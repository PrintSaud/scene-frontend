import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { formatDistanceToNowStrict } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import api from "../../../shared/api/api";
import useTranslate from "../../../shared/utils/useTranslate";
import { useLanguage } from "../../../shared/context/LanguageContext";
import StarRating from "../components/StarRating";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 768;

const SCENE_PURPLE = "#B327F6";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || "";
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "";

const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";
const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";

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

const formatTimestamp = (date, isArabic = false) => {
  if (!date) return "";

  return formatDistanceToNowStrict(new Date(date), {
    addSuffix: true,
    locale: isArabic ? arLocale : undefined,
  });
};

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.shows)) return value.shows;
  if (Array.isArray(value?.logs)) return value.logs;
  return [];
}

function firstArray(...values) {
  for (const value of values) {
    const arr = asArray(value);
    if (arr.length > 0) return arr;
  }

  return [];
}

function imageFromRaw(raw, fallback = FALLBACK_POSTER) {
  if (!raw) return fallback;
  const value = String(raw);

  if (value.startsWith("http")) return value;
  if (value.startsWith("/")) return `${TMDB_IMG}${value}`;

  return value;
}


function getEpisodeBackdropUrl(item) {
  const raw =
    item?.episodeBackdrop ||
    item?.episodeBackdropUrl ||
    item?.customEpisodeBackdrop ||
    item?.still ||
    item?.stillUrl ||
    item?.still_path ||
    item?.episode?.backdrop ||
    item?.episode?.backdropUrl ||
    item?.episode?.still ||
    item?.episode?.stillUrl ||
    item?.episode?.still_path ||
    item?.nextEpisode?.backdrop ||
    item?.nextEpisode?.backdropUrl ||
    item?.nextEpisode?.still ||
    item?.nextEpisode?.stillUrl ||
    item?.nextEpisode?.still_path ||
    item?.backdrop ||
    item?.backdropUrl ||
    item?.backdrop_path ||
    item?.show?.backdrop ||
    item?.show?.backdropUrl ||
    item?.show?.backdrop_path ||
    "";

  if (!raw) return "";
  if (String(raw).startsWith("http")) return raw;
  if (String(raw).startsWith("/")) return `${TMDB_IMG}${raw}`;
  return String(raw);
}

function getEpisodeTitle(item) {
  return (
    item?.episodeTitle ||
    item?.episode?.title ||
    item?.episode?.name ||
    item?.nextEpisode?.title ||
    item?.nextEpisode?.name ||
    getTitle(item)
  );
}

function getEpisodeNumberText(item) {
  const seasonNumber =
    item?.seasonNumber ||
    item?.season ||
    item?.episode?.seasonNumber ||
    item?.episode?.season ||
    item?.nextEpisode?.seasonNumber ||
    item?.nextEpisode?.season;

  const episodeNumber =
    item?.episodeNumber ||
    item?.episodeNo ||
    item?.episode?.episodeNumber ||
    item?.episode?.episodeNo ||
    item?.nextEpisode?.episodeNumber ||
    item?.nextEpisode?.episodeNo;

  if (seasonNumber && episodeNumber) return `S${seasonNumber} • E${episodeNumber}`;
  if (episodeNumber) return `Episode ${episodeNumber}`;
  return getSubtitle(item);
}

function getPosterUrl(item) {
  const raw =
    item?.poster ||
    item?.posterUrl ||
    item?.posterURL ||
    item?.poster_path ||
    item?.posterPath ||
    item?.tmdbPoster ||
    item?.tmdbPosterPath ||
    item?.image ||
    item?.imageUrl ||
    item?.imageURL ||
    item?.customShowPoster ||
    item?.customPoster ||
    item?.showPoster ||
    item?.showPosterUrl ||
    item?.show?.poster ||
    item?.show?.posterUrl ||
    item?.show?.posterURL ||
    item?.show?.poster_path ||
    item?.show?.posterPath ||
    item?.show?.tmdbPoster ||
    item?.show?.tmdbPosterPath ||
    item?.show?.image ||
    item?.show?.imageUrl ||
    item?.tvShow?.poster ||
    item?.tvShow?.posterUrl ||
    item?.tvShow?.poster_path ||
    item?.tvShow?.posterPath ||
    item?.media?.poster ||
    item?.media?.posterUrl ||
    item?.media?.poster_path ||
    item?.media?.posterPath ||
    item?.details?.poster ||
    item?.details?.posterUrl ||
    item?.details?.poster_path ||
    item?.details?.posterPath ||
    "";

  return imageFromRaw(raw, FALLBACK_POSTER);
}

