import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

/**
 * Registers routes for checking sound file availability and troubleshooting
 */
export function registerSoundRoutes(app: any) {
  // Route to check sounds directory and list available sound files
  app.get('/api/check-sounds', (_req: Request, res: Response) => {
    const soundsDir = path.join(__dirname, '../public/sounds');
    
    try {
      if (!fs.existsSync(soundsDir)) {
        return res.status(404).json({
          success: false,
          message: 'Sounds directory does not exist',
          soundsDir
        });
      }
      
      const files = fs.readdirSync(soundsDir);
      const fileDetails = files.map(file => {
        const filePath = path.join(soundsDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          modified: stats.mtime
        };
      });
      
      res.json({
        success: true,
        message: 'Sounds directory accessible',
        files: fileDetails,
        soundsDir
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to access sounds directory',
        error: error.message,
        soundsDir
      });
    }
  });
  
  // Route to serve a specific sound file directly
  app.get('/api/sound/:filename', (req: Request, res: Response) => {
    const { filename } = req.params;
    const soundsDir = path.join(__dirname, '../public/sounds');
    const filePath = path.join(soundsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: `Sound file "${filename}" not found`,
        searchPath: filePath
      });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    // Send the file
    res.sendFile(filePath);
  });
}