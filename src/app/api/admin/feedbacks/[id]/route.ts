import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/supabase/admin-auth';
import { createSupabaseAdmin } from '@/lib/supabase/server';

/**
 * PUT /api/admin/feedbacks/:id
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '未登入' }, { status: 401 });
    }

    const { id } = await params;
    const { status, admin_notes } = await request.json();
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from('user_feedbacks')
      .update({
        status,
        admin_notes,
        updated_by: admin.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Update feedback error:', error);
    return NextResponse.json({ success: false, error: '無法更新回報狀態' }, { status: 500 });
  }
}
