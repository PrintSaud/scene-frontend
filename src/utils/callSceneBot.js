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
      return data.reply || "🤖 SceneBot had no answer.";
    } catch (err) {
      console.error("SceneBot Error:", err);
      alert("SceneBot is currently unavailable. Please try again later.");
    }
  };
  