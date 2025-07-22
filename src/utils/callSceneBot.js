export const callSceneBot = async (message, lang) => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = user?.token;

    const preferredLang = lang || localStorage.getItem("sceneLang") || "english";

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/scenebot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message, lang: preferredLang }),
    });

    const data = await res.json();
    console.log("🧠 SceneBot API result:", data);

    if (!res.ok) {
      console.error("❌ Backend error:", data);
      return "🤖 SceneBot is currently unavailable.";
    }

    // 🔥 Robust reply parsing:
    const reply =
      typeof data.reply === "string"
        ? data.reply
        : data.reply?.text
        ? data.reply.text
        : String(data.reply || "");

    return reply || "🤖 SceneBot had no answer.";
  } catch (err) {
    console.error("SceneBot Error:", err);
    return "❌ SceneBot is currently unavailable. Please try again later.";
  }
};
