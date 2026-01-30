import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/feedback/submit
 * Simplified public feedback submission endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, content, email, honeypot } = body;

    // Honeypot check
    if (honeypot) {
      return NextResponse.json({ success: false, error: '無效的提交' }, { status: 400 });
    }

    if (!type || !content) {
      return NextResponse.json(
        { success: false, error: '請提供回饋類型和內容' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from('user_feedbacks')
      .insert({
        feedback_type: type,
        content,
        contact_email: email || '',
        status: 'pending',
        user_agent: request.headers.get('user-agent') || '',
        referrer_url: request.headers.get('referer') || '',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        message: '感謝您的回饋！我們會盡快處理。',
        submission_id: data.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Feedback submit error:', error);
    return NextResponse.json({ success: false, error: '提交失敗' }, { status: 500 });
  }
}
