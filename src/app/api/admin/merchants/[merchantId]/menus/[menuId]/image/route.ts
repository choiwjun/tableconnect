import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAdminUser, hasAccessToMerchant } from '@/lib/auth';
import { isValidUUID } from '@/lib/utils/validators';

const BUCKET_NAME = 'menu-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface RouteParams {
  params: Promise<{ merchantId: string; menuId: string }>;
}

/**
 * POST /api/admin/merchants/[merchantId]/menus/[menuId]/image
 * Upload menu image
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { merchantId, menuId } = await params;

  if (!isValidUUID(merchantId) || !isValidUUID(menuId)) {
    return NextResponse.json(
      { error: 'Invalid ID' },
      { status: 400 }
    );
  }

  // Check access
  const hasAccess = await hasAccessToMerchant(merchantId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify menu exists and belongs to merchant
    const { data: menu, error: menuError } = await supabase
      .from('menus')
      .select('id, image_url')
      .eq('id', menuId)
      .eq('merchant_id', merchantId)
      .single();

    if (menuError || !menu) {
      return NextResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      );
    }

    // Delete old image if exists
    if (menu.image_url) {
      const oldPath = menu.image_url.split(`${BUCKET_NAME}/`)[1];
      if (oldPath) {
        await supabase.storage.from(BUCKET_NAME).remove([oldPath]);
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${merchantId}/${menuId}-${Date.now()}.${fileExt}`;

    // Convert File to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadData.path);

    // Update menu with new image URL
    const { error: updateError } = await supabase
      .from('menus')
      .update({ image_url: urlData.publicUrl })
      .eq('id', menuId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update menu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: urlData.publicUrl,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/merchants/[merchantId]/menus/[menuId]/image
 * Delete menu image
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { merchantId, menuId } = await params;

  if (!isValidUUID(merchantId) || !isValidUUID(menuId)) {
    return NextResponse.json(
      { error: 'Invalid ID' },
      { status: 400 }
    );
  }

  // Check access
  const hasAccess = await hasAccessToMerchant(merchantId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    // Get current menu
    const { data: menu, error: menuError } = await supabase
      .from('menus')
      .select('id, image_url')
      .eq('id', menuId)
      .eq('merchant_id', merchantId)
      .single();

    if (menuError || !menu) {
      return NextResponse.json(
        { error: 'Menu not found' },
        { status: 404 }
      );
    }

    if (!menu.image_url) {
      return NextResponse.json(
        { error: 'No image to delete' },
        { status: 400 }
      );
    }

    // Delete from storage
    const filePath = menu.image_url.split(`${BUCKET_NAME}/`)[1];
    if (filePath) {
      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    }

    // Update menu to remove image URL
    const { error: updateError } = await supabase
      .from('menus')
      .update({ image_url: null })
      .eq('id', menuId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update menu' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Image delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
