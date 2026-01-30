import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/supabase/admin-auth';
import { createSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/admin/movies/:id
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

    const { data: movie, error } = await supabase
      .from('movies')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !movie) {
      return NextResponse.json({ success: false, error: 'Movie not found' }, { status: 404 });
    }

    // Get promotion count
    const { count } = await supabase
      .from('movie_promotions')
      .select('id', { count: 'exact', head: true })
      .eq('movie_id', id);

    return NextResponse.json({
      success: true,
      data: {
        ...movie,
        has_bonuses: (count || 0) > 0,
        bonus_count: count || 0,
      },
    });
  } catch (error) {
    console.error('Get movie error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch movie' }, { status: 500 });
  }
}
