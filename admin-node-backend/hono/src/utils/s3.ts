import { ListObjectsV2Command, ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import { s3Client } from '../config';
import path from 'path';

// Image extensions set for O(1) lookup
const imageExtensions = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.bmp',
  '.webp',
  '.svg',
  '.tiff',
  '.heic',
  '.avif',
  '.ico',
  '.jxl',
  '.heif',
  '.raw',
]);

/**
 * Check if a file has an image extension
 */
function isImageFile(filename: string): boolean {
  if (!filename) return false;
  const ext = path.extname(filename).toLowerCase();
  return imageExtensions.has(ext);
}

/**
 * List all images in a specific folder in S3 with memory optimization
 */
export async function listImages(bucketName: string, folderPrefix: string): Promise<string[]> {
  // Input validation
  if (!bucketName) {
    throw new Error('Bucket name cannot be empty');
  }
  if (!folderPrefix) {
    throw new Error('Folder prefix cannot be empty');
  }

  const s3Images: string[] = [];

  try {
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: folderPrefix,
        ContinuationToken: continuationToken,
      });

      const response: ListObjectsV2CommandOutput = await s3Client.send(command);

      if (response.Contents) {
        for (const object of response.Contents) {
          const key = object.Key;
          if (key && isImageFile(key)) {
            s3Images.push(key);
          }
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return s3Images;
  } catch (error) {
    console.error(`Failed to list objects in bucket ${bucketName} with prefix ${folderPrefix}:`, error);
    throw new Error(`Failed to list S3 images: ${(error as Error).message}`);
  }
}


