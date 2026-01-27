// shared/utils/callSceneBot.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { backend } from "shared/config";

const DEFAULT_TIMEOUT = 12000;
// CLIENT-SIDE RATE LIMIT: minimum ms between calls from this app instance
const MIN_CALL_INTERVAL_MS = 800;

let _lastCallAt = 0;

function normalizeBackendUrl(candidate) {
  if (!candidate || typeof candidate !== "string") throw new Error("NO_BACKEND");
  if (!candidate.startsWith("https://")) throw new Error("NO_BACKEND");
  return candidate.replace(/\/$/, "");
}

async function getTokenFromStorage() {
  try {
    const raw = await AsyncStorage.getItem("user");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.token) return parsed.token;
      } catch {}
    }
    const fallback = (await AsyncStorage.getItem("token")) || (await AsyncStorage.getItem("authToken")) || null;
    return fallback;
  } catch (e) {
    return null;
  }
}

function timeoutPromise(promise, ms) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "TIMEOUT" })), ms);
    promise
      .then((r) => {
        clearTimeout(id);
        resolve(r);
      })
      .catch((err) => {
        clearTimeout(id);
        reject(err);
      });
  });
}

/**
 * callSceneBot(message, lang, optionsOrToken)
 * optionsOrToken can be { token?, signal?, timeoutMs? } or a token string
 *
 * Important: if no token is provided or found in storage, this function will
 * deliberately omit the Authorization header so the server will treat the
 * request as a "bypass" (review) call. This matches server-side bypass logic
 * and avoids sending invalid tokens which would be rejected.
 */
export const callSceneBot = async (message, lang = "english", optionsOrToken = {}) => {
  const opts = typeof optionsOrToken === "string" ? { token: optionsOrToken } : (optionsOrToken || {});

  if (typeof message !== "string") {
    const e = new Error("invalid-message");
    e.code = "INVALID_INPUT";
    throw e;
  }

  if (!backend) {
    const e = new Error("No backend configured");
    e.code = "NO_BACKEND";
    throw e;
  }

  let base;
  try {
    base = normalizeBackendUrl(backend);
  } catch (err) {
    const e = new Error("No backend configured or invalid URL");
    e.code = "NO_BACKEND";
    throw e;
  }

  const timeoutMs = typeof opts.timeoutMs === "number" ? opts.timeoutMs : DEFAULT_TIMEOUT;
  const incomingSignal = opts.signal || null;
  const providedToken = opts.token || null;

  // CLIENT RATE LIMIT (simple): prevent accidental rapid-fire UI calls
  const now = Date.now();
  if (now - _lastCallAt < MIN_CALL_INTERVAL_MS) {
    const e = new Error("client_rate_limited");
    e.code = "CLIENT_RATE_LIMIT";
    throw e;
  }
  _lastCallAt = now;

  // Determine token: explicit param wins, else try storage.
  // IMPORTANT: if no token found, we DELIBERATELY do NOT send Authorization header
  let token = providedToken;
  if (!token) token = await getTokenFromStorage();

  const payload = { message, lang };

  // Build controller
  const controller = incomingSignal ? null : new AbortController();
  const signal = incomingSignal || controller?.signal;
  if (controller) {
    setTimeout(() => controller.abort(), timeoutMs);
  }

  try {
    const headers = { "Content-Type": "application/json" };
    // Only include Authorization header if we actually have a token (real user token)
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await timeoutPromise(
      fetch(`${base}/api/scene-bot`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal,
      }),
      timeoutMs + 50
    );

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      const err = new Error(`SceneBot HTTP ${res.status}: ${txt || res.status}`);
      err.status = res.status;
      if (res.status === 401 || res.status === 403) err.code = "UNAUTHORIZED";
      else if (res.status >= 500) err.code = "SERVICE_UNAVAILABLE";
      else err.code = "BAD_RESPONSE";
      throw err;
    }

    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j = await res.json().catch(() => null);
      if (j && (typeof j.reply === "string" || typeof j.reply === "number")) return String(j.reply);
      if (j && j.reply) return JSON.stringify(j.reply);
      if (j && (typeof j.message === "string" || typeof j.text === "string")) return String(j.message || j.text);
      const err = new Error("SceneBot responded without reply property");
      err.code = "BAD_RESPONSE";
      throw err;
    } else {
      const txt = await res.text();
      return txt;
    }
  } catch (err) {
    const msg = String(err?.message || "").toLowerCase();
    if (err?.code === "TIMEOUT" || msg.includes("timeout") || err?.name === "AbortError") {
      const e = new Error("timeout");
      e.code = "TIMEOUT";
      throw e;
    }
    if (msg.includes("getaddrinfo") || msg.includes("could not resolve host")) {
      const e = new Error("dns-fail");
      e.code = "DNS_FAIL";
      throw e;
    }
    // Rethrow auth errors as-is
    if (err?.status === 401 || err?.code === "UNAUTHORIZED") {
      const e = new Error("Not authorized, invalid token");
      e.code = "UNAUTHORIZED";
      e.status = 401;
      throw e;
    }
    // For other failures attempt demo fallback
    try {
      const demoRes = await fetch(`${base}/api/scene-bot/demo`, { signal: incomingSignal || undefined });
      if (demoRes.ok) {
        const demoJson = await demoRes.json().catch(() => null);
        if (demoJson && (demoJson.reply || demoJson.message)) return String(demoJson.reply || demoJson.message);
      }
    } catch (demoErr) {}
    const fe = new Error("SceneBot is currently unavailable. Please try again later.");
    fe.code = "SERVICE_UNAVAILABLE";
    fe.inner = err;
    throw fe;
  }
};

export default callSceneBot;
