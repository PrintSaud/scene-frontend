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

import { callSceneBot } from "../../../shared/utils/callSceneBot";
import { funPrompts } from "../../../shared/utils/funPrompts";

import useTranslate from "../../../shared/utils/useTranslate";
import { useLanguage } from "../../../src/context/LanguageContext";

const INPUT_H = 58;

function useSafeTabBarHeight() {
  try {
    return useTabHeightRaw();
  } catch {
    return 0;
  }
}

export default function SceneBotScreen() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);

  const [hasAuth, setHasAuth] = useState(null);
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

  const inputBottom =
  kbHeight > 0
    ? kbHeight + 4
    : Math.max(tabBarHeight + insets.bottom - 2, 10);

 //   const inputBottom =
//  kbHeight > 0
  //  ? kbHeight + 4
   // : Math.max(tabBarHeight + insets.bottom + 14, 10);

  const bottomOffset = inputBottom;

  const STORAGE_KEY = `scenebotHistory:${language}`;

  const pickPrompt = () => {
    const list = funPrompts[botLang] || funPrompts.english || [];
    if (!list.length) return "";
    return list[Math.floor(Math.random() * list.length)];
  };

  const shouldShowBack = !!movie;

  const handleBack = () => {
    if (movie) {
      if (navigation.canGoBack && navigation.canGoBack()) navigation.goBack();
      else navigation.navigate("Movie", { id: movie.id });
      return;
    }

    navigation.navigate("Home");
  };

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
            if (isFresh) {
              setMessages(parsed.map((m) => ({ ...m, time: undefined })));
            } else {
              await AsyncStorage.removeItem(STORAGE_KEY);
            }
          }
        }
      } catch (e) {
        if (__DEV__) console.warn("SceneBot: load history failed", e);
      }

      if (!cancelled) setHydrated(true);
    })();

    return () => {
      cancelled = true;
      if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    };
  }, [STORAGE_KEY]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const rawUser = await AsyncStorage.getItem("user");

        if (rawUser) {
          try {
            const parsed = JSON.parse(rawUser);

            if (parsed?.token) {
              if (!cancelled) {
                setAuthToken(parsed.token);
                setHasAuth(true);
              }
              return;
            }
          } catch {}
        }

        const tok =
          (await AsyncStorage.getItem("token")) ||
          (await AsyncStorage.getItem("authToken")) ||
          (await AsyncStorage.getItem("auth"));

        if (tok) {
          if (!cancelled) {
            setAuthToken(tok);
            setHasAuth(true);
          }
          return;
        }

        if (!cancelled) setHasAuth(false);
      } catch (e) {
        if (__DEV__) console.warn("SceneBot: auth check failed", e);
        if (!cancelled) setHasAuth(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const s = Keyboard.addListener(showEvt, (e) => {
      setKbHeight(e.endCoordinates?.height ?? 0);
    });

    const h = Keyboard.addListener(hideEvt, () => {
      setKbHeight(0);
    });

    return () => {
      s.remove();
      h.remove();
    };
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
    const s = String(text || "").trim();
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

          if (last?.sender === "bot") {
            last.text = dedupeTail(last.text);
            last.isTypingBubble = false;
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
          last.text = full.slice(0, i + 1);
          last.isTypingBubble = false;
        }

        return copy;
      });

      indexRef.current = i + 1;
    }, 12);
  };

  const callSceneBotWithRetries = async (prompt, lang, maxRetries = 2) => {
    let attempt = 0;
    let lastErr = null;

    while (attempt <= maxRetries) {
      try {
        const res = await callSceneBot(prompt, lang, authToken);
        return res;
      } catch (err) {
        lastErr = err;
        attempt += 1;

        if (__DEV__) {
          console.warn(
            `SceneBot request failed (attempt ${attempt})`,
            err?.message || err
          );
        }

        if (attempt <= maxRetries) {
          await new Promise((r) => setTimeout(r, 800 * attempt));
          continue;
        }

        throw lastErr;
      }
    }

    throw lastErr;
  };

  const handleAsk = async (customPrompt, attachMovie = null) => {
    if (loading) return;

    if (hasAuth === null) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          sender: "bot",
          text: "Checking session…",
        },
      ]);

      await new Promise((r) => setTimeout(r, 300));
    }

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

    const botTypingMsg = {
      id: Date.now() + Math.random(),
      sender: "bot",
      text: "",
      isTypingBubble: true,
    };

    setMessages((prev) => [...prev, botTypingMsg]);

    try {
      const replyText = await callSceneBotWithRetries(question, botLang, 2);

      replyRef.current = String(replyText || "");

      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];

        if (last?.sender === "bot") {
          last.text = "";
          last.isTypingBubble = false;
        }

        return copy;
      });

      startTypewriter();
    } catch (err) {
      setLoading(false);
      setTyping(false);

      let messageText = "SceneBot is temporarily unavailable. Please try again later.";

      if (__DEV__) {
        const devMsg = String(err?.message || err);
        console.warn("SceneBot error detail (dev-only):", devMsg);
        messageText = `SceneBot is temporarily unavailable. (${devMsg})`;
      }

      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];

        if (last?.sender === "bot" && !last.text) {
          last.text = messageText;
          last.isTypingBubble = false;
          saveToStorage(copy);
          return copy;
        }

        const next = [
          ...prev,
          {
            id: Date.now() + Math.random(),
            sender: "bot",
            text: messageText,
            isTypingBubble: false,
          },
        ];

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

  const bootAskedRef = useRef(false);

  useEffect(() => {
    if (!hydrated || bootAskedRef.current) return;

    if (autoAsk) {
      bootAskedRef.current = true;

      if (movie) handleAsk(autoAsk, movie);
      else handleAsk(autoAsk);
    }
  }, [hydrated, autoAsk, movie?.id, botLang]);

  useEffect(() => {
    return () => {
      if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!atBottom) return;

    const id = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 0);

    return () => clearTimeout(id);
  }, [messages.length, typing, atBottom]);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 30 }]}>
        <View style={styles.headerBorder} />

        {shouldShowBack && (
          <TouchableOpacity
            onPress={handleBack}
            style={[
              styles.backBtn,
              {
                top: insets.top + 14,
              },
              isRTL ? { right: 16, left: "auto" } : { left: 16, right: "auto" },
            ]}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            activeOpacity={0.75}
          >
            <Ionicons
              name={isRTL ? "chevron-forward" : "chevron-back"}
              size={21}
              color="rgba(255,255,255,0.88)"
            />
          </TouchableOpacity>
        )}

        <View pointerEvents="none" style={styles.headerCenterAbsolute}>
          <View style={styles.headerCenter}>
            <View style={styles.headerIconWrap}>
              <Text style={styles.headerIcon}>🎬</Text>
            </View>

            <Text style={styles.headerText}>SceneBot</Text>
            <View style={styles.headerLiveDot} />
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
          const nearBottom =
            contentOffset.y + layoutMeasurement.height >= contentSize.height - 40;

          setAtBottom(nearBottom);
        }}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingBottom: 30 + bottomOffset + INPUT_H,
          paddingTop: 8,
        }}
      >
        {messages.map((m) => {
          const isBot = m.sender === "bot";
          const showTypingDots = isBot && typing && m.isTypingBubble && !m.text;

          return (
            <View
              key={m.id}
              style={[
                styles.bubbleWrapper,
                isBot ? styles.bubbleWrapperBot : styles.bubbleWrapperUser,
              ]}
            >
              {isBot && (
                <View style={styles.botAvatar}>
                  <Text style={styles.botAvatarIcon}>🎬</Text>
                </View>
              )}

              <View style={[styles.bubble, isBot ? styles.botBubble : styles.userBubble]}>
                {!!m.movie && !isBot && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Movie", { id: m.movie.id })}
                    activeOpacity={0.85}
                    style={{
                      alignItems: isRTL ? "flex-end" : "flex-start",
                      marginBottom: m.text ? 8 : 0,
                    }}
                  >
                    <Image
                      source={{ uri: m.movie.poster }}
                      style={styles.posterBubbleImage}
                      resizeMode="cover"
                    />

                    {!!m.movie.title && !!m.text && (
                      <Text
                        style={[
                          styles.bubbleText,
                          styles.userBubbleText,
                          {
                            marginTop: 8,
                            textAlign: isRTL ? "right" : "left",
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {String(m.movie.title)}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                {showTypingDots ? (
                  <View style={styles.typingDots}>
                    <View style={[styles.dot, { opacity: 1 }]} />
                    <View style={[styles.dot, { opacity: 0.6 }]} />
                    <View style={[styles.dot, { opacity: 0.3 }]} />
                  </View>
                ) : (
                  !!m.text && (
                    <Text
                      style={[
                        styles.bubbleText,
                        isBot ? styles.botBubbleText : styles.userBubbleText,
                        { textAlign: isRTL ? "right" : "left" },
                      ]}
                    >
                      {String(m.text)}
                    </Text>
                  )
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View
        style={[
          styles.inputRow,
          {
            bottom: inputBottom,
          },
        ]}
      >
        <View style={styles.glassInputWrap}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleAsk()}
            placeholder={t("ask_anything")}
            placeholderTextColor="rgba(255,255,255,0.32)"
            style={[
              styles.input,
              {
                textAlign: isRTL ? "right" : "left",
                writingDirection: isRTL ? "rtl" : "ltr",
              },
            ]}
            autoCorrect
            autoCapitalize="sentences"
            returnKeyType="send"
            editable={!loading && hasAuth !== false}
          />

          <TouchableOpacity
            onPress={handleFunPrompt}
            disabled={loading || hasAuth === false}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.diceText,
                (loading || hasAuth === false) && { opacity: 0.3 },
              ]}
            >
              🎲
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleAsk()}
            disabled={!input.trim() || loading || hasAuth === false}
            style={[
              styles.sendBtn,
              (!input.trim() || loading || hasAuth === false) && styles.sendBtnDisabled,
            ]}
            activeOpacity={0.78}
          >
            <Ionicons name="arrow-up" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
  },

  header: {
    flexShrink: 0,
    backgroundColor: "#000000",
    paddingHorizontal: 16,
    paddingBottom: 18,
    minHeight: 118,
    justifyContent: "flex-end",
    zIndex: 20,
  },
  
  headerBorder: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  
  headerCenterAbsolute: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 21,
  },
  
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },


  headerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerIcon: {
    fontSize: 17,
  },

  headerText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.25,
  },

  headerLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ade80",
    marginLeft: 2,
  },

  backBtn: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 12,

    borderWidth: 0.5,

    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },

  messages: {
    flex: 1,
    paddingHorizontal: 14,
  },

  bubbleWrapper: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "flex-end",
  },

  bubbleWrapperBot: {
    justifyContent: "flex-start",
  },

  bubbleWrapperUser: {
    justifyContent: "flex-end",
  },

  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginBottom: 2,
    flexShrink: 0,
  },

  botAvatarIcon: {
    fontSize: 13,
  },

  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 18,
    maxWidth: "78%",
  },

  botBubble: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.11)",
    borderBottomLeftRadius: 4,
  },

  botBubbleText: {
    color: "rgba(255,255,255,0.87)",
  },

  userBubble: {
    backgroundColor: "rgba(124,58,237,0.72)",
    borderWidth: 0.5,
    borderColor: "rgba(167,139,250,0.35)",
    borderBottomRightRadius: 4,
  },

  userBubbleText: {
    color: "#fff",
  },

  bubbleText: {
    fontSize: 14.5,
    lineHeight: 21,
  },

  posterBubbleImage: {
    width: 140,
    height: 210,
    borderRadius: 10,
    backgroundColor: "#222",
  },

  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 2,
    paddingVertical: 4,
    minWidth: 42,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.45)",
  },

  inputRow: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: "transparent",
    zIndex: 30,
    bottom: 118,
  },

  glassInputWrap: {
    height: INPUT_H,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.18)",
    paddingLeft: 18,
    paddingRight: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  input: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    paddingVertical: 7,
    paddingRight: 8,
    minHeight: 36,
  },

  iconBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  diceText: {
    fontSize: 18,
  },

  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(124,58,237,0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },

  sendBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.09)",
  },
});

