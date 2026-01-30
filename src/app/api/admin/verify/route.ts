import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/supabase/admin-auth';

/**
 * GET /api/admin/verify
 * Verify admin session
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '未登入' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ success: false, error: '驗證失敗' }, { status: 500 });
  }
}
