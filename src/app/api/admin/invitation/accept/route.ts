import { NextRequest, NextResponse } from 'next/server';
import { acceptInvitation } from '@/lib/supabase/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: '請提供有效的邀請碼和密碼（至少 6 字元）' },
        { status: 400 }
      );
    }

    const result = await acceptInvitation(token, password);

    return NextResponse.json({
      success: true,
      message: '帳號建立成功，請登入',
      user: { email: result.user.email, role: result.user.role },
    });
  } catch (error: any) {
    console.error('Accept invitation error:', error);
    const status = error.message?.includes('Invalid') ? 400 : 500;
    return NextResponse.json(
      { success: false, error: error.message || '接受邀請失敗' },
      { status }
    );
  }
}
