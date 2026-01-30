import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/feedback/user-submission
 * User feedback with optional bonus details
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedbackData, bonusDetails } = body;

    if (!feedbackData?.feedback_type || !feedbackData?.content) {
      return NextResponse.json(
        { success: false, error: 'feedback_type and content are required' },
        { status: 400 }
      );
    }

    // Honeypot check
    if (feedbackData.honeypot) {
      return NextResponse.json({ success: false, error: 'Invalid submission' }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    // Insert feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('user_feedbacks')
      .insert({
        feedback_type: feedbackData.feedback_type,
        title: feedbackData.title || '',
        content: feedbackData.content,
        contact_email: feedbackData.contact_email || '',
        contact_name: feedbackData.contact_name || '',
        status: 'pending',
        user_agent: feedbackData.user_agent || request.headers.get('user-agent') || '',
        referrer_url: feedbackData.referrer_url || request.headers.get('referer') || '',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (feedbackError) throw feedbackError;

    // Insert bonus details if provided
    if (bonusDetails && feedback) {
      try {
        await supabase.from('user_bonus_submissions').insert({
          feedback_id: feedback.id,
          movie_title: bonusDetails.movie_title || '',
          cinema_name: bonusDetails.cinema_name || '',
          bonus_type: bonusDetails.bonus_type || '',
          bonus_name: bonusDetails.bonus_name || '',
          bonus_description: bonusDetails.bonus_description || '',
          acquisition_method: bonusDetails.acquisition_method || '',
          source_url: bonusDetails.source_url || '',
          created_at: new Date().toISOString(),
        });
      } catch {
        // Non-critical: bonus details table may not exist yet
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Feedback submitted successfully',
        submission_id: feedback?.id,
        feedback_id: feedback?.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('User submission error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit feedback' }, { status: 500 });
  }
}
