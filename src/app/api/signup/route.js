// penpal/app/api/signup/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { attemptMatch } from '@/lib/match';

export async function POST(request) {
  try {
    const { userId, userLanguage, targetLanguage } = await request.json();

    if (!userId || !userLanguage || !targetLanguage) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // 1. Check if user already has a request
    const { data: existingRequests, error: findError } = await supabase
      .from('requests')
      .select('*')
      .eq('user_id', userId);

    if (findError) {
      console.error(findError);
      return NextResponse.json({ error: 'Error reading from DB' }, { status: 500 });
    }

    if (!existingRequests || existingRequests.length === 0) {
      // Insert new record
      const { error: insertError } = await supabase
        .from('requests')
        .insert([
          {
            user_id: userId,
            user_language: userLanguage,
            target_language: targetLanguage,
          },
        ]);
      if (insertError) {
        console.error(insertError);
        return NextResponse.json({ error: 'Could not create request' }, { status: 500 });
      }
    } else {
      // Update existing record
      const existing = existingRequests[0];
      const { error: updateError } = await supabase
        .from('requests')
        .update({
          user_language: userLanguage,
          target_language: targetLanguage,
          matched_user_id: null,
          match_deleted: false,
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error(updateError);
        return NextResponse.json({ error: 'Could not update request' }, { status: 500 });
      }
    }

    // Attempt to match
    await attemptMatch();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('signup POST error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
