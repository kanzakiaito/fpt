"use client";

import { useState, useEffect, useCallback } from "react";

export function useAdminSession(section = "main") {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const storageKey = `fpt_admin_session_${section}`;

  const verifySession = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        setAuthChecking(false);
        return;
      }

      const session = JSON.parse(stored);
      // 1. Check client-side expiration (24 hours)
      if (!session.expiresAt || Date.now() > session.expiresAt) {
        localStorage.removeItem(storageKey);
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        setAuthChecking(false);
        return;
      }

      // 2. Verify server-side token validity and permissions
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
      } else {
        localStorage.removeItem(storageKey);
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.warn("Session check error, preserving local session if not expired:", err);
      // In case of network glitch but valid unexpired local session
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const session = JSON.parse(stored);
          if (session.expiresAt && Date.now() < session.expiresAt) {
            setIsAuthenticated(true);
            setUser(session.user);
            setToken(session.token);
          }
        }
      } catch (e) {}
    } finally {
      setAuthChecking(false);
    }
  }, [section, storageKey]);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const handleLoginSuccess = (sessionData) => {
    setIsAuthenticated(true);
    setUser(sessionData.user);
    setToken(sessionData.token);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
      sessionStorage.removeItem("fpt_admin_auth");
    }
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
  };

  return {
    isAuthenticated,
    setIsAuthenticated,
    authChecking,
    user,
    token,
    handleLoginSuccess,
    handleLogout,
    refreshSession: verifySession,
  };
}