function getTitle(item) {
  return (
    item?.title ||
    item?.name ||
    item?.showTitle ||
    item?.showName ||
    item?.show?.title ||
    item?.show?.name ||
    item?.tvShow?.title ||
    item?.tvShow?.name ||
    item?.media?.title ||
    item?.media?.name ||
    item?.details?.title ||
    item?.details?.name ||
    "Untitled"
  );
}

function getSubtitle(item) {
  if (item?.subtitle) return item.subtitle;
  if (item?.episodeTitle) return item.episodeTitle;

  const seasonNumber =
    item?.seasonNumber ||
    item?.season ||
    item?.episode?.seasonNumber ||
    item?.episode?.season;

  const episodeNumber =
    item?.episodeNumber ||
    item?.episode ||
    item?.episode?.episodeNumber;

  if (seasonNumber && episodeNumber) {
    return `S${seasonNumber} • E${episodeNumber}`;
  }

  if (item?.year) return String(item.year);
  if (item?.firstAirYear) return String(item.firstAirYear);
  if (item?.first_air_date) return String(item.first_air_date).slice(0, 4);
  if (item?.show?.year) return String(item.show.year);
  if (item?.show?.first_air_date) return String(item.show.first_air_date).slice(0, 4);

  return "";
}

function normalizeHomePayload(data) {
  const source =
    data?.data ||
    data?.home ||
    data?.tvHome ||
    data?.payload ||
    data ||
    {};

  const weeklyShow =
    source?.weeklyShow ||
    source?.showOfTheWeek ||
    source?.featuredShow ||
    source?.heroShow ||
    source?.hero ||
    source?.featured ||
    source?.weekly?.show ||
    source?.weekly ||
    null;

  const banners = firstArray(
    source?.banners,
    source?.tvBanners,
    source?.homeBanners,
    source?.heroBanners
  ).slice().reverse();

  const continueWatching = firstArray(
    source?.continueWatching,
    source?.watching,
    source?.inProgress,
    source?.progress,
    source?.sections?.continueWatching
  );

  const trendingShows = firstArray(
    source?.trendingShows,
    source?.trending,
    source?.popularShows,
    source?.popular,
    source?.sections?.trendingShows,
    source?.sections?.trending
  );

  const friendActivity = firstArray(
    source?.friendActivity,
    source?.recentFriendActivity,
    source?.friendsActivity,
    source?.activity,
    source?.feed,
    source?.sections?.friendActivity
  );

  const recentlyLogged = firstArray(
    source?.recentlyLogged,
    source?.recentLogs,
    source?.latestLogs,
    source?.logs,
    source?.sections?.recentlyLogged
  );

  return {
    weeklyShow,
    banners,
    continueWatching,
    trendingShows,
    friendActivity,
    recentlyLogged,
  };
}

function getShowId(item) {
  return (
    item?.showId ||
    item?.tmdbId ||
    item?.tmdb_id ||
    item?.id ||
    item?.show?.tmdbId ||
    item?.show?.tmdb_id ||
    item?.show?.id ||
    item?.show?._id ||
    item?.tvShow?.tmdbId ||
    item?.tvShow?.tmdb_id ||
    item?.tvShow?.id ||
    item?.media?.tmdbId ||
    item?.media?.id ||
    item?._id
  );
}

