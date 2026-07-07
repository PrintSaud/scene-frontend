// src/screens/HomeScreen.js

import React, { useEffect, useMemo, useState, useRef } from "react";

import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  FlatList,
  Animated,
  Linking,
  Alert,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { formatDistanceToNowStrict } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import api from "../../../shared/api/api";
import useTranslate from "../../../shared/utils/useTranslate";
import { useLanguage } from "../../../shared/context/LanguageContext";
import {
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import dayjs from "dayjs";
import { dailyMoviePool, specialDays } from "../data/dailyMoviePool";
import StarRating from "../components/StarRating";

const formatTimestamp = (date, isArabic = false) => {
  if (!date) return "";
  return formatDistanceToNowStrict(new Date(date), {
    addSuffix: true,
    locale: isArabic ? arLocale : undefined,
  });
};


const { width } = Dimensions.get("window");
const isTablet = width >= 768;
const PUSH_PROMPT_DISMISSED_KEY = "scene:pushPromptDismissed:v1";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || "";
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "";

const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";
const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";
const screenWidth = Dimensions.get("window").width;
const DAILY_CACHE_KEY = "dailyMovie:v2";

const GAP = 12;
const SIDE = 14;
const COLS = 2;
const ITEM_W = Math.floor((screenWidth - SIDE * 2 - GAP * (COLS - 1)) / COLS);
const FEED_COLS = isTablet ? 4 : 3;
const FEED_GAP = 8;
const FEED_SIDE = 10;
const FEED_ITEM_W = Math.floor(
  (screenWidth - FEED_SIDE * 2 - FEED_GAP * (FEED_COLS - 1)) / FEED_COLS
);

const TRENDING_COLS = isTablet ? 6 : 2;
const TRENDING_GAP = 12;
const TRENDING_SIDE = 6;
const TRENDING_ITEM_W = Math.floor(
  (screenWidth - TRENDING_SIDE * 2 - TRENDING_GAP * (TRENDING_COLS - 1)) /
    TRENDING_COLS
);

export default function HomeScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const t = useTranslate();
  const { language } = useLanguage();
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [pushRegistering, setPushRegistering] = useState(false);
  const [user, setUser] = useState(null);
  const [feedLogs, setFeedLogs] = useState([]);
  const [movies, setMovies] = useState([]);
  const [dailyMovie, setDailyMovie] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [homeBanners, setHomeBanners] = useState([]);

  const dotWidths = useRef(
    [0, 1, 2].map((idx) => new Animated.Value(currentSection === idx ? 100 : 30))
  ).current;

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        setUser(stored ? JSON.parse(stored) : null);
      } catch {
        setUser(null);
      }
    })();
  }, [isFocused]);

  useEffect(() => {
    if (!user?.token) return;
  
    let mounted = true;
  
    const checkPushPrompt = async () => {
      try {
        const dismissed = await AsyncStorage.getItem(PUSH_PROMPT_DISMISSED_KEY);
  
        if (mounted && dismissed !== "true") {
          setShowPushPrompt(true);
        }
      } catch (err) {
        console.log("⚠️ Failed to check push prompt:", err?.message || err);
      }
    };
  
    checkPushPrompt();
  
    return () => {
      mounted = false;
    };
  }, [user?.token]);

  useEffect(() => {
    dotWidths.forEach((anim, idx) => {
      Animated.timing(anim, {
        toValue: currentSection === idx ? 150 : 30,
        duration: 120,
        useNativeDriver: false,
      }).start();
    });
  }, [currentSection, dotWidths]);



  useEffect(() => {
    fetchHomeBanners();
  }, []);

  const fetchHomeBanners = async () => {
    try {
      const res = await api.get("/api/banners/home");
      console.log("🔥 BANNERS:", res.data);
      setHomeBanners(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("❌ Failed to fetch home banners:", err);
      setHomeBanners([]);
    }
  };

  const handleBannerPress = async (banner) => {
    try {
      if (!banner) return;
  
      const actionType = String(banner.actionType || "none");
      const actionValue = String(banner.actionValue || "").trim();
  
      if (!actionValue || actionType === "none") return;
  
      if (actionType === "url") {
        const canOpen = await Linking.canOpenURL(actionValue);
  
        if (canOpen) {
          await Linking.openURL(actionValue);
        }
  
        return;
      }
  
      if (actionType === "screen") {
        const screenMap = {
          Trending: "Trending",
          SceneBot: "SceneBot",
          SceneBotScreen: "SceneBot",
          Profile: "Profile",
          ProfileScreen: "Profile",
          Search: "Search",
          Notifications: "Notifications",
        };
  
        const screenName = screenMap[actionValue] || actionValue;
  
        navigation.navigate(screenName);
        return;
      }
  
      if (actionType === "movie") {
        const id = Number(actionValue);
  
        if (!Number.isNaN(id) && id > 0) {
          navigation.navigate("Movie", { id });
        }
  
        return;
      }
  
      if (actionType === "actor") {
        const id = Number(actionValue);
  
        if (!Number.isNaN(id) && id > 0) {
          navigation.navigate("ActorScreen", { id });
        }
  
        return;
      }
  
      if (actionType === "director") {
        const id = Number(actionValue);
  
        if (!Number.isNaN(id) && id > 0) {
          navigation.navigate("DirectorScreen", { id });
        }
  
        return;
      }
  
      if (actionType === "cinematographer") {
        const id = Number(actionValue);
  
        if (!Number.isNaN(id) && id > 0) {
          navigation.navigate("CinematographerScreen", { id });
        }
  
        return;
      }
    } catch (err) {
      console.error("❌ Failed banner action:", err);
    }
  };

  const renderHomeBanner = (banner, index) => {
    const designType = String(banner?.designType || "text");
    const hasImage = !!banner?.image;
    const hasButton = !!banner?.buttonText;
    const bg = banner?.backgroundColor || "#111";
    const textColor = banner?.textColor || "#ffffff";
    const buttonColor = banner?.buttonColor || "#6C4DF6";
    const buttonTextColor = banner?.buttonTextColor || "#ffffff";
  
    const isTextOnly = designType === "text";
    const isImage = designType === "image";
    const isLink = designType === "link";
    const isMovie = designType === "movie";
  
    return (
      <TouchableOpacity
        key={banner._id || index}
        activeOpacity={0.9}
        onPress={() => handleBannerPress(banner)}
        style={[
          styles.homeBannerCard,
          {
            width: screenWidth - 32,
            marginLeft: index === 0 ? 16 : 10,
            marginRight: index === homeBanners.length - 1 ? 16 : 0,
            backgroundColor: bg,
          },
          isTextOnly && styles.homeBannerTextOnly,
          isImage && styles.homeBannerImageDesign,
          isLink && styles.homeBannerLinkDesign,
          isMovie && styles.homeBannerMovieDesign,
        ]}
      >
        {(isImage || isMovie) && hasImage && (
          <Image
            source={{ uri: banner.image }}
            style={styles.homeBannerImage}
            resizeMode="cover"
          />
        )}
  
        {(isImage || isMovie) && hasImage && (
          <View style={styles.homeBannerDarkOverlay} />
        )}
  
        <View
          style={[
            styles.homeBannerContent,
            isTextOnly && styles.homeBannerContentTextOnly,
            isLink && styles.homeBannerContentLink,
            isMovie && styles.homeBannerContentMovie,
          ]}
        >
          <Text
            style={[
              styles.homeBannerTitle,
              {
                color: textColor,
              },
            ]}
            numberOfLines={2}
          >
            {banner.title}
          </Text>
  
          {!!banner.subtitle && (
            <Text
              style={[
                styles.homeBannerSubtitle,
                {
                  color: textColor,
                  opacity: 0.82,
                },
              ]}
              numberOfLines={3}
            >
              {banner.subtitle}
            </Text>
          )}
  
          {hasButton && (
            <View
              style={[
                styles.homeBannerButton,
                {
                  backgroundColor: buttonColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.homeBannerButtonText,
                  {
                    color: buttonTextColor,
                  },
                ]}
              >
                {banner.buttonText}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handleEnablePushFromHome = async () => {
    try {
      if (pushRegistering) return;
  
      setPushRegistering(true);
      console.log("🔔 Home push registration started");
  
      const {
        registerPushNotifications,
      } = require("../../../shared/utils/registerPushNotifications");
  
      const token = await registerPushNotifications();
  
      console.log("🔔 Home push registration result:", token);
  
      if (token) {
        await AsyncStorage.setItem(PUSH_PROMPT_DISMISSED_KEY, "true");
        setShowPushPrompt(false);
  
        Alert.alert(
          "Notifications enabled 🎬",
          "Scene will now send you updates when friends interact with you."
        );
      } else {
        Alert.alert(
          "Notifications not enabled",
          "You can try again later from this banner."
        );
      }
    } catch (err) {
      console.log("❌ Home push registration failed:", err?.message || err);
  
      Alert.alert(
        "Notifications failed",
        "Something went wrong while enabling notifications."
      );
    } finally {
      setPushRegistering(false);
    }
  };
  
  const handleDismissPushPrompt = async () => {
    try {
      await AsyncStorage.setItem(PUSH_PROMPT_DISMISSED_KEY, "true");
      setShowPushPrompt(false);
    } catch {
      setShowPushPrompt(false);
    }
  };

  const getRelativeTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso).getTime();
    const diff = Date.now() - d;

    const min = Math.floor(diff / 60000);
    const hr = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);
    const year = Math.floor(day / 365);

    if (min < 1) return t("time.just_now") || "Just now";
    if (min < 60) return t("time.minutes_ago", { min }) || `${min}m ago`;
    if (hr < 24) return t("time.hours_ago", { hr }) || `${hr}h ago`;
    if (day <= 7) return t("time.days_ago", { day }) || `${day}d ago`;

    const x = new Date(iso);

    if (year >= 1) {
      return `${x.getUTCFullYear()}`;
    } else {
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      const m = monthNames[x.getUTCMonth()];
      const dd = x.getUTCDate();
      return `${m} ${dd}`;
    }
  };

  const fetchTrendingMovies = async () => {
    try {
      if (!TMDB_KEY) {
        console.warn("⚠️ TMDB key missing — skipping trending fetch");
        setMovies([]);
        return;
      }

      const r = await fetch(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`
      );
      const d = await r.json();
      setMovies(Array.isArray(d?.results) ? d.results : []);
    } catch (err) {
      console.error("🔥 Failed to fetch trending:", err);
      setMovies([]);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);

      await Promise.all([
        (async () => {
          if (!user?._id) return;
          const res = await api.get(`/api/logs/feed/${user._id}`);
          setFeedLogs(Array.isArray(res.data) ? res.data : []);
        })(),
        fetchTrendingMovies(),
        (async () => {
          await AsyncStorage.removeItem(DAILY_CACHE_KEY);
        })(),
      ]);
    } catch (err) {
      console.error("🔥 Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user?._id) return;

    (async () => {
      try {
        const res = await api.get(`/api/logs/feed/${user._id}`);
        setFeedLogs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("🔥 Failed to fetch feed logs:", err);
        setFeedLogs([]);
      }
    })();
  }, [user?._id]);

  useEffect(() => {
    fetchTrendingMovies();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!TMDB_KEY) {
          console.warn("⚠️ TMDB key missing — skipping daily movie fetch");
          return;
        }

        const today = new Date();
        const todayKey = dayjs(today).format("MM-DD");

        const stored = await AsyncStorage.getItem(DAILY_CACHE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.date === today.toDateString()) {
            setDailyMovie(parsed.movie);
            return;
          }
        }

        let chosen = specialDays[todayKey] || null;
        if (!chosen) {
          const yearStart = dayjs(`${today.getFullYear()}-09-01`);
          const diff =
            today < yearStart
              ? dayjs(today).diff(yearStart.subtract(1, "year"), "day")
              : dayjs(today).diff(yearStart, "day");
          chosen = dailyMoviePool[diff % dailyMoviePool.length];
        }

        if (!chosen?.id) return;

        const [detailEnRes, detailArRes] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/movie/${chosen.id}?api_key=${TMDB_KEY}&language=en-US`
          ),
          fetch(
            `https://api.themoviedb.org/3/movie/${chosen.id}?api_key=${TMDB_KEY}&language=ar-SA`
          ),
        ]);

        const detailEn = await detailEnRes.json();
        const detailAr = await detailArRes.json();

        const daily = {
          id: chosen.id,
          poster: detailEn?.poster_path
            ? `${TMDB_IMG}${detailEn.poster_path}`
            : FALLBACK_POSTER,
          title_en: detailEn?.title,
          title_ar: detailAr?.title || detailEn?.title,
          overview_en: detailEn?.overview,
          overview_ar: detailAr?.overview || detailEn?.overview,
          original_language: detailEn?.original_language,
          reason: chosen?.reason || null,
        };

        setDailyMovie(daily);

        await AsyncStorage.setItem(
          DAILY_CACHE_KEY,
          JSON.stringify({ date: today.toDateString(), movie: daily })
        );
      } catch (err) {
        console.error("🔥 Failed to fetch daily movie:", err);
      }
    })();
  }, []);

  const uniqueFeedLogs = useMemo(() => {
    const seen = new Set();
    const out = [];

    for (const log of feedLogs) {
      const movieId = log?.tmdbId || log?.movie?.id || log?.movie;
      const userId = log?.user?._id || log?.user;
      if (!movieId || !userId) continue;

      const key = `${userId}-${movieId}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(log);
      }
    }

    return out;
  }, [feedLogs]);

  const dailyTitle =
    dailyMovie &&
    (dailyMovie.original_language === "ar" && dailyMovie.title_ar?.trim()
      ? dailyMovie.title_ar
      : dailyMovie.title_en || dailyMovie.title);

  const dailyOverview =
    dailyMovie &&
    (language === "ar"
      ? dailyMovie.overview_ar?.trim() || dailyMovie.overview_en?.trim() || ""
      : dailyMovie.overview_en?.trim() || dailyMovie.overview_ar?.trim() || "");

  const dailyOverviewSnippet = (dailyOverview || "")
    .split(" ")
    .slice(0, 25)
    .join(" ")
    .concat(dailyOverview ? "..." : "");

  const trendingData = useMemo(() => movies.slice(0, 8), [movies]);

  const HeaderBlock = useMemo(
    () => (
      <View>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            {t("Welcome back, {name} 🎬").replace(
              "{name}",
              user?.username || user?.name || ""
            )}
          </Text>
          <Image
            source={{
              uri: user?.avatar?.startsWith?.("http")
                ? user.avatar
                : user?.avatar && BACKEND_URL
                ? `${BACKEND_URL}${user.avatar}`
                : FALLBACK_AVATAR,
            }}
            style={styles.avatar}
          />
        </View>

        {showPushPrompt && (
  <TouchableOpacity
    activeOpacity={0.88}
    style={styles.pushPromptCard}
    onPress={handleEnablePushFromHome}
    disabled={pushRegistering}
  >
    <View style={{ flex: 1 }}>
      <Text style={styles.pushPromptTitle}>
        🔔 {t("Stay in the Scene")}
      </Text>

      <Text style={styles.pushPromptSubtitle}>
        {t("Get notified when friends reply, like, follow, or share movies with you.")}
      </Text>

      <Text style={styles.pushPromptTapText}>
        {pushRegistering ? t("Enabling...") : t("Tap to enable")}
      </Text>
    </View>

    <TouchableOpacity
      style={styles.pushPromptClose}
      onPress={handleDismissPushPrompt}
      disabled={pushRegistering}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Text style={styles.pushPromptCloseText}>×</Text>
    </TouchableOpacity>
  </TouchableOpacity>
)}

        {homeBanners.length > 0 && (
  <View style={styles.homeBannerWrap}>
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.homeBannerScrollContent}
    >
      {homeBanners.map((banner, index) => renderHomeBanner(banner, index))}
    </ScrollView>
  </View>
)}

        {dailyMovie && (
          <>
            <Text style={styles.dailyTagline}>
              {t("New Day. New Amazing Film. It’s a Scene Thing. 🎥")}
            </Text>

            <TouchableOpacity
              style={styles.dailyMovie}
              onPress={() => navigation.navigate("Movie", { id: dailyMovie.id })}
            >
              <Image
                source={{ uri: dailyMovie?.poster || FALLBACK_POSTER }}
                style={styles.dailyPoster}
              />
              <View style={{ flex: 1, padding: 12, marginBottom: 8 }}>
                <Text style={styles.dailyTitle}>{dailyTitle}</Text>
                <Text style={styles.dailyOverview}>
                  {dailyOverviewSnippet}{" "}
                  <Text style={styles.readMore}>{t("Read more")}</Text>
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.sectionTitle}>{t("Recent Activities")}</Text>

        {uniqueFeedLogs.length > 0 ? (
          <>
            <ScrollView
              horizontal
              pagingEnabled
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / screenWidth
                );
                setCurrentSection(index);
              }}
            >
              {[0, 6, 12].map((start, idx) => (
                <View
                  key={idx}
                  style={{
                    width: screenWidth,
                    paddingHorizontal: FEED_SIDE,
                    paddingVertical: 10,
                  }}
                >
                  <View style={styles.grid}>
                    {uniqueFeedLogs.slice(start, start + 6).map((log, i) => {
                      const id =
                        log?.tmdbId ?? log?.movie?.id ?? log?.movie ?? log?.movieId;

                      const posterUrl = log?.posterOverride
                        ? log.posterOverride
                        : log?.movie?.poster_path
                        ? `${TMDB_IMG}${log.movie.poster_path}`
                        : FALLBACK_POSTER;

                      const raw = (log?.review || "").trim();
                      const mediaMarkers = ["__media__", "[GIF ONLY]", "[IMAGE ONLY]"];
                      const hasTextReview = !!raw && !mediaMarkers.includes(raw);
                      const hasMedia = !!(
                        log?.gif ||
                        log?.image ||
                        mediaMarkers.includes(raw)
                      );
                      const hasReviewOrMedia = hasTextReview || hasMedia;

                      const timestamp = formatTimestamp(
                        log?.createdAt,
                        language === "ar"
                      );

                      const avatarUri = log?.user?.avatar?.startsWith?.("http")
                        ? log.user.avatar
                        : log?.user?.avatar && BACKEND_URL
                        ? `${BACKEND_URL}${log.user.avatar}`
                        : FALLBACK_AVATAR;

                      const isLastInRow = i % FEED_COLS === FEED_COLS - 1;

                      const goTo = () => {
                        if (hasReviewOrMedia && log?._id) {
                          navigation.navigate("ReviewPage", { id: String(log._id) });
                        } else if (id && !Number.isNaN(Number(id))) {
                          navigation.navigate("Movie", { id: Number(id) });
                        }
                      };

                      return (
                        <TouchableOpacity
                          key={String(log?._id || `${log?.user?._id}-${id}-${i}`)}
                          onPress={goTo}
                          style={[
                            styles.card,
                            {
                              width: FEED_ITEM_W,
                              marginRight: isLastInRow ? 0 : FEED_GAP,
                              marginBottom: FEED_GAP,
                            },
                          ]}
                        >
                          <Image source={{ uri: posterUrl }} style={styles.poster} />

                          <Text style={styles.timestamp}>{timestamp}</Text>

                          <View style={styles.userRow}>
                            <Image source={{ uri: avatarUri }} style={styles.userAvatar} />
                            <Text style={styles.username}>
                              {log?.user?.username || ""}
                            </Text>
                          </View>

                          <View style={styles.iconRow}>
                            <StarRating rating={Number(log?.rating) || 0} size={12} />
                            {hasTextReview && (
                              <MaterialCommunityIcons
                                name="chat-outline"
                                size={12}
                                color="#aaa"
                                style={{ marginLeft: -4 }}
                              />
                            )}
                            {Number(log?.rewatchCount ?? log?.rewatch) > 0 && (
                              <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <MaterialIcons
                                  name="refresh"
                                  size={12}
                                  color="#aaa"
                                  style={{ marginLeft: -5 }}
                                />
                                <Text style={styles.rewatchText}>
                                  {(log?.rewatchCount ?? log?.rewatch) || 0}x
                                </Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.sceneDots}>
              {[0, 1, 2].map((idx) => (
                <Animated.View
                  key={idx}
                  style={[
                    styles.sceneDot,
                    {
                      width: dotWidths[idx],
                      backgroundColor: currentSection === idx ? "#a855f7" : "#555",
                    },
                  ]}
                />
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.emptyText}>{t("No recent logs yet.")}</Text>
        )}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 2,
            marginBottom: 2,
          }}
        >
          <Text style={styles.sectionTitle}>🔥 {t("Trending Movies")}</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate("Trending")}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Text style={{ color: "#ccc", fontSize: 14, marginRight: 2 }}>
              {t("more")}
            </Text>
            <Text style={{ color: "#ccc", fontSize: 14, marginRight: 15 }} />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [
      currentSection,
      dailyMovie,
      dailyOverviewSnippet,
      dailyTitle,
      dotWidths,
      homeBanners,
      language,
      navigation,
      t,
      uniqueFeedLogs,
      user,
    ]
  );

  if (!user) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: "#fff", marginTop: 10 }}>
          {t("Loading your Scenes...")}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={trendingData}
      keyExtractor={(m) => String(m.id)}
      numColumns={TRENDING_COLS}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ paddingBottom: 120 }}
      columnWrapperStyle={{
        gap: TRENDING_GAP,
        paddingHorizontal: TRENDING_SIDE,
      }}
      ListHeaderComponent={HeaderBlock}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => {
            if (item?.id && !Number.isNaN(Number(item.id))) {
              navigation.navigate("Movie", { id: Number(item.id) });
            }
          }}
        >
          <Image
            source={{
              uri: item?.poster_path
                ? `${TMDB_IMG}${item.poster_path}`
                : FALLBACK_POSTER,
            }}
            style={{
              width: TRENDING_ITEM_W,
              height: Math.round(TRENDING_ITEM_W * 1.5),
              borderRadius: 6,
              marginBottom: TRENDING_GAP,
            }}
          />
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },

  header: { alignItems: "center", marginVertical: 95, marginBottom: 35 },
  welcomeText: {
    fontSize: 20,
    color: "#fff",
    marginBottom: -50,
    fontWeight: "700",
    fontFamily: "PixelifySans_700Bold",
  },
  avatar: { width: 100, height: 100, borderRadius: 50, marginTop: 90 },

  dailyTagline: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 26,
    fontFamily: "PixelifySans_700Bold",
  },
  dailyMovie: {
    flexDirection: "row",
    backgroundColor: "#111",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: "hidden",
  },
  dailyPoster: { width: 150, height: 220 },
  dailyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 35,
    fontFamily: "PixelifySans_700Bold",
  },
  dailyOverview: {
    fontSize: 13.5,
    color: "#ccc",
    fontFamily: "PixelifySans_700Bold",
    marginBottom: 8,
  },
  readMore: { color: "#B327F6", fontWeight: "500" },

  sectionTitle: {
    fontSize: 18,
    color: "#fff",
    marginVertical: 20,
    paddingHorizontal: 16,
    fontFamily: "PixelifySans_700Bold",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  card: { position: "relative" },
  poster: {
    width: "100%",
    height: isTablet ? 340 : 190,
    borderRadius: 6,
    gap: 1,
  },

  timestamp: {
    position: "absolute",
    top: 6,
    right: 4,
    fontSize: 10,
    color: "#ccc",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  userRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  userAvatar: { width: 20, height: 20, borderRadius: 10, marginRight: 6 },
  username: { fontSize: 12, color: "#fff" },
  iconRow: { flexDirection: "row", alignItems: "center", marginTop: 3, gap: 6 },
  rewatchText: { fontSize: 10, color: "#aaa", marginLeft: 1 },

  dots: { flexDirection: "row", justifyContent: "center", marginVertical: 12 },
  dot: { width: 30, height: 6, borderRadius: 3, marginHorizontal: 4 },

  trendingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: SIDE,
  },
  trendingPoster: {
    width: TRENDING_ITEM_W,
    height: Math.round(TRENDING_ITEM_W * 1.5),
    borderRadius: 6,
    margin: TRENDING_GAP / 4,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },

  sceneDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sceneDot: {
    height: 6,
    borderRadius: 999,
    marginHorizontal: 4,
  },

  emptyText: {
    color: "#888",
    marginTop: 1,
    paddingHorizontal: 16,
    fontFamily: "PixelifySans_700Bold",
  },

  homeBannerWrap: {
    marginBottom: 18,
  },
  
  homeBannerScrollContent: {
    alignItems: "center",
  },
  
  homeBannerCard: {
    height: 118,
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  
  homeBannerTextOnly: {
    justifyContent: "center",
  },
  
  homeBannerImageDesign: {
    justifyContent: "flex-end",
  },
  
  homeBannerLinkDesign: {
    justifyContent: "center",
  },
  
  homeBannerMovieDesign: {
    justifyContent: "flex-end",
  },
  
  homeBannerImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  
  homeBannerDarkOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  
  homeBannerContent: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  
  homeBannerContentTextOnly: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  
  homeBannerContentLink: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  
  homeBannerContentMovie: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  
  homeBannerTitle: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 23,
    letterSpacing: 0.1,
  },
  
  homeBannerSubtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 7,
    fontWeight: "500",
  },
  
  homeBannerButton: {
    marginTop: 10,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  
  homeBannerButtonText: {
    fontSize: 12,
    fontWeight: "800",
  },

  pushPromptCard: {
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#120816",
    borderWidth: 1,
    borderColor: "rgba(179,39,246,0.42)",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  
  pushPromptTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 7,
    fontFamily: "PixelifySans_700Bold",
  },
  
  pushPromptSubtitle: {
    color: "#cfcfcf",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  
  pushPromptTapText: {
    color: "#B327F6",
    fontSize: 12.5,
    fontWeight: "800",
  },
  
  pushPromptClose: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  
  pushPromptCloseText: {
    color: "#ccc",
    fontSize: 18,
    lineHeight: 21,
    fontWeight: "700",
  },

});

