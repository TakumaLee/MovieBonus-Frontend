import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/supabase/admin-auth';
import { createSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/admin/movies/:id/promotions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '未登入' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createSupabaseAdmin();

    const { data: promotions, error } = await supabase
      .from('movie_promotions')
      .select('*')
      .eq('movie_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: promotions || [],
    });
  } catch (error) {
    console.error('Get promotions error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch promotions' }, { status: 500 });
  }
}

/**
 * POST /api/admin/movies/:id/promotions
 * Create a new promotion for a movie
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '未登入' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = createSupabaseAdmin();

    // Validate
    if (!body.movie_title || !body.bonuses || !Array.isArray(body.bonuses) || body.bonuses.length === 0) {
      return NextResponse.json(
        { success: false, error: '請提供完整的電影標題和特典資料' },
        { status: 400 }
      );
    }

    // Check movie exists
    const { data: movie } = await supabase
      .from('movies')
      .select('id, title')
      .eq('id', id)
      .single();

    if (!movie) {
      return NextResponse.json({ success: false, error: '找不到電影' }, { status: 404 });
    }

    // Insert promotions
    const promotionsToInsert = body.bonuses.map((bonus: any) => ({
      movie_id: id,
      title: bonus.bonus_name,
      description: bonus.acquisition_method,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data: inserted, error } = await supabase
      .from('movie_promotions')
      .insert(promotionsToInsert)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `成功創建 ${(inserted || []).length} 項特典`,
      data: inserted,
    });
  } catch (error) {
    console.error('Create promotion error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create promotion' }, { status: 500 });
  }
}
