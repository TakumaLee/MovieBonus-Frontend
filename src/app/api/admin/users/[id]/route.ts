import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, updateAdminUserDetails } from '@/lib/supabase/admin-auth';

/**
 * PUT /api/admin/users/:id
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

    if (admin.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: '只有超級管理員可以更新其他管理員' },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (id === admin.id) {
      return NextResponse.json(
        { success: false, error: '您不能修改自己的角色或狀態' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates: { role?: string; isActive?: boolean } = {};

    if (body.role !== undefined) updates.role = body.role;
    if (body.is_active !== undefined) updates.isActive = body.is_active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: '沒有提供要更新的資料' },
        { status: 400 }
      );
    }

    const updatedUser = await updateAdminUserDetails(id, updates);

    return NextResponse.json({
      success: true,
      message: '管理員資料已更新',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ success: false, error: '更新失敗' }, { status: 500 });
  }
}
