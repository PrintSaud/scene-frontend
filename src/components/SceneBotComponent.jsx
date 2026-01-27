// src/pages/SceneBotComponent.jsx
import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { callSceneBot } from "../utils/callSceneBot";
import { FiSend } from "react-icons/fi";
import { funPrompts } from "../utils/funPrompts";
import { detectLang } from "../utils/detectLang";
import useTranslate from "../utils/useTranslate";

export default function SceneBotComponent() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const typeTimerRef = useRef(null);
  const replyRef = useRef("");
  const indexRef = useRef(0);
  const t = useTranslate();

  const botLang = detectLang();
  const isRTL = botLang === "arabic";

  const location = useLocation();
  const { movie, autoAsk } = location.state || {};
  const navigate = useNavigate();

  const pickPrompt = () => {
    const list = funPrompts[botLang] || funPrompts.english || [];
    if (!list.length) return "";
    return list[Math.floor(Math.random() * list.length)];
  };

  // hydrate history (24h)
  useEffect(() => {
    const saved = localStorage.getItem("scenebotHistory");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      const lastTime = parsed[parsed.length - 1]?.time;
      const isFresh = Date.now() - lastTime < 24 * 60 * 60 * 1000;
      if (isFresh) setMessages(parsed.map((m) => ({ ...m, time: undefined })));
      else localStorage.removeItem("scenebotHistory");
    } catch {}
  }, []);

  const saveToStorage = (arr) => {
    const withTime = arr.map((m) => ({ ...m, time: Date.now() }));
    localStorage.setItem("scenebotHistory", JSON.stringify(withTime));
  };

  const dedupeTail = (text) => {
    const s = text.trim();
    const chunk = s.slice(-200);
    const without = s.slice(0, -200);
    return without.endsWith(chunk) ? without : s;
  };

  const startTypewriter = () => {
    if (typeTimerRef.current) clearInterval(typeTimerRef.current);

    typeTimerRef.current = setInterval(() => {
      const full = replyRef.current;
      const i = indexRef.current;

      if (i >= full.length) {
        clearInterval(typeTimerRef.current);
        typeTimerRef.current = null;
        setLoading(false);
        setTyping(false);
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.sender === "bot") last.text = dedupeTail(last.text);
          saveToStorage(copy);
          return copy;
        });
        return;
      }

      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.sender === "bot") last.text = full.slice(0, i + 1);
        return copy;
      });

      indexRef.current = i + 1;
      const atBottom =
        Math.abs(
          messagesEndRef.current?.parentElement.scrollHeight -
            messagesEndRef.current?.parentElement.scrollTop -
            messagesEndRef.current?.parentElement.clientHeight
        ) < 60;

      if (atBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }, 12);
  };

  const handleAsk = async (customPrompt) => {
    if (loading) return;
    const question = String(customPrompt ?? input ?? "").trim();
    if (!question) return;

    const userMsg = { sender: "user", text: question };
    const next = [...messages, userMsg];
    setMessages(next);
    saveToStorage(next);
    setLoading(true);
    setTyping(true);
    setInput("");

    if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    replyRef.current = "";
    indexRef.current = 0;

    try {
      const replyText = await callSceneBot(question, botLang);
      replyRef.current = replyText || "";

      // bot bubble placeholder
      setMessages((prev) => [...prev, { sender: "bot", text: "" }]);
      startTypewriter();
    } catch {
      setLoading(false);
      setTyping(false);
      const errMsg = { sender: "bot", text: t("Something went wrong") };
      const copy = [...next, errMsg];
      setMessages(copy);
      saveToStorage(copy);
    }
  };

  const handleFunPrompt = async () => {
    const p = pickPrompt();
    if (!p) return;
    await handleAsk(p);
  };

  useEffect(() => {
    if (autoAsk) handleAsk(autoAsk);
  }, [autoAsk]);

  useEffect(() => {
    const atBottom =
      Math.abs(
        messagesEndRef.current?.parentElement.scrollHeight -
          messagesEndRef.current?.parentElement.scrollTop -
          messagesEndRef.current?.parentElement.clientHeight
      ) < 60;

    if (atBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, typing]);

  useEffect(() => {
    return () => {
      if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    };
  }, []);

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#0e0e0e",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        overflow: "hidden", // ✅ stop scroll above header
      }}
    >
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          background: "#0e0e0e",
          padding: "10px 16px",
          borderBottom: "1px solid #222",
          textAlign: "center",
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        SceneBot 🎬
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 12px 96px",
        }}
      >
        {/* Poster */}
        {movie && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 20,
              cursor: "pointer",
            }}
            onClick={() => navigate(`/movie/${movie.id}`)}
          >
            <img
              src={movie.poster}
              alt={movie.title}
              style={{ width: 120, borderRadius: 8, marginBottom: 8 }}
            />
            <h3
              style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              {movie.title}
            </h3>
          </div>
        )}

        {/* Chat bubbles */}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.sender === "bot" ? "flex-end" : "flex-start", // 🔄 flipped
              marginTop: i === 0 ? 6 : 10,
              padding: "0 4px",
            }}
          >
            <div
              style={{
                background: m.sender === "bot" ? "#1a1a1a" : "#fff",
                color: m.sender === "bot" ? "#fff" : "#000",
                padding: "8px 12px",
                borderRadius: 14,
                maxWidth: "78%",
                fontSize: 14.5,
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
                border: m.sender === "bot" ? "1px solid #333" : "none",
                textAlign: isRTL ? "right" : "left",
                wordBreak: "break-word",
              }}
            >
              {String(m.text)}
            </div>
          </div>
        ))}

        {/* Typing */}
        {typing && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end", // 🔄 match bot side
              marginTop: 10,
              padding: "0 4px",
            }}
          >
            <div
              style={{
                background: "#1a1a1a",
                color: "#aaa",
                padding: "8px 12px",
                borderRadius: 14,
                fontSize: 13,
                fontStyle: "italic",
                border: "1px solid #333",
                maxWidth: "60%",
              }}
            >
              {t("SceneBot is typing…")}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} style={{ height: 40 }} />
      </div>

      {/* Input */}
      <div
        style={{
          position: "fixed",
          bottom: 60,
          left: 0,
          width: "90%",
          padding: "12px 12px",
          background: "#0e0e0e",
          borderTop: "1px solid #222",
          display: "flex",
          alignItems: "center",
          gap: 8,
          zIndex: 99,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder={t("ask_anything")}
          dir={isRTL ? "rtl" : "ltr"}
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 999,
            border: "1px solid #444",
            background: "#2a2a2a",
            color: "#fff",
            fontSize: 15,
            outline: "none",
          }}
        />
        <button
          onClick={() => handleAsk()}
          disabled={loading}
          style={{
            background: "transparent",
            border: "none",
            color: loading ? "#888" : "#fff",
            fontSize: 22,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          aria-label={t("Send")}
          title={t("Send")}
        >
          <FiSend />
        </button>
        <button
          onClick={handleFunPrompt}
          disabled={loading}
          style={{
            background: "transparent",
            border: "none",
            color: loading ? "#888" : "#fff",
            fontSize: 22,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          title={t("Surprise me!")}
          aria-label={t("Surprise me!")}
        >
          🎲
        </button>
      </div>
    </div>
  );
}
