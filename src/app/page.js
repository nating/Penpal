import { useState, useEffect } from 'react';

export default function Home() {
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState(null); // 'no-request', 'waiting', 'matched', 'match-deleted'
  const [matchedUserId, setMatchedUserId] = useState(null);

  // For signup form
  const [userLanguage, setUserLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');

  // -- 1. Mock "Sign In" with World ID
  // We'll just let the user manually type a userId for now.
  // In reality, you'd use World ID's SDK to fill this in automatically.

  async function fetchStatus(uId) {
    if (!uId) {
      setStatus(null);
      return;
    }
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
      console.error('Error fetching status', err);
    }
  }

  useEffect(() => {
    if (userId) {
      fetchStatus(userId);
    }
  }, [userId]);

  // 2. Sign Up handler
  async function handleSignup() {
    if (!userId || !userLanguage || !targetLanguage) return;
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        // Refresh status
        fetchStatus(userId);
      }
    } catch (err) {
      console.error('Error signing up', err);
    }
  }

  // 3. Delete Match
  async function handleDeleteMatch() {
    try {
      const res = await fetch('/api/delete-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.error) {
        console.error(data.error);
      } else {
        // Refresh status
        fetchStatus(userId);
      }
    } catch (err) {
      console.error('Error deleting match', err);
    }
  }

  // 4. UI logic
  // If no userId, prompt the user to "log in" with a mock user ID.
  if (!userId) {
    return (
      <main style={{ padding: 20 }}>
        <h1>Penpal App</h1>
        <p>Mock sign-in with a "World ID":</p>
        <input
          type="text"
          placeholder="Enter your userId"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
      </main>
    );
  }

  // If we have userId, show status-based UI
  return (
    <main style={{ padding: 20 }}>
      <h1>Penpal App</h1>
      <p>Logged in as: <strong>{userId}</strong> (mocked)</p>

      {status === 'no-request' && (
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

      {status === 'waiting' && (
        <div>
          <h2>Please wait...</h2>
          <p>We’re trying to find a suitable penpal for you.</p>
        </div>
      )}

      {status === 'matched' && matchedUserId && (
        <div>
          <h2>Penpal Found!</h2>
          <p>Your penpal's user ID: {matchedUserId}</p>
          <button onClick={handleDeleteMatch}>Delete Match</button>
        </div>
      )}

      {status === 'match-deleted' && (
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
