import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    if (!username) {
      return NextResponse.json({ error: "No username" }, { status: 400 });
    }

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
      return NextResponse.json({ status: "no-request" });
    }

    const reqData = rows[0];
    if (reqData.match_deleted) {
      return NextResponse.json({ status: "match-deleted" });
    }

    if (reqData.matched_user_id) {
      // partner might have deleted as well
      const { data: partnerRows } = await supabase
        .from("requests")
        .select("*")
        .eq("user_id", reqData.matched_user_id)
        .limit(1);

      if (partnerRows && partnerRows.length > 0 && partnerRows[0].match_deleted) {
        return NextResponse.json({ status: "match-deleted" });
      }

      return NextResponse.json({
        status: "matched",
        matchedUserId: reqData.matched_user_id,
      });
    }

    // otherwise => waiting
    return NextResponse.json({ status: "waiting" });
  } catch (err) {
    console.error("status route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
