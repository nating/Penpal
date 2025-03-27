// lib/match.js
import { supabase } from "@/lib/supabaseClient";

export async function attemptMatch() {
  // fetch unmatched
  const { data: requests, error } = await supabase
    .from("requests")
    .select("*")
    .eq("match_deleted", false)
    .is("matched_user_id", null);

  if (error) {
    console.error("attemptMatch DB error:", error);
    return;
  }

  // naive O(n^2)
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
        // match them
        await supabase
          .from("requests")
          .update({ matched_user_id: userB.user_id })
          .eq("id", userA.id);

        await supabase
          .from("requests")
          .update({ matched_user_id: userA.user_id })
          .eq("id", userB.id);

        break;
      }
    }
  }
}
