import { NextResponse } from "next/server";
import { verifyCloudProof, ISuccessResult } from "@worldcoin/minikit-js";
import { supabase } from "@/lib/supabaseClient"; // Or wherever you keep your Supabase client
import { attemptMatch } from "@/lib/match";     // Your naive match logic

// We'll also read your World "App ID" from an env var:
const appId = process.env.APP_ID; // e.g. "app_abc123" from your .env

export async function POST(req) {
  try {
    const body = await req.json();
    const { proofPayload, userLanguage, targetLanguage } = body;

    if (!proofPayload || proofPayload.status !== "success") {
      return NextResponse.json({ error: "Invalid proof payload" }, { status: 400 });
    }

    // 1) Verify the proof on the server
    //    proofPayload is typed as ISuccessResult: { proof, nullifier_hash, merkle_root, ... }
    const verifyRes = await verifyCloudProof(
      proofPayload,       // The entire result from minikit
      appId,              // e.g. "app_xyz123"
      proofPayload.action,
      proofPayload.signal // if you used a signal
    );

    if (!verifyRes.success) {
      // Could be user has already verified, or something else
      return NextResponse.json({ error: "Proof verification failed" }, { status: 400 });
    }

    // 2) We now have a guaranteed-unique user identified by `nullifier_hash`.
    const userId = proofPayload.nullifier_hash;

    // Insert or update the "requests" table with userLanguage, targetLanguage, etc.
    const { data: existing, error: findError } = await supabase
      .from("requests")
      .select("*")
      .eq("user_id", userId);

    if (findError) {
      console.error("DB find error:", findError);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    if (!existing || existing.length === 0) {
      // Insert new request
      const { error: insertError } = await supabase.from("requests").insert([
        {
          user_id: userId,
          user_language: userLanguage || "",
          target_language: targetLanguage || "",
        },
      ]);
      if (insertError) {
        console.error("Insert error:", insertError);
        return NextResponse.json({ error: "DB insert error" }, { status: 500 });
      }
    } else {
      // Update existing
      const request = existing[0];
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          user_language: userLanguage || "",
          target_language: targetLanguage || "",
          matched_user_id: null,
          match_deleted: false,
        })
        .eq("id", request.id);
      if (updateError) {
        console.error("Update error:", updateError);
        return NextResponse.json({ error: "DB update error" }, { status: 500 });
      }
    }

    // 3) Attempt to match
    await attemptMatch();

    // 4) Return success + the user's nullifier_hash as "userId"
    return NextResponse.json({
      status: 200,
      success: true,
      userId
    });
  } catch (err) {
    console.error("verify-and-match route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
