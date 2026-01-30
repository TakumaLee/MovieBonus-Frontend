import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/supabase/admin-auth';
import { createSupabaseAdmin } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string; promotionId: string }> };

/**
 * PUT /api/admin/movies/:id/promotions/:promotionId
 */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '未登入' }, { status: 401 });
    }

    const { promotionId } = await params;
    const body = await request.json();
    const supabase = createSupabaseAdmin();

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.start_date !== undefined) updateData.start_date = body.start_date;
    if (body.end_date !== undefined) updateData.end_date = body.end_date;
    if (body.is_verified !== undefined) updateData.is_verified = body.is_verified;

    const { data, error } = await supabase
      .from('movie_promotions')
      .update(updateData)
      .eq('id', promotionId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: '特典已更新',
      data,
    });
  } catch (error) {
    console.error('Update promotion error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update promotion' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/movies/:id/promotions/:promotionId
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '未登入' }, { status: 401 });
    }

    const { promotionId } = await params;
    const supabase = createSupabaseAdmin();

    const { error } = await supabase
      .from('movie_promotions')
      .delete()
      .eq('id', promotionId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: '特典已刪除',
    });
  } catch (error) {
    console.error('Delete promotion error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete promotion' }, { status: 500 });
  }
}
