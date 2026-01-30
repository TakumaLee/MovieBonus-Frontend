import { NextRequest, NextResponse } from 'next/server';
import { validatePasswordResetToken } from '@/lib/supabase/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const token = new URL(request.url).searchParams.get('token');
    if (!token) {
      return NextResponse.json({ success: false, error: '請提供重設碼' }, { status: 400 });
    }

    const tokenData = await validatePasswordResetToken(token);
    if (!tokenData) {
      return NextResponse.json({ success: false, error: '重設碼無效或已過期' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      reset: { email: tokenData.email, expires_at: tokenData.expires_at },
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return NextResponse.json({ success: false, error: '驗證失敗' }, { status: 500 });
  }
}
