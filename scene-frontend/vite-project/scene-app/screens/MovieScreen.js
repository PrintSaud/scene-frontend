import React, { useEffect, useMemo, useState, useCallback, useRef } from "react"
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    FlatList,
    Linking,
  } from "react-native";
  
  // ✅ Correct source for AdMob
  import {
    BannerAd,
    BannerAdSize,
    TestIds,
  } from "react-native-google-mobile-ads";
  
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useTranslate from "shared/utils/useTranslate";
import { useLanguage } from "shared/context/LanguageContext";
import StarRating from "../components/StarRating";
import BottomNav from "../components/BottomNav";
import { LinearGradient } from "expo-linear-gradient";
import MovieTopBar from "../components/Movie/MovieTopBar"; // ✅ import
import ChangePosterModal from "../components/Movie/ChangePosterModal";
import MovieTabs from "../components/Movie/MovieTabs";
import { MaterialCommunityIcons, MaterialIcons, AntDesign } from "@expo/vector-icons";
import LogScreen from "./LogScreen";
import SceneAdBanner from "../components/SceneAdBanner";
import { Ionicons } from "@expo/vector-icons";
import axiosInstance from "shared/api/api";


const screenWidth = Dimensions.get("window").width;
const HEADER_H = 60;
const TMDB_IMG_ORIG = "https://image.tmdb.org/t/p/original";
const TMDB_IMG_AVATAR = "https://image.tmdb.org/t/p/w185";
const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";
const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "https://backend.scenesa.com";

// tiny helpers
const getYear = (dateStr) => (dateStr ? String(dateStr).slice(0, 4) : "—");
const isNonEmpty = (s) => !!(s && String(s).trim() !== "" && s !== "N/A");

// --- AdMob IDs ---

// choose a nice display title like your web util
// ✅ Display title logic
const pickDisplayTitle = (movie, language) => {
    if (!movie) return "—";
  
    // Always show Arabic title if the original language is Arabic
    if (movie.original_language === "ar" && isNonEmpty(movie.title_ar)) {
      return movie.title_ar;
    }
  
    // Otherwise, force English/original title
    return (
      movie.original_title ||
      movie.title || 
      "Untitled"
    );
  };
  
  

export default function MovieScreen({ navigation }) {
  const tabNav = navigation;               // tab navigator for BottomNav
  const stackNav = useNavigation();        // stack nav for back + pushing
  const route = useRoute();
  const id = route.params?.id;
  const t = useTranslate();
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [movie, setMovie] = useState(null);
  const [posterOverride, setPosterOverride] = useState(null);
  const [showPosterModal, setShowPosterModal] = useState(false); // ✅ new state
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);          // ← ADD
  const [pendingEditLogId, setPendingEditLogId] = useState(null); 
  const [credits, setCredits] = useState(null); // { local, en }
  const [trailerKey, setTrailerKey] = useState(null);
  const [providers, setProviders] = useState({});
  const [friendLogs, setFriendLogs] = useState([]);
  const [popularReviews, setPopularReviews] = useState([]);
  const [animatingLikes, setAnimatingLikes] = useState([]);
  const [activeTab, setActiveTab] = useState("cast");
  const [selectedRegion, setSelectedRegion] = useState(null);
  const scrollRef = useRef(null);

  const IOS_BANNER_ID = "ca-app-pub-1279194555922916/4804628050";
const ANDROID_BANNER_ID = "ca-app-pub-1279194555922916/xxxxxxxxxx"; // replace later

// ✅ Use test ads in dev, real IDs in release
const adUnitId = __DEV__
  ? TestIds.BANNER
  : Platform.OS === "ios"
  ? IOS_BANNER_ID
  : ANDROID_BANNER_ID;


    // who am I?
    const [myId, setMyId] = useState(null);
    useEffect(() => {
      (async () => {
        try {
          const userStr = await AsyncStorage.getItem("user");
          const me = userStr ? JSON.parse(userStr) : null;
          setMyId(me?._id || null);
        } catch {}
      })();
    }, []);

  const EXPO_TMDB_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
  

  // helpers
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
  
  const pickDisplayLogForUser = (logsForUser) => {
    if (!Array.isArray(logsForUser) || !logsForUser.length) return null;
    const withRating = logsForUser.find((l) => typeof l.rating === "number");
    if (withRating) return withRating;
    const withReview = logsForUser.find((l) => !!l.review);
    if (withReview) return withReview;
    const withRewatch = logsForUser.find(
      (l) =>
        (typeof l.rewatchCount === "number" && l.rewatchCount > 0) ||
        (typeof l.rewatch === "number" && l.rewatch > 0)
    );
    if (withRewatch) return withRewatch;
    return logsForUser[0];
  };

  const goToLog = () => {
    navigation.navigate("LogScreen", { movie }); 
  };

  // how many avatars we show inline
