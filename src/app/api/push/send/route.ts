import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createSupabaseAdmin } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Configure VAPID
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:paruparu@example.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin-session')?.value;
    
    // Also allow API key auth for scrapers/cron
    const apiKey = request.headers.get('x-api-key');
    const validApiKey = process.env.PUSH_API_KEY;

    if (!sessionToken && (!apiKey || apiKey !== validApiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If session token, verify it
    if (sessionToken && !apiKey) {
      const supabase = createSupabaseAdmin();
      const { data: session } = await supabase
        .from('admin_sessions')
        .select('id')
        .eq('token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!session) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }
    }

    const { title, body, url } = await request.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 });
    }

    const supabase = createSupabaseAdmin();

    // Get all subscriptions
    const { data: subscriptions, error: fetchErr } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (fetchErr || !subscriptions) {
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    const payload = JSON.stringify({ title, body, url: url || '/' });
    let sentCount = 0;
    let failedCount = 0;
    const expiredEndpoints: string[] = [];

    // Send to all subscribers
    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.keys_p256dh,
                auth: sub.keys_auth,
              },
            },
            payload
          );
          sentCount++;
        } catch (err: unknown) {
          failedCount++;
          // Remove expired/invalid subscriptions (410 Gone, 404)
          const statusCode = (err as { statusCode?: number })?.statusCode;
          if (statusCode === 410 || statusCode === 404) {
            expiredEndpoints.push(sub.endpoint);
          }
        }
      })
    );

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
    }

    // Log the notification
    await supabase.from('push_notification_log').insert({
      title,
      body,
      url: url || '/',
      sent_count: sentCount,
      failed_count: failedCount,
    });

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      cleaned: expiredEndpoints.length,
    });
  } catch (err) {
    console.error('Send push error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