function TVHomeBanner({ banner, index, total, onPress }) {
  const designType = String(banner?.designType || "text");
  const hasImage = !!banner?.image;
  const hasButton = !!banner?.buttonText;
  const bg = banner?.backgroundColor || "#111";
  const textColor = banner?.textColor || "#ffffff";
  const buttonColor = banner?.buttonColor || SCENE_PURPLE;
  const buttonTextColor = banner?.buttonTextColor || "#ffffff";

  const isImage = designType === "image";
  const isMovie = designType === "movie";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(banner)}
      style={[
        styles.homeBannerCard,
        {
          width: screenWidth - 32,
          marginLeft: index === 0 ? 16 : 10,
          marginRight: index === total - 1 ? 16 : 0,
          backgroundColor: bg,
        },
      ]}
    >
      {(isImage || isMovie) && hasImage && (
        <Image source={{ uri: banner.image }} style={styles.homeBannerImage} />
      )}

      {(isImage || isMovie) && hasImage && (
        <View style={styles.homeBannerDarkOverlay} />
      )}

      <View style={styles.homeBannerContent}>
        <Text
          style={[styles.homeBannerTitle, { color: textColor }]}
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
          <View style={[styles.homeBannerButton, { backgroundColor: buttonColor }]}>
            <Text style={[styles.homeBannerButtonText, { color: buttonTextColor }]}>
              {banner.buttonText}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function WeeklyShowCard({ show, onPress }) {
  if (!show) {
    return (
      <>
        <Text style={styles.dailyTagline}>
          New Week. New Amazing Show. It’s a Scene Thing. 📺
        </Text>

        <View style={styles.weeklyShowCard}>
          <View style={styles.weeklyPosterFallback}>
            <MaterialCommunityIcons
              name="television-classic"
              color="#555"
              size={42}
            />
          </View>

          <View style={{ flex: 1, padding: 12 }}>
            <Text style={styles.weeklyTitle}>Scene TV is connected.</Text>
            <Text style={styles.weeklyOverview}>
              Weekly shows, progress, reviews, and friends activity will appear here.
            </Text>
          </View>
        </View>
      </>
    );
  }

  const posterUrl = getPosterUrl(show);
  const overview =
    show?.overview ||
    show?.description ||
    show?.summary ||
    t("Track your episodes, reviews, progress, and friends’ reactions.");

  const snippet = String(overview).split(" ").slice(0, 24).join(" ");

  return (
    <>
      <Text style={styles.dailyTagline}>
        New Week. New Amazing Show. It’s a Scene Thing. 📺
      </Text>

      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.weeklyShowCard}
        onPress={() => onPress(show)}
      >
        <Image source={{ uri: posterUrl }} style={styles.weeklyPoster} />

        <View style={{ flex: 1, padding: 12, marginBottom: 8 }}>
          <Text style={styles.weeklyEyebrow}>This Week on Scene TV</Text>

          <Text style={styles.weeklyTitle} numberOfLines={2}>
            {getTitle(show)}
          </Text>

          {!!getSubtitle(show) && (
            <Text style={styles.weeklySubtitle} numberOfLines={1}>
              {getSubtitle(show)}
            </Text>
          )}

          <Text style={styles.weeklyOverview} numberOfLines={4}>
            {snippet}
            {snippet ? "... " : ""}
            <Text style={styles.readMore}>Read more</Text>
          </Text>
        </View>
      </TouchableOpacity>
    </>
  );
}

