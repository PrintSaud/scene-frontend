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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { formatDistanceToNowStrict } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import { formatTimestamp } from "shared/utils/time"; // adjust path
import { Animated } from "react-native";
import { useIsFocused } from "@react-navigation/native";

import api from "shared/api/api";
import useTranslate from "shared/utils/useTranslate";
import { useLanguage } from "shared/context/LanguageContext";
import { AntDesign, FontAwesome, MaterialIcons, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

import dayjs from "dayjs";
import { dailyMoviePool, specialDays } from "../data/dailyMoviePool";
import StarRating from "../components/StarRating";


const { width } = Dimensions.get("window");
const isTablet = width >= 768;
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";
const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";
const screenWidth = Dimensions.get("window").width;
const DAILY_CACHE_KEY = "dailyMovie:v2"; // bumped for fresh cache

// constants near top
const GAP = 12;
const SIDE = 14;
const COLS = 2; // 👈 missing; fixes the runtime error
const ITEM_W = Math.floor((screenWidth - SIDE * 2 - GAP * (COLS - 1)) / COLS);
const FEED_COLS = isTablet ? 4 : 3; // 4 columns iPad, 2 columns iPhone
const FEED_GAP = 8;
const FEED_SIDE = 10;
const FEED_ITEM_W = Math.floor(
  (screenWidth - FEED_SIDE * 2 - FEED_GAP * (FEED_COLS - 1)) / FEED_COLS );

  // 🎬 Trending grid
const TRENDING_COLS = isTablet ? 6 : 2; // 6 on iPad, 2 on iPhone
const TRENDING_GAP = 12;
const TRENDING_SIDE = 6;
const TRENDING_ITEM_W = Math.floor(
  (screenWidth - TRENDING_SIDE * 2 - TRENDING_GAP * (TRENDING_COLS - 1)) /
    TRENDING_COLS
);






export default function HomeScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [feedLogs, setFeedLogs] = useState([]);
  const [movies, setMovies] = useState([]);
  const [dailyMovie, setDailyMovie] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const dotWidths = useRef([0, 1, 2].map((idx) =>
    new Animated.Value(currentSection === idx ? 100 : 30)
  )).current;
  const isFocused = useIsFocused();

// Load user
useEffect(() => {
  (async () => {
    try {
      const stored = await AsyncStorage.getItem("user");
      setUser(stored ? JSON.parse(stored) : null);
    } catch {
      setUser(null);
    }
  })();
}, [isFocused]); // 👈 refresh on screen focus


  useEffect(() => {
    dotWidths.forEach((anim, idx) => {
      Animated.timing(anim, {
        toValue: currentSection === idx ? 150 : 30,
        duration: 120,
        useNativeDriver: false,
      }).start();
    });
  }, [currentSection]);
  
  
  const t = useTranslate();
  const { language } = useLanguage(); // "en" | "ar"

  const [refreshing, setRefreshing] = useState(false);


  const getRelativeTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso).getTime();
    const diff = Date.now() - d;
  
    const min = Math.floor(diff / 60000);
    const hr = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);
    const year = Math.floor(day / 365);
  
    if (min < 1) return t("time.just_now") || "Just now";
    if (min < 60) return (t("time.minutes_ago", { min }) || `${min}m ago`);
    if (hr < 24) return (t("time.hours_ago", { hr }) || `${hr}h ago`);
    if (day <= 7) return (t("time.days_ago", { day }) || `${day}d ago`);
  
    const x = new Date(iso);
  
    if (year >= 1) {
      // ✅ More than a year ago → only year
      return `${x.getUTCFullYear()}`;
    } else {
      // ✅ Within the last year → Month short name + day number
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const m = monthNames[x.getUTCMonth()];
      const dd = x.getUTCDate();
      return `${m} ${dd}`;
    }
  };

