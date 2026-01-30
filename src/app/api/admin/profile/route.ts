import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, updateAdminUser } from '@/lib/supabase/admin-auth';

/**
 * GET /api/admin/profile
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '未登入' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        display_name: admin.display_name,
        role: admin.role,
        created_at: admin.created_at,
        updated_at: admin.updated_at,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ success: false, error: '取得個人資料失敗' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/profile
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '未登入' }, { status: 401 });
    }

    const body = await request.json();
    const { display_name, name } = body;

    const updates: Record<string, unknown> = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (name !== undefined) updates.name = name;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: '請提供至少一個要更新的欄位' },
        { status: 400 }
      );
    }

    const updatedProfile = await updateAdminUser(admin.id, updates);

    return NextResponse.json({
      success: true,
      data: updatedProfile,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ success: false, error: '更新個人資料失敗' }, { status: 500 });
  }
}
