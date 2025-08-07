import { useState, useRef, useEffect } from "react";
import { callSceneBot } from "../utils/callSceneBot";
import { FiSend } from "react-icons/fi";
import { funPrompts } from "../utils/funPrompts";
import { backend } from "../config";
import { useLocation } from "react-router-dom";

export default function SceneBotComponent() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState("");
  const messagesEndRef = useRef(null);
  const location = useLocation();

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
    // 🧹 Normalize input
    let rawInput = customPrompt || input || "";
    if (typeof rawInput !== "string") {
      console.warn("⚠️ Input was not string. Converting to string:", rawInput);
      rawInput = String(rawInput);
    }
  
    const question = rawInput.trim();
    if (!question) return;
  
    // 🌍 Language Triggers
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
  
    // 🧠 Save user message
    const userMsg = {
      sender: "user",
      text: typeof question === "string" ? question : JSON.stringify(question),
    };
  
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveToStorage(newMessages);
    setLoading(true);
    setInput("");
  
    // 🚀 Call SceneBot
    const lang = forcedLang || localStorage.getItem("sceneLang") || "english";
    console.log("🧠 CONFIRMATION — calling callSceneBot with:", question);
    console.trace();
  
    const result = await callSceneBot(question, lang);
    setLoading(false);
  
    const replyText = typeof result === "string" ? result : JSON.stringify(result);
    if (!replyText) return;
  
    setTypingText("");
  
    const botMsg = {
      sender: "bot",
      text: "", // start empty, we'll type it
    };
  
    let fullMessages = [...newMessages, botMsg];
    setMessages(fullMessages);
  
    // ✍️ Typewriter Effect
    let i = 0;
    const typeChar = () => {
      if (i < replyText.length) {
        fullMessages = [...fullMessages];
        fullMessages[fullMessages.length - 1] = {
          ...fullMessages[fullMessages.length - 1],
          text: fullMessages[fullMessages.length - 1].text + replyText[i],
        };
        setMessages(fullMessages);
        i++;
        setTimeout(typeChar, 15); // or use requestAnimationFrame for buttery smoothness
      } else {
        saveToStorage(fullMessages);
      }
    };
  
    typeChar();
  };
  
  
  useEffect(() => {
    if (location.state?.autoAsk) {
      const text = location.state.autoAsk;
      setInput(""); // clear input UI
      handleAsk(text); // auto fire
    }
  }, [location.state]);
  

  const translatePrompt = async (text, lang) => {
    if (lang === "english" || lang === "arabic") return text;

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/scenebot/translate`, {
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
    <div
  style={{
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#0e0e0e",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
    position: "relative",
  }}
>
  {/* 🧠 Sticky Header with ❓ Icon */}
  <div
    style={{
      position: "sticky",
      top: 0,
      background: "#0e0e0e",
      zIndex: 100,
      padding: "20px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderBottom: "1px solid #222",
    }}
  >
    {/* Centered Title */}
    <div style={{ fontSize: "20px", fontWeight: "600", flex: 1, textAlign: "center" }}>
      SceneBot 🎬
    </div>

    {/* ❓ Icon — now truly top right */}
    <div
      onClick={() =>
        alert(
          `🌍 To change language, just type:\n\nreply in "arabic"\nreply in "french"\nreply in "english"\n\nTo reset, type: reset language`
        )
      }
      style={{
        position: "absolute",
        top: 20,
        right: 16,
        fontSize: "20px",
        cursor: "pointer",
        color: "#ccc",
      }}
      title="Language Info"
    >
      🌍
    </div>
  </div>

  
      {/* 🗨️ Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 16px 140px",
          paddingTop: "0px", // ✅ REMOVE TOP GAP
          display: "flex",
          flexDirection: "column",
          gap: "0px",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.sender === "user" ? "end" : "start",
              marginLeft: msg.sender === "user" ? "auto" : 0,
              marginRight: msg.sender === "user" ? 0 : "auto",
              marginTop: i === 0 ? "0px" : "14px", // ✅ FIRST MESSAGE NO MARGIN-TOP
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
            {String(msg.text)}
          </div>
        ))}
  
        {loading && !typingText && (
          <div
            style={{
              background: "#1a1a1a",
              padding: "14px 16px",
              borderRadius: "16px",
              maxWidth: "80%",
              alignSelf: "flex-start",
              fontSize: "14px",
              color: "#ccc",
              fontStyle: "italic",
            }}
          >
            SceneBot is typing...
          </div>
        )}
  
        <div ref={messagesEndRef} style={{ height: "100px" }} />
      </div>
  
      {/* ✍️ Input + Buttons */}
      <div
        style={{
          position: "fixed",
          bottom: "60px",
          left: 0,
          width: "95%",
          padding: "14px 16px",
          background: "#0e0e0e",
          borderTop: "1px solid #222",
          display: "flex",
          alignItems: "center",
          zIndex: 99,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder="Ask Anything about Movies..."
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
          onClick={() => handleAsk()}
          style={{
            marginLeft: "8px",
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: "22px",
            cursor: "pointer",
            top: "0.5px",
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
            top: "-0.5px",
          }}
          title="Surprise me!"
        >
          🎲
        </button>
      </div>
    </div>
  );
  
}
