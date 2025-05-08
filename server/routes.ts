import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  app.post('/api/dev/save-story-level', async (req, res) => {
    if (process.env.VITE_REACT_APP_DEV_MODE !== 'true') {
      return res.status(403).json({ message: 'This endpoint is only available in development mode.' });
    }

    const { levelData } = req.body;

    if (!levelData || !Array.isArray(levelData)) {
      return res.status(400).json({ message: 'Invalid levelData provided.' });
    }

    const levelsFilePath = path.join(__dirname, '..', 'client', 'src', 'components', 'game', 'Levels.ts');

    try {
      let fileContent = fs.readFileSync(levelsFilePath, 'utf8');
      
      // Format the new level data as a string for insertion
      // Ensure 2-space indentation for the new array entry
      const newLevelString = `  ${JSON.stringify(levelData, null, 2).replace(/\n/g, '\n  ')},\n`;

      // Find the last occurrence of '];' which should mark the end of the Levels array
      const endOfArrayMarker = '];';
      const insertionIndex = fileContent.lastIndexOf(endOfArrayMarker);

      if (insertionIndex === -1) {
        return res.status(500).json({ message: `Could not find insertion point ('${endOfArrayMarker}') in ${levelsFilePath}` });
      }

      // Insert the new level string before the '];'
      const updatedFileContent = 
        fileContent.substring(0, insertionIndex) +
        newLevelString +
        fileContent.substring(insertionIndex);

      fs.writeFileSync(levelsFilePath, updatedFileContent, 'utf8');
      return res.status(200).json({ message: 'Level saved successfully to Levels.ts' });
    } catch (error) {
      console.error('Error saving level:', error);
      return res.status(500).json({ message: 'Failed to save level.', error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
