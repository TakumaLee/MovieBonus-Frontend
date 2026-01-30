import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/supabase/admin-auth';
import { createSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/admin/movies
 * Admin movie list with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '未登入' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const supabase = createSupabaseAdmin();

    // Build query
    let query = supabase
      .from('movies')
      .select('id, title, english_title, vieshow_movie_id, status, release_date, poster_url, created_at, updated_at', { count: 'exact' });

    // Search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,english_title.ilike.%${search}%`);
    }

    // Status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.order('release_date', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    const { data: movies, error, count } = await query;

    if (error) throw error;

    // Get promotion counts
    const movieIds = (movies || []).map(m => m.id);
    let promotionCounts: Record<string, number> = {};

    if (movieIds.length > 0) {
      const { data: promotions } = await supabase
        .from('movie_promotions')
        .select('movie_id')
        .in('movie_id', movieIds);

      if (promotions) {
        promotions.forEach(p => {
          promotionCounts[p.movie_id] = (promotionCounts[p.movie_id] || 0) + 1;
        });
      }
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const formattedMovies = (movies || []).map(movie => ({
      id: movie.id,
      title: movie.title,
      english_title: movie.english_title,
      vieshow_movie_id: movie.vieshow_movie_id,
      status: movie.status || 'showing',
      release_date: movie.release_date,
      poster_url: movie.poster_url,
      bonus_count: promotionCounts[movie.id] || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        movies: formattedMovies,
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching movies:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch movies' }, { status: 500 });
  }
}
