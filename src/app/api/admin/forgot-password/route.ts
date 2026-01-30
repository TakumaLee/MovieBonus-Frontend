import { NextRequest, NextResponse } from 'next/server';
import { createPasswordResetToken } from '@/lib/supabase/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: '請提供有效的電子郵件' },
        { status: 400 }
      );
    }

    // Always return success for security (don't reveal if email exists)
    await createPasswordResetToken(email);

    return NextResponse.json({
      success: true,
      message: '如果該電子郵件存在於系統中，您將收到密碼重設連結',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({
      success: true,
      message: '如果該電子郵件存在於系統中，您將收到密碼重設連結',
    });
  }
}