const MAX_FRIEND_TILES = 5;

// When navigated with editLogId (or legacy logId), capture it
useEffect(() => {
      const incoming = route.params?.editLogId ?? route.params?.logId;
      if (incoming) setPendingEditLogId(incoming);
    }, [route.params?.editLogId, route.params?.logId]);

// navigate to LogScreen (presented as a modal via navigator options)
useEffect(() => {
      if (pendingEditLogId && movie) {
        const editId = pendingEditLogId;
       setPendingEditLogId(null);
        stackNav.navigate("LogScreen", {
          movie,
          editLogId: editId,
        });
       // clear route params so it won't auto-open again
       stackNav.setParams({ editLogId: undefined, logId: undefined, edit: undefined });
     }
    }, [pendingEditLogId, movie, stackNav]);
    
    

// robustly read a user id off a log
const getLogUserId = (l) =>
  l?.user?._id ??
  l?.userId ??
  l?.user_id ??
  (typeof l?.user === "string" ? l.user : null);

// unique user ids for "watched by friends"
const uniqueFriendUserIds = useMemo(() => {
  const s = new Set();
  (friendLogs || []).forEach((l) => {
    const uid = getLogUserId(l);
    if (uid) s.add(uid);
  });
  return Array.from(s);
}, [friendLogs]);


  // fetch everything (movie, credits, videos, providers)
  // ✅ Extracted fetch function
  const loadMovie = useCallback(async () => {
    try {
      setLoading(true);
      const TMDB_BASE = "https://api.themoviedb.org/3";
      const langMap = { en: "en-US", ar: "ar-SA" };
      const tmdbLocale = langMap[language] || "en-US";

      const [
        movieEnRes,
        movieLocalRes,
        creditsLocalRes,
        creditsEnRes,
        videosLocalRes,
        videosEnRes,
        providersRes,
      ] = await Promise.all([
        fetch(`${TMDB_BASE}/movie/${id}?api_key=${EXPO_TMDB_KEY}&language=en-US&append_to_response=translations`),
        fetch(`${TMDB_BASE}/movie/${id}?api_key=${EXPO_TMDB_KEY}&language=${tmdbLocale}`),
        fetch(`${TMDB_BASE}/movie/${id}/credits?api_key=${EXPO_TMDB_KEY}&language=${tmdbLocale}`),
        fetch(`${TMDB_BASE}/movie/${id}/credits?api_key=${EXPO_TMDB_KEY}&language=en-US`),
        fetch(`${TMDB_BASE}/movie/${id}/videos?api_key=${EXPO_TMDB_KEY}&language=${tmdbLocale}`),
        fetch(`${TMDB_BASE}/movie/${id}/videos?api_key=${EXPO_TMDB_KEY}&language=en-US`),
        fetch(`${TMDB_BASE}/movie/${id}/watch/providers?api_key=${EXPO_TMDB_KEY}`),
      ]);

      const movieEn = await movieEnRes.json();
      const movieLocal = await movieLocalRes.json();
      const creditsLocal = await creditsLocalRes.json();
      const creditsEn = await creditsEnRes.json();
      const videosLocal = await videosLocalRes.json();
      const videosEn = await videosEnRes.json();
      const providersJson = await providersRes.json();
      
      let localizedOverview = movieEn.overview;
      let localizedTagline = movieEn.tagline;

      if (language === "ar") {
        if (isNonEmpty(movieLocal.overview)) localizedOverview = movieLocal.overview;
        if (isNonEmpty(movieLocal.tagline)) localizedTagline = movieLocal.tagline;

        const trArr = movieEn?.translations?.translations || [];
        const wanted = trArr.find((tr) => tr.iso_639_1 === "ar");
        if (wanted?.data) {
          if (isNonEmpty(wanted.data.overview)) localizedOverview = wanted.data.overview;
          if (isNonEmpty(wanted.data.tagline)) localizedTagline = wanted.data.tagline;
        }
        if (localizedTagline === movieEn.tagline) {
          localizedTagline = String(t(movieEn.tagline) || movieEn.tagline || "");
        }
      }

      const fallbackPoster =
        movieEn.poster_path
          ? `${TMDB_IMG_ORIG}${movieEn.poster_path}`
          : movieLocal.poster_path
          ? `${TMDB_IMG_ORIG}${movieLocal.poster_path}`
          : FALLBACK_POSTER;

      setCredits({ local: creditsLocal, en: creditsEn });
      setProviders(providersJson?.results || {});

      setMovie({
        id: movieEn.id,
        title: movieEn.title,
        original_title: movieEn.original_title,
        title_ar: movieLocal.title,
        localized_title: movieLocal.title,
        original_language: movieEn.original_language,
        poster: fallbackPoster,
        backdrop_path: movieEn.backdrop_path,
        overview: language === "ar" ? localizedOverview : movieEn.overview,
        tagline: language === "ar" ? localizedTagline : movieEn.tagline,
        genres:
          language === "ar" && Array.isArray(movieLocal.genres) && movieLocal.genres.length
            ? movieLocal.genres
            : movieEn.genres,
        release_date: movieEn.release_date,
        runtime: movieEn.runtime,
        vote_average: movieEn.vote_average,
        vote_count: movieEn.vote_count,
        popularity: movieEn.popularity,
      });

      const bestTrailer =
        videosLocal?.results?.find((v) => v.type === "Trailer" && v.site === "YouTube") ||
        videosEn?.results?.find((v) => v.type === "Trailer" && v.site === "YouTube");
      setTrailerKey(bestTrailer?.key || null);
    } catch (e) {
      console.error("❌ Movie fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }, [id, language, EXPO_TMDB_KEY, ]);

  // ✅ Run on mount + when id/language changes
  useEffect(() => {
    loadMovie();
  }, [loadMovie]);





  

  const openTrailer = async () => {
    try {
      const TMDB_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${TMDB_KEY}`
      );
      const data = await res.json();
      const trailer = data.results.find(
        (v) => v.type === "Trailer" && v.site === "YouTube"
      );
      if (trailer) {
        Linking.openURL(`https://www.youtube.com/watch?v=${trailer.key}`);
      } else {
        Toast.show({ type: "scene", text1: "No trailer found" });
      }
    } catch (err) {
      console.error("❌ Trailer fetch error:", err);
      Toast.show({ type: "scene", text1: "Trailer error" });
    }
  };

// poster override per-user
useEffect(() => {
  let isMounted = true;

  (async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      const me = userStr ? JSON.parse(userStr) : null;
      if (!me?._id || !movie?.id) return;

      const res = await axiosInstance.get(`/api/posters/${movie.id}`, {
        params: { userId: me._id },
        headers: { Authorization: `Bearer ${me.token}` },
      });

      if (isMounted) {
        setPosterOverride(res.data?.posterOverride || null);
        console.log("[POSTER FETCH] override for movie", movie.id, "->", res.data?.posterOverride);
      }
    } catch (e) {
      if (isMounted) setPosterOverride(null);
      console.error("❌ Failed to fetch poster override:", e.message || e);
    }
  })();

  return () => { isMounted = false; };
}, [movie?.id]);


  

    // ✅ Save handler
    const handleSavePoster = async (movieId, posterUrl) => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        const me = userStr ? JSON.parse(userStr) : null;
        if (!me?.token) return console.warn("No token found, aborting poster save.");
    
        const res = await axiosInstance.post(
          `/api/posters/${movieId}`, // ✅ POST, not PATCH
          { posterUrl },
          { headers: { Authorization: `Bearer ${me.token}` } }
        );
    
        if (res.status === 200) {
          setPosterOverride(posterUrl); // local update
          console.log("✅ Poster saved!");
        }
      } catch (e) {
        console.error("❌ Failed to save poster:", e.message || e);
      }
    };
    
    
    
    
    
  
      useEffect(() => {
        if (!id || !BACKEND_URL) return;
      
        (async () => {
          try {
            // pull token like your web axios instance would
            const userStr = await AsyncStorage.getItem("user");
            const me = userStr ? JSON.parse(userStr) : null;
            const headers = me?.token ? { Authorization: `Bearer ${me.token}` } : {};
      
            const friendsUrl = `${BACKEND_URL}/api/logs/movie/${id}/friends`;
            const popularUrl = `${BACKEND_URL}/api/logs/movie/${id}/popular`;
      
            const [friendsRes, popularRes] = await Promise.all([
              fetch(friendsUrl, { headers, credentials: "include" }),
              fetch(popularUrl, { headers, credentials: "include" }),
            ]);
      
            const [friendsText, popularText] = await Promise.all([
              friendsRes.text(),
              popularRes.text(),
            ]);
      
            const safeParse = (txt) => {
              try {
                return JSON.parse(txt);
              } catch {
                return null;
              }
            };
      
            const asArray = (x) =>
              Array.isArray(x)
                ? x
                : Array.isArray(x?.reviews)
                ? x.reviews
                : Array.isArray(x?.logs)
                ? x.logs
                : Array.isArray(x?.data)
                ? x.data
                : [];
      
            let friends = asArray(safeParse(friendsText));
            let popular = asArray(safeParse(popularText));
      
            // 🔄 fallback fetch if popular is empty
            if (popularRes.ok && popular.length === 0) {
              const fallbackRes = await fetch(`${popularUrl}?all=true`, {
                headers,
                credentials: "include",
              });
              const fallbackTxt = await fallbackRes.text();
              const fallbackArr = asArray(safeParse(fallbackTxt));
              if (fallbackRes.ok && fallbackArr.length) popular = fallbackArr;
            }
      
            // ✅ Normalize media-only reviews so r.gif / r.image always exist
            popular = popular.map((r) => {
              if (
                r.review === "__media__" ||
                r.review === "[GIF ONLY]" ||
                r.review === "[IMAGE ONLY]"
              ) {
                const hasGif = r.gif || (r.mediaUrl && r.mediaUrl.endsWith(".gif"));
                const hasImg =
                  r.image ||
                  (r.mediaUrl && !r.mediaUrl.endsWith(".gif") ? r.mediaUrl : null);
      
                return {
                  ...r,
                  review: "", // no text
                  gif: hasGif || null,
                  image: hasImg || null,
                };
              }
              return r;
            });
      
            setFriendLogs(friends);
            setPopularReviews(popular);
      
            if (__DEV__) {
              console.log("friends url→", friendsUrl, "status→", friendsRes.status);
              console.log("popular url→", popularUrl, "status→", popularRes.status);
              console.log("friends len→", friends.length, friends[0]);
              console.log("popular len→", popular.length, popular[0]);
            }
          } catch (e) {
            console.warn("Logs/reviews fetch failed:", e);
            setFriendLogs([]);
            setPopularReviews([]);
          }
        })();
      }, [id, BACKEND_URL]);
      
      
  

  const displayTitle = useMemo(() => pickDisplayTitle(movie, language), [movie, language]);

  const handleLikeReview = async (reviewId) => {
    try {
      const meStr = await AsyncStorage.getItem("user");
      const me = meStr ? JSON.parse(meStr) : null;
      if (!me?.token) return;

      // optimistic toggle
      setPopularReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId
            ? {
                ...r,
                likes: r.likes?.includes(me._id)
                  ? r.likes.filter((x) => x !== me._id)
                  : [...(r.likes || []), me._id],
              }
            : r
        )
      );

      setAnimatingLikes((prev) => [...prev, reviewId]);
      setTimeout(() => setAnimatingLikes((prev) => prev.filter((x) => x !== reviewId)), 400);

      await fetch(`${BACKEND_URL}/api/logs/${reviewId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${me.token}` },
      });
    } catch (e) {
      console.warn("like failed", e);
    }
  };

   useEffect(() => {
       const r = scrollRef.current;
       if (r?.scrollTo) {
         const idTimer = setTimeout(() => r.scrollTo({ y: 0, animated: true }), 0);
         return () => clearTimeout(idTimer);
       }
     }, [id]);

