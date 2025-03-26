"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [inputValue, setInputValue] = useState(""); // what the user types
  const [userId, setUserId] = useState("");         // the actual user ID we use
  const [status, setStatus] = useState(null);
  const [matchedUserId, setMatchedUserId] = useState(null);
  const [userLanguage, setUserLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");

  // This fetch only happens AFTER userId is set (by clicking "Sign In" below)
  useEffect(() => {
    if (!userId) return; // if empty, do nothing

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

  // Called when you click "Sign In"
  function handleSignIn() {
    setUserId(inputValue.trim()); // move inputValue into userId
  }

  async function handleSignup() {
    if (!userId || !userLanguage || !targetLanguage) return;
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userLanguage,
          targetLanguage,
        }),
      });
      const data = await res.json();
      if (data.error) {
        console.error(data.error);
      } else {
        // re-fetch status
        setStatus(null);
        setMatchedUserId(null);
        // We'll rely on useEffect to call fetchStatus automatically
        setUserId(userId); // triggers re-fetch
      }
    } catch (err) {
      console.error("Error signing up", err);
    }
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
        // re-fetch status
        setStatus(null);
        setMatchedUserId(null);
        setUserId(userId); // triggers re-fetch
      }
    } catch (err) {
      console.error("Error deleting match", err);
    }
  }

  // If userId is not yet set, show sign-in form
  if (!userId) {
    return (
      <main style={{ padding: 20 }}>
        <h1>Penpal App</h1>
        <p>Mock sign-in with a "World ID":</p>
        <input
          type="text"
          placeholder="Enter your userId"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button onClick={handleSignIn}>Sign In</button>
      </main>
    );
  }

  // If we have a userId, show the rest of the UI
  return (
    <main style={{ padding: 20 }}>
      <h1>Penpal App</h1>
      <p>
        Logged in as: <strong>{userId}</strong> (mocked)
      </p>

      {status === "no-request" && (
        <div>
          <h2>Request a Penpal</h2>
          <input
            type="text"
            placeholder="Your language"
            value={userLanguage}
            onChange={(e) => setUserLanguage(e.target.value)}
          />
          <br />
          <input
            type="text"
            placeholder="Penpal's language"
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
          />
          <br />
          <button onClick={handleSignup}>Sign up</button>
        </div>
      )}

      {status === "waiting" && (
        <div>
          <h2>Please wait...</h2>
          <p>We’re trying to find a suitable penpal for you.</p>
        </div>
      )}

      {status === "matched" && matchedUserId && (
        <div>
          <h2>Penpal Found!</h2>
          <p>Your penpal's user ID: {matchedUserId}</p>
          <button onClick={handleDeleteMatch}>Delete Match</button>
        </div>
      )}

      {status === "match-deleted" && (
        <div>
          <h2>Match Deleted</h2>
          <p>Either you or your penpal has deleted the match. Request a new penpal?</p>
          <input
            type="text"
            placeholder="Your language"
            value={userLanguage}
            onChange={(e) => setUserLanguage(e.target.value)}
          />
          <br />
          <input
            type="text"
            placeholder="Penpal's language"
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
          />
          <br />
          <button onClick={handleSignup}>Sign up Again</button>
        </div>
      )}
    </main>
  );
}
