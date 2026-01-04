import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import useTranslate from "shared/utils/useTranslate";
import filterMovies from "shared/utils/filterMovies";
import { TMDB_BASE_URL, TMDB_KEY, TMDB_POSTER } from "shared/config";

export default function SimilarFilmsTab({ movieId, navigate, onNavigateToMovie }) {
  const t = useTranslate();
  const [similarMovies, setSimilarMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();

  // 🔑 Responsive columns & card width
  const { numColumns, cardWidth } = useMemo(() => {
    const SIDE = 16;  // side padding
    const GAP = 10;   // gap between items
    const minCard = 140;

    const usable = width - SIDE * 2;
    let cols = Math.floor((usable + GAP) / (minCard + GAP));
    cols = Math.max(2, Math.min(5, cols)); // clamp 2–5

    const cardW = Math.floor((usable - GAP * (cols - 1)) / cols);
    return { numColumns: cols, cardWidth: cardW };
  }, [width]);

  const fetchSimilar = useCallback(async () => {
    if (!movieId) return;
    try {
      setLoading(true);
      const url = `${TMDB_BASE_URL}/movie/${movieId}/similar?api_key=${TMDB_KEY}&language=en-US`;
      const res = await fetch(url);
      const data = await res.json();
      const raw = Array.isArray(data?.results) ? data.results : [];
      const filtered = typeof filterMovies === "function" ? filterMovies(raw) : raw;
      setSimilarMovies(filtered);
    } catch (err) {
      console.warn("❌ Failed to fetch similar films:", err?.message || err);
      setSimilarMovies([]);
    } finally {
      setLoading(false);
    }
  }, [movieId]);

  useEffect(() => {
    fetchSimilar();
  }, [fetchSimilar]);

  const openMovie = (id) => {
    if (!id) return;
    if (onNavigateToMovie) onNavigateToMovie(id);
    else if (navigate) navigate("Movie", { id });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingTxt}>{t("Loading similar films...")}</Text>
      </View>
    );
  }

  if (!similarMovies.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTxt}>{t("No similar films found.")}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={similarMovies}
      keyExtractor={(m, i) => String(m?.id ?? i)}
      numColumns={numColumns}
      columnWrapperStyle={{ gap: 10 }}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => {
        const poster = item?.poster_path ? `${TMDB_POSTER}${item.poster_path}` : null;
        return (
          <TouchableOpacity
            style={[styles.card, { width: cardWidth }]}
            onPress={() => openMovie(item.id)}
          >
            {poster ? (
              <Image source={{ uri: poster }} style={styles.poster} resizeMode="cover" />
            ) : (
              <View style={[styles.poster, styles.posterFallback]} />
            )}
            <Text numberOfLines={1} style={styles.title}>
              {item?.title || t("Untitled")}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 24, alignItems: "center", justifyContent: "center" },
  loadingTxt: { marginTop: 8, color: "#888" },
  emptyTxt: { color: "#888" },
  listContent: { paddingVertical: 12, paddingHorizontal: 16 },
  card: { marginBottom: 16 },
  poster: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 10,
    backgroundColor: "#111",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  posterFallback: { borderWidth: 1, borderColor: "#333" },
  title: {
    marginTop: 6,
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    fontFamily: "PixelifySans_700Bold",
  },
});
