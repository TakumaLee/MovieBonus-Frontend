import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * GET /api/admin/csrf-token
 * Generate CSRF token for admin login
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = crypto.randomUUID();
    const csrfToken = crypto.randomBytes(32).toString('hex');

    const response = NextResponse.json({
      success: true,
      csrfToken,
      sessionId: sessionId.substring(0, 8) + '...',
    });

    // Store CSRF token in a cookie (tied to session)
    response.cookies.set('admin-csrf-session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 60, // 30 minutes
    });

    response.cookies.set('admin-csrf-token', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 60,
    });

    return response;
  } catch (error) {
    console.error('CSRF token error:', error);
    return NextResponse.json({ success: false, error: '內部伺服器錯誤' }, { status: 500 });
  }
}
