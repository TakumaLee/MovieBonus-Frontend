import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordWithToken } from '@/lib/supabase/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: '請提供有效的重設碼和新密碼（至少 6 字元）' },
        { status: 400 }
      );
    }

    await resetPasswordWithToken(token, password);

    return NextResponse.json({
      success: true,
      message: '密碼重設成功，請稍後重新登入',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    const status = error.message?.includes('Invalid') ? 400 : 500;
    return NextResponse.json(
      { success: false, error: error.message || '密碼重設失敗' },
      { status }
    );
  }
}
