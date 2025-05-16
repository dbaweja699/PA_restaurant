import { Request, Response } from 'express';
import { storage } from './storage';
import { insertPhotoGallarySchema } from '../shared/schema';
import { z } from 'zod';

export function registerPhotoGalleryRoutes(app: any) {
  // Get all photos from the gallery
  app.get('/api/gallery', async (_req: Request, res: Response) => {
    try {
      const photos = await storage.getPhotoGallery();
      res.json(photos);
    } catch (error: any) {
      console.error('Error fetching gallery:', error);
      res.status(500).json({ error: 'Failed to fetch gallery' });
    }
  });

  // Get a single photo by ID
  app.get('/api/gallery/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const photo = await storage.getPhotoById(id);
      if (!photo) {
        return res.status(404).json({ error: 'Photo not found' });
      }
      
      res.json(photo);
    } catch (error: any) {
      console.error(`Error fetching photo ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch photo' });
    }
  });

  // Create a new photo entry
  app.post('/api/gallery', async (req: Request, res: Response) => {
    try {
      const validation = insertPhotoGallarySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid photo data', 
          details: validation.error.format() 
        });
      }

      const photo = await storage.createPhoto(validation.data);
      res.status(201).json(photo);
    } catch (error: any) {
      console.error('Error creating photo:', error);
      res.status(500).json({ error: 'Failed to create photo' });
    }
  });

  // Update a photo
  app.patch('/api/gallery/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      // Validate the update data
      const updateSchema = insertPhotoGallarySchema.partial();
      const validation = updateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid update data', 
          details: validation.error.format() 
        });
      }

      const updatedPhoto = await storage.updatePhoto(id, validation.data);
      if (!updatedPhoto) {
        return res.status(404).json({ error: 'Photo not found' });
      }
      
      res.json(updatedPhoto);
    } catch (error: any) {
      console.error(`Error updating photo ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update photo' });
    }
  });

  // Generate AI caption for a photo
  app.post('/api/gallery/:id/generate-caption', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      const caption = await storage.generateAICaption(id);
      if (!caption) {
        return res.status(404).json({ error: 'Photo not found or unable to generate caption' });
      }
      
      res.json({ caption });
    } catch (error: any) {
      console.error(`Error generating caption for photo ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to generate caption' });
    }
  });

  // Post a photo to social media by sending the ID
  app.post('/api/gallery/:id/post', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
      }

      // Get the photo first to check if it exists
      const photo = await storage.getPhotoById(id);
      if (!photo) {
        return res.status(404).json({ error: 'Photo not found' });
      }
      
      // For now, we'll just mark the photo as posted by updating its status
      const updatedPhoto = await storage.updatePhoto(id, { status: 'posted' });
      
      res.json({ 
        success: true, 
        message: 'Photo has been posted successfully', 
        photo: updatedPhoto 
      });
    } catch (error: any) {
      console.error(`Error posting photo ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to post photo' });
    }
  });
}