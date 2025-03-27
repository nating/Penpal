import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * Cancels the user's penpal request by removing their row
 * (only if they're not matched yet).
 */
export async function POST(req) {
  try {
    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: "No username provided" }, { status: 400 });
    }

    // Find user's request
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
      // no row => no request
      return NextResponse.json({ success: true });
    }

    const userRequest = rows[0];
    if (userRequest.matched_user_id) {
      return NextResponse.json({ error: "Cannot cancel after matched" }, { status: 400 });
    }

    // If user is matched, we might disallow? Or just remove anyway.
    // But let's do a simple approach: remove the row if it exists,
    // ignoring if it's matched or not.
    // If you want to block removing a matched row, do an if-check here.

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
