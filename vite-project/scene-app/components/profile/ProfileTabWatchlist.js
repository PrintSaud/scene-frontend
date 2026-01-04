// src/components/profile/ProfileTabWatchlist.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Dimensions,
  Modal,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api, { getCustomPostersBatch } from "shared/api/api";
import getPosterUrl from "shared/utils/getPosterUrl";
import useTranslate from "shared/utils/useTranslate";

const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";

/* ---------------- id util ---------------- */
function toTmdbIdAny(x) {
  const id =
    x?.tmdbId ??
    x?.movie?.tmdbId ??
    x?.movie?.id ??
    x?.movieId ??
    x?.id ??
    (typeof x === "number" || (typeof x === "string" && /^\d+$/.test(x)) ? x : null);
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

/* ---------------- parse helpers (robust) ---------------- */
const toNum = (v) => {
  if (v == null) return NaN;
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const safeTime = (d) => {
  if (!d) return NaN;
  const ts = new Date(d).getTime();
  return Number.isFinite(ts) ? ts : NaN;
};

// runtime strings: "142", "142 min", "2h 22m", "02:22", "PT142M", "PT2H22M"
const parseRuntime = (v) => {
  if (v == null) return NaN;
  if (typeof v === "number") return v;

  if (typeof v === "string") {
    // ISO 8601 duration PT#H#M
    const iso = v.match(/^PT(?:(\d+)H)?(?:(\d+)M)?/i);
    if (iso) {
      const h = iso[1] ? Number(iso[1]) : 0;
      const m = iso[2] ? Number(iso[2]) : 0;
      return h * 60 + m;
    }

    // "2h 22m" / "2h" / "22m"
    const hm = v.match(/^\s*(\d+)\s*h(?:ours?)?\s*(\d+)?\s*m?/i);
    if (hm) return Number(hm[1]) * 60 + (hm[2] ? Number(hm[2]) : 0);
    const mins = v.match(/^\s*(\d+)\s*m(?:in)?/i);
    if (mins) return Number(mins[1]);

    // "02:22" -> hours:minutes OR minutes:seconds, assume h:mm if > 1h
    const colon = v.match(/^\s*(\d+):(\d{1,2})\s*$/);
    if (colon) {
      const a = Number(colon[1]);
      const b = Number(colon[2]);
      if (a >= 2) return a * 60 + b; // looks like H:MM
      // If ambiguous, still interpret as H:MM
      return a * 60 + b;
    }

    const n = parseFloat(v);
    if (Number.isFinite(n)) return n;
  }

  return NaN;
};

const getReleaseDate = (m) =>
  m?.movie?.release_date ??
  m?.release_date ??
  m?.movie?.details?.release_date ??
  m?.movie?.info?.release_date ??
  null;

  const getRuntime = (m) => {
    const raw =
      m?.movie?.runtime ??
      m?.runtime ??
      m?.movie?.details?.runtime ??
      m?.movie?.info?.runtime ??
      m?.movie?.data?.runtime ??
      m?.movie?.run_time ??
      m?.movie?.duration ??
      m?.duration ??
      m?.movie?.Runtime;
  
  
    const parsed = parseRuntime(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  
  

// ratings: prefer user 0–5; also accept "4/5", "80%", "★★★★☆"; else TMDB 0–10
const parseStarString = (s) => {
  // count Unicode stars; add 0.5 if half-star present
  const stars = (s.match(/★/g) || []).length + (/[½⯨]/.test(s) ? 0.5 : 0);
  return stars > 0 ? stars : NaN;
};

const getRating = (m) => {
    const localAny =
      m?.rating ??
      m?.myRating ??
      m?.userRating ??
      m?.stars ??
      m?.my_stars ??
      m?.movie?.userRating;
  
    if (typeof localAny === "string") {
      const frac = localAny.match(/(\d+(\.\d+)?)\s*\/\s*(\d+)/);
      if (frac) return (parseFloat(frac[1]) / parseFloat(frac[3])) * 5;
      const pct = localAny.match(/(\d+(\.\d+)?)\s*%/);
      if (pct) return (parseFloat(pct[1]) / 100) * 5;
      const starStr = parseStarString(localAny);
      if (!Number.isNaN(starStr)) return starStr;
      const asNum = parseFloat(localAny);
      if (Number.isFinite(asNum)) return asNum > 10 ? asNum / 2 : asNum;
    } else if (Number.isFinite(localAny)) {
      return localAny > 10 ? localAny / 2 : localAny;
    }
  
    // TMDB average (0–10 scale)
    const tmdb10 =
      m?.movie?.vote_average ??
      m?.vote_average ??
      m?.movie?.rating ??
      m?.movie?.tmdbRating ??
      m?.movie?.details?.vote_average ??
      m?.movie?.info?.vote_average;

  
    const n = toNum(tmdb10);
    return Number.isFinite(n) ? n / 2 : 0; // 👈 fallback to 0
  };
  
  

/* ---------------- genre helpers ---------------- */
const GENRE_NAME_TO_ID = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  "science fiction": 878,
  scifi: 878,
  thriller: 53,
  war: 10752,
  western: 37,
};

const getGenreIds = (m) => {
  const out = new Set();
  const push = (x) => {
    const n = Number(x);
    if (Number.isFinite(n)) out.add(n);
  };
  const ids = m?.movie?.genre_ids ?? m?.genre_ids;
  if (Array.isArray(ids)) ids.forEach(push);

  const objs = m?.movie?.genres ?? m?.genres;
  if (Array.isArray(objs)) {
    objs.forEach((g) => {
      if (g && typeof g === "object") {
        if (g.id != null) push(g.id);
        if (g.name) {
          const mapId = GENRE_NAME_TO_ID[String(g.name).toLowerCase()];
          if (mapId) push(mapId);
        }
      } else if (typeof g === "string") {
        const mapId = GENRE_NAME_TO_ID[g.toLowerCase()];
        if (mapId) push(mapId);
      }
    });
  }
  return [...out];
};

/* ---------------- Poster cell ---------------- */
function Poster({ tmdbId, posters, movie, onPress }) {
  const posterUrl = getPosterUrl(tmdbId, posters, movie) || FALLBACK_POSTER;
  return (
    <TouchableOpacity style={styles.posterWrapper} onPress={onPress}>
      <Image source={{ uri: posterUrl }} style={styles.poster} />
    </TouchableOpacity>
  );
}

export default function ProfileTabWatchlist({
  user,
  sortType,
  setSortType,
  order,
  setOrder,
  watchList,
  setWatchList,
  profileUserId,
}) {
  const navigation = useNavigation();
  const [selectedGenre, setSelectedGenre] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [posters, setPosters] = useState({});
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [genreModalVisible, setGenreModalVisible] = useState(false);
  const t = useTranslate();

  const isOwner = user?._id === profileUserId;

  const screenWidth = Dimensions.get("window").width;
  const numColumns = screenWidth >= 768 ? 5 : screenWidth >= 480 ? 4 : 3;

  /* fetch; still pass params to API (server may also sort), but we guarantee client sorting */
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        setIsLoading(true);
         const res = await api.get(
               `/api/users/${profileUserId}/watchlist?sort=${sortType}&order=${order}&genre=${selectedGenre || ""}`
            )
        const visible = isOwner ? res.data : res.data.filter((m) => !m.isPrivate);
        setWatchList(visible);

        const ids = visible.slice(0, 30).map(toTmdbIdAny).filter(Boolean);
        if (ids.length) {
          const batch = await getCustomPostersBatch(profileUserId, ids);
          setPosters(batch || {});
        }
      } catch (err) {
        console.error("❌ Failed to fetch watchlist", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (profileUserId) fetchWatchlist();
  }, [profileUserId, sortType, order, selectedGenre, isOwner, setWatchList]);

  /* client genre filter */
  const genreFiltered = useMemo(() => {
    if (!selectedGenre) return watchList || [];
    const want = Number(selectedGenre);
    return (watchList || []).filter((m) => getGenreIds(m).includes(want));
  }, [watchList, selectedGenre]);

  /* client sort with metric presence fallback */
  const clientSortedWatchList = useMemo(() => {
    const base = Array.isArray(genreFiltered) ? [...genreFiltered] : [];
    const dir = order === "asc" ? 1 : -1;
    const getKey = (m) => {
      switch (sortType) {
        case "rating":
          return getRating(m);
        case "runtime":
          return getRuntime(m);
        case "release":
          return safeTime(getReleaseDate(m));
        case "added":
        default:
          return safeTime(m.addedAt || m.createdAt || m.updatedAt || m.movie?.createdAt);
      }
    };

    // measure metric availability; if too sparse, keep server order
    const keys = base.map(getKey);
    const present = keys.filter((k) => !Number.isNaN(k)).length;
    const enoughData =
      present >= Math.min(5, base.length) && present >= Math.ceil(base.length * 0.2); // at least 20% or 5 items

// NEW
if (!enoughData && (sortType === "release" || sortType === "added")) {
    // only bail out for date sorts when almost nothing has dates
    return base;
  }
  

    const cmp = (A, B) => (A < B ? -1 : A > B ? 1 : 0);

    return base
      .map((m, i) => ({ m, k: keys[i], i })) // keep original idx for stable tiebreak
      .sort((a, b) => {
        const aMissing = Number.isNaN(a.k);
        const bMissing = Number.isNaN(b.k);
        if (aMissing && !bMissing) return 1;
        if (!aMissing && bMissing) return -1;
        if (aMissing && bMissing) return a.i - b.i; // stable
        const primary = dir * cmp(a.k, b.k);
        return primary !== 0 ? primary : a.i - b.i;
      })
      .map((x) => x.m);
  }, [genreFiltered, sortType, order]);

  const renderPoster = ({ item: movie }) => {
    const tmdbId = toTmdbIdAny(movie);
    return (
      <View style={{ flex: 1 / numColumns, margin: 3 }}>
        <Poster
          tmdbId={tmdbId}
          posters={posters}
          movie={movie}
          onPress={() => {
            if (!tmdbId) return;
            navigation.navigate("Movie", { id: tmdbId });
          }}
        />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, marginTop: 8 }}>
      {isOwner && (
        <View style={styles.controlsRow}>
          {/* Sort Button */}
          <TouchableOpacity style={styles.filterBtn} onPress={() => setSortModalVisible(true)}>
            <Text style={styles.filterText}>
              {t("Sort")}:{" "}
              {sortType === "added"
                ? t("Recently Added")
                : sortType === "release"
                ? t("Release Date")
                : sortType === "rating"
                ? t("Rating")
                : t("Runtime")}{" "}
              {order === "asc" ? "⬆" : "⬇"}
            </Text>
          </TouchableOpacity>

          {/* Genre Button */}
          <TouchableOpacity style={styles.filterBtn} onPress={() => setGenreModalVisible(true)}>
            <Text style={styles.filterText}>
              {t("Genre")}:{" "}
              {selectedGenre === ""
                ? t("All")
                : selectedGenre === "28"
                ? t("Action")
                : selectedGenre === "35"
                ? t("Comedy")
                : selectedGenre === "18"
                ? t("Drama")
                : selectedGenre === "27"
                ? t("Horror")
                : selectedGenre === "10749"
                ? t("Romance")
                : selectedGenre === "16"
                ? t("Animation")
                : selectedGenre === "80"
                ? t("Crime")
                : t("Thriller")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sort Modal */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSortModalVisible(false)}>
          <View style={styles.modalBox}>
            {[
              ["added", t("Recently Added")],
              ["release", t("Release Date")],
              ["rating", t("Rating")],
              ["runtime", t("Runtime")],
            ].map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={styles.modalItem}
                onPress={() => {
                  setSortType(val);
                  setSortModalVisible(false);
                }}
              >
                <Text style={styles.modalText}>{label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.modalItem, { borderTopWidth: 1, borderColor: "#333" }]}
              onPress={() => {
                setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                setSortModalVisible(false);
              }}
            >
              <Text style={styles.modalText}>
                {order === "asc" ? t("⬆ Ascending") : t("⬇ Descending")}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Genre Modal */}
      <Modal
        visible={genreModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGenreModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setGenreModalVisible(false)}>
          <View style={styles.modalBox}>
            {[
              ["", t("All")],
              ["28", t("Action")],
              ["35", t("Comedy")],
              ["18", t("Drama")],
              ["27", t("Horror")],
              ["10749", t("Romance")],
              ["16", t("Animation")],
              ["80", t("Crime")],
              ["53", t("Thriller")],
            ].map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedGenre(String(val));
                  setGenreModalVisible(false);
                }}
              >
                <Text style={styles.modalText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#B327F6" />
          <Text style={{ color: "#aaa", marginTop: 8 }}>
            🎞️ {t("Loading your Scenes...")}
          </Text>
        </View>
         ) : clientSortedWatchList?.length > 0 ? (
               <FlatList
                 data={clientSortedWatchList}
          extraData={{ sortType, order, selectedGenre, len: clientSortedWatchList.length }}
          renderItem={renderPoster}
          keyExtractor={(item, idx) => `${item._id || toTmdbIdAny(item) || idx}`}
          numColumns={numColumns}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      ) : (
        <Text style={styles.empty}>{t("This watchlist is empty.")}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  posterWrapper: {
    aspectRatio: 2 / 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  poster: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    resizeMode: "cover",
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  filterBtn: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterText: {
    color: "white",
    fontSize: 13,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 8,
    width: 220,
    borderWidth: 1,
    borderColor: "#333",
  },
  modalItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalText: {
    color: "#fff",
    fontSize: 14,
  },
  loading: {
    marginTop: 40,
    alignItems: "center",
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#aaa",
  },
});
