"use client";

import { useState, useEffect } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

/**
 * A single-page MVP:
 *  - If not in World App => "please open in World"
 *  - "Sign in with wallet" => gets `username` from MiniKit.user.username
 *  - "Request Penpal" => calls /api/request-match (upserts DB + attempts match)
 *  - We fetch status from /api/status?username=...
 *  - "Delete Match" => calls /api/delete-match
 *
 * No incognito or orb checks. We rely solely on `username` from wallet auth.
 */

export default function Home() {
  const [isChecking, setIsChecking] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);

  // Are we wallet-authed? => we have a username
  const [isWalletAuthed, setIsWalletAuthed] = useState(false);
  const [username, setUsername] = useState("");

  // penpal states
  const [status, setStatus] = useState(null); // "no-request", "waiting", "matched", "match-deleted"
  const [matchedUserId, setMatchedUserId] = useState(null);

  // user-languages
  const [userLanguage, setUserLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  // 1) On mount => MiniKit.install(), check isInstalled
  useEffect(() => {
    MiniKit.install();
    const installed = MiniKit.isInstalled();
    setIsInstalled(installed);
    setIsChecking(false);
  }, []);

  // 2) Whenever `username` changes => fetch penpal status
  useEffect(() => {
    if (!username) return;
    fetchStatus(username);
  }, [username]);

  async function fetchStatus(uName) {
    try {
      const res = await fetch(`/api/status?username=${encodeURIComponent(uName)}`);
      const data = await res.json();
      if (data.error) {
        console.error(data.error);
        setStatus(null);
        setMatchedUserId(null);
      } else {
        setStatus(data.status);
        setMatchedUserId(data.matchedUserId || null);
      }
    } catch (err) {
      console.error("fetchStatus error:", err);
    }
  }

  // ------------------------------
  // Sign in with wallet => get username
  // ------------------------------
  async function handleSignInWithWallet() {
    setErrorMessage("");

    if (!isInstalled) {
      setErrorMessage("Please open this mini app inside the World App.");
      return;
    }

    try {
      // 1) get nonce from /api/nonce
      const r = await fetch("/api/nonce"); // <== You must have a /api/nonce route for SIWE
      const { nonce } = await r.json();

      // 2) call walletAuth
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce,
        requestId: "0",
        statement: "Sign in to the Penpal App",
      });

      if (finalPayload.status === "error") {
        setErrorMessage("Wallet auth error or user canceled.");
        return;
      }

      // 3) verify in the backend => /api/complete-siwe
      const verifyRes = await fetch("/api/complete-siwe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: finalPayload, nonce }),
      });
      const verifyData = await verifyRes.json();
      if (verifyData.status !== "success" || !verifyData.isValid) {
        setErrorMessage("SIWE verification failed or invalid signature.");
        return;
      }

      // 4) If success => read username
      if (MiniKit.user?.username) {
        setUsername(MiniKit.user.username);
        setIsWalletAuthed(true);
      } else {
        setErrorMessage("No username found. Please set a username in the World App.");
      }
    } catch (err) {
      console.error("handleSignInWithWallet error:", err);
      setErrorMessage(String(err));
    }
  }

  // ------------------------------
  // Request a Penpal => /api/request-match
  // ------------------------------
  async function handleRequestPenpal() {
    setErrorMessage("");

    if (!isInstalled) {
      setErrorMessage("Please open in the World App first.");
      return;
    }
    if (!isWalletAuthed || !username) {
      setErrorMessage("Please sign in with your wallet first.");
      return;
    }

    try {
      const res = await fetch("/api/request-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          userLanguage,
          targetLanguage,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setErrorMessage(`request-match error: ${JSON.stringify(data)}`);
        return;
      }

      // Refresh status
      fetchStatus(username);
    } catch (err) {
      console.error("handleRequestPenpal error:", err);
      setErrorMessage(String(err));
    }
  }

  // ------------------------------
  // Delete match => /api/delete-match
  // ------------------------------
  async function handleDeleteMatch() {
    setErrorMessage("");

    try {
      const res = await fetch("/api/delete-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (data.error) {
        setErrorMessage(`delete-match error: ${JSON.stringify(data)}`);
        return;
      }

      // Refresh status
      fetchStatus(username);
    } catch (err) {
      console.error("handleDeleteMatch error:", err);
      setErrorMessage(String(err));
    }
  }

  // ---------- RENDER -----------
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-800">
        Initializing MiniKit...
      </div>
    );
  }
  if (!isInstalled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white p-6">
        <h2 className="text-3xl font-bold mb-4">Please Open in the World App</h2>
        <p className="max-w-sm text-center text-white text-opacity-90">
          We can’t detect the World App environment.
          Please launch this mini app from inside the official World App.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
      <header className="py-8 text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold drop-shadow-md mb-3">
          Penpal App
        </h1>
        <p className="max-w-xl mx-auto text-white text-opacity-90 text-lg sm:text-xl">
          Single action “Request Penpal.” We store & match by username.
        </p>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md bg-white text-gray-800 rounded-xl shadow-xl p-6">
          {errorMessage && (
            <div className="bg-red-100 text-red-700 border border-red-300 p-3 rounded mb-4">
              {errorMessage}
            </div>
          )}

          {/* If not authed => sign in */}
          {!isWalletAuthed && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Sign In with Wallet
              </h2>
              <p className="mb-3 text-gray-600">
                Authenticate with your World App wallet to load your username.
              </p>
              <button
                onClick={handleSignInWithWallet}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded font-semibold hover:bg-blue-700 transition-colors"
              >
                Sign In with Wallet
              </button>
            </div>
          )}

          {/* If we have a username => show penpal UI */}
          {isWalletAuthed && username && (
            <div>
              <div className="mb-6 border-b border-gray-200 pb-2">
                <p className="text-gray-700 mb-1">
                  Username:
                  <br />
                  <strong className="font-medium text-purple-600">{username}</strong>
                </p>
              </div>

              {status === "no-request" && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    Request a Penpal
                  </h2>
                  <div className="mb-4">
                    <label
                      htmlFor="myLanguage"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Your language
                    </label>
                    <input
                      id="myLanguage"
                      type="text"
                      placeholder="e.g. English"
                      className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={userLanguage}
                      onChange={(e) => setUserLanguage(e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="targetLanguage"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Penpal’s language
                    </label>
                    <input
                      id="targetLanguage"
                      type="text"
                      placeholder="e.g. Spanish"
                      className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleRequestPenpal}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Request Penpal
                  </button>
                </div>
              )}

              {status === "waiting" && (
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2 text-gray-800">
                    Please wait...
                  </h2>
                  <p className="text-gray-500">
                    We’re finding you a suitable penpal.
                  </p>
                </div>
              )}

              {status === "matched" && matchedUserId && (
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    Penpal Found!
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Your penpal’s username:{" "}
                    <span className="font-bold text-purple-600">{matchedUserId}</span>
                  </p>
                  <button
                    onClick={handleDeleteMatch}
                    className="w-full bg-red-500 text-white py-2 px-4 rounded font-semibold hover:bg-red-600 transition-colors"
                  >
                    Delete Match
                  </button>
                </div>
              )}

              {status === "match-deleted" && (
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    Match Deleted
                  </h2>
                  <p className="text-gray-500 mb-4">
                    Your match is no longer active. Request a new one?
                  </p>
                  <button
                    onClick={handleRequestPenpal}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Request Penpal Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-white/80">
        &copy; {new Date().getFullYear()} Penpal Inc.
      </footer>
    </div>
  );
}
