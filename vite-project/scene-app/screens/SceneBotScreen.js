// src/screens/SceneBotScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight as useTabHeightRaw } from "@react-navigation/bottom-tabs";

import { callSceneBot } from "shared/utils/callSceneBot";
import { funPrompts } from "shared/utils/funPrompts";
import useTranslate from "shared/utils/useTranslate";
import { useLanguage } from "shared/context/LanguageContext";

const INPUT_H = 56;

// Safe tab bar height hook (returns 0 if not inside a Tab navigator)
function useSafeTabBarHeight() {
  try { return useTabHeightRaw(); } catch { return 0; }
}

export default function SceneBotScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);

  const [hasAuth, setHasAuth] = useState(null); // null = unknown, false = no token, true = token found
  const [authToken, setAuthToken] = useState(null);

  const scrollRef = useRef(null);
  const typeTimerRef = useRef(null);
  const replyRef = useRef("");
  const indexRef = useRef(0);

  const route = useRoute();
  const navigation = useNavigation();
  const { movie, autoAsk } = route.params || {};

  const t = useTranslate();
  const { language } = useLanguage();
  const botLang = language === "ar" ? "arabic" : "english";
  const isRTL = language === "ar";

  const insets = useSafeAreaInsets();
  const tabBarHeight = useSafeTabBarHeight();

  const [kbHeight, setKbHeight] = useState(0);
  const [atBottom, setAtBottom] = useState(true);
  const bottomOffset = kbHeight > 0 ? kbHeight : tabBarHeight + insets.bottom;

  const STORAGE_KEY = `scenebotHistory:${language}`;

  const pickPrompt = () => {
    const list = funPrompts[botLang] || funPrompts.english || [];
    if (!list.length) return "";
    return list[Math.floor(Math.random() * list.length)];
  };

  // Show the Back button ONLY when opened with a movie (i.e. from the Movie screen)
  const shouldShowBack = !!movie;

  const handleBack = () => {
    if (movie) {
      if (navigation.canGoBack && navigation.canGoBack()) navigation.goBack();
      else navigation.navigate("Movie", { id: movie.id });
      return;
    }
    navigation.navigate("Home");
  };

  // Load history (24h) → then mark hydrated
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const lastTime = parsed[parsed.length - 1]?.time;
          const isFresh = Date.now() - lastTime < 24 * 60 * 60 * 1000;
          if (!cancelled) {
            if (isFresh) setMessages(parsed.map((m) => ({ ...m, time: undefined })));
            else await AsyncStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (e) {
        if (__DEV__) console.warn("SceneBot: load history failed", e);
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => { cancelled = true; typeTimerRef.current && clearInterval(typeTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [STORAGE_KEY]);

  // --- NEW: check for auth token (reviewer devices may be logged out) ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Common keys apps store tokens under. Check 'user' (JSON), 'token', or 'auth'
        const rawUser = await AsyncStorage.getItem("user");
        if (rawUser) {
          try {
            const parsed = JSON.parse(rawUser);
            if (parsed?.token) {
              if (!cancelled) { setAuthToken(parsed.token); setHasAuth(true); return; }
            }
          } catch {}
        }
        const tok = (await AsyncStorage.getItem("token")) || (await AsyncStorage.getItem("authToken")) || (await AsyncStorage.getItem("auth"));
        if (tok) {
          if (!cancelled) { setAuthToken(tok); setHasAuth(true); return; }
        }
        if (!cancelled) setHasAuth(false);
      } catch (e) {
        if (__DEV__) console.warn("SceneBot: auth check failed", e);
        if (!cancelled) setHasAuth(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Keyboard height tracking
  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const s = Keyboard.addListener(showEvt, (e) => setKbHeight(e.endCoordinates?.height ?? 0));
    const h = Keyboard.addListener(hideEvt, () => setKbHeight(0));
    return () => { s.remove(); h.remove(); };
  }, []);

  const saveToStorage = async (arr) => {
    try {
      const withTime = arr.map((m) => ({ ...m, time: Date.now() }));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(withTime));
    } catch (e) {
      if (__DEV__) console.warn("SceneBot: save failed", e);
    }
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
    }, 12);
  };

  // callSceneBot wrapper with retries + backoff
  const callSceneBotWithRetries = async (prompt, lang, maxRetries = 2) => {
    let attempt = 0;
    let lastErr = null;
    while (attempt <= maxRetries) {
      try {
        const res = await callSceneBot(prompt, lang, authToken); // if your callSceneBot supports token param
        return res;
      } catch (err) {
        lastErr = err;
        attempt += 1;
        if (__DEV__) console.warn(`SceneBot request failed (attempt ${attempt})`, err?.message || err);
        if (attempt <= maxRetries) {
          await new Promise((r) => setTimeout(r, 800 * attempt));
          continue;
        }
        throw lastErr;
      }
    }
  };

  // Ask the bot. If attachMovie provided, embed poster+title in the SAME user bubble.
  const handleAsk = async (customPrompt, attachMovie = null) => {
    if (loading) return;

    // If auth check hasn't completed yet, wait a bit
    if (hasAuth === null) {
      // conservative: show sign-in hint while detecting
      setMessages((prev) => {
        const msg = { id: Date.now() + Math.random(), sender: "bot", text: "Checking session…" };
        return [...prev, msg];
      });
      // small delay to allow auth check to finish
      await new Promise((r) => setTimeout(r, 300));
    }

    // If there's no auth token, prompt to sign in (prevents reviewer seeing dev error)
    if (!hasAuth) {
      setMessages((prev) => {
        const next = [
          ...prev,
          {
            id: Date.now() + Math.random(),
            sender: "bot",
            text: "Please sign in to chat with SceneBot.",
          },
        ];
        saveToStorage(next);
        return next;
      });
      return;
    }

    const q =
      typeof customPrompt === "string"
        ? customPrompt
        : typeof customPrompt?.nativeEvent?.text === "string"
        ? customPrompt.nativeEvent.text
        : input;

    const question = String(q || "").trim();
    if (!question) return;

    const userMsg = {
      id: Date.now() + Math.random(),
      sender: "user",
      text: question,
      ...(attachMovie
        ? {
            movie: {
              id: attachMovie.id,
              poster: attachMovie.poster,
              title: attachMovie.title,
            },
          }
        : {}),
    };

    setMessages((prev) => {
      const next = [...prev, userMsg];
      saveToStorage(next);
      return next;
    });

    setLoading(true);
    setTyping(true);
    setInput("");

    if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    replyRef.current = "";
    indexRef.current = 0;

    try {
      const replyText = await callSceneBotWithRetries(question, botLang, 2);

      replyRef.current = replyText || "";

      setMessages((prev) => [...prev, { id: Date.now() + Math.random(), sender: "bot", text: "" }]);
      startTypewriter();
    } catch (err) {
      setLoading(false);
      setTyping(false);

      // User-facing friendly messages only
      let messageText = "SceneBot is temporarily unavailable. Please try again later.";

      // Keep dev details in console only (no dev strings shown to users/reviewers)
      if (__DEV__) {
        const devMsg = String(err?.message || err);
        console.warn("SceneBot error detail (dev-only):", devMsg);
        // Optionally show a slightly more specific hint in DEV builds
        messageText = `SceneBot is temporarily unavailable. (${devMsg})`;
      }

      const errMsgObj = { id: Date.now() + Math.random(), sender: "bot", text: messageText };
      setMessages((prev) => {
        const next = [...prev, errMsgObj];
        saveToStorage(next);
        return next;
      });
    }
  };

  const handleFunPrompt = async () => {
    const p = pickPrompt();
    if (!p) return;
    await handleAsk(p);
  };

  // Fire autoAsk ONLY after hydration completes (prevents overwrite race)
  const bootAskedRef = useRef(false);
  useEffect(() => {
    if (!hydrated || bootAskedRef.current) return;
    if (autoAsk) {
      bootAskedRef.current = true;
      if (movie) handleAsk(autoAsk, movie);
      else handleAsk(autoAsk);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, autoAsk, movie?.id, botLang]);

  useEffect(() => {
    return () => typeTimerRef.current && clearInterval(typeTimerRef.current);
  }, []);

  // Only auto-scroll when user is already at bottom
  useEffect(() => {
    if (!atBottom) return;
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 0);
    return () => clearTimeout(id);
  }, [messages.length, typing, atBottom]);

  // If user is not signed in, show helpful center UI instead of chat input - (optional)
  // Here we keep the current layout but block sending (we already block in handleAsk above).
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0e0e0e" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? tabBarHeight + insets.bottom : 0}
    >
      {/* Header with Back - only when opened from a Movie */}
      <View style={[styles.header, { paddingTop: 12 + insets.top }]}>
        {shouldShowBack ? (
          <TouchableOpacity
            onPress={handleBack}
            style={[
              styles.backBtn,
              isRTL ? { right: 12, left: "auto" } : { left: 12, right: "auto" },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36, height: 36 }} />
        )}

        <Text style={styles.headerText}>SceneBot 🎬</Text>

        <View style={{ width: 36, height: 36 }} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        keyboardShouldPersistTaps="handled"
        onScroll={(e) => {
          const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
          const nearBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 40;
          setAtBottom(nearBottom);
        }}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 16 + bottomOffset + INPUT_H }}
      >
        {messages.map((m) => {
          const isBot = m.sender === "bot";
          const side = { justifyContent: isBot ? "flex-end" : "flex-start" };
          const bubbleStyle = [styles.bubble, isBot ? styles.botBubble : styles.userBubble];
          const textColor = isBot ? "#fff" : "#000";

          return (
            <View key={m.id ?? Math.random()} style={[styles.bubbleWrapper, side]}>
              <View style={bubbleStyle}>
                {!!m.movie && !isBot && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Movie", { id: m.movie.id })}
                    activeOpacity={0.85}
                    style={{ alignItems: isRTL ? "flex-end" : "flex-start", marginBottom: m.text ? 8 : 0 }}
                  >
                    <Image source={{ uri: m.movie.poster }} style={styles.posterBubbleImage} resizeMode="cover" />
                    {!!m.movie.title && !!m.text && (
                      <Text
                        style={[
                          styles.bubbleText,
                          { color: textColor, marginTop: 8, textAlign: isRTL ? "right" : "left" },
                        ]}
                        numberOfLines={2}
                      >
                        {String(m.movie.title)}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                {!!m.text && (
                  <Text
                    style={[
                      styles.bubbleText,
                      { color: textColor, textAlign: isRTL ? "right" : "left" },
                    ]}
                  >
                    {String(m.text)}
                  </Text>
                )}
              </View>
            </View>
          );
        })}

        {typing && (
          <View style={[styles.bubbleWrapper, { justifyContent: "flex-end" }]}>
            <View style={styles.botBubble}>
              <Text style={{ color: "#aaa", fontStyle: "italic", fontSize: 13 }}>
                {t("SceneBot is typing…")}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Input Bar */}
      <View
        style={[
          styles.inputRow,
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: kbHeight > 0 ? kbHeight : tabBarHeight + insets.bottom,
            paddingBottom: 8,
            zIndex: 10,
          },
        ]}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleAsk}
          placeholder={t("ask_anything")}
          placeholderTextColor="#888"
          style={[
            styles.input,
            { textAlign: isRTL ? "right" : "left", writingDirection: isRTL ? "rtl" : "ltr" },
          ]}
          autoCorrect
          autoCapitalize="sentences"
          returnKeyType="send"
          editable={!loading && hasAuth !== false} // disable typing if known logged out
        />
        <TouchableOpacity onPress={() => handleAsk()} disabled={loading || hasAuth === false} style={{ paddingHorizontal: 6 }}>
          <Ionicons name="send" size={22} color={loading ? "#888" : "#fff"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleFunPrompt} disabled={loading || hasAuth === false} style={{ paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 20, color: loading ? "#888" : "#fff" }}>🎲</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexShrink: 0,
    backgroundColor: "#0e0e0e",
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    alignItems: "center",
  },
  headerText: { fontSize: 18, fontWeight: "600", color: "#fff" },

  backBtn: {
    position: "absolute",
    top: 50,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  messages: { flex: 1, padding: 12 },

  bubbleWrapper: { flexDirection: "row", marginTop: 8 },
  bubble: { padding: 10, borderRadius: 14, maxWidth: "78%", borderWidth: 1 },
  userBubble: { backgroundColor: "#fff", borderColor: "#fff" },
  botBubble: { backgroundColor: "#1a1a1a", borderColor: "#333" },
  bubbleText: { fontSize: 14.5, lineHeight: 20 },

  posterBubbleImage: {
    width: 140,
    height: 210,
    borderRadius: 10,
    backgroundColor: "#222",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingHorizontal: 13,
    borderTopWidth: 1,
    borderTopColor: "#222",
    backgroundColor: "#0e0e0e",
    height: INPUT_H,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#444",
    backgroundColor: "#2a2a2a",
    color: "#fff",
    fontSize: 15,
  },
});
