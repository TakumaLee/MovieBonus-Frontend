import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  signIn,
  getAdminUser,
  generateSessionToken,
  createSession,
} from '@/lib/supabase/admin-auth';

/**
 * POST /api/admin/login
 * Admin login — authenticates via Supabase Auth, creates a session.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, csrfToken } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '請提供電子郵件和密碼' },
        { status: 400 }
      );
    }

    // CSRF validation — compare with cookie-stored token
    const cookieStore = await cookies();
    const storedCsrf = cookieStore.get('admin-csrf-token')?.value;

    if (csrfToken && storedCsrf && csrfToken !== storedCsrf) {
      return NextResponse.json(
        { success: false, error: '請求已過期，請重新整理頁面' },
        { status: 400 }
      );
    }

    // Authenticate with Supabase
    let authData;
    try {
      authData = await signIn(email, password);
    } catch (error: any) {
      if (error.message === 'Invalid login credentials' || error.status === 400) {
        return NextResponse.json(
          { success: false, error: '電子郵件或密碼錯誤' },
          { status: 401 }
        );
      }
      throw error;
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: '電子郵件或密碼錯誤' },
        { status: 401 }
      );
    }

    // Check admin status
    const adminUser = await getAdminUser(authData.user.id);
    if (!adminUser || !adminUser.is_active) {
      return NextResponse.json(
        { success: false, error: '您沒有管理員權限' },
        { status: 403 }
      );
    }

    // Create session
    const sessionToken = generateSessionToken();
    const sessionExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await createSession({
      id: sessionToken,
      user_id: authData.user.id,
      expires_at: sessionExpires.toISOString(),
      ip_address: ip,
      user_agent: userAgent,
      last_activity: new Date().toISOString(),
    });

    // Build response
    const response = NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.display_name || adminUser.email,
        role: adminUser.role || 'admin',
      },
    });

    // Set session cookie
    response.cookies.set('admin-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: sessionExpires,
    });

    // Clear CSRF cookies
    response.cookies.delete('admin-csrf-session');
    response.cookies.delete('admin-csrf-token');

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: '登入失敗，請稍後再試' },
      { status: 500 }
    );
  }
}
