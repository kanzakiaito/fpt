import fs from "fs";
import { Redis } from "@upstash/redis";

function cleanEnvVal(val) {
  if (!val || typeof val !== "string") return "";
  return val.trim().replace(/^["']|["']$/g, "").trim();
}

async function main() {
  const envContent = fs.readFileSync(".env.local", "utf-8");
  const env = {};
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = (match[2] || "").trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      env[match[1]] = val;
    }
  });

  const url = cleanEnvVal(process.env.KV_REST_API_URL || env.KV_REST_API_URL);
  const token = cleanEnvVal(process.env.KV_REST_API_TOKEN || env.KV_REST_API_TOKEN);

  if (!url || !token) {
    console.error("Missing KV_REST_API_URL or KV_REST_API_TOKEN in .env.local");
    process.exit(1);
  }

  console.log(`Connecting to Redis: ${url}`);
  const redis = new Redis({ url, token });

  const pong = await redis.ping();
  console.log(`PING status: ${pong}`);

  const backupPath = "src/app/data/backup_kv.json";
  if (!fs.existsSync(backupPath)) {
    console.error(`Backup file not found at ${backupPath}`);
    process.exit(1);
  }

  const backupData = JSON.parse(fs.readFileSync(backupPath, "utf-8"));
  const keys = Object.keys(backupData).filter((k) => !k.startsWith("__"));

  console.log(`Restoring ${keys.length} keys from backup...`);
  for (const key of keys) {
    const val = backupData[key];
    await redis.set(key, val);
    console.log(`✓ Restored: ${key}`);
  }

  console.log("\nAll keys successfully restored to the new Redis instance!");
}

main().catch((err) => {
  console.error("Restore failed:", err);
  process.exit(1);
});