// Build the first message for SceneBot (spoiler-free opinion)
const makeAutoAsk = (m, lang) => {
    const yr = getYear(m?.release_date);
    const title = pickDisplayTitle(m, lang) || "this movie";
    const withYear = yr && yr !== "—" ? ` (${yr})` : "";
  
    if (lang === "ar") {
      return `بدون حرق أحداث: ما رأيك في «${title}»${withYear}؟ أعطني رأيًا مختصرًا وما الذي يميّزه، وأي ملاحظات سلبية إن وُجدت.`;
    }
  
    return `No spoilers: what do you think about “${title}”${withYear}? Give a brief take on what stands out, plus any downsides if relevant.`;
  };
  

  if (loading || !movie || !credits) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#B327F6" />
        <Text style={{ color: "#fff", marginTop: 10 }}>{String(t("loading_movie") || "Loading…")}</Text>
      </View>
    );
  }

  // director & starring (dual language)
  const directorLocal = credits.local?.crew?.find?.((p) => p.job === "Director");
  const directorEn = credits.en?.crew?.find?.((p) => p.job === "Director");
  const starringLocal = (credits.local?.cast || []).slice(0, 8);
  const starringEn = credits.en?.cast || [];

  const posterSrc = posterOverride || movie.poster || FALLBACK_POSTER;
  const backdropSrc = movie.backdrop_path ? `${TMDB_IMG_ORIG}${movie.backdrop_path}` : null;
  
  

  return (
    <View style={styles.container}>
      {/* ✅ Back + 3-dots menu */}
      <MovieTopBar
  movie={movie}                          // ✅ needed for tmdbId & logs
  setShowPosterModal={setShowPosterModal} 
  setShowAddToListModal={setShowAddToListModal}
/>



  <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 110 }}>
    {/* 🎬 Backdrop */}
    {backdropSrc ? (
  <View style={{ width: "100%", height: 280, backgroundColor: "#111" }}>
    <Image
      source={{ uri: backdropSrc }}
      style={{ width: "100%", height: "100%" }}
      resizeMode="cover"
    />
    <LinearGradient
  colors={[
    "rgba(14,14,14,0)", 
    "rgba(14,14,14,0.6)", 
    "rgba(14,14,14,1)"   // full black bottom
  ]}
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}
  style={{
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 280   // cover backdrop + extra
  }}
/>



  </View>
) : null}



