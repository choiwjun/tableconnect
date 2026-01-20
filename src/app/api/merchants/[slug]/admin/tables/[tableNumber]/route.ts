import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

interface TableConfig {
  tableNumber: number;
  type: 'standard' | 'vip' | 'private';
  capacity: number;
  isAvailable: boolean;
}

/**
 * PUT /api/merchants/[slug]/admin/tables/[tableNumber]
 * Update a table configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string; tableNumber: string } }
) {
  try {
    const { slug, tableNumber } = params;
    const body = await request.json();
    const { type, capacity, isAvailable } = body;

    if (!type || capacity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get merchant
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, settings')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Update table (in production, this would be stored in database)
    // For demo, we'll return success
    const updatedTable: TableConfig = {
      tableNumber: parseInt(tableNumber, 10),
      type,
      capacity,
      isAvailable: isAvailable !== undefined ? true : isAvailable,
    };

    return NextResponse.json({
      data: updatedTable,
      message: 'Table updated successfully',
    });
  } catch (error) {
    console.error('Table update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/merchants/[slug]/admin/tables/[tableNumber]
 * Delete a table
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string; tableNumber: string } }
) {
  try {
    const { slug, tableNumber } = params;

    const supabase = getSupabaseAdmin();

    // Get merchant
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Delete table (in production, this would delete from database)
    // For demo, we'll return success
    return NextResponse.json({
      message: 'Table deleted successfully',
      tableNumber: parseInt(tableNumber, 10),
    });
  } catch (error) {
    console.error('Table delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
