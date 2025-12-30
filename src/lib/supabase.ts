import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Storage bucket names (like Cloudinary folders)
export const STORAGE_BUCKETS = {
  EVIDENCE: 'evidence-files',      // For evidence photos/videos
  PROFILES: 'profile-images',      // For user profile pictures
} as const;

/**
 * Upload file to Supabase Storage (like Cloudinary upload)
 * @param bucket - Storage bucket name
 * @param file - File buffer or Blob
 * @param fileName - File name with extension
 * @returns Public URL of uploaded file
 */
export async function uploadFile(
  bucket: keyof typeof STORAGE_BUCKETS,
  file: Buffer | Blob,
  fileName: string
): Promise<{ url: string; path: string }> {
  const bucketName = STORAGE_BUCKETS[bucket];
  const filePath = `${Date.now()}-${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      contentType: 'auto',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`File upload failed: ${error.message}`);
  }

  // Get public URL (like Cloudinary URL)
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path,
  };
}

/**
 * Get public URL for existing file (like Cloudinary URL)
 */
export function getPublicUrl(bucket: keyof typeof STORAGE_BUCKETS, filePath: string): string {
  const bucketName = STORAGE_BUCKETS[bucket];
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Delete file from storage
 */
export async function deleteFile(bucket: keyof typeof STORAGE_BUCKETS, filePath: string): Promise<void> {
  const bucketName = STORAGE_BUCKETS[bucket];
  const { error } = await supabase.storage.from(bucketName).remove([filePath]);

  if (error) {
    throw new Error(`File deletion failed: ${error.message}`);
  }
}

/**
 * Download file from storage
 */
export async function downloadFile(bucket: keyof typeof STORAGE_BUCKETS, filePath: string): Promise<Blob> {
  const bucketName = STORAGE_BUCKETS[bucket];
  const { data, error } = await supabase.storage.from(bucketName).download(filePath);

  if (error) {
    throw new Error(`File download failed: ${error.message}`);
  }

  return data;
}

/**
 * List all files in a bucket
 */
export async function listFiles(bucket: keyof typeof STORAGE_BUCKETS, folder?: string) {
  const bucketName = STORAGE_BUCKETS[bucket];
  const { data, error } = await supabase.storage.from(bucketName).list(folder);

  if (error) {
    throw new Error(`File listing failed: ${error.message}`);
  }

  return data;
}
