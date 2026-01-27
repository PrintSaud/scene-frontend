// src/components/profile/ProfileTabProfile.js
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import StarRating from "../StarRating";
import getPosterUrl from "shared/utils/getPosterUrl";
import useTranslate from "shared/utils/useTranslate";
import { getPlatformIcon } from "shared/utils/getPlatformIcon";

const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";
const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";

const toTmdbId = (x) => {
  if (x == null) return null;
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string" && /^\d+$/.test(x)) return Number(x);
  if (typeof x === "object") {
    const cand = x.tmdbId ?? x.id ?? x.movieId ?? x.movie?.tmdbId ?? x.movie?.id;
    const n = Number(cand);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

export default function ProfileTabProfile({
  user,
  favoriteMovies = [],
  logs = [],
  profileUserId,
  customPosters = {},
}) {
  const navigation = useNavigation();
  const t = useTranslate();
  const [showConnections, setShowConnections] = useState(true);

  // —— feed layout (3 cols, edge-to-edge) ——
  const FEED_COLS = 3;
  const FEED_GAP = 12;
  const HEADER_SIDE = 16;
  const GRID_SIDE = 0;

  const [gridW, setGridW] = useState(
    Dimensions.get("window").width - GRID_SIDE * 2
  );
  const handleGridLayout = (e) => {
    const outerW = e.nativeEvent.layout.width;
    setGridW(Math.max(0, outerW - GRID_SIDE * 2));
  };

  const TILE_W = Math.floor((gridW - FEED_GAP * (FEED_COLS - 1)) / FEED_COLS);
  const POSTER_H = Math.round(TILE_W * 1.5);

  // ✅ Scene-style time formatter
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
      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const m = monthNames[x.getUTCMonth()];
      const dd = x.getUTCDate();
      return `${m} ${dd}`;
    }
  };

  // last 6 logs
  const recentlyWatched = useMemo(() => {
    const arr = Array.isArray(logs) ? logs : [];
    return arr
      .slice()
      .sort((a, b) => {
        const ad = new Date(a?.createdAt ?? a?.watchedAt ?? 0).getTime();
        const bd = new Date(b?.createdAt ?? b?.watchedAt ?? 0).getTime();
        return bd - ad;
      })
      .slice(0, 6);
  }, [logs]);

  

  return (
    <View style={{ marginTop: 16 }} onLayout={handleGridLayout}>
      {/* 🎬 Favorite Movies */}
      {favoriteMovies?.length > 0 ? (
        <View>
          <Text style={styles.sectionTitle}>{t("Favorite Movies")}</Text>
          <View style={styles.favMoviesRow}>
            {favoriteMovies.slice(0, 4).map((movie, idx) => {
              const id = toTmdbId(movie);
              if (!id) return null;

              const posterUrl = getPosterUrl({
                tmdbId: id,
                posterPath: movie.poster_path || movie.poster || null,
                override: customPosters?.[id],
                size: "w342",
              });

              return (
                <TouchableOpacity
                  key={`${id}-${idx}-${customPosters?.[id] || ""}`}
                  onPress={() => navigation.navigate("Movie", { id })}
                  style={styles.favPosterWrapper}
                >
                  <Image
                    source={{ uri: posterUrl || FALLBACK_POSTER }}
                    style={styles.posterFill}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : (
        <Text style={styles.emptyText}>{t("No favorite movies yet.")}</Text>
      )}

      {/* 👀 Recent Activities */}
      <View style={{ marginTop: 20, }}>
        <View style={[styles.sectionHeader, { paddingHorizontal: HEADER_SIDE, marginLeft: -14 }]}>
          <Text style={styles.sectionTitle}>{t("Recent Activities")}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Films")}>
            <Text style={styles.moreBtn}>{t("More →")}</Text>
          </TouchableOpacity>
        </View>

        {recentlyWatched?.length > 0 ? (
          <View style={{ paddingHorizontal: GRID_SIDE }}>
            <View style={styles.feedGrid}>
            {recentlyWatched.map((log, i) => {
  // movie (TMDB) id for posters / Movie screen
  const id = toTmdbId(log?.tmdbId ?? log?.movie ?? log?.movieId ?? log?.movie?.id);
  if (!id) return null;

  const posterUrl =
    log?.posterOverride ||
    getPosterUrl({
      tmdbId: log.tmdbId || log.movie?.id,
      posterPath: log.movie?.poster_path || log.poster,
      override: customPosters[id],
    }) ||
    FALLBACK_POSTER;

  // 👇 consider text + media-only (“__media__”, gif, image)
  const raw = (log?.review || "").trim();
  const hasTextReview = !!raw && !["__media__", "[GIF ONLY]", "[IMAGE ONLY]"].includes(raw);
  const hasMedia = !!(log?.gif || log?.image || raw === "__media__");
  const hasReviewOrMedia = hasTextReview || hasMedia;

  const timestamp = getRelativeTime(log?.createdAt || log?.watchedAt || Date.now());
  const isLastInRow = ((i + 1) % FEED_COLS) === 0;

  const goTo = () => {
    if (hasReviewOrMedia && log?._id) {
      // ✅ open the review by its LOG id
      navigation.navigate("ReviewPage", { id: String(log._id) });
    } else {
      // ✅ otherwise open the movie by TMDB id
      navigation.navigate("Movie", { id });
    }
  };

  return (
    <TouchableOpacity
      key={String(log._id || i)}
      onPress={goTo}
      style={[
        styles.card,
        {
          width: TILE_W,
          marginRight: isLastInRow ? 0 : FEED_GAP,
          marginBottom: FEED_GAP,
        },
      ]}
    >
      <View style={{ position: "relative" }}>
        <Image
          source={{ uri: posterUrl }}
          style={[styles.poster, { width: "100%", height: POSTER_H }]}
        />
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>

      <View style={styles.metaRow}>
        <StarRating rating={Number(log?.rating) || 0} size={12} />
        {hasTextReview && (
          <MaterialCommunityIcons
            name="chat-outline"
            size={12}
            color="#aaa"
            style={{ marginLeft: -2 }}
          />
        )}
        {Number(log?.rewatchCount ?? log?.rewatch) > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialIcons name="refresh" size={12} color="#aaa" style={{ marginLeft: -2 }} />
            <Text style={styles.rewatchText}>{(log?.rewatchCount ?? log?.rewatch) || 0}x</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
})}

            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>{t("No recent logs yet.")}</Text>
        )}
      </View>

{/* 🔗 Connections */}
{Object.values(user?.socials || {}).some(Boolean) && (
  <View style={{ marginTop: 16 }}>
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { fontSize: 16 }]}>
        {t("Connections")}
      </Text>
      <TouchableOpacity onPress={() => setShowConnections((prev) => !prev)}>
        <Text style={styles.moreBtn}>
          {showConnections ? t("Hide") : t("Show")}
        </Text>
      </TouchableOpacity>
    </View>

    {showConnections && (
      <View style={{ marginTop: 6 }}>
        {
            Object.entries(user?.socials || user?.connections || {})
          .filter(([, val]) => !!val)
          .map(([platform, raw]) => {
            const value = String(raw).trim();

            // strip http(s):// and @ → show clean username
            const handle = value
              .replace(/^https?:\/\/(www\.)?/, "")
              .replace(/^@/, "")
              .replace(/\/$/, "");

            const DOMAIN = {
              X: "x.com",
              twitter: "x.com",
              instagram: "instagram.com",
              tiktok: "tiktok.com",
              youtube: "youtube.com",
              imdb: "imdb.com",
              tmdb: "themoviedb.org",
              website: null,
            };

            const ensureHttp = (url) =>
              /^https?:\/\//i.test(url) ? url : `https://${url}`;

            const link =
              platform === "website"
                ? ensureHttp(value)
                : ensureHttp(`${DOMAIN[platform] || `${platform}.com`}/${handle}`);

            return (
              <TouchableOpacity
                key={platform}
                activeOpacity={0.9}
                style={styles.socialCard}
                onPress={() => Linking.openURL(link)}
              >
                <View style={styles.socialLeft}>
                  <View style={{ marginRight: 12 }}>
                    {getPlatformIcon(platform, 20, "#fff")}
                  </View>
                  <View style={styles.socialValueWrap}>
                    {/* 👤 Show only username/slug */}
                    <Text numberOfLines={1} style={styles.socialValue}>
                      {handle}
                    </Text>
                    <View style={styles.verifyPill}>
                      <MaterialIcons name="check" size={12} color="#fff" />
                    </View>
                  </View>
                </View>
                <MaterialIcons name="open-in-new" size={18} color="#aaa" />
              </TouchableOpacity>
            );
          })}
      </View>
    )}
  </View>
)}

    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "white", marginBottom: 6,  },
  emptyText: { color: "#888", marginTop: 20, textAlign: "center", fontSize: 13 },

  // Favorites
  favMoviesRow: {
    flexDirection: "row",
    justifyContent: "flex-start", // evenly spread across row
    marginTop: 8,
  },
  favPosterWrapper: {
    flex: 1,                // take equal space
    aspectRatio: 2 / 3,     // keep poster ratio
    marginHorizontal: 4,    // spacing between
    maxWidth: "24%",        // max 4 posters across
  },
  posterFill: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    resizeMode: "cover",
  },
  

  // generic poster
  poster: { borderRadius: 6, resizeMode: "cover" },

  // Recent Activities
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  moreBtn: { fontSize: 13, color: "#ccc" },
  feedGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 4, width: "100%" },
  card: { backgroundColor: "transparent" },
  timestamp: {
    position: "absolute",
    top: 6,
    right: 6,
    fontSize: 10,
    color: "white", // ✅ forced white
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 4 },
  rewatchText: { fontSize: 10, color: "#aaa", marginLeft: 2 },

  // Connections
  socialCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    
  },
  socialLeft: { flexDirection: "row", alignItems: "center", gap: 12,  },
  socialValueWrap: { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: "75%" },
  socialValue: { color: "white", fontSize: 14, fontWeight: "500" , right: 20, },
  verifyPill: {
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    justifyContent: "center",
    alignItems: "center",
    right: 24,
  },
});
