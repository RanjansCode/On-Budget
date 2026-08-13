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
 * Converts a file/blob to a Base64 Data URL as a fail-safe fallback when cloud storage is unreachable.
 */
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a file to Firebase Storage under a designated directory/path.
 * Automatically optimizes/compresses images before uploading and reports real-time progress.
 * If Firebase Storage is uninitialized or unreachable, seamlessly falls back to inline Base64 Data URL.
 */
export async function uploadFileToStorage(
  file: File,
  folderPath: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  if (!file) {
    throw new Error('No file selected for upload.');
  }

  // 1. Optimize / compress large images automatically in the browser
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
          altStorage.maxUploadRetryTime = 4000;
          altStorage.maxOperationRetryTime = 4000;
          return await performUpload(altStorage);
        } catch (altErr) {
          console.warn('Fallback storage bucket upload failed:', altErr);
        }
      }
    }

    // Fallback to compressed Data URL if cloud storage is unreachable/uninitialized
    try {
      console.warn('Firebase Storage upload unavailable/failed. Falling back to inline Data URL.');
      onProgress?.(90, 'Storage bucket offline. Converting to optimized inline Data URL...');
      const dataUrl = await fileToDataUrl(fileToUpload);
      onProgress?.(100, 'Upload complete (via fallback data URL)!');
      return dataUrl;
    } catch (fallbackErr) {
      console.error('Data URL fallback failed:', fallbackErr);
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
