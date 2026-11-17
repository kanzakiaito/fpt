"use client";

import { useState } from "react";

export default function AdminUserMenu({ user, section, onLogout, theme = "cyan" }) {
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
  const btnTextColor = isGold ? "#030812" : "#030812";

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
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            background: primaryBg,
            border: `1px solid ${primaryBorder}`,
            borderRadius: "20px",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: `0 0 12px ${isGold ? "rgba(255, 215, 0, 0.15)" : "rgba(0, 229, 255, 0.15)"}`,
            transition: "all 0.2s",
          }}
        >
          <span style={{ fontSize: "16px" }}>👤</span>
          <span>{user?.name || user?.username || "Admin"}</span>
          {user?.isMainAdmin && (
            <span
              style={{
                fontSize: "10px",
                background: isGold ? "#ffd700" : "#00e5ff",
                color: "#030812",
                fontWeight: "800",
                padding: "2px 6px",
                borderRadius: "10px",
              }}
            >
              MAIN ADMIN
            </span>
          )}
          <span style={{ fontSize: "10px", opacity: 0.7 }}>▼</span>
        </button>

        {showDropdown && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: "115%",
              right: 0,
              width: "220px",
              background: "rgba(10, 20, 38, 0.96)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${primaryBorder}`,
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
              padding: "10px 0",
              zIndex: 9999,
              textAlign: "left",
            }}
          >
            <div style={{ padding: "8px 16px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>เข้าสู่ระบบในชื่อ</div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: primaryColor }}>
                @{user?.username}
              </div>
            </div>

            <button
              onClick={() => {
                setShowDropdown(false);
                setShowPassModal(true);
              }}
              style={{
                width: "100%",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "none",
                border: "none",
                color: "#ffffff",
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <span>🔑</span>
              <span>เปลี่ยนรหัสผ่าน</span>
            </button>

            <button
              onClick={() => {
                setShowDropdown(false);
                if (onLogout) onLogout();
              }}
              style={{
                width: "100%",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "none",
                border: "none",
                color: "#ff6b6b",
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 80, 80, 0.12)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <span>🚪</span>
              <span>ออกจากระบบ</span>
            </button>
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