{/* 🎬 Poster + Meta */}
<View
  style={{
    marginTop: -80,
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 16,
  }}
>
  <Image
    source={{ uri: posterSrc }}
    style={{
      width: 140,
      height: 210,
      borderRadius: 12,
      backgroundColor: "#222",
    }}
  />
  <View style={{ flex: 1, justifyContent: "flex-end" }}>
    <Text
      style={{
        fontSize: 20,
        fontWeight: "700",
        color: "#fff",
        fontFamily: "PixelifySans_700Bold",
      }}
    >
      {String(displayTitle)}
    </Text>

    {!!movie.tagline && (
      <Text
        style={{
          fontSize: 12,
          fontStyle: "italic",
          color: "#aaa",
          marginTop: 4,
        }}
      >
        {movie.tagline}
      </Text>
    )}

    <Text style={{ fontSize: 12, color: "#ccc", marginTop: 4 }}>
      {getYear(movie.release_date)} •{" "}
      {movie.runtime ? `${movie.runtime}m` : "—"}
    </Text>

    {!!movie.genres?.length && (
      <Text
        style={{ fontSize: 12, color: "#ccc", marginTop: 2 }}
        numberOfLines={2}
      >
        {String(movie.genres.map((g) => g.name).join(" • "))}
      </Text>
    )}


