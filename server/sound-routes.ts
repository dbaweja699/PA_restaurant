import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Registers routes for checking sound file availability and troubleshooting
 */
export function registerSoundRoutes(app: any) {
  console.log("Registering sound routes for API access");
  
  // Debug endpoint to check if sound files are accessible
  app.get('/api/check-sounds', (_req: Request, res: Response) => {
    try {
      const soundsDir = path.join(process.cwd(), 'public', 'sounds');
      let files: string[] = [];
      
      // Check if directory exists
      if (fs.existsSync(soundsDir)) {
        files = fs.readdirSync(soundsDir);
      }
      
      // Check if we can access the alarm sound specifically
      const alarmPath = path.join(soundsDir, 'alarm_clock.mp3');
      const alarmExists = fs.existsSync(alarmPath);
      
      // Also check if we can access it through the public path
      const publicSoundUrl = '/sounds/alarm_clock.mp3';
      const apiSoundUrl = '/api/sound/alarm_clock.mp3';
      
      res.json({
        soundsDirExists: fs.existsSync(soundsDir),
        soundFiles: files,
        alarmExists,
        soundsDir,
        alarmPath,
        publicSoundUrl,
        apiSoundUrl,
        cwd: process.cwd()
      });
    } catch (error) {
      console.error("Error checking sound files:", error);
      res.status(500).json({ error: "Error checking sound files", details: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // Endpoint to serve sound files with proper headers
  app.get('/api/sound/:filename', (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const soundsDir = path.join(process.cwd(), 'public', 'sounds');
      const filePath = path.join(soundsDir, filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`Sound file not found: ${filePath}`);
        return res.status(404).json({ error: "Sound file not found" });
      }
      
      // Set headers for proper cross-origin audio playback
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', (error) => {
        console.error(`Error streaming sound file ${filename}:`, error);
        res.status(500).json({ error: "Error streaming sound file" });
      });
    } catch (error) {
      console.error("Error serving sound file:", error);
      res.status(500).json({ error: "Error serving sound file", details: error instanceof Error ? error.message : String(error) });
    }
  });
}