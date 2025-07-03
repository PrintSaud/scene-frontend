export const callSceneBot = async (message, lang) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;
  
      // 🌐 Fallback to saved language if not explicitly passed
      const preferredLang = lang || localStorage.getItem("sceneLang") || "english";
  
      const res = await fetch(`${import.meta.env.VITE_BACKEND}/api/scenebot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, lang: preferredLang }),
      });
  
      const data = await res.json();
      console.log("🧠 SceneBot data:", data); // ✅ Debug log
  
      if (!res.ok) {
        console.error("❌ Backend error:", data);
        return "🤖 SceneBot is currently unavailable.";
      }
  
      // Ensure the reply is a string to avoid [object Object] bugs
      const reply = typeof data.reply === "string" ? data.reply : String(data.reply || "");
      return reply || "🤖 SceneBot had no answer.";
    } catch (err) {
      console.error("SceneBot Error:", err);
      return "❌ SceneBot is currently unavailable. Please try again later.";
    }
  };
  