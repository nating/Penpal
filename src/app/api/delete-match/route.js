// app/api/delete-match/route.js

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * Deletes a match for the given username:
 *  - If user has a match, we mark the partner's row as match_deleted
 *  - Then we mark user's own row as match_deleted
 *
 * This is called by handleDeleteMatch() in page.js.
 */
export async function POST(req) {
  try {
    // 1) Read JSON body
    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: "No username provided" }, { status: 400 });
    }

    // 2) Find the user's request row
    const { data: rows, error } = await supabase
      .from("requests")
      .select("*")
      .eq("user_id", username)
      .limit(1);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!rows || rows.length === 0) {
      // No row => nothing to delete
      return NextResponse.json({ success: true });
    }

    const userRequest = rows[0];

    // 3) If matched, mark the partner's row as deleted too
    if (userRequest.matched_user_id) {
      await supabase
        .from("requests")
        .update({ match_deleted: true })
        .eq("user_id", userRequest.matched_user_id);
    }

    // 4) Mark this user's row as deleted
    await supabase
      .from("requests")
      .update({ match_deleted: true })
      .eq("id", userRequest.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("delete-match route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
