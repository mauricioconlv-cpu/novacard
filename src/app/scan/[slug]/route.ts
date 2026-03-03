import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    // Use admin client if RLS prevents inserts for unauthenticated users,
    // but we can just use the anon client since we configured RLS on interactions/attendance
    // to allow public inserts.
    const supabase = await createClient();

    // 1. Fetch Card to get the user_id (employee)
    const { data: card, error: cardError } = await supabase
        .from('cards')
        .select('id, user_id, is_active')
        .eq('slug', slug)
        .single();

    if (cardError || !card || !card.is_active) {
        // Fallback redirect to home if invalid card
        return NextResponse.redirect(new URL('/', request.url));
    }

    // 2. Identify IP Address (for basic anti-fraud)
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // 3. Determine if this is a Check-In or Check-Out
    // We look for the ABSOLUTE most recent log for this employee, ignoring date boundaries
    // to flawlessly handle overnight or 24x24 shifts.
    const { data: lastLogs } = await supabase
        .from('attendance_logs')
        .select('scan_type')
        .eq('employee_user_id', card.user_id)
        .order('scan_timestamp', { ascending: false })
        .limit(1);

    let nextType = 'check_in'; // Default to check-in if no logs ever
    if (lastLogs && lastLogs.length > 0) {
        // If last action was a check_in, next must be a check_out
        if (lastLogs[0].scan_type === 'check_in') {
            nextType = 'check_out';
        }
    }

    // 4. Log the Attendance
    const { error: insertError } = await supabase
        .from('attendance_logs')
        .insert([{
            employee_user_id: card.user_id,
            scanned_by_ip: ipAddress,
            scan_type: nextType
        }]);

    if (insertError) {
        console.error("Failed to insert attendance log", insertError);
    }

    // 5. Track 'qr_scan' interaction
    await supabase.from('interactions').insert([{
        card_id: card.id,
        interaction_type: 'qr_scan',
        ip_address: ipAddress,
        user_agent: request.headers.get('user-agent') || 'unknown'
    }]);

    // 6. Redirect to the public profile immediately
    return NextResponse.redirect(new URL(`/p/${slug}`, request.url));
}
