"use client";

import { useState } from "react";

export default function AdminLoginScreen({
  section = "main",
  title = "ระบบจัดการแข่งขัน (Admin Room)",
  subtitle = "กรุณากรอก Username และ Password เพื่อเข้าสู่ระบบผู้ดูแล",
  theme = "cyan",
  noAccessInfo = null,
  onLogout = null,
  onLoginSuccess,
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState("");

  const isGold = theme === "gold";
  const primaryColor = isGold ? "#ffd700" : "#00e5ff";
  const primaryBorder = isGold ? "1.5px solid #ffd700" : "1.5px solid rgba(0, 229, 255, 0.4)";
  const glowShadow = isGold
    ? "0 0 45px rgba(255, 215, 0, 0.2), 0 20px 50px rgba(0, 0, 0, 0.8)"
    : "0 0 40px rgba(0, 229, 255, 0.15), 0 20px 50px rgba(0, 0, 0, 0.8)";
  const btnGradient = isGold
    ? "linear-gradient(90deg, #ffd700 0%, #ff8800 100%)"
    : "linear-gradient(90deg, #00b4d8 0%, #0077b6 100%)";
  const btnTextColor = isGold ? "#030812" : "#ffffff";

  const logoSrc = section === "trial_foty" ? "/img/trial_foty_logo.png" : "/img/logo.png";

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setAuthError("กรุณากรอกทั้ง Username และ Password");
      return;
    }

    setIsVerifying(true);
    setAuthError("");

    try {
      const res = await fetch("/api/admin-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          username: cleanUser,
          password: cleanPass,
          section,
        }),
      });

      const data = await res.json();
      if (data.success && data.token) {
        const sessionData = {
          token: data.token,
          user: data.user,
          section,
          loginAt: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 1 day
        };
        try {
          localStorage.setItem("fpt_admin_session", JSON.stringify(sessionData));
          localStorage.setItem(`fpt_admin_session_${section}`, JSON.stringify(sessionData));
          ["main", "tournament", "trial_foty"].forEach((s) => {
            localStorage.setItem(`fpt_admin_session_${s}`, JSON.stringify(sessionData));
          });
        } catch (e) {}

        if (onLoginSuccess) {
          onLoginSuccess(sessionData);
        }
      } else {
        setAuthError(data.error || "Username หรือ Password ไม่ถูกต้อง");
      }
    } catch (err) {
      setAuthError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อตรวจสอบสิทธิ์ได้");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isGold
          ? "radial-gradient(ellipse at center, #0a192f 0%, #030812 100%)"
          : "radial-gradient(ellipse at center, #06182c 0%, #020b18 100%)",
        color: "#ffffff",
        fontFamily: "var(--font-th, 'Sukhumvit Set', 'Kanit', 'Noto Sans Thai', sans-serif)",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "440px",
          width: "100%",
          background: isGold
            ? "linear-gradient(160deg, rgba(16, 32, 60, 0.95) 0%, rgba(8, 16, 32, 0.98) 100%)"
            : "linear-gradient(160deg, rgba(8, 24, 44, 0.95) 0%, rgba(3, 12, 24, 0.98) 100%)",
          border: primaryBorder,
          boxShadow: glowShadow,
          borderRadius: "20px",
          padding: "36px 30px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "240px", margin: "0 auto 16px" }}>
          <img
            src={logoSrc}
            alt="Fanpantae 2026"
            style={{
              width: "100%",
              height: "auto",
              filter: isGold
                ? "drop-shadow(0 0 16px rgba(255, 215, 0, 0.45))"
                : "drop-shadow(0 0 16px rgba(0, 229, 255, 0.5))",
            }}
          />
        </div>

        <div
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: "6px",
            background: isGold
              ? "linear-gradient(135deg, #ffd700 0%, #ff8800 100%)"
              : "linear-gradient(135deg, #00e5ff 0%, #0077b6 100%)",
            color: isGold ? "#030812" : "#ffffff",
            fontSize: "11px",
            fontWeight: "900",
            letterSpacing: "1px",
            marginBottom: "10px",
          }}
        >
          {section.toUpperCase()} ADMIN PORTAL
        </div>

        <h2 style={{ fontSize: "20px", fontWeight: "800", color: primaryColor, margin: "0 0 8px 0" }}>
          {title}
        </h2>
        <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.65)", margin: "0 0 20px 0" }}>
          {subtitle}
        </p>

        {/* Access Denied Warning for Current SSO Account */}
        {noAccessInfo && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(255, 170, 0, 0.12)",
              border: "1px solid rgba(255, 170, 0, 0.4)",
              color: "#ffc048",
              fontSize: "12px",
              lineHeight: "1.5",
              marginBottom: "18px",
              textAlign: "left",
            }}
          >
            <div style={{ fontWeight: "700", marginBottom: "4px" }}>
              ⚠️ ล็อกอินในชื่อ: {noAccessInfo.name || noAccessInfo.username}
            </div>
            <div>
              บัญชีนี้ยังไม่ได้รับสิทธิ์เข้าถึงส่วนผู้ดูแลนี้ ({section}) กรุณาเข้าสู่ระบบด้วยบัญชีอื่น หรือ
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                style={{
                  marginTop: "8px",
                  padding: "5px 12px",
                  fontSize: "11px",
                  fontWeight: "700",
                  borderRadius: "6px",
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                🚪 ออกจากระบบเพื่อสลับบัญชี
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ textAlign: "left" }}>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: isGold ? "#ffd700" : "#80d0ff",
                marginBottom: "6px",
              }}
            >
              ชื่อผู้ใช้ (Username)
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (authError) setAuthError("");
              }}
              placeholder="กรุณากรอก Username..."
              autoFocus
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                border: authError ? "1px solid #ff4d4f" : `1px solid ${isGold ? "rgba(255, 215, 0, 0.4)" : "rgba(0, 229, 255, 0.4)"}`,
                background: "rgba(0, 15, 30, 0.75)",
                color: "#ffffff",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: isGold ? "#ffd700" : "#80d0ff",
                marginBottom: "6px",
              }}
            >
              รหัสผ่าน (Password)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (authError) setAuthError("");
              }}
              placeholder="กรุณากรอก Password..."
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                border: authError ? "1px solid #ff4d4f" : `1px solid ${isGold ? "rgba(255, 215, 0, 0.4)" : "rgba(0, 229, 255, 0.4)"}`,
                background: "rgba(0, 15, 30, 0.75)",
                color: "#ffffff",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {authError && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: "rgba(255, 77, 79, 0.15)",
                border: "1px solid rgba(255, 77, 79, 0.4)",
                color: "#ff7875",
                fontSize: "12px",
                marginBottom: "18px",
                textAlign: "center",
              }}
            >
              ⚠️ {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "10px",
              border: "none",
              background: btnGradient,
              color: btnTextColor,
              fontSize: "15px",
              fontWeight: "800",
              cursor: isVerifying ? "not-allowed" : "pointer",
              boxShadow: isGold ? "0 4px 20px rgba(255, 215, 0, 0.4)" : "0 4px 20px rgba(0, 180, 216, 0.4)",
              transition: "transform 0.15s, opacity 0.15s",
              opacity: isVerifying ? 0.7 : 1,
            }}
          >
            {isVerifying ? "กำลังตรวจสอบสิทธิ์..." : "เข้าสู่ระบบ (Sign In)"}
          </button>
        </form>

        <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <p style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)", margin: 0 }}>
            🔒 Single Sign-On • เข้าสู่ระบบครั้งเดียวใช้ได้ทุกส่วนที่คุณได้รับสิทธิ์
          </p>
        </div>
      </div>
    </div>
  );
}
