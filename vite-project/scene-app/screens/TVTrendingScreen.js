import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import api from "../../../shared/api/api";
import useTranslate from "../../../shared/utils/useTranslate";

const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const SCENE_PURPLE = "#B327F6";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 768;

const TRENDING_COLS = isTablet ? 5 : 2;
const TRENDING_GAP = 12;
const TRENDING_SIDE = 16;
const TRENDING_ITEM_W = Math.floor(
  (screenWidth - TRENDING_SIDE * 2 - TRENDING_GAP * (TRENDING_COLS - 1)) /
    TRENDING_COLS
);
const TRENDING_ITEM_H = TRENDING_ITEM_W * 1.5;
const HEADER_H = 60;

function getPosterUrl(item) {
  const raw =
    item?.poster ||
    item?.posterUrl ||
    item?.poster_path ||
    item?.posterPath ||
    item?.posterPath ||
    item?.poster_path ||
    item?.tmdbPoster ||
    item?.tmdbPosterPath ||
    item?.showPoster ||
    item?.show?.poster ||
    item?.show?.posterPath ||
    item?.show?.poster_path ||
    item?.image ||
    item?.imageUrl ||
    "";

  if (!raw) return FALLBACK_POSTER;
  if (String(raw).startsWith("http")) return raw;
  if (String(raw).startsWith("/")) return `${TMDB_IMG}${raw}`;
  return raw;
}

function getShowTitle(item) {
  return (
    item?.name ||
    item?.title ||
    item?.name_en ||
    item?.title_en ||
    item?.originalName ||
    item?.original_name ||
    item?.showName ||
    item?.showTitle ||
    item?.show?.name ||
    item?.show?.title ||
    "Untitled"
  );
}

function getShowId(item) {
  return (
    item?.tmdbId ||
    item?.tmdb_id ||
    item?.id ||
    item?.showTmdbId ||
    item?.show?.tmdbId ||
    item?.show?.tmdb_id ||
    item?.show?.id
  );
}

export default function TVTrendingScreen({ navigation, route }) {
  const stackNav = useNavigation();
  const t = useTranslate();

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingShows = async () => {
      try {
        setLoading(true);

        const res = await api.get("/api/tv-home/public?trendingLimit=20");

        const data = res.data || {};
        const trending =
          Array.isArray(data.trendingShows)
            ? data.trendingShows
            : Array.isArray(data.trending)
            ? data.trending
            : [];

        setShows(trending.slice(0, 20));
      } catch (err) {
        console.error(
          "Error fetching trending TV shows:",
          err?.response?.data || err?.message || err
        );
        setShows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingShows();
  }, []);

  const openShow = (item) => {
    const id = getShowId(item);

    if (!id) return;

    stackNav.navigate("Show", {
      id,
      showTmdbId: id,
    });
  };

  const renderShow = ({ item }) => {
    const poster = getPosterUrl(item);
    const title = getShowTitle(item);

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={styles.card}
        onPress={() => openShow(item)}
      >
        <Image source={{ uri: poster }} style={styles.poster} />

        <Text numberOfLines={2} style={styles.showTitle}>
          {String(title)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.glassHeader}>
        <TouchableOpacity onPress={() => stackNav.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerText}>
          {String(t("Trending Shows This Week 🔥"))}
        </Text>

        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={SCENE_PURPLE}
          style={{ marginTop: HEADER_H + 40 }}
        />
      ) : shows && shows.length > 0 ? (
        <FlatList
          data={shows}
          keyExtractor={(item, index) => String(getShowId(item) || index)}
          numColumns={TRENDING_COLS}
          columnWrapperStyle={{
            gap: TRENDING_GAP,
            paddingHorizontal: TRENDING_SIDE,
          }}
          contentContainerStyle={styles.list}
          renderItem={renderShow}
        />
      ) : (
        <Text style={styles.emptyText}>
          {String(t("No trending shows available."))}
        </Text>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0e0e",
  },

  glassHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_H + 35,
    backgroundColor: "#0e0e0e",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 6,
    zIndex: 100,
    elevation: 10,
  },

  backBtn: {
    padding: 2,
    marginLeft: 6,
    marginBottom: 6,
  },

  backText: {
    color: "#fff",
    fontSize: 18,
  },

  headerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
    paddingBottom: 10,
    marginLeft: 10,
  },

  list: {
    paddingTop: HEADER_H + 50,
    paddingBottom: 110,
  },

  card: {
    width: TRENDING_ITEM_W,
    alignItems: "center",
    marginBottom: 22,
  },

  poster: {
    width: TRENDING_ITEM_W,
    height: TRENDING_ITEM_H,
    borderRadius: 12,
    backgroundColor: "#222",
  },

  showTitle: {
    marginTop: 8,
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },

  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: HEADER_H + 40,
    paddingHorizontal: 24,
  },
});
