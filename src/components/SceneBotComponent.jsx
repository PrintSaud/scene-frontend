import { useState, useRef, useEffect } from "react";
import { callSceneBot } from "../utils/callSceneBot";
import { FiSend } from "react-icons/fi";
import { funPrompts } from "../utils/funPrompts";
import { backend } from "../config";

export default function SceneBotComponent() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState("");
  const messagesEndRef = useRef(null);

  // 🧠 Get a prompt by lang (fallback to English)
  const getRandomPrompt = (lang) => {
    const list = funPrompts[lang] || funPrompts["english"];
    return list[Math.floor(Math.random() * list.length)];
  };
  

  // 📌 Lang from storage
  const userLang = localStorage.getItem("sceneLang") || "english";
  const prompt = getRandomPrompt(userLang);

  useEffect(() => {
    const saved = localStorage.getItem("scenebotHistory");
    if (saved) {
      const parsed = JSON.parse(saved);
      const lastTime = parsed[parsed.length - 1]?.time;
      const isFresh = Date.now() - lastTime < 24 * 60 * 60 * 1000;

      if (isFresh) {
        setMessages(parsed.map((msg) => ({ ...msg, time: undefined })));
      } else {
        localStorage.removeItem("scenebotHistory");
      }
    }
  }, []);

  const saveToStorage = (msgArray) => {
    const withTime = msgArray.map((msg) => ({ ...msg, time: Date.now() }));
    localStorage.setItem("scenebotHistory", JSON.stringify(withTime));
  };

  const handleAsk = async (customPrompt, forcedLang = null) => {
    const question = (customPrompt || input || "").toString().trim();
    if (!question) return;

    const lower = question.toLowerCase();
    if (lower.includes("reply in english")) {
      localStorage.setItem("sceneLang", "english");
    } else if (lower.includes("reply in arabic")) {
      localStorage.setItem("sceneLang", "arabic");
    } else if (lower.includes("reply in french")) {
      localStorage.setItem("sceneLang", "french");
    } else if (lower.includes("reset language")) {
      localStorage.removeItem("sceneLang");
    }

    const userMsg = { sender: "user", text: question };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveToStorage(newMessages);
    setLoading(true);
    setInput("");

    const lang = forcedLang || localStorage.getItem("sceneLang") || "english";
    const result = await callSceneBot(question, lang);

    setLoading(false);

    if (result) {
      setTypingText("");
      const botMsg = { sender: "bot", text: "" };
      const updated = [...newMessages, botMsg];
      setMessages(updated);

      let i = 0;
      const typeChar = () => {
        if (i < result.length) {
          updated[updated.length - 1].text += result[i];
          setMessages([...updated]);
          i++;
          setTimeout(typeChar, 15);
        } else {
          saveToStorage(updated);
        }
      };

      typeChar();
    }
  };

  const translatePrompt = async (text, lang) => {
    if (lang === "english" || lang === "arabic") return text;

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND}/api/scenebot/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("user"))?.token}`,
        },
        body: JSON.stringify({ text, target: lang }),
      });

      const data = await res.json();
      return data.translated || text;
    } catch (err) {
      console.error("Prompt translation failed", err);
      return text;
    }
  };

  const handleFunPrompt = async () => {
    const lang = localStorage.getItem("sceneLang") || "english";
    const randomPrompt = getRandomPrompt(lang);
    const finalPrompt =
      lang === "english" || lang === "arabic"
        ? randomPrompt
        : await translatePrompt(randomPrompt, lang);

    await handleAsk(finalPrompt, lang);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "#0e0e0e",
      color: "#fff",
      fontFamily: "Inter, sans-serif",
      position: "relative",
    }}>
        {/* ❓ Language Info Icon */}
<div
  onClick={() => alert(`🌍 To change language, just type:\n\nreply in "arabic"\nreply in "french"\nreply in "english"\n\nTo reset, type: reset language`)}
  style={{
    position: "absolute",
    top: "18px",
    right: "18px",
    fontSize: "20px",
    cursor: "pointer",
    color: "#ccc",
  }}
  title="Language Info"
>
  ❓
</div>

      {/* 🧠 Header */}
      <div style={{ padding: "24px 16px", fontSize: "20px", fontWeight: "600", textAlign: "center" }}>
        Scene’s Chatbot 🤖
      </div>

      {/* 🗨️ Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "0 16px 140px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.sender === "user" ? "end" : "start",
              marginLeft: msg.sender === "user" ? "auto" : 0,
              marginRight: msg.sender === "user" ? 0 : "auto",
              background: msg.sender === "user" ? "#fff" : "#1a1a1a",
              color: msg.sender === "user" ? "#000" : "#fff",
              padding: "14px 18px",
              borderRadius: "16px",
              maxWidth: "80%",
              fontSize: "14.5px",
              whiteSpace: "pre-wrap",
              border: msg.sender === "bot" ? "1px solid #333" : "none",
            }}
          >
            {msg.text}
          </div>
        ))}

        {loading && !typingText && (
          <div style={{
            background: "#1a1a1a",
            padding: "14px 16px",
            borderRadius: "16px",
            maxWidth: "80%",
            alignSelf: "flex-start",
            fontSize: "14px",
            color: "#ccc",
            fontStyle: "italic",
          }}>
            SceneBot is typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ✍️ Input + Buttons */}
      <div style={{
        position: "fixed",
        bottom: "60px",
        left: 0,
        width: "100%",
        padding: "14px 16px",
        background: "#0e0e0e",
        borderTop: "1px solid #222",
        display: "flex",
        alignItems: "center",
        zIndex: 99,
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder="Ask Chatbot Anything about Movies..."
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "999px",
            border: "1px solid #444",
            background: "#2a2a2a",
            color: "#fff",
            fontSize: "15px",
            fontFamily: "Inter, sans-serif",
            outline: "none",
          }}
        />
        <button
          onClick={handleAsk}
          style={{
            marginLeft: "8px",
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: "22px",
            cursor: "pointer",
          }}
        >
          <FiSend />
        </button>
        <button
          onClick={handleFunPrompt}
          style={{
            marginLeft: "8px",
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: "22px",
            cursor: "pointer",
          }}
          title="Surprise me!"
        >
          🎲
        </button>
      </div>
    </div>
  );
}
