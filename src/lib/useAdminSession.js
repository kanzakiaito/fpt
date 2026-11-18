"use client";

import { useState, useEffect, useCallback } from "react";

const UNIFIED_STORAGE_KEY = "fpt_admin_session";
const SECTION_STORAGE_PREFIX = "fpt_admin_session_";
const ALL_ADMIN_SECTIONS = ["main", "tournament", "trial_foty"];

export function useAdminSession(section = "main") {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [noAccessInfo, setNoAccessInfo] = useState(null);

  const storageKey = `${SECTION_STORAGE_PREFIX}${section}`;

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

  const verifySession = useCallback(async () => {
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

      // 2. Verify server-side token validity and permissions for this specific section
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          token: session.token,
          section,
        }),
      });

      const data = await res.json();
      if (data.success && data.valid && data.user) {
        setIsAuthenticated(true);
        setUser(data.user);
        setToken(session.token);
        setNoAccessInfo(null);

        // Synchronize unified session and current section session
        const syncedSession = {
          ...session,
          user: data.user,
          lastVerified: Date.now(),
        };
        try {
          localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(syncedSession));
          localStorage.setItem(`${SECTION_STORAGE_PREFIX}${section}`, JSON.stringify(syncedSession));
        } catch (e) {}
      } else if (data.noAccess) {
        // Valid login, but user doesn't have permission for this section
        setIsAuthenticated(false);
        setUser(null);
        setToken(session.token);
        setNoAccessInfo({
          username: data.username,
          name: data.name,
          error: data.error,
        });
      } else {
        // Expired or invalid token on server
        handleLogout();
      }
    } catch (err) {
      console.warn("Session check error, preserving local session if unexpired:", err);
      // In case of network glitch but valid unexpired local session
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
    verifySession();

    // Listen to storage events so multi-tab or cross-page auth updates in real-time
    const handleStorageEvent = (e) => {
      if (e.key === UNIFIED_STORAGE_KEY || (e.key && e.key.startsWith(SECTION_STORAGE_PREFIX))) {
        verifySession();
      }
    };

    window.addEventListener("storage", handleStorageEvent);
    return () => window.removeEventListener("storage", handleStorageEvent);
  }, [verifySession]);

  const handleLoginSuccess = (sessionData) => {
    setIsAuthenticated(true);
    setUser(sessionData.user);
    setToken(sessionData.token);
    setNoAccessInfo(null);

    // Save to unified key and all admin section keys
    try {
      localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(sessionData));
      localStorage.setItem(`${SECTION_STORAGE_PREFIX}${section}`, JSON.stringify(sessionData));
      ALL_ADMIN_SECTIONS.forEach((s) => {
        localStorage.setItem(`${SECTION_STORAGE_PREFIX}${s}`, JSON.stringify(sessionData));
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
    refreshSession: verifySession,
  };
}
