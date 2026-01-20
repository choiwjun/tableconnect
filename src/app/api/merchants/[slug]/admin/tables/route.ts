import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

interface TableConfig {
  tableNumber: number;
  type: 'standard' | 'vip' | 'private';
  capacity: number;
  isAvailable: boolean;
}

/**
 * GET /api/merchants/[slug]/admin/tables
 * Get all tables for a merchant
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
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

    // Get max tables from merchant settings
    const maxTables = merchant.settings?.max_tables || 50;

    // Generate table list (1 to maxTables)
    const tables = Array.from({ length: maxTables }, (_, i) => ({
      tableNumber: i + 1,
      type: i + 1 === 1 ? 'vip' : i + 1 === 2 ? 'private' : 'standard',
      capacity: 4,
      isAvailable: true,
    }));

    return NextResponse.json({ data: tables });
  } catch (error) {
    console.error('Tables API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/merchants/[slug]/admin/tables
 * Add a new table (in production, this would be stored in DB)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
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

    // Get max tables
    const maxTables = merchant.settings?.max_tables || 50;

    // Find next available table number
    const tableNumber = maxTables + 1;

    // Create table config (in production, store in database)
    const newTable: TableConfig = {
      tableNumber,
      type,
      capacity,
      isAvailable: isAvailable !== undefined ? true : isAvailable,
    };

    return NextResponse.json(
      { data: newTable, message: 'Table added successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add table API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
