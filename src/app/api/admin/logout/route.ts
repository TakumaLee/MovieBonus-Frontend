import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/supabase/admin-auth';

/**
 * POST /api/admin/logout
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin-session')?.value;

    if (sessionToken) {
      await deleteSession(sessionToken);
    }

    const response = NextResponse.json({ success: true, message: '登出成功' });
    response.cookies.delete('admin-session');
    response.cookies.delete('admin-csrf-session');
    response.cookies.delete('admin-csrf-token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: '登出失敗' }, { status: 500 });
  }
}
