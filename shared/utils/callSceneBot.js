import AsyncStorage from "@react-native-async-storage/async-storage";

const backend = "https://scene-backend-tv-production.up.railway.app"; // ✅ match all other files
const DEFAULT_TIMEOUT = 100000;
const MIN_CALL_INTERVAL_MS = 800;

let _lastCallAt = 0;

async function getTokenFromStorage() {
  try {
    const raw = await AsyncStorage.getItem("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token) return parsed.token;
    }
    const fallback =
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("authToken")) ||
      null;
    return fallback;
  } catch {
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

export const callSceneBot = async (message, lang = "english", optionsOrToken = {}) => {
  const opts = typeof optionsOrToken === "string" ? { token: optionsOrToken } : optionsOrToken || {};

  if (typeof message !== "string") {
    const e = new Error("invalid-message");
    e.code = "INVALID_INPUT";
    throw e;
  }

  const now = Date.now();
  if (now - _lastCallAt < MIN_CALL_INTERVAL_MS) {
    const e = new Error("client_rate_limited");
    e.code = "CLIENT_RATE_LIMIT";
    throw e;
  }
  _lastCallAt = now;

  const timeoutMs = typeof opts.timeoutMs === "number" ? opts.timeoutMs : DEFAULT_TIMEOUT;
  const incomingSignal = opts.signal || null;

  let token = opts.token || (await getTokenFromStorage());
  const payload = { message, lang };

  const controller = incomingSignal ? null : new AbortController();
  const signal = incomingSignal || controller?.signal;
  if (controller) setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await timeoutPromise(
      fetch(`${backend}/api/scene-bot`, {
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
      if (j?.reply) return String(j.reply);
      if (j?.message || j?.text) return String(j.message || j.text);
      throw new Error("SceneBot responded without reply property");
    } else {
      return await res.text();
    }
  } catch (err) {
    const msg = String(err?.message || "").toLowerCase();
    if (err?.code === "TIMEOUT" || msg.includes("timeout")) {
      const e = new Error("timeout");
      e.code = "TIMEOUT";
      throw e;
    }

    try {
      const demoRes = await fetch(`${backend}/api/scene-bot/demo`, { signal: incomingSignal || undefined });
      if (demoRes.ok) {
        const demoJson = await demoRes.json().catch(() => null);
        if (demoJson?.reply || demoJson?.message)
          return String(demoJson.reply || demoJson.message);
      }
    } catch {}

    const fe = new Error(
      "SceneBot is currently unavailable. Please try again later."
    );

    fe.code =
      err?.code ||
      "SERVICE_UNAVAILABLE";

    fe.status =
      err?.status ||
      null;

    fe.inner =
      err;

    throw fe;
  }
};

export default callSceneBot;
