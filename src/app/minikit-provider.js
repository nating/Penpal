"use client";

import { useEffect } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

/**
 * Wrap your app in this provider so MiniKit is installed
 * when the user opens the mini app inside World.
 */
export default function MiniKitProvider({ children }) {
  useEffect(() => {
    // If you have an app ID from your World dashboard,
    // pass it here: MiniKit.install("app_myAppId123")
    // If not, you can just call MiniKit.install() with no args
    MiniKit.install();
  }, []);

  return <>{children}</>;
}
