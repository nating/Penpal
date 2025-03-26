// penpal/app/api/delete-match/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Find the user's request
    const { data: userRequests, error } = await supabase
      .from('requests')
      .select('*')
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: 'Error reading DB' }, { status: 500 });
    }

    if (!userRequests || userRequests.length === 0) {
      // no record => nothing to delete
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const userRequest = userRequests[0];

    // if user has matched_user_id, also mark that partner's record as deleted
    if (userRequest.matched_user_id) {
      await supabase
        .from('requests')
        .update({ match_deleted: true })
        .eq('user_id', userRequest.matched_user_id);
    }

    // Mark the user’s own record as match_deleted
    await supabase
      .from('requests')
      .update({ match_deleted: true })
      .eq('id', userRequest.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('delete-match POST error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
