import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/feedback
 * Public feedback submission
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, feedback, category = 'other' } = body;

    if (!name || !email || !feedback) {
      return NextResponse.json(
        { success: false, error: 'name, email, and feedback are required' },
        { status: 400 }
      );
    }

    if (feedback.length < 10 || feedback.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Feedback must be between 10 and 1000 characters' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from('user_feedbacks')
      .insert({
        contact_name: name,
        contact_email: email,
        content: feedback,
        feedback_type: category,
        status: 'pending',
        user_agent: request.headers.get('user-agent') || '',
        created_at: new Date().toISOString(),
      })
      .select('id, status, created_at')
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        message: 'Feedback submitted successfully',
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
