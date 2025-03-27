import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MiniAppWalletAuthSuccessPayload, verifySiweMessage } from "@worldcoin/minikit-js";

export async function POST(req) {
  try {
    const { payload, nonce } = await req.json();

    // Compare with the nonce we stored
    const storedNonce = cookies().get("siwe")?.value;
    if (!storedNonce || nonce !== storedNonce) {
      return NextResponse.json({
        status: "error",
        isValid: false,
        message: "Invalid or missing nonce",
      });
    }

    // Verify the SIWE message
    // (the user signs in the World App, we validate the signature)
    const verifyRes = await verifySiweMessage(payload, nonce);

    if (verifyRes.isValid) {
      // success => we can consider the user "logged in"
      return NextResponse.json({
        status: "success",
        isValid: true,
      });
    } else {
      return NextResponse.json({
        status: "error",
        isValid: false,
        message: "SIWE signature invalid",
      });
    }
  } catch (err) {
    console.error("complete-siwe error:", err);
    return NextResponse.json({
      status: "error",
      isValid: false,
      message: err.message,
    });
  }
}
