

export const callSceneBot = async (message, lang) => {


  if (typeof message !== "string") {
    console.error("🛑 BLOCKED — callSceneBot received non-string message:", message);
    console.trace(); // 🔍 Will show exactly where it was called from
    return "❌ SceneBot can only receive plain text.";
  }

  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = user?.token;
    const preferredLang = lang || localStorage.getItem("sceneLang") || "english";

    const payload = {
      message,
      lang: preferredLang,
    };

   

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/scenebot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();


    return typeof data.reply === "string"
      ? data.reply
      : JSON.stringify(data.reply);
  } catch (err) {
    console.error("❌ SceneBot Error:", err);
    return "❌ SceneBot is currently unavailable. Please try again later.";
  }
};
