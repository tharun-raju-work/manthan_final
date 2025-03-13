import fs from 'fs/promises';
import path from 'path';

export const deleteFile = async (filePath) => {
  try {
    const absolutePath = path.resolve(filePath);
    await fs.access(absolutePath);
    await fs.unlink(absolutePath);
  } catch (error) {
    console.error('Error deleting file:', error);
    // Don't throw error if file doesn't exist
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}; 