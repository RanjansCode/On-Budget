import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

// -----------------------------------------------------------------------------
// Firebase Storage Configuration Instructions:
// To store and fetch files, go to your Firebase Console:
// 1. Go to the "Storage" section in the left sidebar menu.
// 2. Click "Get Started" to initialize.
// 3. Configure storage rules to grant read/write permissions for authenticated users/admins.
// -----------------------------------------------------------------------------

/**
 * Uploads a file to Firebase Storage under a designated directory/path.
 */
export async function uploadFileToStorage(file: File, folderPath: string): Promise<string> {
  try {
    const uniqueFileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `${folderPath}/${uniqueFileName}`);
    
    // Upload bytes
    const snapshot = await uploadBytes(storageRef, file);
    
    // Retrieve download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) {
    console.error('Firebase Storage Upload Error:', error);
    throw new Error(error?.message || 'Failed to upload file to storage.');
  }
}

/**
 * Deletes a file from Firebase Storage using its full storage path/URL.
 */
export async function deleteFileFromStorage(fileUrl: string): Promise<void> {
  try {
    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);
  } catch (error: any) {
    console.error('Firebase Storage Deletion Error:', error);
    throw new Error(error?.message || 'Failed to delete file from storage.');
  }
}
