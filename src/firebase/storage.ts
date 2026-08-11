import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  getStorage,
} from 'firebase/storage';
import { storage, app } from './config';
import { compressImageForUpload } from '../lib/imageCompressor';

export interface UploadProgressCallback {
  (progressPercent: number, statusText: string): void;
}

/**
 * Uploads a file to Firebase Storage under a designated directory/path.
 * Automatically optimizes/compresses images before uploading and reports real-time progress.
 */
export async function uploadFileToStorage(
  file: File,
  folderPath: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  if (!file) {
    throw new Error('No file selected for upload.');
  }

  // 1. Optimize / compress large poster images automatically in the browser
  onProgress?.(5, 'Optimizing image for upload...');
  let fileToUpload = file;
  try {
    fileToUpload = await compressImageForUpload(file);
  } catch (compressErr) {
    console.warn('Image optimization skipped, proceeding with original file:', compressErr);
  }

  // 2. Sanitize filename and create storage path
  const sanitizedName = fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueFileName = `${Date.now()}-${sanitizedName}`;
  const fullPath = `${folderPath}/${uniqueFileName}`;

  onProgress?.(10, 'Initializing Firebase Storage upload...');

  // Helper function to execute upload with progress on a given Storage instance
  const performUpload = (storageInstance: typeof storage): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const storageRef = ref(storageInstance, fullPath);
        const uploadTask = uploadBytesResumable(storageRef, fileToUpload, {
          contentType: fileToUpload.type || 'image/jpeg',
        });

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const totalBytes = snapshot.totalBytes || 1;
            const transferred = snapshot.bytesTransferred || 0;
            const percent = Math.min(98, Math.round((transferred / totalBytes) * 100));
            onProgress?.(percent, `Uploading... ${percent}%`);
          },
          (error) => {
            reject(error);
          },
          async () => {
            try {
              onProgress?.(99, 'Retrieving image download URL...');
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              onProgress?.(100, 'Upload complete!');
              resolve(downloadURL);
            } catch (urlErr) {
              reject(urlErr);
            }
          }
        );
      } catch (initErr) {
        reject(initErr);
      }
    });
  };

  try {
    return await performUpload(storage);
  } catch (primaryError: any) {
    console.warn('Primary Firebase Storage upload failed:', primaryError);

    // If primary upload hit retry-limit or bucket-not-found, try alternative bucket URL extension
    const isRetryLimit =
      primaryError?.code === 'storage/retry-limit-exceeded' ||
      primaryError?.message?.includes('retry-limit-exceeded');
    const isBucketNotFound =
      primaryError?.code === 'storage/bucket-not-found' ||
      primaryError?.message?.includes('bucket-not-found');

    if (isRetryLimit || isBucketNotFound) {
      const currentBucket = storage.app.options.storageBucket || '';
      let altBucket = '';
      if (currentBucket.includes('firebasestorage.app')) {
        altBucket = currentBucket.replace('firebasestorage.app', 'appspot.com');
      } else if (currentBucket.includes('appspot.com')) {
        altBucket = currentBucket.replace('appspot.com', 'firebasestorage.app');
      }

      if (altBucket) {
        console.log(`Attempting fallback storage bucket: ${altBucket}`);
        try {
          onProgress?.(15, 'Retrying with fallback storage bucket endpoint...');
          const altStorage = getStorage(app, `gs://${altBucket}`);
          altStorage.maxUploadRetryTime = 10000;
          altStorage.maxOperationRetryTime = 10000;
          return await performUpload(altStorage);
        } catch (altErr) {
          console.error('Fallback storage bucket upload failed:', altErr);
        }
      }
    }

    // Produce clean human-readable error
    let userFriendlyMsg = 'Poster image upload failed. Please check your connection and try again.';
    if (primaryError?.code === 'storage/unauthorized') {
      userFriendlyMsg = 'Poster image upload failed: Access denied by Storage security rules. Please verify you are signed in as an administrator.';
    } else if (isRetryLimit || isBucketNotFound) {
      userFriendlyMsg = 'Poster image upload failed: Firebase Storage bucket is not accessible or not initialized on this project. You can also paste an image URL directly.';
    } else if (primaryError?.message) {
      userFriendlyMsg = `Poster image upload failed: ${primaryError.message}`;
    }

    throw new Error(userFriendlyMsg);
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
