// src/pages/SceneBotComponent.jsx
import { useState, useRef, useEffect } from "react";
import { callSceneBot } from "../utils/callSceneBot";
import { FiSend } from "react-icons/fi";
import { funPrompts } from "../utils/funPrompts";
import { detectLang } from "../utils/detectLang";
import useTranslate from "../utils/useTranslate";

export default function SceneBotComponent() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const typeTimerRef = useRef(null);          // ✅ single typewriter timer
  const replyRef = useRef("");                // buffer for current reply
  const indexRef = useRef(0);                 // current index while typing
  const t = useTranslate();

  const botLang = detectLang();
  const isRTL = botLang === "arabic";

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

  // small helper to remove duplicated trailing paragraph/sentence
  const dedupeTail = (text) => {
    // if last ~200 chars repeat, drop the duplicate
    const s = text.trim();
    const chunk = s.slice(-200);
    const without = s.slice(0, -200);
    return without.endsWith(chunk) ? without : s;
  };

  const startTypewriter = () => {
    // clear any previous timer just in case
    if (typeTimerRef.current) clearInterval(typeTimerRef.current);

    typeTimerRef.current = setInterval(() => {
      const full = replyRef.current;
      const i = indexRef.current;

      if (i >= full.length) {
        clearInterval(typeTimerRef.current);
        typeTimerRef.current = null;
        setLoading(false);
        // final dedupe safeguard
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.sender === "bot") {
            last.text = dedupeTail(last.text);
          }
          saveToStorage(copy);
          return copy;
        });
        return;
      }

      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.sender === "bot") {
          last.text = full.slice(0, i + 1);     // ✅ substring, no additive drift
        }
        return copy;
      });

      indexRef.current = i + 1;
      // keep view stuck to bottom while typing
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 12);
  };

  const handleAsk = async (customPrompt) => {
    if (loading) return; // ✅ prevent double-fire while typing

    const question = String(customPrompt ?? input ?? "").trim();
    if (!question) return;

    // append user message
    const userMsg = { sender: "user", text: question };
    const next = [...messages, userMsg];
    setMessages(next);
    saveToStorage(next);
    setLoading(true);
    setInput("");

    // ensure a fresh typewriter state
    if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    replyRef.current = "";
    indexRef.current = 0;

    try {
      const replyText = await callSceneBot(question, botLang);
      // buffer the reply for the interval loop
      replyRef.current = replyText || "";

      // create (single) bot bubble to fill progressively
      setMessages((prev) => [...prev, { sender: "bot", text: "" }]);

      // go!
      startTypewriter();
    } catch (e) {
      setLoading(false);
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // cleanup on unmount
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
      }}
    >
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "#0e0e0e",
          zIndex: 100,
          padding: "14px 16px",          // tighter
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
          padding: "8px 12px 96px",       // tighter: less bottom padding
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.sender === "user" ? "end" : "start",
              marginLeft: m.sender === "user" ? "auto" : 0,
              marginRight: m.sender === "user" ? 0 : "auto",
              marginTop: i === 0 ? 4 : 10, // tighter vertical rhythm
              background: m.sender === "user" ? "#fff" : "#1a1a1a",
              color: m.sender === "user" ? "#000" : "#fff",
              padding: "10px 14px",        // tighter bubble padding
              borderRadius: 14,
              maxWidth: "78%",             // a touch wider on mobile
              fontSize: 14.5,
              lineHeight: 1.55,
              whiteSpace: "pre-wrap",
              border: m.sender === "bot" ? "1px solid #333" : "none",
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {String(m.text)}
          </div>
        ))}

        {loading && (
          <div
            style={{
              background: "#1a1a1a",
              padding: "10px 14px",
              borderRadius: 14,
              maxWidth: "60%",
              alignSelf: "flex-start",
              fontSize: 13.5,
              color: "#ccc",
              fontStyle: "italic",
              border: "1px solid #333",
            }}
          >
            {t("SceneBot is typing...")}
          </div>
        )}

        <div ref={messagesEndRef} style={{ height: 80 }} />
      </div>

      {/* Input row */}
      <div
        style={{
          position: "fixed",
          bottom: 60,                      // keep room for your tab bar
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
          placeholder={t("Ask Anything about Movies...")}
          dir={isRTL ? "rtl" : "ltr"}
          disabled={loading}               // ✅ block typing during generation
          style={{
            flex: 1,
            padding: "11px 14px",
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