const onRefresh = async () => {
  try {
    setRefreshing(true);
    await Promise.all([
      // re-run your loaders
      (async () => { /* refetch feed */ const res = await api.get(`/api/logs/feed/${user._id}`); setFeedLogs(res.data||[]);} )(),
      (async () => { /* refetch trending */ const r = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${process.env.EXPO_PUBLIC_TMDB_API_KEY}`); const d = await r.json(); setMovies(d.results||[]);} )(),
      (async () => { /* bust daily cache */ await AsyncStorage.removeItem("dailyMovie:v2"); /* your daily movie effect will repopulate on next render or trigger it here if you prefer */ })(),
    ]);
  } finally {
    setRefreshing(false);
  }
};


  // Load user
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        setUser(stored ? JSON.parse(stored) : null);
      } catch {
        setUser(null);
      }
    })();
  }, []);

  // Feed logs
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

  // Trending
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${process.env.EXPO_PUBLIC_TMDB_API_KEY}`
        );
        const data = await res.json();
        setMovies(Array.isArray(data?.results) ? data.results : []);
      } catch (err) {
        console.error("🔥 Failed to fetch trending:", err);
        setMovies([]);
      }
    })();
  }, []);

  // Daily Movie
  useEffect(() => {
    (async () => {
      try {
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
            `https://api.themoviedb.org/3/movie/${chosen.id}?api_key=${process.env.EXPO_PUBLIC_TMDB_API_KEY}&language=en-US`
          ),
          fetch(
            `https://api.themoviedb.org/3/movie/${chosen.id}?api_key=${process.env.EXPO_PUBLIC_TMDB_API_KEY}&language=ar-SA`
          ),
        ]);

        const detailEn = await detailEnRes.json();
        const detailAr = await detailArRes.json();

        const daily = {
          id: chosen.id,
          poster: detailEn?.poster_path ? `${TMDB_IMG}${detailEn.poster_path}` : FALLBACK_POSTER,
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

  // Dedupe feed like web
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

  // Language-aware daily fields
  const dailyTitle =
    dailyMovie &&
    (dailyMovie.original_language === "ar" && dailyMovie.title_ar?.trim()
      ? dailyMovie.title_ar
      : dailyMovie.title_en || dailyMovie.title);

  const dailyOverview =
    dailyMovie &&
    ((language === "ar"
      ? dailyMovie.overview_ar?.trim() || dailyMovie.overview_en?.trim() || ""
      : dailyMovie.overview_en?.trim() || dailyMovie.overview_ar?.trim() || ""));

  const dailyOverviewSnippet =
    (dailyOverview || "")
      .split(" ")
      .slice(0, 25)
      .join(" ")
      .concat(dailyOverview ? "..." : "");

  // Trending data for FlatList
  const trendingData = useMemo(() => movies.slice(0, 8), [movies]);

  // Header (welcome, daily movie, feed, dots, trending header)
  const HeaderBlock = useMemo(() => (
    <View>
      {/* 👋 Welcome */}
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
              : user?.avatar
              ? `${process.env.EXPO_PUBLIC_BACKEND_URL}${user.avatar}`
              : FALLBACK_AVATAR,
          }}
          style={styles.avatar}
        />
      </View>

      {/* 🎬 Daily Movie */}
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
            <View style={{ flex: 1, padding: 12 , marginBottom: 8, }}>
              <Text style={styles.dailyTitle}>{dailyTitle}</Text>
              <Text style={styles.dailyOverview}>
                {dailyOverviewSnippet} <Text style={styles.readMore}>{t("Read more")}</Text>
              </Text>
            </View>
          </TouchableOpacity>
        </>
      )}

{/* 👀 Recent Activities */}
<Text style={styles.sectionTitle}>{t("Recent Activities")}</Text>

{uniqueFeedLogs.length > 0 ? (
  <>
    <ScrollView
      horizontal
      pagingEnabled
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={(e) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
        setCurrentSection(index);
      }}
    >
      {[0, 6, 12].map((start, idx) => (
        <View
          key={idx}
          style={{ width: screenWidth, paddingHorizontal: FEED_SIDE, paddingVertical: 10 }}
        >
          <View style={styles.grid}>


          {uniqueFeedLogs.slice(start, start + 6).map((log, i) => {
  // TMDB id for Movie screen
  const id =
    log?.tmdbId ??
    log?.movie?.id ??
    log?.movie ??
    log?.movieId;

  // poster
  const posterUrl =
    log?.posterOverride
      ? log.posterOverride
      : log?.movie?.poster_path
      ? `${TMDB_IMG}${log.movie.poster_path}`
      : FALLBACK_POSTER;

  // ✅ treat media-only posts as “has review”
  const raw = (log?.review || "").trim();
  const hasTextReview = !!raw && !["__media__", "[GIF ONLY]", "[IMAGE ONLY]"].includes(raw);
  const hasMedia = !!(log?.gif || log?.image || raw === "__media__");
  const hasReviewOrMedia = hasTextReview || hasMedia;

  const timestamp = formatTimestamp(log?.createdAt, t);

  const avatarUri =
    log?.user?.avatar?.startsWith?.("http")
      ? log.user.avatar
      : log?.user?.avatar
      ? `${process.env.EXPO_PUBLIC_BACKEND_URL}${log.user.avatar}`
      : FALLBACK_AVATAR;

  const isLastInRow = (i % FEED_COLS) === FEED_COLS - 1;

  const goTo = () => {
    if (hasReviewOrMedia && log?._id) {
      // open review by LOG id
      navigation.navigate("ReviewPage", { id: String(log._id) });
    } else if (id) {
      navigation.navigate("Movie", { id });
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
      {/* Poster */}
      <Image source={{ uri: posterUrl }} style={styles.poster} />

      {/* 🕒 Timestamp */}
      <Text style={styles.timestamp}>{timestamp}</Text>

      {/* Avatar + Username */}
      <View style={styles.userRow}>
        <Image source={{ uri: avatarUri }} style={styles.userAvatar} />
        <Text style={styles.username}>{log?.user?.username || ""}</Text>
      </View>

      {/* Rating + Icons */}
      <View style={styles.iconRow}>
        <StarRating rating={Number(log?.rating) || 0} size={12} />
        {hasTextReview && (
          <MaterialCommunityIcons name="chat-outline" size={12} color="#aaa" style={{ marginLeft: -4 }} />
        )}
        {Number(log?.rewatchCount ?? log?.rewatch) > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialIcons name="refresh" size={12} color="#aaa" style={{ marginLeft: -5 }} />
            <Text style={styles.rewatchText}>{(log?.rewatchCount ?? log?.rewatch) || 0}x</Text>
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

{/* 🎯 Scene Dot Indicators */}
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

{/* 🔥 Trending header */}
<View
  style={{
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 2, // tighter so "Trending Movies" hugs the left edge
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
    <Text style={{ color: "#ccc", fontSize: 14, marginRight: 15 }}></Text>
  </TouchableOpacity>
</View>


    </View>
  ), [user, dailyMovie, uniqueFeedLogs, currentSection, language, dailyOverviewSnippet, t, navigation]);

  if (!user) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: "#fff", marginTop: 10 }}>{t("Loading your Scenes...")}</Text>
      </View>
    );
  }

  // 🔽 MAIN RETURN — ONE vertical FlatList (smooth scroll)
  return (
    <FlatList
  style={styles.container}
  data={trendingData}
  keyExtractor={(m) => String(m.id)}
  numColumns={TRENDING_COLS}   // 👈 use TRENDING_COLS instead of COLS
  refreshing={refreshing}
  onRefresh={onRefresh}
  contentContainerStyle={{ paddingBottom: 120 }}
  columnWrapperStyle={{ gap: TRENDING_GAP, paddingHorizontal: TRENDING_SIDE }}
  ListHeaderComponent={HeaderBlock}
  renderItem={({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate("Movie", { id: item.id })}>
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
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },

  // header
  header: { alignItems: "center", marginVertical: 95, marginBottom: 35,  },
  welcomeText: { fontSize: 20, color: "#fff", marginBottom: -50, fontWeight: "700", fontFamily: "PixelifySans_700Bold", },
  avatar: { width: 100, height: 100, borderRadius: 50, marginTop: 90 },

  // daily movie
  dailyTagline: { fontSize: 16, color: "#fff", textAlign: "center", marginBottom: 26,   fontFamily: "PixelifySans_700Bold",},
  dailyMovie: {
    flexDirection: "row",
    backgroundColor: "#111",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: "hidden",
    
  },
  dailyPoster: { width: 150, height: 220 },
  dailyTitle: { fontSize: 18, fontWeight: "600", color: "#fff", marginBottom: 35,  fontFamily: "PixelifySans_700Bold", },
  dailyOverview: { fontSize: 13.5, color: "#ccc" ,   fontFamily: "PixelifySans_700Bold", marginBottom: 8, },
  readMore: { color: "#B327F6", fontWeight: "500" },
  // sections
  sectionTitle: { fontSize: 18, color: "#fff", marginVertical: 20, paddingHorizontal: 16 ,fontFamily: "PixelifySans_700Bold",},

  // feed grid
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start" },
// remove fixed width/margin here; we set them inline above
card: { position: "relative" , },
poster: {
  width: "100%",
  height: isTablet ? 340 : 190, // smaller on iPad
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

  // dots
  dots: { flexDirection: "row", justifyContent: "center", marginVertical: 12 },
  dot: { width: 30, height: 6, borderRadius: 3, marginHorizontal: 4 },

// styles
trendingGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "center",
  paddingHorizontal: SIDE,
},
trendingPoster: {
  width: TRENDING_ITEM_W,
  height: Math.round(TRENDING_ITEM_W * 1.5), // maintain poster ratio
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


  // empty state
  emptyText: { color: "#888", marginTop: 1, paddingHorizontal: 16,   fontFamily: "PixelifySans_700Bold", },
});
