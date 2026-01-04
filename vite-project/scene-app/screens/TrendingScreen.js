// src/screens/TrendingScreen.js
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
import useTranslate from "shared/utils/useTranslate";
import BottomNav from "../components/BottomNav";

const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 768;

// 🎬 Responsive grid constants
const TRENDING_COLS = isTablet ? 5 : 2;
const TRENDING_GAP = 12;
const TRENDING_SIDE = 16;
const TRENDING_ITEM_W = Math.floor(
  (screenWidth - TRENDING_SIDE * 2 - TRENDING_GAP * (TRENDING_COLS - 1)) /
    TRENDING_COLS
);
const TRENDING_ITEM_H = TRENDING_ITEM_W * 1.5;
const HEADER_H = 60;

export default function TrendingScreen({ navigation, route }) {
  const tabNav = navigation;          // tab navigation
  const stackNav = useNavigation();   // stack navigation
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslate();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/movies/trending`
        );
        const data = await res.json();
        setMovies(data);
      } catch (err) {
        console.error("Error fetching trending movies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const renderMovie = ({ item }) => {
    const poster = item.poster?.startsWith("http")
      ? item.poster
      : item.poster_path
      ? `${TMDB_IMG}${item.poster_path}`
      : FALLBACK_POSTER;

    const title =
      item.title ||
      item.title_en ||
      item.original_title ||
      item.name ||
      item.original_name ||
      item.movie?.title ||
      "Untitled";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => stackNav.navigate("Movie", { id: item.id })}
      >
        <Image source={{ uri: poster }} style={styles.poster} />
        <Text numberOfLines={2} style={styles.movieTitle}>
          {String(title)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 🌌 Header */}
      <View style={styles.glassHeader}>
        <TouchableOpacity onPress={() => stackNav.goBack()} style={styles.backBtn}>
          <Text style={{ color: "#fff", fontSize: 18 }}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerText}>
          {String(t("Trending Movies This Week 🔥"))}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 🎬 Movie Grid */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#fff"
          style={{ marginTop: HEADER_H + 40 }}
        />
      ) : movies && movies.length > 0 ? (
        <FlatList
          data={movies}
          keyExtractor={(m) => String(m.id)}
          numColumns={TRENDING_COLS}
          columnWrapperStyle={{ gap: TRENDING_GAP, paddingHorizontal: TRENDING_SIDE }}
          contentContainerStyle={styles.list}
          renderItem={renderMovie}
        />
      ) : (
        <Text
          style={{
            color: "#888",
            textAlign: "center",
            marginTop: HEADER_H + 40,
          }}
        >
          {String(t("No trending movies available."))}
        </Text>
      )}

      {/* 🌌 Bottom Nav */}
      <BottomNav state={tabNav.getState()} navigation={tabNav} />
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
    paddingBottom: 100,
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
  movieTitle: {
    marginTop: 8,
    color: "#fff",
    fontSize: 14,
    fontFamily: "PixelifySans_700Bold",
    textAlign: "center",
  },
});
