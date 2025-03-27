import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  // Must be at least 8 characters, only alphanumeric
  // You can also do randomAlphaNumeric(16) or something custom:
  const nonce = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

  // Store the nonce in a secure, HttpOnly cookie so user can't tamper
  cookies().set("siwe", nonce, { secure: true, httpOnly: true });

  return NextResponse.json({ nonce });
}
