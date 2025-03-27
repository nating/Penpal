"use client";

import { useState, useEffect } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

/**
 * Refined "Penpal" MVP:
 *  - Centered title "Penpal"
 *  - Subtext "Find a real human language exchange partner in just a few clicks"
 *  - No logo in the app
 *  - "Sign in" button is purple
 *  - "Welcome, <username>!" with username in purple
 *  - Default languages: English => Portuguese
 *  - Cancel request from the waiting screen
 */

export default function Home() {
  const [isChecking, setIsChecking] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);

  const [isWalletAuthed, setIsWalletAuthed] = useState(false);
  const [username, setUsername] = useState("");

  // penpal status
  const [status, setStatus] = useState(null); // "no-request", "waiting", "matched", "match-deleted"
  const [matchedUserId, setMatchedUserId] = useState(null);

  // default userLanguage = English, default targetLanguage = Portuguese
  const [userLanguage, setUserLanguage] = useState("English");
  const [targetLanguage, setTargetLanguage] = useState("Portuguese");

  const [errorMessage, setErrorMessage] = useState("");

  // We'll just do a small list for the dropdown
  const languageOptions = [
    "English",
    "Spanish",
    "French",
    "German",
    "Chinese",
    "Japanese",
    "Korean",
    "Portuguese",
    "Italian",
  ];

  useEffect(() => {
    MiniKit.install();
    const installed = MiniKit.isInstalled();
    setIsInstalled(installed);
    setIsChecking(false);
  }, []);

  useEffect(() => {
    if (!username) return;
    fetchStatus(username);
  }, [username]);

  async function fetchStatus(uName) {
    try {
      const res = await fetch(`/api/status?username=${encodeURIComponent(uName)}`);
      const data = await res.json();
      if (data.error) {
        console.error("Status error:", data.error);
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

  // ----- Sign in with wallet (purple button) -----
  async function handleSignInWithWorld() {
    setErrorMessage("");
    if (!isInstalled) {
      setErrorMessage("Please open this mini app in the World App to proceed.");
      return;
    }

    try {
      // get nonce
      const r = await fetch("/api/nonce");
      const { nonce } = await r.json();

      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce,
        requestId: "0",
        statement: "Sign in to Penpal",
      });

      if (finalPayload.status === "error") {
        setErrorMessage("Sign-in canceled or error occurred.");
        return;
      }

      // verify SIWE
      const verifyRes = await fetch("/api/complete-siwe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: finalPayload, nonce }),
      });
      const verifyData = await verifyRes.json();
      if (verifyData.status !== "success" || !verifyData.isValid) {
        setErrorMessage("Sign-in verification failed. Please try again.");
        return;
      }

      if (MiniKit.user?.username) {
        setUsername(MiniKit.user.username);
        setIsWalletAuthed(true);
      } else {
        setErrorMessage("No username found. Please set a username in the World App.");
      }
    } catch (err) {
      console.error("handleSignInWithWorld error:", err);
      setErrorMessage(String(err));
    }
  }

  // single action => /api/request-match
  async function handleRequestPenpal() {
    setErrorMessage("");
    if (!isWalletAuthed || !username) {
      setErrorMessage("Please sign in first.");
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
        setErrorMessage(data.error);
        return;
      }
      // refresh
      fetchStatus(username);
    } catch (err) {
      console.error("handleRequestPenpal error:", err);
      setErrorMessage(String(err));
    }
  }

  // cancel => /api/cancel-request
  async function handleCancelRequest() {
    setErrorMessage("");
    if (!isWalletAuthed || !username) return;

    try {
      const res = await fetch("/api/cancel-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (data.error) {
        setErrorMessage(data.error);
        return;
      }
      // likely no-request
      fetchStatus(username);
    } catch (err) {
      console.error("handleCancelRequest error:", err);
      setErrorMessage(String(err));
    }
  }

  // if matched => user can delete => /api/delete-match
  async function handleDeleteMatch() {
    setErrorMessage("");
    if (!isWalletAuthed || !username) return;

    try {
      const res = await fetch("/api/delete-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (data.error) {
        setErrorMessage(data.error);
        return;
      }
      fetchStatus(username);
    } catch (err) {
      console.error("deleteMatch error:", err);
      setErrorMessage(String(err));
    }
  }

  // ---------- RENDER -----------
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-800">
        <p>Loading Penpal...</p>
      </div>
    );
  }

  if (!isInstalled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white p-6">
        <h2 className="text-3xl font-bold mb-4 text-center">Please Open in World App</h2>
        <p className="max-w-sm text-center text-white text-opacity-90">
          We can’t detect the World App environment. Please launch this mini app from inside the official World App.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
      <header className="py-12 px-4 text-center">
        <h1 className="text-5xl font-extrabold drop-shadow-md mb-4">Penpal</h1>
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

          {/* If not wallet authed => sign in (purple) */}
          {!isWalletAuthed && (
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Sign in with World
              </h2>
              <p className="mb-3 text-gray-600">
                Securely verify you're a real person and get started.
              </p>
              <button
                onClick={handleSignInWithWorld}
                className="inline-block bg-purple-600 text-white py-2 px-4 rounded font-semibold hover:bg-purple-700 transition-colors"
              >
                Sign In with World
              </button>
            </div>
          )}

          {/* If we have a username => show penpal UI */}
          {isWalletAuthed && username && (
            <div>
              {/* "Welcome <username>!" */}
              <div className="mb-6 border-b border-gray-200 pb-2">
                <p className="text-gray-700 text-lg">
                  Welcome,{" "}
                  <strong className="font-medium text-purple-600">{username}</strong>!
                </p>
              </div>

              {/* no-request => show request form */}
              {status === "no-request" && (
                <div>
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
                      {languageOptions.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
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
                      {languageOptions.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleRequestPenpal}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Request Penpal
                  </button>
                </div>
              )}

              {/* waiting => show "Please wait" + cancel */}
              {status === "waiting" && (
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2 text-gray-800">
                    Please wait...
                  </h2>
                  <p className="text-gray-500 mb-4">
                    We’re searching for a suitable partner for you.
                  </p>
                  <button
                    onClick={handleCancelRequest}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel Request
                  </button>
                </div>
              )}

              {/* matched => show matched user + delete */}
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

              {/* match-deleted => show "request again" */}
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
        &copy; {new Date().getFullYear()} Penpal
      </footer>
    </div>
  );
}
