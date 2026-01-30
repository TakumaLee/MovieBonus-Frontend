import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, inviteAdmin } from '@/lib/supabase/admin-auth';

/**
 * POST /api/admin/users/invite
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '未登入' }, { status: 401 });
    }

    if (admin.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: '只有超級管理員可以邀請新管理員' },
        { status: 403 }
      );
    }

    const { email, role } = await request.json();

    if (!email || !role || !['admin', 'super_admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: '請提供有效的電子郵件和角色' },
        { status: 400 }
      );
    }

    const adminUser = await inviteAdmin(email, role);

    return NextResponse.json({
      success: true,
      message: '邀請已發送',
      user: adminUser,
    });
  } catch (error: any) {
    console.error('Invite admin error:', error);
    const status = error.message?.includes('已存在') ? 409 : 500;
    return NextResponse.json(
      { success: false, error: error.message || '邀請失敗' },
      { status }
    );
  }
}