<View style={{ marginTop: 10 }}>
    {/* Top row: Log + Trailer */}
<View style={{ flexDirection: "row", gap: 8 }}>
  <TouchableOpacity
    style={[styles.btn, { flex: 1 }]}
    onPress={goToLog}
  >
    <Text style={styles.btnText}>+ {t("log")}</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.btn, { flex: 1 }]}
    onPress={openTrailer}
  >
    <Text style={styles.btnText}>🎞 {t("trailer")}</Text>
  </TouchableOpacity>
</View>

{/* Bottom row: SceneBot */}
<TouchableOpacity
  style={[styles.btn, { marginTop: 8 }]}
  onPress={() =>
    // push the SceneBot screen with a poster + autoAsk like the web
    navigation.navigate("SceneBotScreen", {
      movie: { id, poster: posterSrc, title: displayTitle },
      autoAsk: makeAutoAsk(movie, language),
    })
  }
>
  <Text style={styles.btnText}>🤖 {t("ask_scenebot")}</Text>
</TouchableOpacity>


</View>


  </View>
</View>

{/* Overview + Rating row */}
{isNonEmpty(movie.overview) && (
  <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text style={styles.sectionHeader}>{String(t("overview") || "Overview")}</Text>
      
      {!!movie.vote_average && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <StarRating rating={movie.vote_average} size={12} />
          <Text style={{ color: "#aaa", fontSize: 12 }}>
            {movie.vote_average.toFixed(1)} ({movie.vote_count})
          </Text>
        </View>
      )}
    </View>
    
    <Text style={styles.overviewText}>{String(movie.overview)}</Text>


  </View>
)}

{/* Director */}
<View style={{ paddingHorizontal: 16, marginTop: 24 }}>
  <Text style={styles.sectionHeader}>{String(t("director") || "Director")}</Text>
  {directorLocal ? (
    <TouchableOpacity
      onPress={() => stackNav.navigate("Director", { id: directorLocal.id })}
      style={{ flexDirection: "row", gap: 12, alignItems: "center", marginTop: 8 }}
    >
      <Image
        source={{
          uri: directorLocal.profile_path ? `${TMDB_IMG_AVATAR}${directorLocal.profile_path}` : FALLBACK_AVATAR,
        }}
        style={{ width: 70, height: 110, borderRadius: 10, backgroundColor: "#222" }}
        resizeMode="cover"
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.personName}>
          {String(directorLocal.name)}
          {directorEn?.name && directorEn.name !== directorLocal.name ? ` / ${directorEn.name}` : ""}
        </Text>
      </View>
    </TouchableOpacity>
  ) : (
    <Text style={styles.subtle}>{String(t("no_director_found") || "No director found")}</Text>
  )}
