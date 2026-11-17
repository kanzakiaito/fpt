"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminUserMenu({
  user,
  section = "main",
  onLogout,
  onReset,
  resetLabel = "รีเซ็ตข้อมูล",
  customLinks,
  theme = "cyan",
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isGold = theme === "gold";
  const primaryColor = isGold ? "#ffd700" : "#00e5ff";
  const primaryBg = isGold
    ? "linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 136, 0, 0.2) 100%)"
    : "linear-gradient(135deg, rgba(0, 229, 255, 0.2) 0%, rgba(0, 119, 182, 0.2) 100%)";
  const primaryBorder = isGold ? "rgba(255, 215, 0, 0.4)" : "rgba(0, 229, 255, 0.4)";
  const btnGradient = isGold
    ? "linear-gradient(135deg, #ffd700 0%, #ff8800 100%)"
    : "linear-gradient(135deg, #00e5ff 0%, #0077b6 100%)";
  const btnTextColor = "#030812";

  // Predefined default links by section if customLinks is not passed
  const getSectionLinks = () => {
    if (customLinks && Array.isArray(customLinks)) return customLinks;

    if (section === "tournament") {
      return [
        { href: "/", label: "หน้าหลักแฟนพันธุ์แท้", icon: "🏠", target: "_blank" },
        { href: "/tournament", label: "หน้า Tournament (/tournament)", icon: "⚔️", target: "_blank" },
        { href: "/admin", label: "Admin ปกติ (/admin)", icon: "⚙️" },
        { href: "/admin/tournament/photos", label: "จัดการรูปถ่ายผู้เข้าแข่งขัน", icon: "📸" },
      ];
    }

    if (section === "trial_foty") {
      return [
        { href: "/", label: "หน้าหลักแฟนพันธุ์แท้", icon: "🏠", target: "_blank" },
        { href: "/trial-foty", label: "ตารางคะแนนงุ่นง่าน (/trial-foty)", icon: "📊", target: "_blank" },
        { href: "/trial-foty/vote", label: "หน้าเปิดโหวตงุ่นง่าน (/vote)", icon: "🗳️", target: "_blank" },
        { href: "/trial-foty/info", label: "หน้าข้อมูลผู้เข้าแข่งขัน & ถามทีมงาน", icon: "ℹ️", target: "_blank" },
        { href: "/admin", label: "Admin ปกติ (/admin)", icon: "⚙️" },
        { href: "/admin/tournament", label: "ห้อง Tournament Admin", icon: "⚔️" },
      ];
    }

    // Default: main
    return [
      { href: "/", label: "หน้าหลักแฟนพันธุ์แท้", icon: "🏠", target: "_blank" },
      { href: "/history", label: "ทำเนียบแชมป์ (/history)", icon: "🏆", target: "_blank" },
      { href: "/game", label: "หน้าเกมแข่งขัน (/game)", icon: "🎮", target: "_blank" },
      { href: "/admin/tournament", label: "จัดการ Tournament 2026-27", icon: "⚔️" },
      { href: "/admin/tournament/photos", label: "จัดการรูปถ่ายผู้เข้าแข่งขัน", icon: "📸" },
      { href: "/trial-foty/admin", label: "ห้อง Admin Trial FoTY", icon: "🌟" },
    ];
  };

  const navLinks = getSectionLinks();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!oldPassword) {
      setError("กรุณากรอกรหัสผ่านปัจจุบัน");
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setError("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_password",
          username: user.username,
          oldPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setShowPassModal(false);
          setSuccess("");
        }, 1800);
      } else {
        setError(data.error || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ position: "relative", display: "inline-block" }}>
        {/* Invisible Backdrop for closing dropdown on outside click */}
        {showDropdown && (
          <div
            onClick={() => setShowDropdown(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 9990,
              cursor: "default",
            }}
          />
        )}

        {/* Profile Pill Trigger Button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            background: primaryBg,
            border: `1.5px solid ${primaryBorder}`,
            borderRadius: "24px",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: `0 0 16px ${isGold ? "rgba(255, 215, 0, 0.2)" : "rgba(0, 229, 255, 0.2)"}`,
            transition: "all 0.2s ease",
            position: "relative",
            zIndex: 9991,
          }}
        >
          <span style={{ fontSize: "16px" }}>👤</span>
          <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.name || user?.username || "Admin"}
          </span>
          {user?.isMainAdmin ? (
            <span
              style={{
                fontSize: "10px",
                background: isGold ? "#ffd700" : "#00e5ff",
                color: "#030812",
                fontWeight: "900",
                padding: "2px 7px",
                borderRadius: "10px",
                letterSpacing: "0.5px",
              }}
            >
              MAIN ADMIN
            </span>
          ) : user?.role === "maintainer" ? (
            <span
              style={{
                fontSize: "10px",
                background: "rgba(168, 85, 247, 0.25)",
                border: "1px solid #c084fc",
                color: "#e9d5ff",
                fontWeight: "900",
                padding: "2px 7px",
                borderRadius: "10px",
                letterSpacing: "0.5px",
              }}
            >
              MAINTAINER
            </span>
          ) : (
            <span
              style={{
                fontSize: "10px",
                background: "rgba(0, 229, 255, 0.2)",
                border: "1px solid #00e5ff",
                color: "#67e8f9",
                fontWeight: "800",
                padding: "2px 7px",
                borderRadius: "10px",
                letterSpacing: "0.5px",
              }}
            >
              ADMIN
            </span>
          )}
          <span style={{ fontSize: "10px", opacity: 0.7, transform: showDropdown ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            ▼
          </span>
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: "120%",
              right: 0,
              width: "280px",
              background: "rgba(10, 20, 38, 0.98)",
              backdropFilter: "blur(16px)",
              border: `1px solid ${primaryBorder}`,
              borderRadius: "14px",
              boxShadow: "0 14px 40px rgba(0, 0, 0, 0.75), 0 0 20px rgba(0, 229, 255, 0.15)",
              padding: "8px 0",
              zIndex: 9999,
              textAlign: "left",
              animation: "fadeIn 0.15s ease-out",
            }}
          >
            {/* User Info Header */}
            <div style={{ padding: "10px 18px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                เข้าสู่ระบบในชื่อ
              </div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: primaryColor, marginTop: "2px" }}>
                @{user?.username}
              </div>
              {user?.name && user.name !== user.username && (
                <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.75)", marginTop: "1px" }}>
                  {user.name}
                </div>
              )}
            </div>

            {/* Navigation / Quick Links Section */}
            {navLinks.length > 0 && (
              <div style={{ padding: "6px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div style={{ padding: "4px 18px 6px", fontSize: "11px", color: "rgba(255, 255, 255, 0.4)", fontWeight: "700" }}>
                  เมนูลัด / นำทาง
                </div>
                {navLinks.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    target={item.target || undefined}
                    onClick={() => setShowDropdown(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 18px",
                      color: "#e2e8f0",
                      fontSize: "13px",
                      textDecoration: "none",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0, 229, 255, 0.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: "15px" }}>{item.icon || "🔗"}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Reset Action (if provided) */}
            {onReset && (
              <div style={{ padding: "6px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDropdown(false);
                    onReset();
                  }}
                  style={{
                    width: "100%",
                    padding: "9px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "none",
                    border: "none",
                    color: "#fca5a5",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.18)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <span style={{ fontSize: "15px" }}>⚠️</span>
                  <span>{resetLabel}</span>
                </button>
              </div>
            )}

            {/* Account Settings Section */}
            <div style={{ padding: "6px 0" }}>
              <button
                type="button"
                onClick={() => {
                  setShowDropdown(false);
                  setShowPassModal(true);
                }}
                style={{
                  width: "100%",
                  padding: "9px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "none",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "13px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <span style={{ fontSize: "15px" }}>🔑</span>
                <span>เปลี่ยนรหัสผ่าน</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowDropdown(false);
                  if (onLogout) onLogout();
                }}
                style={{
                  width: "100%",
                  padding: "9px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "none",
                  border: "none",
                  color: "#ff6b6b",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 80, 80, 0.15)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <span style={{ fontSize: "15px" }}>🚪</span>
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {showPassModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 5, 15, 0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "20px",
          }}
          onClick={() => setShowPassModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "420px",
              width: "100%",
              background: "linear-gradient(160deg, rgba(16, 32, 56, 0.98) 0%, rgba(8, 16, 28, 0.98) 100%)",
              border: `1.5px solid ${primaryColor}`,
              borderRadius: "16px",
              boxShadow: `0 0 35px ${isGold ? "rgba(255, 215, 0, 0.25)" : "rgba(0, 229, 255, 0.25)"}`,
              padding: "28px 24px",
              color: "#ffffff",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: primaryColor }}>
                🔑 เปลี่ยนรหัสผ่าน (@{user?.username})
              </h3>
              <button
                onClick={() => setShowPassModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)", marginBottom: "20px" }}>
              รหัสผ่านที่เปลี่ยนจะมีผลกับทุกฝั่งที่คุณมีสิทธิ์เข้าใช้งานในระบบ
            </p>

            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#a0c4ff", marginBottom: "6px" }}>
                  รหัสผ่านปัจจุบัน
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านปัจจุบัน..."
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "rgba(0, 10, 25, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#a0c4ff", marginBottom: "6px" }}>
                  รหัสผ่านใหม่
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="อย่างน้อย 4 ตัวอักษร..."
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "rgba(0, 10, 25, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#a0c4ff", marginBottom: "6px" }}>
                  ยืนยันรหัสผ่านใหม่
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง..."
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "rgba(0, 10, 25, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    background: "rgba(255, 77, 79, 0.15)",
                    border: "1px solid rgba(255, 77, 79, 0.5)",
                    color: "#ff7875",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    marginBottom: "16px",
                  }}
                >
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div
                  style={{
                    background: "rgba(82, 196, 26, 0.15)",
                    border: "1px solid rgba(82, 196, 26, 0.5)",
                    color: "#73d13d",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    marginBottom: "16px",
                  }}
                >
                  ✅ {success}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowPassModal(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    background: btnGradient,
                    border: "none",
                    color: btnTextColor,
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: loading ? "wait" : "pointer",
                  }}
                >
                  {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
