"use client";

import { useState, useEffect, Fragment } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

// A small spinner for loading states
function Spinner() {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

// An array of language objects with flags
// You can adjust or expand these country codes and languages as needed.
const languages = [
  {
    label: "Select a language...",
    value: "",
    flag: "", // blank
  },
  {
    label: "English",
    value: "English",
    flag: "🇬🇧", // or "🇺🇸" depending on your preference
  },
  {
    label: "Spanish",
    value: "Spanish",
    flag: "🇪🇸",
  },
  {
    label: "French",
    value: "French",
    flag: "🇫🇷",
  },
  {
    label: "German",
    value: "German",
    flag: "🇩🇪",
  },
  {
    label: "Chinese",
    value: "Chinese",
    flag: "🇨🇳",
  },
  {
    label: "Japanese",
    value: "Japanese",
    flag: "🇯🇵",
  },
  {
    label: "Korean",
    value: "Korean",
    flag: "🇰🇷",
  },
];

export default function Home() {
  const [isChecking, setIsChecking] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isWalletAuthed, setIsWalletAuthed] = useState(false);
  const [username, setUsername] = useState("");

  const [status, setStatus] = useState(null);
  const [matchedUserId, setMatchedUserId] = useState(null);

  const [userLanguage, setUserLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false); // for showing spinner in some transitions

  // Because we want less jumpiness, let's define a minHeight for the card content
  // We'll also do a subtle transition on the height so it doesn't jerk around.
  const cardMinHeight = 300;

  useEffect(() => {
    MiniKit.install();
    const installed = MiniKit.isInstalled();
    setIsInstalled(installed);
    setIsChecking(false);
  }, []);

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
        console.error(data.error);
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

  // 1) Sign in with World
  async function handleSignInWithWorld() {
    setErrorMessage("");
    if (!isInstalled) {
      setErrorMessage("Please open this mini app in the World App first.");
      return;
    }
    try {
      setLoading(true);

      // 1) get nonce
      const r = await fetch("/api/nonce");
      const { nonce } = await r.json();

      // 2) walletAuth
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce,
        requestId: "0",
        statement: "Sign in to Penpal and connect with language learners worldwide.",
      });

      if (finalPayload.status === "error") {
        setErrorMessage("Sign in canceled or encountered an error.");
        return;
      }

      // 3) verify signature in /api/complete-siwe
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

      // 4) we have username
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

  // 2) Request penpal => /api/request-match
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
        // fetch status to see "waiting"
        fetchStatus(username);
      }
    } catch (err) {
      setErrorMessage(String(err));
    } finally {
      setLoading(false);
    }
  }

  // 3) Cancel request => /api/cancel-request
  async function handleCancelRequest() {
    setErrorMessage("");
    if (!username) return;
    try {
      setLoading(true);
      const res = await fetch("/api/cancel-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (data.error) {
        setErrorMessage(data.error);
      } else {
        // now user probably has no-request
        fetchStatus(username);
      }
    } catch (err) {
      setErrorMessage(String(err));
    } finally {
      setLoading(false);
    }
  }

  // 4) Delete match => /api/delete-match
  async function handleDeleteMatch() {
    setErrorMessage("");
    try {
      setLoading(true);
      const res = await fetch("/api/delete-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
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

  // When matched, we add a “Start Chat” button
  function handleStartChat() {
    if (!matchedUserId) return;
    // We’ll open the link in a new tab or the same tab; your choice
    const url = `https://worldcoin.org/mini-app?app_id=app_e293fcd0565f45ca296aa317212d8741&path=%2F${matchedUserId}`;
    window.open(url, "_blank");
  }

  // ---------- RENDER ----------
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
          We can’t detect the World App environment. Please launch this mini app from inside World.
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
        <div
          className="w-full max-w-md bg-white text-gray-800 rounded-xl shadow-xl p-6 transition-all duration-300"
          style={{ minHeight: cardMinHeight }}
        >
          {errorMessage && (
            <div className="bg-red-100 text-red-700 border border-red-300 p-3 rounded mb-4">
              {errorMessage}
            </div>
          )}

          {loading && <Spinner />}

          {!isWalletAuthed && !username && !loading && (
            <div className="flex flex-col items-center justify-center h-full">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Sign in with World
              </h2>
              <p className="mb-4 text-gray-600 text-center">
                Securely sign in to confirm you’re a real person and load your username.
              </p>
              <button
                onClick={handleSignInWithWorld}
                className="bg-blue-600 text-white py-2 px-4 rounded font-semibold hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            </div>
          )}

          {isWalletAuthed && username && !loading && (
            <div>
              <div className="mb-6 border-b border-gray-200 pb-2">
                <p className="text-gray-700">
                  Signed in as:
                  <br />
                  <strong className="font-medium text-purple-600">
                    {username}
                  </strong>
                </p>
              </div>

              {/* STATES: no-request, waiting, matched, match-deleted */}
              {status === "no-request" && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    Request a Penpal
                  </h2>

                  {/* User language dropdown */}
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

                  {/* Target language dropdown */}
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
              )}

              {status === "waiting" && (
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-3 text-gray-800">
                    Searching for a Partner
                  </h2>
                  <p className="text-gray-600 mb-4">
                    We’re actively looking for someone who speaks{" "}
                    <strong>{targetLanguage}</strong> and wants to learn{" "}
                    <strong>{userLanguage}</strong>. Please check back later!
                  </p>
                  <button
                    onClick={handleCancelRequest}
                    className="text-sm text-gray-500 underline hover:text-gray-700"
                  >
                    Cancel Request
                  </button>
                </div>
              )}

              {status === "matched" && matchedUserId && (
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    Great News!
                  </h2>
                  <p className="text-gray-700 mb-3">
                    We found your perfect language partner:
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
              )}

              {status === "match-deleted" && (
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    Match Removed
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Your match was deleted. You can request another partner
                    anytime!
                  </p>
                  <button
                    onClick={handleRequestPenpal}
                    className="bg-purple-600 text-white py-2 px-4 rounded font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Request New Penpal
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
