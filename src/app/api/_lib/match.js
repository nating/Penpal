import { supabase } from '../../../../lib/supabaseClient';

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

  // 2. Attempt to find pairs:
  //    We want userA.target_language === userB.user_language
  //    AND userB.target_language === userA.user_language
  //    in the simplest scenario.
  //
  //    This naive approach is O(n^2). For an MVP, that's fine.

  for (let i = 0; i < requests.length; i++) {
    const userA = requests[i];

    // Skip if user is already matched from a previous iteration
    if (userA.matched_user_id) continue;

    for (let j = i + 1; j < requests.length; j++) {
      const userB = requests[j];

      if (userB.matched_user_id) continue;

      // Check complementary languages
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

        // Break out of the inner loop to move on to the next user
        break;
      }
    }
  }
}
