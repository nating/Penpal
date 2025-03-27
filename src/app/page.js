"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

/**
 * A single-page Next.js 13+ (or 15+) "Penpal App" with a
 * full-page purple gradient background, no white gap.
 * Tailwind + Headless UI + Heroicons for a polished look.
 *
 * Make sure:
 *  1) Tailwind is configured
 *  2) @headlessui/react and @heroicons/react are installed
 *  3) The necessary API endpoints exist: /api/status, /api/signup, /api/delete-match
 */

export default function Home() {
  // ----- State ----- //
  // Input typed by the user for "mock sign-in"
  const [inputValue, setInputValue] = useState("");
  // Actual userId used for backend calls
  const [userId, setUserId] = useState("");
  // "no-request" | "waiting" | "matched" | "match-deleted" | null
  const [status, setStatus] = useState(null);
  const [matchedUserId, setMatchedUserId] = useState(null);

  // For sign-up fields
  const [userLanguage, setUserLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");

  // Controls the "delete match" confirmation dialog
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  // ----- Effects ----- //
  // Whenever userId changes, fetch the user's penpal status
  useEffect(() => {
    if (!userId) return;

    async function fetchStatus(uId) {
      try {
        const res = await fetch(`/api/status?userId=${uId}`);
        const data = await res.json();
        if (data.error) {
          console.error(data.error);
          setStatus(null);
        } else {
          setStatus(data.status);
          if (data.matchedUserId) {
            setMatchedUserId(data.matchedUserId);
          } else {
            setMatchedUserId(null);
          }
        }
      } catch (err) {
        console.error("Error fetching status", err);
      }
    }

    fetchStatus(userId);
  }, [userId]);

  // ----- Handlers ----- //
  function handleSignIn() {
    setUserId(inputValue.trim());
  }

  async function handleSignup() {
    if (!userId || !userLanguage || !targetLanguage) return;
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userLanguage, targetLanguage }),
      });
      const data = await res.json();
      if (data.error) {
        console.error(data.error);
      } else {
        setStatus(null);
        setMatchedUserId(null);
        setUserId(userId); // triggers re-fetch
      }
    } catch (err) {
      console.error("Error signing up", err);
    }
  }

  function onClickDeleteMatch() {
    setDeleteModalOpen(true);
  }

  function cancelDelete() {
    setDeleteModalOpen(false);
  }

  async function handleDeleteMatch() {
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
        setStatus(null);
        setMatchedUserId(null);
        setUserId(userId); // triggers re-fetch
      }
    } catch (err) {
      console.error("Error deleting match", err);
    }
  }

  function confirmDelete() {
    setDeleteModalOpen(false);
    handleDeleteMatch();
  }

  // ----- Render -----
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
      {/* Header / Branding */}
      <header className="py-8 text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold drop-shadow-md mb-3">
          Penpal App
        </h1>
        <p className="max-w-xl mx-auto text-white text-opacity-90 text-lg sm:text-xl">
          Find the perfect language exchange partner in just a few clicks.
        </p>
      </header>

      {/* Main Content: center everything */}
      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        {/* Card container (white background for contrast) */}
        <div className="w-full max-w-md bg-white text-gray-800 rounded-xl shadow-xl p-6">
          {/* If not signed in, show sign-in form */}
          {!userId && (
            <>
              <h2 className="text-xl font-semibold mb-4">Mock Sign-In</h2>
              <label
                htmlFor="userIdInput"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Enter your user ID (World ID)
              </label>
              <input
                id="userIdInput"
                type="text"
                placeholder="e.g. alice123"
                className="w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button
                onClick={handleSignIn}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded font-semibold hover:bg-purple-700 transition-colors"
              >
                Sign In
              </button>
            </>
          )}

          {/* If signed in, show penpal status & actions */}
          {userId && (
            <div>
              <div className="mb-6 border-b border-gray-200 pb-4">
                <p className="text-gray-700 mb-1">
                  Logged in as:{" "}
                  <strong className="font-medium text-purple-600">{userId}</strong>
                </p>
                <p className="text-xs text-gray-400">
                  (This is a mock – normally we'd use World ID’s secure login)
                </p>
              </div>

              {/* status: no-request */}
              {status === "no-request" && (
                <>
                  <h2 className="text-lg font-semibold mb-3">Request a Penpal</h2>
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
                      Penpal&apos;s language
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
                    onClick={handleSignup}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Sign Up
                  </button>
                </>
              )}

              {/* status: waiting */}
              {status === "waiting" && (
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2 text-gray-800">
                    Please wait...
                  </h2>
                  <p className="text-gray-500">
                    We&apos;re trying to find a suitable penpal for you.
                  </p>
                </div>
              )}

              {/* status: matched */}
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

              {/* status: match-deleted */}
              {status === "match-deleted" && (
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    Match Deleted
                  </h2>
                  <p className="text-gray-500 mb-4">
                    Either you or your penpal has deleted the match. Request a new
                    penpal?
                  </p>

                  <div className="mb-4 text-left">
                    <label
                      htmlFor="myLanguageDeleted"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Your language
                    </label>
                    <input
                      id="myLanguageDeleted"
                      type="text"
                      placeholder="e.g. English"
                      className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={userLanguage}
                      onChange={(e) => setUserLanguage(e.target.value)}
                    />
                  </div>

                  <div className="mb-4 text-left">
                    <label
                      htmlFor="targetLanguageDeleted"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Penpal&apos;s language
                    </label>
                    <input
                      id="targetLanguageDeleted"
                      type="text"
                      placeholder="e.g. Spanish"
                      className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleSignup}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Sign up Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-white/80">
        &copy; {new Date().getFullYear()} Penpal Inc. All rights reserved.
      </footer>

      {/* HEADLESS UI CONFIRMATION DIALOG (for Delete Match) */}
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
            {/* Modal backdrop */}
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </Transition.Child>

          {/* Center the Dialog */}
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
                  Are you sure you want to delete this match? You won’t be able
                  to contact your penpal anymore.
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
