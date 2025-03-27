import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { attemptMatch } from "@/lib/match";

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, userLanguage, targetLanguage } = body;

    if (!username) {
      return NextResponse.json({ error: "No username provided" }, { status: 400 });
    }

    // 1) Find existing
    const { data: existing, error: findError } = await supabase
      .from("requests")
      .select("*")
      .eq("user_id", username);

    if (findError) {
      console.error(findError);
      return NextResponse.json({ error: "DB read error" }, { status: 500 });
    }

    // 2) Insert or update
    if (!existing || existing.length === 0) {
      const { error: insertError } = await supabase.from("requests").insert([
        {
          user_id: username,
          user_language: userLanguage || "",
          target_language: targetLanguage || "",
        },
      ]);
      if (insertError) {
        console.error(insertError);
        return NextResponse.json({ error: "DB insert error" }, { status: 500 });
      }
    } else {
      const row = existing[0];
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          user_language: userLanguage || "",
          target_language: targetLanguage || "",
          matched_user_id: null,
          match_deleted: false,
        })
        .eq("id", row.id);

      if (updateError) {
        console.error(updateError);
        return NextResponse.json({ error: "DB update error" }, { status: 500 });
      }
    }

    // 3) Attempt naive match
    await attemptMatch();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("request-match route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
