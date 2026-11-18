import { NextResponse } from "next/server";
import {
  authenticateUser,
  changeUserPassword,
  getAdminUsers,
  saveAdminUsers,
  verifyToken,
  findUserByUsername,
  hashPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Helper to check caller authority
async function getCallerFromToken(token, section) {
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;
  const user = await findUserByUsername(decoded.username);
  if (!user) return null;

  const perm = user.permissions?.[section];
  const isSuperAdmin = user.username === "admin" || Boolean(user.permissions?.main?.isMainAdmin);
  const hasAccess = Boolean(
    user.username === "admin" ||
    perm?.access ||
    (isSuperAdmin && section === "main")
  );

  if (!hasAccess) {
    return {
      noAccess: true,
      username: user.username,
      name: user.name || user.username,
      permissions: user.permissions,
    };
  }

  const isMainAdmin = Boolean(user.username === "admin" || perm?.isMainAdmin);
  const role = isMainAdmin ? "main_admin" : (perm?.role || "admin");

  return {
    ...user,
    currentSection: section,
    role,
    isSectionMainAdmin: isMainAdmin,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") || request.headers.get("authorization")?.replace("Bearer ", "");
  const section = searchParams.get("section") || "main";

  if (!token) {
    return NextResponse.json({ authenticated: false, error: "No token provided" });
  }

  const caller = await getCallerFromToken(token, section);
  if (!caller) {
    return NextResponse.json({ authenticated: false, error: "Invalid or expired token" });
  }
  if (caller.noAccess) {
    return NextResponse.json({
      authenticated: false,
      noAccess: true,
      username: caller.username,
      name: caller.name,
      error: `บัญชี "${caller.name || caller.username}" ไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ (${section})`,
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: caller.id,
      username: caller.username,
      name: caller.name,
      section,
      role: caller.role,
      isMainAdmin: caller.isSectionMainAdmin,
      permissions: caller.permissions,
    },
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const action = body.action || "login";

    // 1. LOGIN
    if (action === "login") {
      const { username, password, section = "main" } = body;
      if (!username || !password) {
        return NextResponse.json({ success: false, error: "กรุณากรอก Username และ Password" });
      }
      const result = await authenticateUser(username.trim(), password.trim(), section);
      return NextResponse.json(result);
    }

    // 2. VERIFY TOKEN
    if (action === "verify") {
      const { token, section = "main" } = body;
      if (!token) {
        return NextResponse.json({ success: false, valid: false, error: "ไม่มีโทเคน" });
      }
      const caller = await getCallerFromToken(token, section);
      if (!caller) {
        return NextResponse.json({ success: false, valid: false, error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" });
      }
      if (caller.noAccess) {
        return NextResponse.json({
          success: false,
          valid: true,
          noAccess: true,
          username: caller.username,
          name: caller.name,
          error: `บัญชี "${caller.name || caller.username}" ไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ (${section})`,
        });
      }
      return NextResponse.json({
        success: true,
        valid: true,
        user: {
          id: caller.id,
          username: caller.username,
          name: caller.name,
          section,
          role: caller.role,
          isMainAdmin: caller.isSectionMainAdmin,
          permissions: caller.permissions,
        },
      });
    }

    // 3. CHANGE PASSWORD (Self-service)
    if (action === "change_password") {
      const { username, oldPassword, newPassword } = body;
      if (!username || !oldPassword || !newPassword) {
        return NextResponse.json({ success: false, error: "ข้อมูลไม่ครบถ้วน" });
      }
      const result = await changeUserPassword(username.trim(), oldPassword.trim(), newPassword.trim());
      return NextResponse.json(result);
    }

    // 4. CHECK USERNAME (Check if account exists in central database)
    if (action === "check_username") {
      const { username } = body;
      if (!username) {
        return NextResponse.json({ success: false, error: "กรุณาระบุ Username" });
      }
      const user = await findUserByUsername(username.trim());
      if (!user) {
        return NextResponse.json({ success: true, exists: false });
      }
      const sections = Object.entries(user.permissions || {})
        .filter(([_, p]) => p?.access)
        .map(([sec, p]) => ({ section: sec, isMainAdmin: Boolean(p.isMainAdmin) }));
      return NextResponse.json({
        success: true,
        exists: true,
        user: {
          username: user.username,
          name: user.name,
          sections,
        },
      });
    }

    // From here, token authentication is required
    const token = body.token || request.headers.get("authorization")?.replace("Bearer ", "");
    const section = body.section || "main";
    const caller = await getCallerFromToken(token, section);

    if (!caller || caller.noAccess) {
      return NextResponse.json({ success: false, error: "ไม่มีสิทธิ์ในการดำเนินการนี้ หรือเซสชันหมดอายุ" }, { status: 401 });
    }

    // 5. LIST USERS (for the section)
    if (action === "list_users") {
      const allUsers = await getAdminUsers();
      // Users with access to this section
      const sectionUsers = allUsers.map((u) => {
        const p = u.permissions?.[section] || { access: false, isMainAdmin: false };
        const role = Boolean(p.isMainAdmin || u.username === "admin")
          ? "main_admin"
          : (p.role || "admin");
        return {
          id: u.id,
          username: u.username,
          name: u.name || u.username,
          hasAccess: Boolean(p.access),
          isMainAdmin: Boolean(p.isMainAdmin || u.username === "admin"),
          role,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          otherSections: Object.keys(u.permissions || {}).filter((k) => k !== section && u.permissions[k]?.access),
        };
      });

      return NextResponse.json({
        success: true,
        users: sectionUsers,
        caller: {
          username: caller.username,
          role: caller.role,
          isMainAdmin: caller.isSectionMainAdmin,
        },
      });
    }

    // Actions below require Main Admin authority of this section
    if (!caller.isSectionMainAdmin) {
      return NextResponse.json({ success: false, error: "เฉพาะ Main Admin ของฝั่งนี้เท่านั้นที่สามารถจัดการผู้ใช้ได้" }, { status: 403 });
    }

    // 6. SAVE USER (Create new or update existing user)
    if (action === "save_user") {
      const { targetUser } = body;
      if (!targetUser || !targetUser.username) {
        return NextResponse.json({ success: false, error: "กรุณาระบุข้อมูลผู้ใช้" });
      }

      const rawUsername = targetUser.username.trim().toLowerCase();
      if (!rawUsername.match(/^[a-zA-Z0-9_-]{3,30}$/)) {
        return NextResponse.json({
          success: false,
          error: "Username ต้องเป็นภาษาอังกฤษ ตัวเลข ขีดล่าง หรือยัติภังค์ (3-30 ตัวอักษร)",
        });
      }

      const allUsers = await getAdminUsers();
      const existingIdx = allUsers.findIndex((u) => u.username.toLowerCase() === rawUsername);
      const rawRole = targetUser.role || (targetUser.isMainAdmin ? "main_admin" : "admin");
      const isTargetMainAdmin = rawRole === "main_admin" || Boolean(targetUser.isMainAdmin);
      const targetRole = isTargetMainAdmin ? "main_admin" : rawRole;

      if (existingIdx >= 0) {
        // Update existing user
        const existing = allUsers[existingIdx];
        const perms = { ...(existing.permissions || {}) };
        perms[section] = { access: true, isMainAdmin: isTargetMainAdmin, role: targetRole };

        const updatedUser = {
          ...existing,
          name: targetUser.name?.trim() || existing.name || rawUsername,
          permissions: perms,
          updatedAt: new Date().toISOString(),
        };

        // If a new password is provided, update password
        if (targetUser.password && targetUser.password.trim()) {
          if (targetUser.password.trim().length < 4) {
            return NextResponse.json({ success: false, error: "รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร" });
          }
          updatedUser.passwordHash = hashPassword(targetUser.password.trim());
          delete updatedUser.password;
        }

        allUsers[existingIdx] = updatedUser;
        await saveAdminUsers(allUsers);

        return NextResponse.json({
          success: true,
          message: `อัปเดตสิทธิ์ผู้ใช้ ${rawUsername} สำหรับฝั่ง ${section} เรียบร้อยแล้ว`,
        });
      } else {
        // Create brand new user
        if (!targetUser.password || targetUser.password.trim().length < 4) {
          return NextResponse.json({ success: false, error: "กรุณาระบุรหัสผ่านอย่างน้อย 4 ตัวอักษรสำหรับผู้ใช้ใหม่" });
        }

        const newUser = {
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          username: rawUsername,
          passwordHash: hashPassword(targetUser.password.trim()),
          name: targetUser.name?.trim() || rawUsername,
          permissions: {
            [section]: { access: true, isMainAdmin: isTargetMainAdmin, role: targetRole },
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        allUsers.push(newUser);
        await saveAdminUsers(allUsers);

        return NextResponse.json({
          success: true,
          message: `สร้างผู้ใช้ ${rawUsername} ในระบบและให้สิทธิ์ฝั่ง ${section} เรียบร้อยแล้ว`,
        });
      }
    }

    // 7. GRANT ACCESS (to an existing user)
    if (action === "grant_access") {
      const { username: targetUsername, isMainAdmin = false, role: rawReqRole } = body;
      const allUsers = await getAdminUsers();
      const existingIdx = allUsers.findIndex((u) => u.username.toLowerCase() === String(targetUsername).toLowerCase().trim());

      if (existingIdx < 0) {
        return NextResponse.json({ success: false, error: "ไม่พบบัญชีผู้ใช้นี้ในระบบ" });
      }

      const existing = allUsers[existingIdx];
      const perms = { ...(existing.permissions || {}) };
      const isTargetMainAdmin = Boolean(isMainAdmin || rawReqRole === "main_admin");
      const targetRole = isTargetMainAdmin ? "main_admin" : (rawReqRole || "admin");
      perms[section] = { access: true, isMainAdmin: isTargetMainAdmin, role: targetRole };

      allUsers[existingIdx] = {
        ...existing,
        permissions: perms,
        updatedAt: new Date().toISOString(),
      };

      await saveAdminUsers(allUsers);
      return NextResponse.json({
        success: true,
        message: `ให้สิทธิ์ ${existing.username} เข้าใช้งานฝั่ง ${section} สำเร็จ`,
      });
    }

    // 8. REVOKE ACCESS
    if (action === "revoke_access") {
      const { username: targetUsername } = body;
      const cleanTarget = String(targetUsername).toLowerCase().trim();

      if (cleanTarget === "admin") {
        return NextResponse.json({ success: false, error: "ไม่สามารถถอนสิทธิ์ Super Admin ได้" });
      }

      const allUsers = await getAdminUsers();
      const existingIdx = allUsers.findIndex((u) => u.username.toLowerCase() === cleanTarget);

      if (existingIdx < 0) {
        return NextResponse.json({ success: false, error: "ไม่พบบัญชีผู้ใช้นี้ในระบบ" });
      }

      const existing = allUsers[existingIdx];
      // Cannot revoke oneself if last main admin
      if (existing.username.toLowerCase() === caller.username.toLowerCase()) {
        const otherMainAdmins = allUsers.filter(
          (u) => u.username.toLowerCase() !== caller.username.toLowerCase() && u.permissions?.[section]?.isMainAdmin
        );
        if (otherMainAdmins.length === 0) {
          return NextResponse.json({
            success: false,
            error: "ไม่สามารถถอนสิทธิ์ตนเองได้เนื่องจากคุณเป็น Main Admin คนเดียวของฝั่งนี้",
          });
        }
      }

      const perms = { ...(existing.permissions || {}) };
      perms[section] = { access: false, isMainAdmin: false };

      allUsers[existingIdx] = {
        ...existing,
        permissions: perms,
        updatedAt: new Date().toISOString(),
      };

      await saveAdminUsers(allUsers);
      return NextResponse.json({
        success: true,
        message: `ถอนสิทธิ์ ${existing.username} จากฝั่ง ${section} เรียบร้อยแล้ว`,
      });
    }

    // 9. TOGGLE MAIN ADMIN
    if (action === "toggle_main_admin") {
      const { username: targetUsername, isMainAdmin } = body;
      const cleanTarget = String(targetUsername).toLowerCase().trim();

      if (cleanTarget === "admin" && !isMainAdmin) {
        return NextResponse.json({ success: false, error: "ไม่สามารถปลด Super Admin ออกจาก Main Admin ได้" });
      }

      const allUsers = await getAdminUsers();
      const existingIdx = allUsers.findIndex((u) => u.username.toLowerCase() === cleanTarget);

      if (existingIdx < 0) {
        return NextResponse.json({ success: false, error: "ไม่พบบัญชีผู้ใช้นี้ในระบบ" });
      }

      const existing = allUsers[existingIdx];
      const perms = { ...(existing.permissions || {}) };
      perms[section] = {
        access: true,
        isMainAdmin: Boolean(isMainAdmin),
      };

      allUsers[existingIdx] = {
        ...existing,
        permissions: perms,
        updatedAt: new Date().toISOString(),
      };

      await saveAdminUsers(allUsers);
      return NextResponse.json({
        success: true,
        message: `ปรับสถานะ Main Admin ของ ${existing.username} สำหรับฝั่ง ${section} สำเร็จ`,
      });
    }

    // 10. UPDATE ROLE
    if (action === "update_role") {
      const { username: targetUsername, role = "admin" } = body;
      const cleanTarget = String(targetUsername).toLowerCase().trim();

      if (cleanTarget === "admin" && role !== "main_admin") {
        return NextResponse.json({ success: false, error: "ไม่สามารถลดระดับ Super Admin ได้" });
      }

      const allUsers = await getAdminUsers();
      const existingIdx = allUsers.findIndex((u) => u.username.toLowerCase() === cleanTarget);

      if (existingIdx < 0) {
        return NextResponse.json({ success: false, error: "ไม่พบบัญชีผู้ใช้นี้ในระบบ" });
      }

      const existing = allUsers[existingIdx];
      const isMainAdmin = role === "main_admin";

      if (existing.username.toLowerCase() === caller.username.toLowerCase() && !isMainAdmin) {
        const otherMainAdmins = allUsers.filter(
          (u) => u.username.toLowerCase() !== caller.username.toLowerCase() && u.permissions?.[section]?.isMainAdmin
        );
        if (otherMainAdmins.length === 0) {
          return NextResponse.json({
            success: false,
            error: "ไม่สามารถลดระดับตนเองได้เนื่องจากคุณเป็น Main Admin คนเดียวของฝั่งนี้",
          });
        }
      }

      const perms = { ...(existing.permissions || {}) };
      perms[section] = {
        access: true,
        isMainAdmin,
        role,
      };

      allUsers[existingIdx] = {
        ...existing,
        permissions: perms,
        updatedAt: new Date().toISOString(),
      };

      await saveAdminUsers(allUsers);
      return NextResponse.json({
        success: true,
        message: `ปรับบทบาทของ ${existing.username} เป็น ${role.toUpperCase()} สำเร็จ`,
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Auth API error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
