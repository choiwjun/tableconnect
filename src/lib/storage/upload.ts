import { getSupabaseAdmin } from '@/lib/supabase/admin';

const BUCKET_NAME = 'menu-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a menu image to Supabase Storage
 */
export async function uploadMenuImage(
  file: File,
  merchantId: string,
  menuId: string
): Promise<UploadResult> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: 'File size exceeds 5MB limit',
    };
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      success: false,
      error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF',
    };
  }

  const supabase = getSupabaseAdmin();

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${merchantId}/${menuId}-${Date.now()}.${fileExt}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: 'Failed to upload image',
    };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    success: true,
    url: urlData.publicUrl,
  };
}

/**
 * Delete a menu image from Supabase Storage
 */
export async function deleteMenuImage(imageUrl: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  // Extract path from URL
  const urlParts = imageUrl.split(`${BUCKET_NAME}/`);
  if (urlParts.length < 2) {
    return false;
  }

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error('Delete error:', error);
    return false;
  }

  return true;
}

/**
 * Get a signed URL for temporary access (if bucket is private)
 */
export async function getSignedUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    console.error('Signed URL error:', error);
    return null;
  }

  return data.signedUrl;
}