function ContinueWatchingCard({ item, onPress }) {
  const backdropUrl = getEpisodeBackdropUrl(item);
  const title = getEpisodeTitle(item);
  const episodeText = getEpisodeNumberText(item);
  const showTitle = getTitle(item?.show || item?.tvShow || item);
  const progress =
    Number(item?.progressPercent ?? item?.percent ?? item?.completionPercent ?? 0) || 0;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.continueEpisodeCard}
      onPress={() => onPress(item)}
    >
      <View style={styles.continueBackdropWrap}>
        {backdropUrl ? (
          <Image source={{ uri: backdropUrl }} style={styles.continueBackdrop} />
        ) : (
          <View style={styles.continueBackdropFallback}>
            <MaterialCommunityIcons
              name="television-play"
              size={34}
              color="#555"
            />
          </View>
        )}

        <View style={styles.continueBackdropShade} />

        {!!episodeText && (
          <View style={styles.episodeBadge}>
            <Text style={styles.episodeBadgeText}>{episodeText}</Text>
          </View>
        )}
      </View>

      <Text style={styles.continueEpisodeTitle} numberOfLines={2}>
        {title}
      </Text>

      {!!showTitle && showTitle !== title && (
        <Text style={styles.continueShowTitle} numberOfLines={1}>
          {showTitle}
        </Text>
      )}

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.max(8, Math.min(100, progress || 20))}%`,
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

function TVActivityCard({ log, navigation, language }) {
  const show = log?.show || log?.tvShow || log?.media || log;
  const id = getShowId(log);
  const posterUrl = getPosterUrl(show);
  const timestamp = formatTimestamp(log?.createdAt, language === "ar");

  const avatar = log?.user?.avatar?.startsWith?.("http")
    ? log.user.avatar
    : log?.user?.avatar && BACKEND_URL
    ? `${BACKEND_URL}${log.user.avatar}`
    : FALLBACK_AVATAR;

  const rating = Number(log?.rating) || 0;

  const goTo = () => {
    if (log?._id) {
      navigation.navigate("TVReview", { id: String(log._id) });
      return;
    }

    if (id) {
      navigation.navigate("Show", { id });
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.86} onPress={goTo} style={styles.card}>
      <Image source={{ uri: posterUrl }} style={styles.poster} />

      {!!timestamp && <Text style={styles.timestamp}>{timestamp}</Text>}

      <View style={styles.userRow}>
        <Image source={{ uri: avatar }} style={styles.userAvatar} />
        <Text style={styles.username}>{log?.user?.username || ""}</Text>
      </View>

      <View style={styles.iconRow}>
        <StarRating rating={rating} size={12} />

        {!!log?.review && (
          <MaterialCommunityIcons
            name="chat-outline"
            size={12}
            color="#aaa"
            style={{ marginLeft: -4 }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function TVHomeScreen({ onSwitchMode, switchingMode }) {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const t = useTranslate();
  const { language } = useLanguage();

  const [user, setUser] = useState(null);
  const [homeData, setHomeData] = useState(null);
  const [tmdbTrending, setTmdbTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [error, setError] = useState("");

  const dotWidths = useRef(
    [0, 1, 2].map((idx) => new Animated.Value(currentSection === idx ? 100 : 30))
  ).current;

  const normalized = useMemo(
    () => normalizeHomePayload(homeData || {}),
    [homeData]
  );

  const fetchUser = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("user");
      setUser(stored ? JSON.parse(stored) : null);
    } catch {
      setUser(null);
    }
  }, []);

  const fetchTMDBTrending = useCallback(async () => {
    try {
      if (!TMDB_KEY) {
        console.log("⚠️ TMDB key missing — skipping TV trending fetch");
        setTmdbTrending([]);
        return;
      }

      const urls = [
        `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_KEY}`,
        `https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_KEY}`,
      ];

      for (const url of urls) {
        const res = await fetch(url);
        const data = await res.json();
        const results = Array.isArray(data?.results) ? data.results : [];

        if (results.length > 0) {
          console.log("📺 TMDB TV fallback loaded:", results.length, {
            firstTitle: results[0]?.name,
            firstPoster: results[0]?.poster_path,
          });
          setTmdbTrending(results);
          return;
        }
      }

      setTmdbTrending([]);
    } catch (err) {
      console.log("Failed to fetch TMDB TV trending:", err?.message || err);
      setTmdbTrending([]);
    }
  }, []);

  const fetchTVHome = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError("");

      const { data } = await api.get("/api/tv-home");

      console.log("�� TV HOME RAW:", JSON.stringify(data, null, 2));

      const normalizedPreview = normalizeHomePayload(data || {});
      console.log("📺 TV HOME COUNTS:", {
        banners: normalizedPreview.banners.length,
        continueWatching: normalizedPreview.continueWatching.length,
        trendingShows: normalizedPreview.trendingShows.length,
        friendActivity: normalizedPreview.friendActivity.length,
        recentlyLogged: normalizedPreview.recentlyLogged.length,
        weeklyShowKeys: normalizedPreview.weeklyShow
          ? Object.keys(normalizedPreview.weeklyShow)
          : [],
        firstContinueKeys: normalizedPreview.continueWatching[0]
          ? Object.keys(normalizedPreview.continueWatching[0])
          : [],
        firstTrendingKeys: normalizedPreview.trendingShows[0]
          ? Object.keys(normalizedPreview.trendingShows[0])
          : [],
      });

      setHomeData(data || {});
    } catch (err) {
      console.log("Failed to fetch TV Home:", err?.response?.data || err?.message);
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          t("Could not load TV Home.")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isFocused) return;

    fetchUser();
    fetchTVHome();
    fetchTMDBTrending();
  }, [fetchTMDBTrending, fetchTVHome, fetchUser, isFocused]);

  useEffect(() => {
    dotWidths.forEach((anim, idx) => {
      Animated.timing(anim, {
        toValue: currentSection === idx ? 150 : 30,
        duration: 120,
        useNativeDriver: false,
      }).start();
    });
  }, [currentSection, dotWidths]);

  const onRefresh = async () => {
    setRefreshing(true);

    await Promise.all([
      fetchTVHome({ silent: true }),
      fetchTMDBTrending(),
      fetchUser(),
    ]);
  };

  const handleBannerPress = async (banner) => {
    try {
      if (!banner) return;

      const actionType = String(banner.actionType || "none");
      const actionValue = String(banner.actionValue || "").trim();

      if (!actionValue || actionType === "none") return;

      if (actionType === "url") {
        const canOpen = await Linking.canOpenURL(actionValue);
        if (canOpen) await Linking.openURL(actionValue);
        return;
      }

      if (actionType === "screen") {
        navigation.navigate(actionValue);
        return;
      }

      if (actionType === "show" || actionType === "tv") {
        navigation.navigate("Show", { id: actionValue });
      }
    } catch (err) {
      console.error("❌ Failed TV banner action:", err);
    }
  };

  const openShow = (item) => {
    const id = getShowId(item);

    if (id) {
      navigation.navigate("Show", {
        id,
        showTmdbId: id,
      });
    }
  };

  const openTVTrending = () => {
    const parentNavigation = navigation.getParent?.();

    if (parentNavigation?.navigate) {
      parentNavigation.navigate("TVTrending");
      return;
    }

    navigation.navigate("TVTrending");
  };

  const feedData = useMemo(() => {
    const source = normalized.friendActivity.length
      ? normalized.friendActivity
      : normalized.recentlyLogged;

    return source.slice(0, 18);
  }, [normalized.friendActivity, normalized.recentlyLogged]);

  const trendingData = useMemo(() => {
    const backendTrending = normalized.trendingShows.slice(0, 8);

    if (backendTrending.length > 0) return backendTrending;

    return tmdbTrending.slice(0, 8);
  }, [normalized.trendingShows, tmdbTrending]);

  const avatarUri = user?.avatar?.startsWith?.("http")
    ? user.avatar
    : user?.avatar && BACKEND_URL
    ? `${BACKEND_URL}${user.avatar}`
    : FALLBACK_AVATAR;

  const HeaderBlock = useMemo(
    () => (
      <View>
        <View style={styles.header}>
          <View style={styles.modeSwitchMini}>
            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.modeSwitchMiniItem}
              onPress={() => onSwitchMode?.("movies")}
              disabled={switchingMode}
            >
              <MaterialCommunityIcons
                name="filmstrip"
                size={12}
                color="#8a8a8a"
              />
              <Text style={styles.modeSwitchMiniText}>Movies</Text>
            </TouchableOpacity>

            <View style={styles.modeSwitchMiniActive}>
              <MaterialCommunityIcons
                name="television-classic"
                size={12}
                color="#fff"
              />
              <Text style={styles.modeSwitchMiniActiveText}>TV</Text>
            </View>
          </View>

          <Text style={styles.welcomeText}>
            {t("Welcome back, {name} 🎬").replace(
              "{name}",
              user?.username || user?.name || ""
            )}
          </Text>

          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {normalized.banners.length > 0 && (
          <View style={styles.homeBannerWrap}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.homeBannerScrollContent}
            >
              {normalized.banners.map((banner, index) => (
                <TVHomeBanner
                  key={banner?._id || banner?.id || index}
                  banner={banner}
                  index={index}
                  total={normalized.banners.length}
                  onPress={handleBannerPress}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <WeeklyShowCard show={normalized.weeklyShow} onPress={openShow} />

        <Text style={styles.sectionTitle}>{t("Continue Watching")}</Text>

        {normalized.continueWatching.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.continueScroll}
          >
            {normalized.continueWatching.slice(0, 3).map((item, index) => (
              <ContinueWatchingCard
                key={item?._id || item?.id || index}
                item={item}
                onPress={openShow}
              />
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.emptyText}>
            Your episode progress will appear here.
          </Text>
        )}

        <Text style={styles.sectionTitle}>Recent TV Activities</Text>

        {feedData.length > 0 ? (
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
                    {feedData.slice(start, start + 6).map((log, i) => {
                      const isLastInRow = i % FEED_COLS === FEED_COLS - 1;

                      return (
                        <View
                          key={String(log?._id || log?.id || `${start}-${i}`)}
                          style={{
                            width: FEED_ITEM_W,
                            marginRight: isLastInRow ? 0 : FEED_GAP,
                            marginBottom: FEED_GAP,
                          }}
                        >
                          <TVActivityCard
                            log={log}
                            navigation={navigation}
                            language={language}
                          />
                        </View>
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
          <Text style={styles.emptyText}>No recent TV logs yet.</Text>
        )}

        <View style={styles.trendingHeader}>
          <Text style={styles.sectionTitle}>Trending Shows </Text>

          <TouchableOpacity
  onPress={() => {
    const parentNavigation = navigation.getParent?.();

    if (parentNavigation?.navigate) {
      parentNavigation.navigate("TVTrending");
      return;
    }

    navigation.navigate("TVTrending");
  }}
  style={{ flexDirection: "row", alignItems: "center" }}
>
  <Text style={styles.moreText}>{t("More →")}</Text>
</TouchableOpacity>
        </View>
      </View>
    ),
    [
      avatarUri,
      currentSection,
      dotWidths,
      error,
      feedData,
      language,
      navigation,
      openTVTrending,
      normalized.banners,
      normalized.continueWatching,
      normalized.weeklyShow,
      t,
      switchingMode,
      onSwitchMode,
      user?.name,
      user?.username,
    ]
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={SCENE_PURPLE} />
        <Text style={{ color: "#fff", marginTop: 10 }}>
          Loading Scene TV...
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={trendingData}
      keyExtractor={(item, index) => String(getShowId(item) || index)}
      numColumns={TRENDING_COLS}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ paddingBottom: 175 }}
      columnWrapperStyle={{
        gap: TRENDING_GAP,
        paddingHorizontal: TRENDING_SIDE,
      }}
      ListHeaderComponent={HeaderBlock}
      ListEmptyComponent={
        !error ? (
          <Text style={styles.emptyText}>Trending shows will appear here.</Text>
        ) : null
      }
      renderItem={({ item }) => (
        <TouchableOpacity activeOpacity={0.86} onPress={() => openShow(item)}>
          <Image
            source={{ uri: getPosterUrl(item) }}
            style={{
              width: TRENDING_ITEM_W,
              height: Math.round(TRENDING_ITEM_W * 1.5),
              borderRadius: 6,
              marginBottom: TRENDING_GAP,
              backgroundColor: "#111",
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

  header: {
    alignItems: "center",
    marginTop: 92,
    marginBottom: 34,
    position: "relative",
    minHeight: 185,
  },

  welcomeText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "700",
    fontFamily: "PixelifySans_700Bold",
    textAlign: "center",
    paddingHorizontal: 72,
    marginBottom: -50,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: 90,
  },

  modeSwitchMini: {
    position: "absolute",
    right: 18,
    top: 42,
    padding: 3,
    borderRadius: 13,
    backgroundColor: "rgba(18,18,18,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    zIndex: 5,
  },

  modeSwitchMiniItem: {
    width: 38,
    height: 55,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  modeSwitchMiniActive: {
    width: 38,
    height: 55,
    borderRadius: 34,
    backgroundColor: "#B327F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
  },

  modeSwitchMiniText: {
    color: "#8a8a8a",
    fontSize: 7,
    fontWeight: "800",
    marginTop: -2,
  },

  modeSwitchMiniActiveText: {
    color: "#fff",
    fontSize: 7,
    fontWeight: "900",
    marginTop: -2,
  },

  modeSwitchTop: {
    flexDirection: "column",
    alignItems: "center",
    alignSelf: "flex-end",
    padding: 5,
    borderRadius: 22,
    backgroundColor: "rgba(18,18,18,0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginRight: 14,
    marginBottom: 24,
  },

  modeSwitchItem: {
    width: 54,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },

  modeSwitchActive: {
    width: 54,
    height: 42,
    borderRadius: 16,
    backgroundColor: SCENE_PURPLE,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },

  modeSwitchDivider: {
    width: 26,
    height: 1,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 3,
  },

  modeSwitchText: {
    color: "#8a8a8a",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 1,
  },

  modeSwitchActiveText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
    marginTop: 1,
  },

  errorBox: {
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,80,80,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,80,80,0.25)",
  },

  errorText: {
    color: "#ff9f9f",
    fontSize: 12.5,
    fontWeight: "700",
  },

  homeBannerWrap: {
    marginTop: 2,
    marginBottom: 20,
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
    paddingHorizontal: 20,
    paddingVertical: 18,
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

  dailyTagline: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
    marginBottom: 26,
    fontFamily: "PixelifySans_700Bold",
  },

  weeklyShowCard: {
    flexDirection: "row",
    backgroundColor: "#111",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: "hidden",
    minHeight: 220,
  },

  weeklyPoster: {
    width: 150,
    height: 220,
    backgroundColor: "#151515",
  },

  weeklyPosterFallback: {
    width: 150,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#151515",
  },

  weeklyEyebrow: {
    color: SCENE_PURPLE,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  weeklyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
    fontFamily: "PixelifySans_700Bold",
  },

  weeklySubtitle: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 12,
    fontWeight: "700",
  },

  weeklyOverview: {
    fontSize: 13.5,
    color: "#ccc",
    fontFamily: "PixelifySans_700Bold",
    marginBottom: 8,
    lineHeight: 18,
  },

  readMore: {
    color: SCENE_PURPLE,
    fontWeight: "500",
  },

  sectionTitle: {
    fontSize: 18,
    color: "#fff",
    marginVertical: 20,
    paddingHorizontal: 16,
    fontFamily: "PixelifySans_700Bold",
  },

  continueScroll: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 6,
  },

  continueEpisodeCard: {
    width: 178,
  },

  continueBackdropWrap: {
    width: 178,
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  continueBackdrop: {
    width: "100%",
    height: "100%",
  },

  continueBackdropFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#151515",
  },

  continueBackdropShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "55%",
    backgroundColor: "rgba(0,0,0,0.33)",
  },

  episodeBadge: {
    position: "absolute",
    left: 8,
    bottom: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.68)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  episodeBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
  },

  continueEpisodeTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 7,
    lineHeight: 16,
  },

  continueShowTitle: {
    color: "#aaa",
    fontSize: 10.5,
    marginTop: 2,
    fontWeight: "700",
  },

  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: "#242424",
    marginTop: 7,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: SCENE_PURPLE,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },

  card: {
    position: "relative",
  },

  poster: {
    width: "100%",
    height: isTablet ? 340 : 190,
    borderRadius: 6,
    backgroundColor: "#111",
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

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  userAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },

  username: {
    fontSize: 12,
    color: "#fff",
  },

  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    gap: 6,
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

  trendingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 2,
    marginBottom: 2,
  },

  moreText: {
    color: "#ccc",
    fontSize: 14,
    marginRight: 16,
  },

  emptyText: {
    color: "#888",
    marginTop: 1,
    paddingHorizontal: 16,
    fontFamily: "PixelifySans_700Bold",
  },
});
