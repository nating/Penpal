// penpal/lib/match.js
import { supabase } from './supabaseClient';

// Simple naive matching logic
export async function attemptMatch() {
  // 1. Fetch all requests that are unmatched & not deleted
  const { data: requests, error } = await supabase
    .from('requests')
    .select('*')
    .eq('match_deleted', false)
    .is('matched_user_id', null);

  if (error) {
    console.error('Error fetching requests:', error);
    return;
  }

  // 2. Attempt to find pairs
  for (let i = 0; i < requests.length; i++) {
    const userA = requests[i];
    if (userA.matched_user_id) continue;

    for (let j = i + 1; j < requests.length; j++) {
      const userB = requests[j];
      if (userB.matched_user_id) continue;

      if (
        userA.target_language === userB.user_language &&
        userB.target_language === userA.user_language
      ) {
        // We found a match! Update in DB
        await supabase
          .from('requests')
          .update({ matched_user_id: userB.user_id })
          .eq('id', userA.id);

        await supabase
          .from('requests')
          .update({ matched_user_id: userA.user_id })
          .eq('id', userB.id);

        break;
      }
    }
  }
}
