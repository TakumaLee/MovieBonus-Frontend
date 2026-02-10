import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Middleware should use anon key only (no service role privileges)
const supabaseAuthClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function middleware(request: NextRequest) {
  // 完全跳過 Next.js 圖片優化
  if (request.nextUrl.pathname.startsWith('/_next/image')) {
    return NextResponse.redirect(new URL('/404', request.url));
  }

  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Skip API routes - they have their own auth
    if (request.nextUrl.pathname.startsWith('/admin/api')) {
      return NextResponse.next();
    }

    const sessionToken = request.cookies.get('admin-session')?.value;

    // Auth-only guard in middleware: require session cookie for admin pages
    if (request.nextUrl.pathname === '/admin/login') {
      if (sessionToken) {
        return NextResponse.redirect(new URL('/admin/feedbacks', request.url));
      }
      return NextResponse.next();
    }

    if (!sessionToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Keep a light anon client reference to ensure env is validated at runtime
    void supabaseAuthClient;
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|google-site-verification.html).*)',
  ],
};
