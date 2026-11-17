import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getKVData, saveKVData } from "./kv.js";

const USERS_FILE = path.join(process.cwd(), "src/app/data/admin_users.json");
const KV_KEY = "fpt_admin_users";
const SALT = "fpt_salt_2026";
const TOKEN_SECRET = process.env.ADMIN_AUTH_SECRET || "fanpantae_auth_token_key_2026_super_secret";
const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 1 day timeout

const DEFAULT_USERS = [
  {
    id: "usr_admin",
    username: "admin",
    passwordHash: "6657c87a0c1f72f01a708f86b5107170fc92fe3d83edcb69f56727c8266a3731",
    name: "Super Admin (ผู้ดูแลหลัก)",
    permissions: {
      main: { access: true, isMainAdmin: true },
      tournament: { access: true, isMainAdmin: true },
      trial_foty: { access: true, isMainAdmin: true },
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "usr_trial_admin",
    username: "trial_admin",
    passwordHash: "898404275ffc550a73936e9bdb2e19d33ef7a79f19bd553ca74d981b95f9917b",
    name: "Trial Admin (แอดมินงุ่นง่าน)",
    permissions: {
      main: { access: false, isMainAdmin: false },
      tournament: { access: false, isMainAdmin: false },
      trial_foty: { access: true, isMainAdmin: true },
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password) + SALT).digest("hex");
}

export function verifyPassword(password, user) {
  if (!user) return false;
  const hashed = hashPassword(password);
  if (user.passwordHash && user.passwordHash === hashed) return true;
  if (user.password && user.password === password) return true;
  return false;
}

export function createToken(payload) {
  const iat = Date.now();
  const exp = iat + ONE_DAY_MS;
  const data = { ...payload, iat, exp };
  const encodedPayload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = crypto.createHmac("sha256", TOKEN_SECRET).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function verifyToken(token) {
  try {
    if (!token || typeof token !== "string" || !token.includes(".")) {
      return null;
    }
    const [encodedPayload, signature] = token.split(".");
    const expectedSignature = crypto.createHmac("sha256", TOKEN_SECRET).update(encodedPayload).digest("base64url");
    if (signature !== expectedSignature) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

function readUsersFromFile() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      try {
        fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
        fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2), "utf-8");
      } catch (e) {}
      return DEFAULT_USERS;
    }
    const content = fs.readFileSync(USERS_FILE, "utf-8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USERS;
  } catch (err) {
    console.error("Error reading admin_users.json:", err);
    return DEFAULT_USERS;
  }
}

function writeUsersToFile(users) {
  try {
    fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    if (err.code !== "EROFS") {
      console.error("Error writing admin_users.json:", err);
    }
  }
}

export async function getAdminUsers() {
  const users = await getKVData(KV_KEY, readUsersFromFile);
  if (!Array.isArray(users) || users.length === 0) {
    return DEFAULT_USERS;
  }
  return users;
}

export async function saveAdminUsers(users) {
  writeUsersToFile(users);
  await saveKVData(KV_KEY, users);
}

export async function findUserByUsername(username) {
  const users = await getAdminUsers();
  return users.find((u) => u.username.toLowerCase() === String(username).toLowerCase().trim()) || null;
}

export async function authenticateUser(username, password, section) {
  const user = await findUserByUsername(username);
  if (!user) {
    return { success: false, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }
  if (!verifyPassword(password, user)) {
    return { success: false, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }

  const perm = user.permissions?.[section];
  // Superadmin with all access or explicit section access
  const hasAccess = Boolean(perm?.access || (user.permissions?.main?.isMainAdmin && section === "main"));
  if (!hasAccess) {
    return { success: false, error: `คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ (${section})` };
  }

  const isMainAdmin = Boolean(perm?.isMainAdmin || (user.username === "admin"));
  const token = createToken({
    id: user.id,
    username: user.username,
    name: user.name || user.username,
    section,
    isMainAdmin,
  });

  return {
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name || user.username,
      section,
      isMainAdmin,
      permissions: user.permissions,
    },
  };
}

export async function changeUserPassword(username, oldPassword, newPassword) {
  const users = await getAdminUsers();
  const index = users.findIndex((u) => u.username.toLowerCase() === String(username).toLowerCase().trim());
  if (index === -1) {
    return { success: false, error: "ไม่พบชื่อผู้ใช้นี้ในระบบ" };
  }

  const user = users[index];
  if (!verifyPassword(oldPassword, user)) {
    return { success: false, error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
  }

  if (!newPassword || newPassword.length < 4) {
    return { success: false, error: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร" };
  }

  const updatedUsers = [...users];
  updatedUsers[index] = {
    ...user,
    passwordHash: hashPassword(newPassword),
    updatedAt: new Date().toISOString(),
  };
  delete updatedUsers[index].password; // remove plain text if any

  await saveAdminUsers(updatedUsers);
  return { success: true, message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" };
}
