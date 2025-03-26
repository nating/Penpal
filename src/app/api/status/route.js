// penpal/app/api/status/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request) {
  try {
    // Parse query params from request.url
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // 1. Find the user's request
    const { data: requests, error } = await supabase
      .from('requests')
      .select('*')
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: 'Error reading DB' }, { status: 500 });
    }

    if (!requests || requests.length === 0) {
      // no record => user has not requested
      return NextResponse.json({ status: 'no-request' }, { status: 200 });
    }

    const requestData = requests[0];

    // If user’s match is deleted
    if (requestData.match_deleted) {
      return NextResponse.json({ status: 'match-deleted' }, { status: 200 });
    }

    // If matched, check if partner also deleted
    if (requestData.matched_user_id) {
      const { data: partnerReqs } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', requestData.matched_user_id)
        .limit(1);

      if (partnerReqs && partnerReqs.length > 0 && partnerReqs[0].match_deleted) {
        return NextResponse.json({ status: 'match-deleted' }, { status: 200 });
      }

      return NextResponse.json({
        status: 'matched',
        matchedUserId: requestData.matched_user_id,
      });
    }

    // Otherwise, user has a request but no match
    return NextResponse.json({ status: 'waiting' }, { status: 200 });
  } catch (err) {
    console.error('status GET error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
