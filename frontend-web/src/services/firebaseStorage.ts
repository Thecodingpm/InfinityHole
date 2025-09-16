import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll, 
  getMetadata,
  StorageReference 
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

export interface CloudFile {
  id: string;
  name: string;
  size: number;
  type: string;
  downloadUrl: string;
  uploadedAt: string;
}

export class FirebaseStorageService {
  private static getStorageRef(userId: string, filename?: string): StorageReference {
    const basePath = `users/${userId}/files`;
    return filename ? ref(storage, `${basePath}/${filename}`) : ref(storage, basePath);
  }

  static async uploadFile(
    userId: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name}`;
      const storageRef = this.getStorageRef(userId, filename);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  static async deleteFile(userId: string, filename: string): Promise<void> {
    try {
      const storageRef = this.getStorageRef(userId, filename);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  static async listUserFiles(userId: string): Promise<CloudFile[]> {
    try {
      const storageRef = this.getStorageRef(userId);
      const result = await listAll(storageRef);
      
      const files: CloudFile[] = [];
      
      for (const itemRef of result.items) {
        try {
          const metadata = await getMetadata(itemRef);
          const downloadURL = await getDownloadURL(itemRef);
          
          files.push({
            id: itemRef.name,
            name: metadata.name,
            size: metadata.size,
            type: metadata.contentType || 'unknown',
            downloadUrl: downloadURL,
            uploadedAt: metadata.timeCreated
          });
        } catch (error) {
          console.error('Error getting file metadata:', error);
        }
      }
      
      return files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('Failed to list files');
    }
  }

  static async getFileSize(userId: string, filename: string): Promise<number> {
    try {
      const storageRef = this.getStorageRef(userId, filename);
      const metadata = await getMetadata(storageRef);
      return metadata.size;
    } catch (error) {
      console.error('Error getting file size:', error);
      return 0;
    }
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

