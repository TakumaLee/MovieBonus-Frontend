import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, signIn, updatePassword, updateAdminUser } from '@/lib/supabase/admin-auth';

/**
 * PUT /api/admin/profile/password
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '未登入' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: '請提供當前密碼和新密碼' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: '新密碼至少需要 6 個字元' },
        { status: 400 }
      );
    }

    // Verify current password
    try {
      await signIn(admin.email, currentPassword);
    } catch {
      return NextResponse.json(
        { success: false, error: '當前密碼錯誤' },
        { status: 400 }
      );
    }

    // Update password
    await updatePassword(admin.id, newPassword);

    // Update timestamp
    try {
      await updateAdminUser(admin.id, { last_password_change: new Date().toISOString() });
    } catch {
      // Column may not exist
    }

    return NextResponse.json({
      success: true,
      message: '密碼更新成功，請稍後重新登入',
    });
  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json({ success: false, error: '密碼更新失敗' }, { status: 500 });
  }
}
