"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const UNIFIED_STORAGE_KEY = "fpt_admin_session";
const SECTION_STORAGE_PREFIX = "fpt_admin_session_";
const ALL_ADMIN_SECTIONS = ["main", "tournament", "trial_foty"];

// Module-level cache & lock to prevent cross-component / cross-tab request storms
let inFlightVerifyPromise = null;
let lastVerifyAttemptTime = 0;
const SESSION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache before re-validating with server
const MIN_REQUEST_COOLDOWN_MS = 15 * 1000; // Minimum 15 seconds between server network requests

export function useAdminSession(section = "main") {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [noAccessInfo, setNoAccessInfo] = useState(null);

  // Helper to retrieve unexpired session from unified storage or fallback section keys
  const getLocalSession = useCallback(() => {
    if (typeof window === "undefined") return null;

    // 1. Check primary unified session
    const primary = localStorage.getItem(UNIFIED_STORAGE_KEY);
    if (primary) {
      try {
        const parsed = JSON.parse(primary);
        if (parsed?.token && parsed?.expiresAt && Date.now() < parsed.expiresAt) {
          return parsed;
        }
      } catch (e) {}
    }

    // 2. Check section-specific session
    const currentSec = localStorage.getItem(`${SECTION_STORAGE_PREFIX}${section}`);
    if (currentSec) {
      try {
        const parsed = JSON.parse(currentSec);
        if (parsed?.token && parsed?.expiresAt && Date.now() < parsed.expiresAt) {
          return parsed;
        }
      } catch (e) {}
    }

    // 3. Fallback: Check other section sessions to import into unified session
    for (const s of ALL_ADMIN_SECTIONS) {
      if (s === section) continue;
      const alt = localStorage.getItem(`${SECTION_STORAGE_PREFIX}${s}`);
      if (alt) {
        try {
          const parsed = JSON.parse(alt);
          if (parsed?.token && parsed?.expiresAt && Date.now() < parsed.expiresAt) {
            return parsed;
          }
        } catch (e) {}
      }
    }

    return null;
  }, [section]);

  const verifySession = useCallback(async (force = false) => {
    if (typeof window === "undefined") return;

    try {
      const session = getLocalSession();
      if (!session) {
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        setNoAccessInfo(null);
        setAuthChecking(false);
        return;
      }

      // 1. Check client-side expiration (24 hours)
      if (!session.expiresAt || Date.now() > session.expiresAt) {
        handleLogout();
        setAuthChecking(false);
        return;
      }

      const now = Date.now();

      // 2. If recently verified within cache TTL and not forced, trust local session without hitting server
      if (!force && session.lastVerified && (now - session.lastVerified < SESSION_CACHE_TTL_MS)) {
        setIsAuthenticated(true);
        setUser(session.user);
        setToken(session.token);
        setNoAccessInfo(null);
        setAuthChecking(false);
        return;
      }

      // 3. Throttle network requests: avoid hammering server within cooldown window
      if (!force && (now - lastVerifyAttemptTime < MIN_REQUEST_COOLDOWN_MS)) {
        // Use cached state during cooldown
        if (session.user) {
          setIsAuthenticated(true);
          setUser(session.user);
          setToken(session.token);
        }
        setAuthChecking(false);
        return;
      }

      lastVerifyAttemptTime = now;

      // 4. Reuse in-flight request if one is already running
      if (!inFlightVerifyPromise) {
        inFlightVerifyPromise = (async () => {
          try {
            const res = await fetch("/api/admin-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "verify",
                token: session.token,
                section,
              }),
            });

            if (!res.ok) {
              throw new Error(`HTTP error ${res.status}`);
            }

            return await res.json();
          } finally {
            inFlightVerifyPromise = null;
          }
        })();
      }

      const data = await inFlightVerifyPromise;

      if (data && data.success && data.valid && data.user) {
        setIsAuthenticated(true);
        setUser(data.user);
        setToken(session.token);
        setNoAccessInfo(null);

        // Synchronize unified session and current section session with new lastVerified timestamp
        const syncedSession = {
          ...session,
          user: data.user,
          lastVerified: Date.now(),
        };
        try {
          localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(syncedSession));
          localStorage.setItem(`${SECTION_STORAGE_PREFIX}${section}`, JSON.stringify(syncedSession));
        } catch (e) {}
      } else if (data && data.noAccess) {
        // Valid login, but user doesn't have permission for this section
        setIsAuthenticated(false);
        setUser(null);
        setToken(session.token);
        setNoAccessInfo({
          username: data.username,
          name: data.name,
          error: data.error,
        });
      } else if (data && data.valid === false) {
        // Expired or explicitly invalid token on server
        handleLogout();
      }
    } catch (err) {
      console.warn("Session check server notice, preserving local session:", err.message || err);
      // In case of network glitch or challenge, preserve local unexpired session
      try {
        const session = getLocalSession();
        if (session && session.expiresAt && Date.now() < session.expiresAt) {
          setIsAuthenticated(true);
          setUser(session.user);
          setToken(session.token);
        }
      } catch (e) {}
    } finally {
      setAuthChecking(false);
    }
  }, [section, getLocalSession]);

  useEffect(() => {
    // Initial verification on mount
    verifySession();

    // Listen to storage events: ONLY update in-memory state without re-fetching from server!
    // This strictly prevents the ping-pong multi-tab infinite loop.
    const handleStorageEvent = (e) => {
      if (e.key === UNIFIED_STORAGE_KEY || (e.key && e.key.startsWith(SECTION_STORAGE_PREFIX))) {
        const session = getLocalSession();
        if (session && session.expiresAt && Date.now() < session.expiresAt) {
          setIsAuthenticated(true);
          setUser(session.user);
          setToken(session.token);
          setNoAccessInfo(null);
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setToken(null);
        }
        setAuthChecking(false);
      }
    };

    window.addEventListener("storage", handleStorageEvent);
    return () => window.removeEventListener("storage", handleStorageEvent);
  }, [verifySession, getLocalSession]);

  const handleLoginSuccess = (sessionData) => {
    const enriched = {
      ...sessionData,
      lastVerified: Date.now(),
    };
    setIsAuthenticated(true);
    setUser(enriched.user);
    setToken(enriched.token);
    setNoAccessInfo(null);

    // Save to unified key and all admin section keys
    try {
      localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(enriched));
      localStorage.setItem(`${SECTION_STORAGE_PREFIX}${section}`, JSON.stringify(enriched));
      ALL_ADMIN_SECTIONS.forEach((s) => {
        localStorage.setItem(`${SECTION_STORAGE_PREFIX}${s}`, JSON.stringify(enriched));
      });
    } catch (e) {}
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(UNIFIED_STORAGE_KEY);
        ALL_ADMIN_SECTIONS.forEach((s) => {
          localStorage.removeItem(`${SECTION_STORAGE_PREFIX}${s}`);
        });
        sessionStorage.removeItem("fpt_admin_auth");
      } catch (e) {}
    }
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    setNoAccessInfo(null);
  };

  return {
    isAuthenticated,
    setIsAuthenticated,
    authChecking,
    user,
    token,
    noAccessInfo,
    handleLoginSuccess,
    handleLogout,
    refreshSession: (force = true) => verifySession(force),
  };
}
