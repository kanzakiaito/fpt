import { Redis } from "@upstash/redis";

function cleanEnvVal(val) {
  if (!val || typeof val !== "string") return "";
  return val.trim().replace(/^["']|["']$/g, "").trim();
}

let redisClient = null;

export function getRedisClient() {
  if (redisClient) return redisClient;

  const rawUrl =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_URL ||
    process.env.REDIS_URL;

  const rawToken =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_READ_ONLY_TOKEN;

  const url = cleanEnvVal(rawUrl);
  const token = cleanEnvVal(rawToken);

  if (url && token && (url.startsWith("https://") || url.startsWith("http://"))) {
    try {
      redisClient = new Redis({
        url,
        token,
      });
      return redisClient;
    } catch (err) {
      console.warn("Failed to initialize Upstash Redis client:", err);
      return null;
    }
  }
  return null;
}

export function isKVConfigured() {
  return Boolean(getRedisClient());
}

/**
 * Get data from Upstash KV or fallback to a local read function.
 * If data is not yet in KV but found in fallback, seed KV automatically.
 */
export async function getKVData(key, fallbackReadFn) {
  const client = getRedisClient();
  if (client) {
    try {
      const data = await client.get(key);
      if (data !== null && data !== undefined) {
        return data;
      }
      // Seed KV with initial local data if key doesn't exist yet
      if (typeof fallbackReadFn === "function") {
        const localData = fallbackReadFn();
        if (localData !== null && localData !== undefined) {
          await client.set(key, localData);
          return localData;
        }
      }
    } catch (err) {
      console.error(`Error reading ${key} from KV, falling back to local:`, err);
    }
  }
  return typeof fallbackReadFn === "function" ? fallbackReadFn() : null;
}

/**
 * Save data to Upstash KV and also attempt local write (if filesystem is writable).
 */
export async function saveKVData(key, data, fallbackWriteFn) {
  const client = getRedisClient();
  if (client) {
    try {
      await client.set(key, data);
    } catch (err) {
      console.error(`Error saving ${key} to KV:`, err);
    }
  }

  // Attempt local write (works in localhost/VPS, gracefully skips read-only errors on Vercel)
  if (typeof fallbackWriteFn === "function") {
    try {
      fallbackWriteFn(data);
    } catch (err) {
      if (err.code !== "EROFS") {
        console.error(`Local write error for ${key}:`, err);
      }
    }
  }
}
