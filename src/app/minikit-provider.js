"use client";
import { useEffect } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

export default function MiniKitProvider({ children }) {
  useEffect(() => {
    // If you have an app ID from your World dev portal, pass it here:
    // e.g. MiniKit.install("app_xyz123")
    MiniKit.install(process.env.APP_ID);
  }, []);

  return <>{children}</>;
}