</View>


{/* ⭐ Starring */}
<View style={{ paddingHorizontal: 16, marginTop: 24 }}>
  <Text style={styles.sectionHeader}>
    {String(t("starring") || "Starring")}
  </Text>
  <FlatList
    data={starringLocal.slice(0, 4)} // ✅ Only top 4
    keyExtractor={(a) => String(a.id)}
    numColumns={4}
    columnWrapperStyle={{ gap: 10 }}
    contentContainerStyle={{ paddingTop: 10 }}
    renderItem={({ item }) => {
      const englishActor = starringEn.find((x) => x.id === item.id);
      const ITEM_W = (screenWidth - 16 * 2 - 10 * 3) / 4;
      const ITEM_H = Math.round(ITEM_W * 1.5); // 👈 maintain portrait ratio

      return (
        <TouchableOpacity
          style={{
            width: ITEM_W,
            alignItems: "center",
            marginBottom: 12,
          }}
          onPress={() => stackNav.navigate("Actor", { id: item.id })}
        >
          <Image
            source={{
              uri: item.profile_path
                ? `${TMDB_IMG_AVATAR}${item.profile_path}`
                : FALLBACK_AVATAR,
            }}
            style={{
              width: ITEM_W,
              height: ITEM_H,
              borderRadius: 10,
              backgroundColor: "#222",
            }}
          />
          <Text numberOfLines={2} style={styles.castName}>
            {String(item.name)}
            {englishActor?.name && englishActor.name !== item.name
              ? ` / ${englishActor.name}`
              : ""}
          </Text>
          <Text numberOfLines={2} style={styles.castRole}>
            {String(item.character || "")}
            {englishActor?.character &&
            englishActor.character !== item.character
              ? ` / ${englishActor.character}`
              : ""}
          </Text>
        </TouchableOpacity>
      );
    }}
  />
</View>

    {/* 🎯 Scene Ad Banner right after overview */}
    {/* Small Ad Banner (320x50) between Overview and Director */}
    <View style={{ alignItems: "center", marginTop: 16 }}>
  <SceneAdBanner size="BANNER" /> 
</View>





