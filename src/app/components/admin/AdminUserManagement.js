"use client";

import { useState, useEffect } from "react";

export default function AdminUserManagement({
  token,
  section = "main",
  currentUser,
  theme = "cyan",
  sectionLabel = "หน้าหลัก (Main)",
}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Modal State for adding/granting user
  const [showAddModal, setShowAddModal] = useState(false);
  const [inputUsername, setInputUsername] = useState("");
  const [inputName, setInputName] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [inputRole, setInputRole] = useState("admin");
  const [checkingUser, setCheckingUser] = useState(false);
  const [existingUserFound, setExistingUserFound] = useState(null); // null | { username, name, sections }
  const [savingUser, setSavingUser] = useState(false);
  const [modalError, setModalError] = useState("");

  // Revoke confirm state
  const [revokeTarget, setRevokeTarget] = useState(null);

  const isGold = theme === "gold";
  const primaryColor = isGold ? "#ffd700" : "#00e5ff";
  const primaryBorder = isGold ? "rgba(255, 215, 0, 0.4)" : "rgba(0, 229, 255, 0.4)";
  const btnGradient = isGold
    ? "linear-gradient(135deg, #ffd700 0%, #ff8800 100%)"
    : "linear-gradient(135deg, #00e5ff 0%, #0077b6 100%)";
  const btnTextColor = "#030812";

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "list_users",
          token,
          section,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      } else {
        setError(data.error || "ไม่สามารถโหลดรายชื่อผู้ใช้ได้");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [section, token]);

  const showNotification = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3500);
  };

  // Check username in central DB
  const handleCheckUsername = async (uName) => {
    const clean = uName.trim().toLowerCase();
    if (!clean) {
      setExistingUserFound(null);
      return;
    }
    setCheckingUser(true);
    setModalError("");
    try {
      const res = await fetch("/api/admin-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check_username",
          username: clean,
        }),
      });
      const data = await res.json();
      if (data.success && data.exists) {
        setExistingUserFound(data.user);
        if (!inputName && data.user.name) {
          setInputName(data.user.name);
        }
      } else {
        setExistingUserFound(false);
      }
    } catch (err) {
      setExistingUserFound(null);
    } finally {
      setCheckingUser(false);
    }
  };

  // Save new user or grant access
  const handleSaveUser = async (e) => {
    if (e) e.preventDefault();
    setModalError("");
    const cleanUser = inputUsername.trim().toLowerCase();
    if (!cleanUser) {
      setModalError("กรุณากรอก Username");
      return;
    }

    if (!existingUserFound && (!inputPassword || inputPassword.length < 4)) {
      setModalError("สำหรับบัญชีใหม่ ต้องระบุรหัสผ่านอย่างน้อย 4 ตัวอักษร");
      return;
    }

    setSavingUser(true);
    try {
      const res = await fetch("/api/admin-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_user",
          token,
          section,
          targetUser: {
            username: cleanUser,
            name: inputName.trim() || cleanUser,
            password: inputPassword.trim() || undefined,
            role: inputRole,
            isMainAdmin: inputRole === "main_admin",
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message || "บันทึกข้อมูลผู้ใช้สำเร็จ");
        setShowAddModal(false);
        setInputUsername("");
        setInputName("");
        setInputPassword("");
        setInputRole("admin");
        setExistingUserFound(null);
        fetchUsers();
      } else {
        setModalError(data.error || "เกิดข้อผิดพลาดในการบันทึกผู้ใช้");
      }
    } catch (err) {
      setModalError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSavingUser(false);
    }
  };

  // Quick grant access
  const handleQuickGrant = async (targetUsername, grantRole = "admin") => {
    try {
      const res = await fetch("/api/admin-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grant_access",
          token,
          section,
          username: targetUsername,
          role: grantRole,
          isMainAdmin: grantRole === "main_admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`ให้สิทธิ์ ${targetUsername} เข้าใช้งานสำเร็จ`);
        fetchUsers();
      } else {
        showNotification(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (e) {
      showNotification("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  // Toggle main admin
  const handleToggleMainAdmin = async (targetUser) => {
    const newStatus = !targetUser.isMainAdmin;
    try {
      const res = await fetch("/api/admin-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_main_admin",
          token,
          section,
          username: targetUser.username,
          isMainAdmin: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message || "อัปเดตสถานะสำเร็จ");
        fetchUsers();
      } else {
        showNotification(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (e) {
      showNotification("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  // Update user role
  const handleUpdateRole = async (targetUser, newRole) => {
    try {
      const res = await fetch("/api/admin-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_role",
          token,
          section,
          username: targetUser.username,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message || `ปรับบทบาทเป็น ${newRole} สำเร็จ`);
        fetchUsers();
      } else {
        showNotification(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (e) {
      showNotification("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  // Revoke access
  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      const res = await fetch("/api/admin-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revoke_access",
          token,
          section,
          username: revokeTarget.username,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message || "ถอนสิทธิ์สำเร็จ");
        setRevokeTarget(null);
        fetchUsers();
      } else {
        showNotification(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (e) {
      showNotification("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const sectionUsers = users.filter((u) => u.hasAccess);
  const otherUsers = users.filter((u) => !u.hasAccess);

  return (
    <div style={{ color: "#ffffff", padding: "10px 0" }}>
      {notice && (
        <div
          style={{
            background: "rgba(82, 196, 26, 0.15)",
            border: "1px solid rgba(82, 196, 26, 0.5)",
            color: "#73d13d",
            padding: "12px 16px",
            borderRadius: "10px",
            marginBottom: "20px",
            fontSize: "14px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>✅</span>
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            background: "rgba(255, 77, 79, 0.15)",
            border: "1px solid rgba(255, 77, 79, 0.5)",
            color: "#ff7875",
            padding: "12px 16px",
            borderRadius: "10px",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "800", color: primaryColor }}>
            👥 จัดการผู้ใช้และสิทธิ์การเข้าถึง • {sectionLabel}
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255, 255, 255, 0.65)" }}>
            Main Admin สามารถเพิ่มผู้ใช้ใหม่, ให้สิทธิ์บัญชีส่วนกลางที่มีอยู่แล้ว, และตั้งสถานะ Main Admin ของฝั่งนี้ได้
          </p>
        </div>

        {currentUser?.isMainAdmin && (
          <button
            onClick={() => {
              setInputUsername("");
              setInputName("");
              setInputPassword("");
              setInputIsMainAdmin(false);
              setExistingUserFound(null);
              setModalError("");
              setShowAddModal(true);
            }}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              background: btnGradient,
              border: "none",
              color: btnTextColor,
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: `0 0 16px ${isGold ? "rgba(255, 215, 0, 0.3)" : "rgba(0, 229, 255, 0.3)"}`,
            }}
          >
            <span>➕</span>
            <span>เพิ่มหรือให้สิทธิ์ผู้ใช้ (Add/Grant User)</span>
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "rgba(255, 255, 255, 0.5)" }}>
          ⏳ กำลังโหลดข้อมูลบัญชีผู้ใช้...
        </div>
      ) : (
        <>
          {/* Active section users */}
          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff", marginBottom: "12px" }}>
              📋 รายชื่อผู้ดูแลระบบฝั่งนี้ ({sectionUsers.length} คน)
            </h3>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  background: "rgba(10, 20, 35, 0.6)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <thead>
                  <tr style={{ background: "rgba(255, 255, 255, 0.04)", textAlign: "left", fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>
                    <th style={{ padding: "12px 16px" }}>ผู้ใช้ (User)</th>
                    <th style={{ padding: "12px 16px" }}>ชื่อแสดงผล (Name)</th>
                    <th style={{ padding: "12px 16px" }}>บทบาทในฝั่งนี้ (Role)</th>
                    <th style={{ padding: "12px 16px" }}>สิทธิ์ในฝั่งอื่น</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {sectionUsers.map((u) => {
                    const isSelf = u.username.toLowerCase() === currentUser?.username?.toLowerCase();
                    const isSuper = u.username.toLowerCase() === "admin";

                    return (
                      <tr
                        key={u.id}
                        style={{
                          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                          fontSize: "14px",
                        }}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontWeight: "700", color: primaryColor }}>@{u.username}</span>
                          {isSelf && (
                            <span
                              style={{
                                marginLeft: "8px",
                                fontSize: "10px",
                                background: "rgba(255, 255, 255, 0.15)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              คุณ (You)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#e2e8f0" }}>{u.name || "-"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          {u.role === "main_admin" || u.isMainAdmin ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 10px",
                                borderRadius: "12px",
                                background: isGold ? "rgba(255, 215, 0, 0.2)" : "rgba(0, 229, 255, 0.2)",
                                color: primaryColor,
                                border: `1px solid ${primaryBorder}`,
                                fontSize: "12px",
                                fontWeight: "800",
                              }}
                            >
                              👑 MAIN ADMIN
                            </span>
                          ) : u.role === "maintainer" ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 10px",
                                borderRadius: "12px",
                                background: "rgba(168, 85, 247, 0.2)",
                                color: "#c084fc",
                                border: "1px solid rgba(168, 85, 247, 0.4)",
                                fontSize: "12px",
                                fontWeight: "800",
                              }}
                            >
                              🛠️ MAINTAINER
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 10px",
                                borderRadius: "12px",
                                background: "rgba(0, 229, 255, 0.12)",
                                color: "#38bdf8",
                                border: "1px solid rgba(56, 189, 248, 0.3)",
                                fontSize: "12px",
                                fontWeight: "800",
                              }}
                            >
                              ⭐ ADMIN
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "12px", color: "rgba(255, 255, 255, 0.55)" }}>
                          {u.otherSections && u.otherSections.length > 0 ? (
                            <span>{u.otherSections.join(", ")}</span>
                          ) : (
                            <span style={{ fontStyle: "italic" }}>ฝั่งนี้เท่านั้น</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          {currentUser?.isMainAdmin && (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                              {!isSuper && (
                                <select
                                  value={u.role || (u.isMainAdmin ? "main_admin" : "admin")}
                                  onChange={(e) => handleUpdateRole(u, e.target.value)}
                                  title="เปลี่ยนระดับสิทธิ์"
                                  style={{
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                    background: "#081020",
                                    color: "#ffffff",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                  }}
                                >
                                  <option value="main_admin">👑 Main Admin</option>
                                  <option value="admin">⭐ Admin</option>
                                  <option value="maintainer">🛠️ Maintainer</option>
                                </select>
                              )}

                              {!isSuper && !isSelf && (
                                <button
                                  onClick={() => setRevokeTarget(u)}
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid rgba(255, 77, 79, 0.3)",
                                    background: "rgba(255, 77, 79, 0.1)",
                                    color: "#ff7875",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                  }}
                                >
                                  ❌ ถอนสิทธิ์
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Other users in central DB without access to this section */}
          {otherUsers.length > 0 && (
            <div style={{ marginTop: "28px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "rgba(255, 255, 255, 0.7)", marginBottom: "12px" }}>
                🌐 บัญชีในระบบส่วนกลางที่ยังไม่มีสิทธิ์ในฝั่งนี้ ({otherUsers.length} บัญชี)
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "12px",
                }}
              >
                {otherUsers.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      background: "rgba(10, 20, 35, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "10px",
                      padding: "14px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "700", color: "#a0c4ff", fontSize: "14px" }}>
                        @{u.username}
                      </div>
                      <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>
                        {u.name || "ไม่มีชื่อแสดงผล"}
                      </div>
                      <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)", marginTop: "2px" }}>
                        สิทธิ์ปัจจุบัน: {u.otherSections?.join(", ") || "-"}
                      </div>
                    </div>
                    {currentUser?.isMainAdmin && (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => handleQuickGrant(u.username, "admin")}
                          title="ให้สิทธิ์เป็น Admin"
                          style={{
                            padding: "6px 10px",
                            borderRadius: "8px",
                            border: `1px solid ${primaryBorder}`,
                            background: "rgba(0, 229, 255, 0.12)",
                            color: primaryColor,
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          ➕ Admin
                        </button>
                        <button
                          onClick={() => handleQuickGrant(u.username, "maintainer")}
                          title="ให้สิทธิ์เป็น Maintainer"
                          style={{
                            padding: "6px 10px",
                            borderRadius: "8px",
                            border: "1px solid rgba(168, 85, 247, 0.4)",
                            background: "rgba(168, 85, 247, 0.15)",
                            color: "#c084fc",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          🛠️ Maintainer
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Grant User Modal */}
      {showAddModal && (
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
          onClick={() => setShowAddModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "460px",
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
                ➕ เพิ่มหรือให้สิทธิ์ผู้ใช้ • {sectionLabel}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "18px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)", marginBottom: "20px" }}>
              พิมพ์ชื่อ Username หากมีอยู่ในระบบส่วนกลางแล้ว สามารถกดให้สิทธิ์เข้าถึงฝั่งนี้ได้ทันที (ใช้รหัสผ่านเดิม) หรือหากเป็นผู้ใช้ใหม่ให้กำหนดรหัสผ่าน
            </p>

            <form onSubmit={handleSaveUser}>
              {/* Username Input with Live/Blur check */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#a0c4ff", marginBottom: "6px" }}>
                  ชื่อผู้ใช้ (Username) *
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={inputUsername}
                    onChange={(e) => {
                      setInputUsername(e.target.value);
                      if (existingUserFound) setExistingUserFound(null);
                    }}
                    onBlur={(e) => handleCheckUsername(e.target.value)}
                    placeholder="เช่น john_doe..."
                    required
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: "rgba(0, 10, 25, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      color: "#ffffff",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleCheckUsername(inputUsername)}
                    disabled={checkingUser || !inputUsername.trim()}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.1)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      color: "#ffffff",
                      fontSize: "12px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {checkingUser ? "กำลังตรวจ..." : "ตรวจ Username"}
                  </button>
                </div>
              </div>

              {/* Status banner when username is checked */}
              {existingUserFound && (
                <div
                  style={{
                    background: "rgba(0, 229, 255, 0.12)",
                    border: `1px solid ${primaryBorder}`,
                    color: primaryColor,
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ fontWeight: "700" }}>🔍 พบบัญชี @{existingUserFound.username} ในระบบส่วนกลางแล้ว!</div>
                  <div style={{ fontSize: "12px", color: "#ffffff", marginTop: "4px" }}>
                    ชื่อแสดงผล: <strong>{existingUserFound.name}</strong>
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.7)", marginTop: "2px" }}>
                    สิทธิ์ปัจจุบัน: {existingUserFound.sections?.map((s) => s.section).join(", ") || "ไม่มีสิทธิ์ฝั่งอื่น"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#a0e0ff", marginTop: "6px" }}>
                    💡 บัญชีนี้จะใช้รหัสผ่านเดิมที่มีอยู่แล้ว หากไม่ต้องการเปลี่ยน ไม่จำเป็นต้องกรอกช่องรหัสผ่าน
                  </div>
                </div>
              )}

              {existingUserFound === false && (
                <div
                  style={{
                    background: "rgba(255, 215, 0, 0.1)",
                    border: "1px solid rgba(255, 215, 0, 0.3)",
                    color: "#ffd700",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    marginBottom: "14px",
                  }}
                >
                  ✨ ไม่พบบัญชีนี้ในระบบ — จะเป็นการสร้างบัญชีใหม่ในระบบส่วนกลาง
                </div>
              )}

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#a0c4ff", marginBottom: "6px" }}>
                  ชื่อแสดงผล (Display Name)
                </label>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="ชื่อเรียก เช่น แอดมินสมชาย..."
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

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#a0c4ff", marginBottom: "6px" }}>
                  รหัสผ่าน (Password) {existingUserFound ? "(เว้นว่างไว้เพื่อใช้รหัสผ่านเดิม)" : "*"}
                </label>
                <input
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder={existingUserFound ? "เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน" : "อย่างน้อย 4 ตัวอักษร..."}
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

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#e2e8f0", marginBottom: "6px" }}>
                  ระดับสิทธิ์การใช้งาน (Role):
                </label>
                <select
                  value={inputRole}
                  onChange={(e) => setInputRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "rgba(0, 10, 25, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    fontSize: "13.5px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  <option value="main_admin">👑 Main Admin (ผู้ดูแลหลัก - มีสิทธิ์เต็ม จัดการผู้ใช้ได้)</option>
                  <option value="admin">⭐ Admin (ผู้ดูแลทั่วไป - จัดการคะแนน, ข้อมูล, โพลล์, ใบสมัคร)</option>
                  <option value="maintainer">🛠️ Maintainer (ผู้ดูแลระดับจัดการแข่งขัน - เปลี่ยนรูปและคุมตารางแข่งขัน)</option>
                </select>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "6px", lineHeight: "1.5" }}>
                  💡 Maintainer จะไม่สามารถดูผลโหวต, ดูใบสมัคร หรือแก้ไขข้อมูลผู้เข้าแข่งขันได้ แต่สามารถเปลี่ยน Path รูปและจัดการตารางแข่งขันได้
                </div>
              </div>

              {modalError && (
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
                  ⚠️ {modalError}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                  disabled={savingUser}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    background: btnGradient,
                    border: "none",
                    color: btnTextColor,
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: savingUser ? "wait" : "pointer",
                  }}
                >
                  {savingUser
                    ? "กำลังบันทึก..."
                    : existingUserFound
                    ? "⚡ ให้สิทธิ์เข้าถึงฝั่งนี้ (Grant Access)"
                    : "➕ สร้างบัญชีและให้สิทธิ์"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke confirmation modal */}
      {revokeTarget && (
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
          onClick={() => setRevokeTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "400px",
              width: "100%",
              background: "#161b22",
              border: "1.5px solid #ff4d4f",
              borderRadius: "16px",
              boxShadow: "0 0 35px rgba(255, 77, 79, 0.3)",
              padding: "24px",
              color: "#ffffff",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>⚠️</div>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "18px", color: "#ff7875" }}>
              ยืนยันการถอนสิทธิ์?
            </h3>
            <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.8)", marginBottom: "20px" }}>
              คุณต้องการถอนสิทธิ์การเข้าใช้งานฝั่ง <strong>{sectionLabel}</strong> ของ{" "}
              <strong style={{ color: primaryColor }}>@{revokeTarget.username}</strong> ใช่หรือไม่?
              <br />
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                (บัญชีจะยังคงอยู่ในระบบส่วนกลางและฝั่งอื่นที่เคยมีสิทธิ์)
              </span>
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                onClick={() => setRevokeTarget(null)}
                style={{
                  padding: "10px 18px",
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
                onClick={handleRevoke}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  background: "#ff4d4f",
                  border: "none",
                  color: "#ffffff",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                ถอนสิทธิ์ทันที
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
