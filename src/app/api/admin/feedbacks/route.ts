import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/supabase/admin-auth';
import { createSupabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/admin/feedbacks
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
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const supabase = createSupabaseAdmin();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('user_feedbacks')
      .select('*', { count: 'exact' });

    if (status && status !== 'all') query = query.eq('status', status);
    if (type && type !== 'all') query = query.eq('feedback_type', type);
    if (search) query = query.or(`content.ilike.%${search}%,title.ilike.%${search}%`);

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: feedbacks, error, count } = await query;

    if (error) throw error;

    const total = count || 0;

    return NextResponse.json({
      success: true,
      data: {
        feedbacks: feedbacks || [],
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get feedbacks error:', error);
    return NextResponse.json({ success: false, error: '無法取得回報列表' }, { status: 500 });
  }
}
