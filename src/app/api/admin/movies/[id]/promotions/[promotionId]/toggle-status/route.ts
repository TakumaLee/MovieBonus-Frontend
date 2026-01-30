import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/supabase/admin-auth';
import { createSupabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/admin/movies/:id/promotions/:promotionId/toggle-status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; promotionId: string }> }
) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '未登入' }, { status: 401 });
    }

    const { promotionId } = await params;
    const supabase = createSupabaseAdmin();

    // Get current status
    const { data: promotion, error: fetchError } = await supabase
      .from('movie_promotions')
      .select('id, status')
      .eq('id', promotionId)
      .single();

    if (fetchError || !promotion) {
      return NextResponse.json(
        { success: false, error: '找不到指定的特典活動' },
        { status: 404 }
      );
    }

    const newStatus = promotion.status === 'active' ? 'inactive' : 'active';

    const { data, error } = await supabase
      .from('movie_promotions')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', promotionId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `特典活動狀態已${newStatus === 'active' ? '啟用' : '停用'}`,
      data: {
        promotion_id: promotionId,
        old_status: promotion.status,
        new_status: newStatus,
        updated_data: data,
      },
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    return NextResponse.json({ success: false, error: 'Failed to toggle status' }, { status: 500 });
  }
}
