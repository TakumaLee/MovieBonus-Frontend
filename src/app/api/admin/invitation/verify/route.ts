import { NextRequest, NextResponse } from 'next/server';
import { validateInvitationToken } from '@/lib/supabase/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const token = new URL(request.url).searchParams.get('token');
    if (!token) {
      return NextResponse.json({ success: false, error: '請提供邀請碼' }, { status: 400 });
    }

    const tokenData = await validateInvitationToken(token);
    if (!tokenData) {
      return NextResponse.json({ success: false, error: '邀請碼無效或已過期' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      invitation: {
        email: tokenData.email,
        role: tokenData.role,
        expires_at: tokenData.expires_at,
      },
    });
  } catch (error) {
    console.error('Verify invitation error:', error);
    return NextResponse.json({ success: false, error: '驗證失敗' }, { status: 500 });
  }
}
