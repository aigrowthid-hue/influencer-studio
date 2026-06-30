import fs from 'fs';
import path from 'path';

export class StorageService {
  /**
   * Saves a base64 encoded image or buffer to the local public/uploads directory.
   * Returns the public URL path.
   */
  static async saveFile(fileData: string | Buffer, filename: string): Promise<string> {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure the directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);

    if (typeof fileData === 'string') {
      // If it's a data URL, extract the base64 part
      const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      await fs.promises.writeFile(filePath, buffer);
    } else {
      await fs.promises.writeFile(filePath, fileData);
    }

    // Return the web-accessible URL
    return `/uploads/${filename}`;
  }

  /**
   * Delete a file from local storage.
   */
  static async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      if (!fileUrl.startsWith('/uploads/')) return false;
      const fileName = fileUrl.replace('/uploads/', '');
      const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting local file:', error);
      return false;
    }
  }
}
export default StorageService;
