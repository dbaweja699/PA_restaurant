import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import initDatabase from "./initDatabase"; // Import the database initialization function
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

// Global handler for unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Promise Rejection:", reason);
});

const app = express();
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Error handler moved above static file serving

(async () => {
  const execPromise = promisify(exec);

  // Run database migration first
  try {
    console.log('Running database migration...');
    await execPromise('npx tsx server/migrateDatabase.ts');
    console.log('Database migration completed');
  } catch (error) {
    console.error('Database migration failed:', error);
  }

  // Connect to Supabase database
  try {
    await initDatabase();
    console.log('Supabase database connection established');
  } catch (error) {
    console.error('Supabase database connection failed:', error);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Express error handler:", err);
    res.status(status).json({ message });
    // Don't throw the error after sending a response
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // For production, use the vite.ts serveStatic function
    // But also check for the public directory and serve it directly
    console.log("Running in production mode");
    
    // Serve public files if they exist
    const publicPath = path.resolve(process.cwd(), "public");
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath));
    }
    
    // Check for environment variable to skip client build
    if (process.env.SKIP_CLIENT_BUILD !== 'true') {
      console.log("Client build is needed for production deployment");
      
      // Create a simple HTML fallback for routes that don't match the API
      app.get('*', (req, res) => {
        if (!req.path.startsWith('/api/')) {
          res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Restaurant AI Management Platform</title>
              <style>
                body {
                  font-family: sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  background-color: #f5f5f5;
                }
                .container {
                  text-align: center;
                  padding: 20px;
                  border-radius: 8px;
                  background-color: white;
                  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                  max-width: 500px;
                }
                h1 {
                  color: #333;
                }
                p {
                  color: #666;
                  line-height: 1.6;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Restaurant AI Management Platform</h1>
                <p>The application is currently running in production mode.</p>
                <p>API endpoints are available at /api/* paths.</p>
                <p>For optimal experience, please use the development environment.</p>
              </div>
            </body>
            </html>
          `);
        }
      });
    } else {
      // Use the default serveStatic function
      serveStatic(app);
    }
  }

  // Use process.env.PORT for deployment or fallback to 5000 for development
  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();