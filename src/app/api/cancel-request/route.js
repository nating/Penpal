// app/api/cancel-request/route.js

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * Cancels the user's penpal request by removing their row
 * from the `requests` table entirely.
 *
 * Called by handleCancelRequest() in page.js.
 */
export async function POST(req) {
  try {
    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: "No username provided" }, { status: 400 });
    }

    // Find the user's request row
    const { data: rows, error } = await supabase
      .from("requests")
      .select("*")
      .eq("user_id", username)
      .limit(1);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    if (!rows || rows.length === 0) {
      // No row => no penpal request to cancel
      return NextResponse.json({ success: true });
    }

    const userRequest = rows[0];

    // Remove their row. This fully cancels their request,
    // so they go back to "no-request" status.
    await supabase
      .from("requests")
      .delete()
      .eq("id", userRequest.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("cancel-request route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
