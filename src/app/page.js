"use client";

import { useState, useEffect, Fragment } from "react";
import { MiniKit, VerifyCommandInput, VerificationLevel } from "@worldcoin/minikit-js";
import { Dialog, Transition } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

/**
 * Main Page:
 *  - Single "Request Penpal" button.
 *  - Calls MiniKit.commandsAsync.verify(...)
 *  - On success, sends finalPayload to /api/verify-and-match
 *  - That route verifies the proof, stores user in DB, attempts match
 *  - We store the user’s `nullifier_hash` as userId
 *  - Then track penpal status as usual
 */

export default function Home() {
  // If we want to store the user’s ID (the nullifier_hash) locally:
  const [userId, setUserId] = useState("");
  // penpal status, matched user, etc.
  const [status, setStatus] = useState(null);
  const [matchedUserId, setMatchedUserId] = useState(null);

  // If you still want them to pick languages:
  const [userLanguage, setUserLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");

  // For the "Delete Match" confirmation dialog
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  // 1. Whenever userId changes, fetch /api/status to see if matched, etc.
  useEffect(() => {
    if (!userId) return;
    fetchStatus(userId);
  }, [userId]);

  async function fetchStatus(uId) {
    try {
      const res = await fetch(`/api/status?userId=${uId}`);
      const data = await res.json();
      if (data.error) {
        console.error(data.error);
        setStatus(null);
        setMatchedUserId(null);
      } else {
        setStatus(data.status);
        if (data.matchedUserId) {
          setMatchedUserId(data.matchedUserId);
        } else {
          setMatchedUserId(null);
        }
      }
    } catch (err) {
      console.error("Error fetching status:", err);
    }
  }

  // 2. "Request a Penpal" => call minikit verify => call /api/verify-and-match
  async function handleRequestPenpal() {
    // Check if in the World App
    if (!MiniKit.isInstalled()) {
      return alert("MiniKit is not installed or not running inside the World App!");
    }

    try {
      // Prepare the incognito action input:
      const verifyPayload = {
        action: "penpal-match",
        signal: "some-optional-signal",
        verification_level: VerificationLevel.Orb, // or VerificationLevel.Device
      };

      // 2a. Trigger the incognito action => user sees a drawer in the World App
      const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload);

      if (finalPayload.status === "error") {
        console.error("Minikit error payload:", finalPayload);
        return;
      }

      // 2b. Next, send the finalPayload + userLanguage, etc. to our backend for proof verification & matching
      const res = await fetch("/api/verify-and-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proofPayload: finalPayload,
          userLanguage,
          targetLanguage,
        }),
      });

      const data = await res.json();
      if (data.error || data.status !== 200) {
        console.error("Error verifying or matching:", data);
        return;
      }

      // 2c. If success, the server returns { userId: <nullifier_hash>, ... }
      if (data.userId) {
        setUserId(data.userId);
      }
      // Then our useEffect calls fetchStatus.
    } catch (err) {
      console.error("Error running minikit verify or calling /api/verify-and-match:", err);
    }
  }

  // 3. Delete match => same as older logic
  function onClickDeleteMatch() {
    setDeleteModalOpen(true);
  }
  function cancelDelete() {
    setDeleteModalOpen(false);
  }
  async function confirmDelete() {
    setDeleteModalOpen(false);
    try {
      const res = await fetch("/api/delete-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.error) {
        console.error(data.error);
      } else {
        // refresh status
        fetchStatus(userId);
      }
    } catch (err) {
      console.error("Error deleting match:", err);
    }
  }

  // ----- RENDER -----
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
      <header className="py-8 text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold drop-shadow-md mb-3">
          Penpal App - MiniKit
        </h1>
        <p className="max-w-xl mx-auto text-white text-opacity-90 text-lg sm:text-xl">
          Verify real users via World’s MiniKit!
        </p>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md bg-white text-gray-800 rounded-xl shadow-xl p-6">
          {!userId && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Request a Penpal
              </h2>

              {/* If you want them to pick their languages */}
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
                Verify &amp; Request Match
              </button>
            </div>
          )}

          {userId && (
            <div>
              <div className="mb-6 border-b border-gray-200 pb-4">
                <p className="text-gray-700 mb-1">
                  Verified user (nullifier_hash):{" "}
                  <strong className="font-medium text-purple-600">{userId}</strong>
                </p>
                <p className="text-xs text-gray-400">
                  (Unique ID derived from your proof)
                </p>
              </div>

              {status === "waiting" && (
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2 text-gray-800">
                    Please wait...
                  </h2>
                  <p className="text-gray-500">
                    Finding a suitable penpal for you.
                  </p>
                </div>
              )}

              {status === "matched" && matchedUserId && (
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    Penpal Found!
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Your penpal&apos;s user ID:{" "}
                    <span className="font-bold text-purple-600">
                      {matchedUserId}
                    </span>
                  </p>
                  <button
                    onClick={onClickDeleteMatch}
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
                    Verify &amp; Request Again
                  </button>
                </div>
              )}

              {status === "no-request" && (
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    No Request
                  </h2>
                  <p className="text-gray-500 mb-4">
                    Looks like you haven&apos;t requested a penpal yet.
                  </p>
                  <button
                    onClick={handleRequestPenpal}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Verify &amp; Request Match
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

      {/* Confirmation dialog for "Delete Match" */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={cancelDelete}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl text-gray-800">
                <div className="flex items-center mb-4">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-2" />
                  <Dialog.Title className="text-lg font-medium text-gray-900">
                    Delete Match
                  </Dialog.Title>
                </div>
                <Dialog.Description className="text-gray-600 mb-6">
                  Are you sure you want to delete this match?
                </Dialog.Description>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelDelete}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-all"
                  >
                    Yes, Delete
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
