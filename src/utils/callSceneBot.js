console.log("✅ callSceneBot.js LOADED"); // Confirms correct file is being used

export const callSceneBot = async (message, lang) => {
  console.log("📤 callSceneBot called with:", message, "Type:", typeof message);

  if (typeof message !== "string") {
    console.error("🛑 BLOCKED — callSceneBot received non-string message:", message);
    console.trace(); // 🔍 Will show exactly where it was called from
    return "❌ SceneBot can only receive plain text.";
  }

  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = user?.token;
    const preferredLang = lang || localStorage.getItem("sceneLang") || "english";

    console.log("🌍 Preferred language:", preferredLang);
    console.log("🔐 Sending token:", token ? "✅ Present" : "❌ Missing");

    const payload = {
      message,
      lang: preferredLang,
    };

    console.log("📦 Payload to backend:", payload);

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/scenebot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("📬 Response from backend:", data);

    return typeof data.reply === "string"
      ? data.reply
      : JSON.stringify(data.reply);
  } catch (err) {
    console.error("❌ SceneBot Error:", err);
    return "❌ SceneBot is currently unavailable. Please try again later.";
  }
};
