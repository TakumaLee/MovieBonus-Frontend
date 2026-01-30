import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, getAdminUsers } from '@/lib/supabase/admin-auth';

/**
 * GET /api/admin/users
 * Get all admin users (super_admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '未登入' }, { status: 401 });
    }

    if (admin.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: '只有超級管理員可以查看所有管理員' },
        { status: 403 }
      );
    }

    const users = await getAdminUsers();

    const admins = users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      is_active: user.isActive,
      created_at: user.createdAt,
      updated_at: user.createdAt,
      last_sign_in_at: user.lastLogin,
    }));

    return NextResponse.json({ success: true, admins });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ success: false, error: '取得管理員列表失敗' }, { status: 500 });
  }
}
