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

    const replyRaw = data.reply;

    if (typeof replyRaw === "string") return replyRaw;
    if (replyRaw?.text && typeof replyRaw.text === "string") return replyRaw.text;

    return JSON.stringify(replyRaw); // <-- final fallback for object replies
  } catch (err) {
    console.error("SceneBot Error:", err);
    return "❌ SceneBot is currently unavailable. Please try again later.";
  }
};
