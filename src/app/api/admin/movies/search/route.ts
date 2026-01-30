import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/supabase/admin-auth';
import { createSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/admin/movies/search?q=...
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '未登入' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ success: false, error: 'Search query is required' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    const { data: movies, error } = await supabase
      .from('movies')
      .select('id, title, english_title, vieshow_movie_id, status')
      .or(`title.ilike.%${q}%,english_title.ilike.%${q}%`)
      .limit(20);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: (movies || []).map(m => ({
        id: m.id,
        title: m.title,
        english_title: m.english_title,
        vieshow_movie_id: m.vieshow_movie_id,
        status: m.status || 'showing',
      })),
    });
  } catch (error) {
    console.error('Movie search error:', error);
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}