{/* Friends watched (compact) */}
<View style={{ paddingHorizontal: 16, marginTop: 20 }}>
  {(() => {
    const MAX_TILES = 5;
    const getUid = (l) =>
      l?.user?._id ??
      l?.userId ??
      l?.user_id ??
      (typeof l?.user === "string" ? l.user : null);

    if (!Array.isArray(friendLogs) || !friendLogs.length) {
      return (
        <>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text style={styles.sectionHeader}>
              {String(t("watched_by_friends") || "Watched by Friends")}
            </Text>
            {/* ✅ Always show More */}
            <TouchableOpacity
              onPress={() =>
                stackNav.navigate("MovieFriends", { id, initialFilter: "friends" })
              }
            >
              <Text style={[styles.subtle, { fontSize: 14 }]}>
                {String(t("more") || "More")}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtle}>
            {String(t("no_friends_logged") || "No friends logged yet")}
          </Text>
        </>
      );
    }

    // group by user
    const byUser = new Map();
    for (const log of friendLogs) {
      const uid = getUid(log);
      if (!uid) continue;
      if (!byUser.has(uid)) byUser.set(uid, []);
      byUser.get(uid).push(log);
    }

    // order: me first, then others
    const order = [];
    if (myId && byUser.has(myId)) {
      order.push(myId);
      byUser.delete(myId);
    }
    for (const uid of byUser.keys()) order.push(uid);

    const displayIds = order.slice(0, MAX_TILES);
    const extra = Math.max(0, order.length - displayIds.length);

    return (
      <>
        {/* Header with More (always visible) */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Text style={styles.sectionHeader}>
            {String(t("watched_by_friends") || "Watched by Friends")}
          </Text>
          <TouchableOpacity
            onPress={() =>
              stackNav.navigate("MovieFriends", { id, initialFilter: "friends" })
            }
          >
            <Text style={[styles.subtle, { fontSize: 14 }]}>
              {String(t("more") || "More")}
              {extra > 0 ? ` (${extra})` : ""}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {displayIds.map((uid, idx) => {
            const logs = friendLogs.filter((l) => getUid(l) === uid);
            const displayLog =
              logs.find((l) => typeof l.rating === "number") || logs[0];
            const hasRating = typeof displayLog?.rating === "number";

            const go = () => {
              stackNav.navigate("ProfileScreen", { id: uid });
            };

            const avatarRaw = displayLog?.user?.avatar;
            const avatar =
              typeof avatarRaw === "string" &&
              (avatarRaw.startsWith?.("http") || avatarRaw.startsWith?.("data:"))
                ? avatarRaw
                : FALLBACK_AVATAR;

            return (
              <TouchableOpacity
                key={`${uid}_${idx}`}
                onPress={go}
                style={{ width: 56, alignItems: "center" }}
              >
                <Image
                  source={{ uri: avatar }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#222",
                    marginBottom: 6,
                  }}
                />
                {hasRating ? (
                  <StarRating rating={Number(displayLog.rating) || 0} size={10} />
                ) : (
                  <View style={{ height: 16 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </>
    );
  })()}
</View>








{/* 📝 Popular Reviews */}
<View style={{ paddingHorizontal: 16, marginTop: 24 }}>
  {(() => {
    const cleaned = Array.isArray(popularReviews) ? popularReviews : [];

    // ✅ Always sort by likes (most liked first)
    const sorted = [...cleaned].sort(
      (a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)
    );

    // ✅ Take top 3
    const DISPLAY = sorted.slice(0, 3);
    const extra = Math.max(0, cleaned.length - DISPLAY.length);

    return (
      <>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Text style={styles.sectionHeader}>
            {String(t("popular_reviews") || "Popular Reviews")}
          </Text>
          <TouchableOpacity
            onPress={() => stackNav.navigate("MovieReviews", { id })}
          >
            <Text style={[styles.subtle, { fontSize: 14 }]}>
              {String(t("more") || "More")}
              {extra > 0 ? ` (${extra})` : ""}
            </Text>
          </TouchableOpacity>
        </View>

        {!DISPLAY.length ? (
          <Text style={styles.subtle}>
            {String(t("no_reviews") || "No reviews")}
          </Text>
        ) : (
          DISPLAY.map((r) => {
            const rawText = String(r.review || "").trim();
            const reviewText =
              !rawText || ["__media__", "[GIF ONLY]", "[IMAGE ONLY]"].includes(rawText)
                ? "" // ✅ treat as media-only
                : rawText;

            const words = reviewText ? reviewText.split(/\s+/) : [];
            const isLong = words.length > 30;
            const shortText = isLong ? words.slice(0, 30).join(" ") : reviewText;

            const meLiked =
              myId && Array.isArray(r.likes) && r.likes.includes(myId);
            const rewatchNum =
              typeof r.rewatchCount === "number"
                ? r.rewatchCount
                : typeof r.rewatch === "number"
                ? r.rewatch
                : 0;

            return (
              <View
                key={String(r._id)}
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: "#1e1e1e",
                  paddingBottom: 10,
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  {/* Avatar → Profile */}
                  <TouchableOpacity
                    onPress={() =>
                      stackNav.navigate("ProfileScreen", { id: r.user?._id })
                    }
                  >
                    <Image
                      source={{ uri: r.user?.avatar || FALLBACK_AVATAR }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: "#222",
                      }}
                    />
                  </TouchableOpacity>

                  <View style={{ flex: 1 }}>
                    {/* Username • stars • rewatch • time */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <TouchableOpacity
                        onPress={() =>
                          stackNav.navigate("ProfileScreen", { id: r.user?._id })
                        }
                      >
                        <Text style={styles.usernameText} numberOfLines={1}>
                          @{String(r.user?.username || "user")}
                        </Text>
                      </TouchableOpacity>

                      {typeof r.rating === "number" && (
                        <StarRating rating={Number(r.rating)} size={12} />
                      )}

                      {rewatchNum > 0 && (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <MaterialIcons name="refresh" size={12} color="#aaa" />
                          <Text style={{ fontSize: 10, color: "#aaa", marginLeft: 2 }}>
                            {rewatchNum}x
                          </Text>
                        </View>
                      )}

                      <Text style={{ fontSize: 10, color: "#888" }}>
                        {getRelativeTime(r.createdAt)}
                      </Text>
                    </View>

                    {/* Review text (if any) */}
                    {!!reviewText && (
                      <Text style={{ color: "#ddd", fontSize: 14, marginTop: 2 }}>
                        {shortText}
                        {isLong && (
                          <Text
                            style={{ color: "#B327F6", fontSize: 13, marginLeft: 4 }}
                          >
                            …
                          </Text>
                        )}
                      </Text>
                    )}

{/* ✅ Always render media if present */}
{!!r.gif && (
  <Image
    source={{ uri: r.gif }}
    style={{
      marginTop: 6,
      width: "100%",
      height: 250,       // ✅ fixed height so it always displays
      borderRadius: 8,
    }}
    resizeMode="contain" // ✅ ensures full media shows, no cropping
  />
)}

{!!r.image && (
  <Image
    source={{ uri: r.image }}
    style={{
      marginTop: 6,
      width: "100%",
      height: 250,       // ✅ same fixed height for images
      borderRadius: 8,
    }}
    resizeMode="contain"
  />
)}


                    {/* Actions */}
                    <View
                      style={{
                        marginTop: 6,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 14,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => handleLikeReview(r._id)}
                        style={{
                          paddingVertical: 2,
                          paddingHorizontal: 6,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                         <Ionicons
   name={meLiked ? "heart" : "heart-outline"}
   size={16}
   color={meLiked ? "#B327F6" : "#A6A6A6"}
 />
                        <Text
                          style={{
                            marginLeft: 6,
                            color: meLiked ? "#B327F6" : "#888",
                            fontSize: 12,
                          }}
                        >
                          {String(r.likes?.length ?? 0)}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() =>
                          stackNav.navigate("MovieReviews", {
                            id,
                            replyTo: r._id,
                            parentUsername: r.user?.username,
                          })
                        }
                      >
                        <Text style={[styles.subtle, { fontSize: 13 }]}>
                          {String(t("reply") || "Reply")}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* ✅ Show max 1 reply preview */}
                    {Array.isArray(r.replies) && r.replies.length > 0 && (
                      <View
                        style={{
                          marginTop: 6,
                          paddingLeft: 40,
                          borderLeftWidth: 2,
                          borderLeftColor: "#222",
                        }}
                      >
                        <Text style={{ color: "#aaa", fontSize: 13 }}>
                          @{r.replies[0].user?.username || "user"}:{" "}
                          {r.replies[0].text || "[media]"}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </>
    );
  })()}
</View>









        <MovieTabs
  activeTab={activeTab}
  setActiveTab={setActiveTab}
  credits={credits.local || credits.en}             // FullCastTab expects a TMDB credits shape
  navigate={(screen, params) => navigation.navigate(screen, params)}
  movieId={id}
  providers={providers}
  selectedRegion={selectedRegion}
  setSelectedRegion={setSelectedRegion}
  onNavigateToMovie={(nextId) => navigation.push("Movie", { id: nextId })}
/>
      </ScrollView>

            {/* 🖼 Change Poster Modal */}
            {showPosterModal && (
        <ChangePosterModal
          movieId={movie.id}
          onClose={() => setShowPosterModal(false)}
          onSave={handleSavePoster} // ✅ call backend + update state
        />
      )}
      {showAddToListModal && (
  <View style={{ position: "absolute", top: 100, left: 0, right: 0, padding: 20, backgroundColor: "#111" }}>
    <Text style={{ color: "#fff" }}>Add to List Modal (TODO)</Text>
    <TouchableOpacity onPress={() => setShowAddToListModal(false)}>
      <Text style={{ color: "red" }}>Close</Text>
    </TouchableOpacity>
  </View>
)}






      {/* Bottom Nav from tab navigator context */}
      <BottomNav state={tabNav.getState()} navigation={tabNav} />
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#0e0e0e",
    },
  
    // 🎬 Floating Back Button
    backBtn: {
      position: "absolute",
      top: 50, // adjust for safe area (iOS notch)
      left: 16,
      zIndex: 20,
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: 16,
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    backIcon: {
      color: "#fff",
      fontSize: 18,
    },
  
    // 🎬 Poster + Meta
    movieTitle: {
      color: "#fff",
      fontSize: 20,
      fontFamily: "PixelifySans_700Bold",
      marginBottom: 4,
    },
    subtle: {
      color: "#aaa",
      fontSize: 12,
    },
  
    // 🎬 Sections
    sectionHeader: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 6,
    },
    overviewText: {
      color: "#ddd",
      fontSize: 14.5,
      lineHeight: 20,
    },
  
    // 🎭 Cast / Director
    personName: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
    },
    castName: {
      marginTop: 6,
      color: "#fff",
      fontSize: 11.5,
      textAlign: "center",
      fontWeight: "600",
    },
    castRole: {
      color: "#aaa",
      fontSize: 10.5,
      textAlign: "center",
    },
  
    // 🎞 Buttons
    btn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      backgroundColor: "#111",
      borderWidth: 1,
      borderColor: "#444",
      alignItems: "center",      // ⬅️ centers horizontally
      justifyContent: "center",  // ⬅️ centers vertically
    },
    btnText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "500",
      textAlign: "center",
    },
    trailerBtn: {
      marginTop: 10,
      backgroundColor: "#B327F6",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      alignSelf: "flex-start",
    },
    trailerBtnText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "700",
    },
    rewatchText: { color: "#aaa", fontSize: 10, marginLeft: 2 },

    usernameText: {
        color: "#ddd",
        fontSize: 14,
        fontWeight: "500",
      },      
  });
  