import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/supabase/admin-auth';
import { createSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/admin/stats
 * Dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '未登入' }, { status: 401 });
    }

    const supabase = createSupabaseAdmin();

    // Get counts in parallel
    const [feedbackResult, movieResult, promotionResult] = await Promise.all([
      supabase.from('user_feedbacks').select('id, status', { count: 'exact' }),
      supabase.from('movies').select('id', { count: 'exact', head: true }),
      supabase.from('movie_promotions').select('id', { count: 'exact', head: true }),
    ]);

    const feedbacks = feedbackResult.data || [];
    const pendingCount = feedbacks.filter(f => f.status === 'pending').length;

    return NextResponse.json({
      success: true,
      data: {
        total_feedbacks: feedbackResult.count || 0,
        pending_feedbacks: pendingCount,
        total_movies: movieResult.count || 0,
        total_promotions: promotionResult.count || 0,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ success: false, error: '取得統計資料失敗' }, { status: 500 });
  }
}
