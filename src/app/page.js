"use client";

import { useState, useEffect } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

/**
 * A small spinner for loading states
 */
function Spinner() {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

/**
 * Language options with flags
 */
const languages = [
  { label: "Select a language...", value: "", flag: "" },
  { label: "English",  value: "English",  flag: "🇬🇧" },
  { label: "Spanish",  value: "Spanish",  flag: "🇪🇸" },
  { label: "French",   value: "French",   flag: "🇫🇷" },
  { label: "German",   value: "German",   flag: "🇩🇪" },
  { label: "Chinese",  value: "Chinese",  flag: "🇨🇳" },
  { label: "Japanese", value: "Japanese", flag: "🇯🇵" },
  { label: "Korean",   value: "Korean",   flag: "🇰🇷" },
];

/**
 * A transition container that applies a fade + smooth height animation
 * when its key changes.
 *
 * - 'uniqueKey': string that changes for each UI state
 * - 'loading': boolean that dims content if true
 */
function TransitionContainer({ uniqueKey, children, loading }) {
  return (
    <div className="relative transition-all duration-300 ease-in-out overflow-hidden">
      <div
        key={uniqueKey}
        className={
          "transition-opacity duration-300 " +
          (loading ? "opacity-50" : "opacity-100")
        }
      >
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const [isChecking, setIsChecking] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);

  // For minikit user
  const [isWalletAuthed, setIsWalletAuthed] = useState(false);
  const [username, setUsername] = useState("");

  // Penpal states
  const [status, setStatus] = useState(null);         // "no-request", "waiting", "matched", "match-deleted", etc.
  const [matchedUserId, setMatchedUserId] = useState(null);

  // For the language dropdowns
  const [userLanguage, setUserLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");

  // For error messages & loading spinner
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // 1) On mount => install minikit
  useEffect(() => {
    MiniKit.install();
    const installed = MiniKit.isInstalled();
    setIsInstalled(installed);
    setIsChecking(false);
  }, []);

  // 2) If we have username => fetch status
  useEffect(() => {
    if (username) {
      fetchStatus(username);
    }
  }, [username]);

  async function fetchStatus(uName) {
    try {
      setLoading(true);
      const res = await fetch(`/api/status?username=${encodeURIComponent(uName)}`);
      const data = await res.json();
      if (data.error) {
        setStatus(null);
        setMatchedUserId(null);
      } else {
        setStatus(data.status);
        setMatchedUserId(data.matchedUserId || null);
      }
    } catch (err) {
      console.error("fetchStatus error:", err);
    } finally {
      setLoading(false);
    }
  }

  // ------------------------
  // Sign in with World
  // ------------------------
  async function handleSignInWithWorld() {
    setErrorMessage("");
    if (!isInstalled) {
      setErrorMessage("Please open this mini app in the World App first.");
      return;
    }
    try {
      setLoading(true);

      // get nonce
      const r = await fetch("/api/nonce");
      const { nonce } = await r.json();

      // run walletAuth
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce,
        requestId: "0",
        statement: "Sign in to Penpal and connect with language learners worldwide.",
      });

      if (finalPayload.status === "error") {
        setErrorMessage("Sign in canceled or encountered an error.");
        return;
      }

      // verify signature in /api/complete-siwe
      const verifyRes = await fetch("/api/complete-siwe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: finalPayload, nonce }),
      });
      const verifyData = await verifyRes.json();
      if (verifyData.status !== "success" || !verifyData.isValid) {
        setErrorMessage("Sign in verification failed. Please try again.");
        return;
      }

      // success => we have a username
      if (MiniKit.user?.username) {
        setUsername(MiniKit.user.username);
        setIsWalletAuthed(true);
      } else {
        setErrorMessage("No username found. Please set a username in the World App.");
      }
    } catch (err) {
      setErrorMessage(String(err));
    } finally {
      setLoading(false);
    }
  }

  // ------------------------
  // Request a Penpal => /api/request-match
  // ------------------------
  async function handleRequestPenpal() {
    setErrorMessage("");
    if (!isWalletAuthed || !username) {
      setErrorMessage("Please sign in with World first.");
      return;
    }
    try {
      setLoading(true);
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
        setErrorMessage(data.error);
      } else {
        fetchStatus(username);
      }
    } catch (err) {
      setErrorMessage(String(err));
    } finally {
      setLoading(false);
    }
  }

  // ------------------------
  // Cancel request => /api/cancel-request
  // ------------------------
  async function handleCancelRequest() {
    setErrorMessage("");
    try {
      setLoading(true);
      await fetch("/api/cancel-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      fetchStatus(username);
    } catch (err) {
      setErrorMessage(String(err));
    } finally {
      setLoading(false);
    }
  }

  // ------------------------
  // Delete match => /api/delete-match
  // ------------------------
  async function handleDeleteMatch() {
    setErrorMessage("");
    try {
      setLoading(true);
      await fetch("/api/delete-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      fetchStatus(username);
    } catch (err) {
      setErrorMessage(String(err));
    } finally {
      setLoading(false);
    }
  }

  // Start Chat => open the link to your mini-app path with the matched user
  function handleStartChat() {
    if (!matchedUserId) return;
    const url = `https://worldcoin.org/mini-app?app_id=app_e293fcd0565f45ca296aa317212d8741&path=%2F${matchedUserId}`;
    window.open(url, "_blank");
  }

  // A single "viewKey" for transitions
  // If not authed => 'sign-in', else we use status or 'no-status'
  const viewKey = !isWalletAuthed && !username
    ? "sign-in"
    : (status ?? "no-status");

  // Renders the main content for each state
  function renderCardContent() {
    // If not signed in
    if (!isWalletAuthed && !username) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Sign in with World
          </h2>
          <p className="text-gray-600 text-center px-2">
            Securely sign in to confirm you’re real and load your username.
          </p>
          <button
            onClick={handleSignInWithWorld}
            className="bg-blue-600 text-white py-2 px-4 rounded font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      );
    }

    switch (status) {
      case "no-request":
        return (
          <div className="py-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Request a Penpal
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Language
              </label>
              <select
                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={userLanguage}
                onChange={(e) => setUserLanguage(e.target.value)}
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Penpal’s Language
              </label>
              <select
                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleRequestPenpal}
              disabled={!userLanguage || !targetLanguage}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              Request Penpal
            </button>
          </div>
        );
      case "waiting":
        return (
          <div className="text-center py-4">
            <h2 className="text-xl font-semibold mb-3 text-gray-800">
              Searching for a Partner
            </h2>
            <p className="text-gray-600 mb-4 px-2">
              We’re actively looking for a suitable match for you.
              Please check back later if you don’t see a match soon.
            </p>
            <button
              onClick={handleCancelRequest}
              className="text-sm text-gray-500 underline hover:text-gray-700"
            >
              Cancel Request
            </button>
          </div>
        );
      case "matched":
        if (!matchedUserId) {
          return (
            <div className="py-4 text-center text-gray-500">
              No matched user found
            </div>
          );
        }
        return (
          <div className="text-center py-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Great News!
            </h2>
            <p className="text-gray-700 mb-3 px-2">
              We found your ideal language partner:
              <br />
              <span className="text-purple-600 font-bold text-lg">
                {matchedUserId}
              </span>
            </p>
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleStartChat}
                className="bg-green-600 text-white py-2 px-4 rounded font-semibold hover:bg-green-700 transition-colors"
              >
                Start Chat
              </button>
              <button
                onClick={handleDeleteMatch}
                className="text-sm text-gray-500 underline hover:text-gray-700"
              >
                Remove Match
              </button>
            </div>
          </div>
        );
      case "match-deleted":
        return (
          <div className="text-center py-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Match Removed
            </h2>
            <p className="text-gray-600 mb-4 px-2">
              Your match was removed. You can request a new partner at any time.
            </p>
            <button
              onClick={handleRequestPenpal}
              className="bg-purple-600 text-white py-2 px-4 rounded font-semibold hover:bg-purple-700 transition-colors"
            >
              Request Penpal Again
            </button>
          </div>
        );
      default:
        return (
          <div className="py-4 text-center text-gray-500"></div>
        );
    }
  }

  // --------------------------------------------------
  // ACTUAL RENDER of the page
  // --------------------------------------------------
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Spinner />
      </div>
    );
  }

  if (!isInstalled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white p-6">
        <h2 className="text-3xl font-bold mb-4">Open in World App</h2>
        <p className="max-w-sm text-center text-white text-opacity-90">
          We can’t detect the World App environment.
          Please launch this mini app from inside World.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
      <header className="py-6 text-center">
        <h1 className="text-4xl font-extrabold drop-shadow-md mb-2">
          Penpal
        </h1>
        <p className="max-w-xl mx-auto text-white text-opacity-90 text-lg">
          Find a real human language exchange partner in just a few clicks
        </p>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md bg-white text-gray-800 rounded-xl shadow-xl p-6">
          {errorMessage && (
            <div className="bg-red-100 text-red-700 border border-red-300 p-3 rounded mb-4">
              {errorMessage}
            </div>
          )}

          {loading && <Spinner />}

          <TransitionContainer uniqueKey={viewKey} loading={loading}>
            {renderCardContent()}
          </TransitionContainer>
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-white/80">
        &copy; {new Date().getFullYear()} Penpal
      </footer>
    </div>
  );
}
