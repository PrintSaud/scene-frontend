// src/screens/SceneBotScreen.js
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
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
  Modal,
  Animated,
  Easing,
} from "react-native";
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight as useTabHeightRaw } from "@react-navigation/bottom-tabs";

import { callSceneBot } from "../../../shared/utils/callSceneBot";
import { funPrompts } from "../../../shared/utils/funPrompts";

import useTranslate from "../../../shared/utils/useTranslate";
import { useLanguage } from "../../../src/context/LanguageContext";

const INPUT_H = 58;
const SUGGESTIONS_H = 48;

const SAVED_MESSAGES_KEY =
  "scenebotSavedMessages:v1";

function getLocalDayKey() {
  const d = new Date();

  const year =
    d.getFullYear();

  const month =
    String(
      d.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      d.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

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

  const [
    savedMessages,
    setSavedMessages,
  ] = useState([]);

  const [
    savedOpen,
    setSavedOpen,
  ] = useState(false);

  const [hasAuth, setHasAuth] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  const scrollRef = useRef(null);
  const typeTimerRef = useRef(null);
const typingDotAnims =
    useRef([
      new Animated.Value(0.2),
      new Animated.Value(0.2),
      new Animated.Value(0.2),
    ]).current;
  const replyRef = useRef("");
  const indexRef = useRef(0);

  const route = useRoute();
  const navigation = useNavigation();

  const {
    movie,
    show,
    autoAsk,
  } = route.params || {};

  const attachedMedia =
    movie
      ? {
          type: "movie",
          id:
            movie.id ??
            movie.tmdbId ??
            movie.movieId,

          title:
            movie.title ||
            movie.originalTitle ||
            movie.original_title ||
            "Movie",

          poster:
            movie.posterOverride ||
            movie.poster ||
            (
              movie.posterPath
                ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
                : movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : ""
            ),
        }
      : show
      ? {
          type: "show",
          id:
            show.id ??
            show.tmdbId ??
            show.showTmdbId,

          title:
            show.nameEn ||
            show.nameAr ||
            show.name ||
            show.originalName ||
            show.original_name ||
            show.title ||
            "Show",

          poster:
            show.posterOverride ||
            show.poster ||
            (
              show.posterPath
                ? `https://image.tmdb.org/t/p/w500${show.posterPath}`
                : show.poster_path
                ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
                : ""
            ),
        }
      : null;

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

  /*
   * Each calendar day gets one unified SceneBot
   * thread regardless of where SceneBot was opened.
   */
  const STORAGE_KEY =
    `scenebotHistory:${language}:${getLocalDayKey()}`;

  /*
   * Migration fallback for conversations created
   * before this upgrade.
   */
  const LEGACY_STORAGE_KEY =
    `scenebotHistory:${language}`;

  const suggestionPrompts = (() => {
    if (
      attachedMedia?.type ===
      "movie"
    ) {
      return [
        t(
          "What makes {{title}} special?",
          {
            title:
              attachedMedia.title,
          }
        ),
        t(
          "Recommend movies like {{title}}",
          {
            title:
              attachedMedia.title,
          }
        ),
        t(
          "Tell me about the cast of {{title}}",
          {
            title:
              attachedMedia.title,
          }
        ),
        t(
          "Explain the ending of {{title}}",
          {
            title:
              attachedMedia.title,
          }
        ),
      ];
    }

    if (
      attachedMedia?.type ===
      "show"
    ) {
      return [
        t(
          "What makes {{title}} special?",
          {
            title:
              attachedMedia.title,
          }
        ),
        t(
          "Recommend shows like {{title}}",
          {
            title:
              attachedMedia.title,
          }
        ),
        t(
          "Tell me about the characters in {{title}}",
          {
            title:
              attachedMedia.title,
          }
        ),
        t(
          "What are the best episodes of {{title}}?",
          {
            title:
              attachedMedia.title,
          }
        ),
      ];
    }

    const list =
      funPrompts[botLang] ||
      funPrompts.english ||
      [];

    return list
      .slice(
        0,
        6
      )
      .map(
        (prompt) =>
          t(prompt)
      );
  })();

  const pickPrompt = () => {
    const list = funPrompts[botLang] || funPrompts.english || [];
    if (!list.length) return "";
    return list[Math.floor(Math.random() * list.length)];
  };

  const shouldShowBack =
    Boolean(attachedMedia);

  const handleBack = () => {
    if (
      navigation.canGoBack &&
      navigation.canGoBack()
    ) {
      navigation.goBack();
      return;
    }

    if (
      attachedMedia?.type ===
      "movie"
    ) {
      navigation.navigate("Movie", {
        id: attachedMedia.id,
        /* SceneBot cleanup overrides */

  botBubble: {
    alignSelf: "stretch",
    maxWidth: "100%",
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderColor: "transparent",
    borderRadius: 0,
    marginTop: 2,
  },

  botBubbleText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 17,
    lineHeight: 28,
  },

  thinkingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 0,
    paddingVertical: 4,
  },

  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minWidth: 30,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.58)",
  },

  thinkingText: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 13,
    fontWeight: "600",
  },
});

      return;
    }

    if (
      attachedMedia?.type ===
      "show"
    ) {
      navigation.navigate("Show", {
        id: attachedMedia.id,
        showTmdbId:
          attachedMedia.id,
      });

      return;
    }

    navigation.navigate("Home");
  };

  const hydrateHistory =
    useCallback(
      async () => {
        try {
          let saved =
            await AsyncStorage.getItem(
              STORAGE_KEY
            );

          /*
           * One-time migration from the previous
           * rolling history storage.
           */
          if (!saved) {
            const legacy =
              await AsyncStorage.getItem(
                LEGACY_STORAGE_KEY
              );

            if (legacy) {
              saved = legacy;

              await AsyncStorage.setItem(
                STORAGE_KEY,
                legacy
              );
            }
          }

          if (saved) {
            const parsed =
              JSON.parse(saved);

            setMessages(
              Array.isArray(parsed)
                ? parsed
                : []
            );
          } else {
            setMessages([]);
          }
        } catch (e) {
          if (__DEV__) {
            console.warn(
              "SceneBot: load history failed",
              e
            );
          }
        } finally {
          setHydrated(true);
        }
      },
      [
        STORAGE_KEY,
        LEGACY_STORAGE_KEY,
      ]
    );

  useEffect(() => {
    hydrateHistory();

    return () => {
      if (
        typeTimerRef.current
      ) {
        clearInterval(
          typeTimerRef.current
        );
      }
    };
  }, [
    hydrateHistory,
  ]);

  /*
   * IMPORTANT:
   *
   * SceneBot inside MainTabs and SceneBot opened
   * from a Movie/Show screen can exist as two
   * mounted screen instances.
   *
   * Rehydrate whenever this screen gets focus so
   * both always display the same today's thread.
   */
  useFocusEffect(
    useCallback(() => {
      if (hydrated) {
        hydrateHistory();
      }

      return undefined;
    }, [
      hydrated,
      hydrateHistory,
    ])
  );

  /*
   * Saved messages live forever until explicitly
   * removed by the user.
   */
  useEffect(() => {
    let cancelled =
      false;

    (async () => {
      try {
        const raw =
          await AsyncStorage.getItem(
            SAVED_MESSAGES_KEY
          );

        if (
          raw &&
          !cancelled
        ) {
          const parsed =
            JSON.parse(raw);

          setSavedMessages(
            Array.isArray(parsed)
              ? parsed
              : []
          );
        }
      } catch (e) {
        if (__DEV__) {
          console.warn(
            "SceneBot: saved messages load failed",
            e
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  useEffect(() => {
    const loops =
      typingDotAnims.map(
        (anim, index) =>
          Animated.loop(
            Animated.sequence([
              Animated.delay(
                index * 180
              ),
              Animated.timing(
                anim,
                {
                  toValue: 1,
                  duration: 260,
                  easing:
                    Easing.inOut(
                      Easing.ease
                    ),
                  useNativeDriver: true,
                }
              ),
              Animated.timing(
                anim,
                {
                  toValue: 0.2,
                  duration: 260,
                  easing:
                    Easing.inOut(
                      Easing.ease
                    ),
                  useNativeDriver: true,
                }
              ),
              Animated.delay(180),
            ])
          )
      );

    if (typing) {
      loops.forEach(
        (loop) =>
          loop.start()
      );
    } else {
      typingDotAnims.forEach(
        (anim) =>
          anim.setValue(0.2)
      );
    }

    return () => {
      loops.forEach(
        (loop) => {
          if (
            typeof loop.stop ===
            "function"
          ) {
            loop.stop();
          }
        }
      );

      typingDotAnims.forEach(
        (anim) =>
          anim.setValue(0.2)
      );
    };
  }, [
    typing,
    typingDotAnims,
  ]);
  const saveToStorage =
    async (arr) => {
      try {
        const now =
          Date.now();

        const withTime =
          arr.map(
            (m) => ({
              ...m,

              /*
               * Keep the original message time
               * instead of rewriting every message
               * whenever a new one is sent.
               */
              time:
                m?.time ||
                now,
            })
          );

        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            withTime
          )
        );
      } catch (e) {
        if (__DEV__) {
          console.warn(
            "SceneBot: save failed",
            e
          );
        }
      }
    };

  const saveSavedMessages =
    async (arr) => {
      try {
        await AsyncStorage.setItem(
          SAVED_MESSAGES_KEY,
          JSON.stringify(arr)
        );
      } catch (e) {
        if (__DEV__) {
          console.warn(
            "SceneBot: saved messages write failed",
            e
          );
        }
      }
    };

  const isMessageSaved =
    (message) =>
      savedMessages.some(
        (item) =>
          String(
            item.sourceMessageId
          ) ===
          String(
            message?.id
          )
      );

  const toggleSavedMessage =
    (message) => {
      if (
        !message ||
        message.sender !==
          "bot" ||
        !String(
          message.text || ""
        ).trim()
      ) {
        return;
      }

      setSavedMessages(
        (current) => {
          const exists =
            current.some(
              (item) =>
                String(
                  item.sourceMessageId
                ) ===
                String(
                  message.id
                )
            );

          const next =
            exists
              ? current.filter(
                  (item) =>
                    String(
                      item.sourceMessageId
                    ) !==
                    String(
                      message.id
                    )
                )
              : [
                  {
                    id:
                      Date.now() +
                      Math.random(),

                    sourceMessageId:
                      message.id,

                    text:
                      String(
                        message.text
                      ),

                    savedAt:
                      Date.now(),
                  },

                  ...current,
                ];

          saveSavedMessages(
            next
          );

          return next;
        }
      );
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

  const callSceneBotWithRetries =
    async (
      prompt,
      lang,
      maxRetries = 1
    ) => {
      let attempt = 0;
      let lastErr = null;

      while (
        attempt <=
        maxRetries
      ) {
        try {
          return await callSceneBot(
            prompt,
            lang,
            authToken
          );
        } catch (err) {
          lastErr = err;
          attempt += 1;

          const code =
            err?.code ||
            err?.inner?.code ||
            null;

          const status =
            err?.status ||
            err?.inner?.status ||
            null;

          const message =
            String(
              err?.message ||
              ""
            ).toLowerCase();

          const underlyingMessage =
            String(
              err?.inner?.message ||
              err?.inner?.inner?.message ||
              ""
            ).toLowerCase();

          const isTimeout =
            code ===
              "TIMEOUT" ||
            message.includes(
              "timeout"
            ) ||
            underlyingMessage.includes(
              "timeout"
            );

          const isAuthError =
            code ===
              "UNAUTHORIZED" ||
            status ===
              401 ||
            status ===
              403;

          /*
           * Never retry a timeout.
           *
           * If web search already took ~60s,
           * immediately firing the same expensive
           * request again only creates a worse demo
           * experience.
           */
          if (
            isTimeout ||
            isAuthError
          ) {
            throw err;
          }

          if (__DEV__) {
            console.warn(
              `SceneBot request failed (attempt ${attempt})`,
              {
                message:
                  err?.message ||
                  null,

                underlying:
                  err?.inner
                    ?.message ||
                  err?.inner
                    ?.inner
                    ?.message ||
                  null,

                code,

                status,
              }
            );
          }

          if (
            attempt <=
            maxRetries
          ) {
            /*
             * One retry only, with a short delay.
             */
            await new Promise(
              (resolve) =>
                setTimeout(
                  resolve,
                  1000
                )
            );

            continue;
          }

          throw lastErr;
        }
      }

      throw lastErr;
    };

  const handleAsk = async (
    customPrompt,
    mediaAttachment = null
  ) => {
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
      id:
        Date.now() +
        Math.random(),

      sender: "user",
      text: question,
      time: Date.now(),

      ...(mediaAttachment
        ? {
            media: {
              type:
                mediaAttachment.type ||
                "movie",

              id:
                mediaAttachment.id,

              poster:
                mediaAttachment.poster ||
                "",

              title:
                mediaAttachment.title ||
                "",
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
      time: Date.now(),
      isTypingBubble: true,
    };

    setMessages((prev) => [...prev, botTypingMsg]);

    try {
      const replyText =
        await callSceneBotWithRetries(
          question,
          botLang,
          1
        );

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
        const detail = {
          message:
            err?.message ||
            null,

          underlying:
            err?.inner?.message ||
            err?.inner?.inner?.message ||
            null,

          code:
            err?.code ||
            err?.inner?.code ||
            null,

          status:
            err?.status ||
            err?.inner?.status ||
            null,
        };

        console.warn(
          "SceneBot error detail (dev-only):",
          detail
        );

        /*
         * Keep the user-facing message clean.
         * Error details belong only in the dev log.
         */
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

      if (attachedMedia) {
        handleAsk(
          autoAsk,
          attachedMedia
        );
      } else {
        handleAsk(autoAsk);
      }
    }
  }, [
    hydrated,
    autoAsk,
    attachedMedia?.type,
    attachedMedia?.id,
    botLang,
  ]);

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

        <TouchableOpacity
          onPress={() =>
            setSavedOpen(true)
          }
          style={[
            styles.savedHeaderBtn,
            {
              /*
               * Keep the button on the exact
               * same vertical level as SceneBot.
               */
              bottom: 16,

              /*
               * Avoid overlapping the RTL back
               * button when opened from media.
               */
              right:
                shouldShowBack &&
                isRTL
                  ? 60
                  : 16,
            },
          ]}
          hitSlop={{
            top: 12,
            bottom: 12,
            left: 12,
            right: 12,
          }}
          activeOpacity={0.75}
        >
          <Ionicons
            name="bookmark-outline"
            size={20}
            color="#fff"
          />

          {savedMessages.length >
            0 && (
            <View
              style={
                styles.savedCountBadge
              }
            >
              <Text
                style={
                  styles.savedCountText
                }
              >
                {savedMessages.length >
                99
                  ? "99+"
                  : savedMessages.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

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
          paddingBottom:
            30 +
            bottomOffset +
            INPUT_H +
            SUGGESTIONS_H,
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
                {!!(
                  m.media ||
                  m.movie
                ) &&
                  !isBot && (() => {
                    /*
                     * m.movie fallback keeps older
                     * saved conversations working.
                     */
                    const media =
                      m.media ||
                      {
                        ...m.movie,
                        type: "movie",
                      };

                    const openMedia = () => {
                      if (
                        media.type ===
                        "show"
                      ) {
                        navigation.navigate(
                          "Show",
                          {
                            id: media.id,
                            showTmdbId:
                              media.id,
                          }
                        );

                        return;
                      }

                      navigation.navigate(
                        "Movie",
                        {
                          id: media.id,
                        }
                      );
                    };

                    return (
                      <TouchableOpacity
                        onPress={openMedia}
                        activeOpacity={0.85}
                        style={{
                          alignItems:
                            isRTL
                              ? "flex-end"
                              : "flex-start",

                          marginBottom:
                            m.text
                              ? 8
                              : 0,
                        }}
                      >
                        {!!media.poster && (
                          <Image
                            source={{
                              uri:
                                media.poster,
                            }}
                            style={
                              styles.posterBubbleImage
                            }
                            resizeMode="cover"
                          />
                        )}

                        {!!media.title &&
                          !!m.text && (
                          <Text
                            style={[
                              styles.bubbleText,
                              styles.userBubbleText,
                              {
                                marginTop:
                                  media.poster
                                    ? 8
                                    : 0,

                                textAlign:
                                  isRTL
                                    ? "right"
                                    : "left",
                              },
                            ]}
                            numberOfLines={2}
                          >
                            {String(
                              media.title
                            )}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })()}

                {showTypingDots ? (
                  <View style={styles.thinkingWrap}>
                    <View style={styles.typingDots}>
                      <Animated.View
                        style={[
                          styles.dot,
                          {
                            opacity:
                              typingDotAnims[0],
                          },
                        ]}
                      />
                      <Animated.View
                        style={[
                          styles.dot,
                          {
                            opacity:
                              typingDotAnims[1],
                          },
                        ]}
                      />
                      <Animated.View
                        style={[
                          styles.dot,
                          {
                            opacity:
                              typingDotAnims[2],
                          },
                        ]}
                      />
                    </View>

                    <Text style={styles.thinkingText}>
                      {t("Thinking...")}
                    </Text>
                  </View>
                ) : (
                  !!m.text && (
                    <Text
                      style={[
                        styles.bubbleText,
                        isBot ? styles.botBubbleText : styles.userBubbleText,
                        {
                          textAlign:
                            isRTL
                              ? "right"
                              : "left",
                          writingDirection:
                            isRTL
                              ? "rtl"
                              : "ltr",
                        },
                      ]}
                    >
                      {String(m.text)}
                    </Text>
                  )
                )}

                {isBot &&
                  !!m.text &&
                  !m.isTypingBubble && (
                    <TouchableOpacity
                      onPress={() =>
                        toggleSavedMessage(
                          m
                        )
                      }
                      style={
                        styles.saveMessageBtn
                      }
                      hitSlop={{
                        top: 8,
                        bottom: 8,
                        left: 8,
                        right: 8,
                      }}
                      activeOpacity={
                        0.7
                      }
                    >
                      <Ionicons
                        name={
                          isMessageSaved(
                            m
                          )
                            ? "bookmark"
                            : "bookmark-outline"
                        }
                        size={15}
                        color={
                          isMessageSaved(
                            m
                          )
                            ? "#B327F6"
                            : "#8d8d8d"
                        }
                      />
                    </TouchableOpacity>
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
        {!!suggestionPrompts.length && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={
              styles.suggestionsContent
            }
            style={
              styles.suggestionsScroll
            }
          >
            {suggestionPrompts.map(
              (
                prompt,
                index
              ) => (
                <TouchableOpacity
                  key={`${prompt}-${index}`}
                  onPress={() =>
                    handleAsk(
                      prompt
                    )
                  }
                  disabled={
                    loading ||
                    hasAuth ===
                      false
                  }
                  style={[
                    styles.suggestionChip,

                    (loading ||
                      hasAuth ===
                        false) &&
                      styles.suggestionChipDisabled,
                  ]}
                  activeOpacity={
                    0.78
                  }
                >
                  <Text
                    numberOfLines={
                      1
                    }
                    style={
                      styles.suggestionText
                    }
                  >
                    {prompt}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        )}

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

      <Modal
        visible={
          savedOpen
        }
        animationType="slide"
        transparent
        onRequestClose={() =>
          setSavedOpen(false)
        }
      >
        <View
          style={
            styles.savedModalBackdrop
          }
        >
          <View
            style={[
              styles.savedModalSheet,
              {
                paddingBottom:
                  Math.max(
                    insets.bottom,
                    16
                  ),
              },
            ]}
          >
            <View
              style={
                styles.savedModalHeader
              }
            >
              <View
                style={{
                  flex: 1,
                  paddingRight: 12,
                }}
              >
                <Text
                  style={
                    styles.savedModalTitle
                  }
                >
                  {t(
                    "Saved Messages"
                  )}
                </Text>

                <Text
                  style={
                    styles.savedModalSubtitle
                  }
                >
                  {t(
                    "SceneBot answers you want to keep."
                  )}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  setSavedOpen(
                    false
                  )
                }
                style={
                  styles.savedModalClose
                }
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.savedListContent
              }
            >
              {savedMessages.length ===
              0 ? (
                <View
                  style={
                    styles.savedEmpty
                  }
                >
                  <Ionicons
                    name="bookmark-outline"
                    size={34}
                    color="#777"
                  />

                  <Text
                    style={
                      styles.savedEmptyTitle
                    }
                  >
                    {t(
                      "No saved messages yet"
                    )}
                  </Text>

                  <Text
                    style={
                      styles.savedEmptyText
                    }
                  >
                    {t(
                      "Tap the bookmark on any SceneBot answer."
                    )}
                  </Text>
                </View>
              ) : (
                savedMessages.map(
                  (item) => (
                    <View
                      key={
                        item.id
                      }
                      style={
                        styles.savedCard
                      }
                    >
                      <Text
                        style={[
                          styles.savedCardText,
                          {
                            textAlign:
                              isRTL
                                ? "right"
                                : "left",
                          },
                        ]}
                      >
                        {
                          item.text
                        }
                      </Text>

                      <TouchableOpacity
                        onPress={() => {
                          const next =
                            savedMessages.filter(
                              (
                                saved
                              ) =>
                                saved.id !==
                                item.id
                            );

                          setSavedMessages(
                            next
                          );

                          saveSavedMessages(
                            next
                          );
                        }}
                        style={
                          styles.savedDeleteBtn
                        }
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#9a9a9a"
                        />
                      </TouchableOpacity>
                    </View>
                  )
                )
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    height: 26,
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
  },

  thinkingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 2,
    paddingVertical: 3,
  },

  thinkingText: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 12,
    fontWeight: "600",
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.45)",
  },

  savedHeaderBtn: {
    position: "absolute",

    width: 38,
    height: 38,

    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
      "rgba(255,255,255,0.07)",

    borderWidth: 0.5,
    borderColor:
      "rgba(255,255,255,0.13)",

    zIndex: 60,
  },

  savedCountBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "#B327F6",
    borderWidth: 2,
    borderColor:
      "#000",
  },

  savedCountText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "900",
  },

  saveMessageBtn: {
    marginTop: 2,
    alignSelf: "flex-end",
    width: 26,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor:
      "rgba(255,255,255,0.04)",
  },

  suggestionsScroll: {
    width: "100%",
    marginBottom: 8,
    flexGrow: 0,
  },

  suggestionsContent: {
    paddingHorizontal: 2,
    gap: 7,
  },

  suggestionChip: {
    height: 34,
    maxWidth: 230,
    paddingHorizontal: 13,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.075)",
    borderWidth: 0.5,
    borderColor:
      "rgba(255,255,255,0.14)",
  },

  suggestionChipDisabled: {
    opacity: 0.4,
  },

  suggestionText: {
    color:
      "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "600",
  },

  savedModalBackdrop: {
    flex: 1,
    justifyContent:
      "flex-end",
    backgroundColor:
      "rgba(0,0,0,0.68)",
  },

  savedModalSheet: {
    maxHeight: "78%",
    minHeight: "44%",
    paddingTop: 8,
    paddingHorizontal: 16,
    backgroundColor:
      "#0b0b0b",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.10)",
  },

  savedModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    paddingTop: 14,
    paddingBottom: 14,
  },

  savedModalTitle: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "900",
  },

  savedModalSubtitle: {
    marginTop: 4,
    color: "#777",
    fontSize: 12,
  },

  savedModalClose: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.07)",
  },

  savedListContent: {
    paddingBottom: 30,
  },

  savedCard: {
    position: "relative",
    marginBottom: 10,
    padding: 14,
    paddingRight: 42,
    borderRadius: 18,
    backgroundColor:
      "rgba(255,255,255,0.065)",
    borderWidth: 0.5,
    borderColor:
      "rgba(255,255,255,0.11)",
  },

  savedCardText: {
    color:
      "rgba(255,255,255,0.88)",
    fontSize: 14,
    lineHeight: 21,
  },

  savedDeleteBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  savedEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 70,
    paddingHorizontal: 24,
  },

  savedEmptyTitle: {
    marginTop: 12,
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },

  savedEmptyText: {
    marginTop: 6,
    color: "#777",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
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
    fontSize: 12,
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

