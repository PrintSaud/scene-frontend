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
import Ionicons from "@expo/vector-icons/Ionicons";

import useTranslate from "../../../../shared/utils/useTranslate";
import { TMDB_BASE_URL, TMDB_POSTER } from "../../../../shared/config";

const TMDB_KEY =
  process.env.EXPO_PUBLIC_TMDB_API_KEY ||
  process.env.VITE_TMDB_API_KEY;

export default function SimilarFilmsTab({ movieId, navigate, onNavigateToMovie }) {
  const t = useTranslate();

  const [similarMovies, setSimilarMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const { width } = useWindowDimensions();

  console.log("🎬 SimilarFilmsTab raw movieId:", movieId);
  console.log("🎬 SimilarFilmsTab TMDB_KEY exists:", !!TMDB_KEY);
  console.log(
    "🎬 SimilarFilmsTab TMDB_KEY preview:",
    TMDB_KEY ? `${String(TMDB_KEY).slice(0, 4)}...` : "MISSING"
  );
  console.log("🎬 SimilarFilmsTab TMDB_BASE_URL:", TMDB_BASE_URL);

  const validMovieId = useMemo(() => {
    const id = Number(movieId);
    return Number.isFinite(id) && id > 0 ? id : null;
  }, [movieId]);

  const { numColumns, cardWidth } = useMemo(() => {
    const SIDE = 16;
    const GAP = 10;
    const minCard = 140;

    const usable = width - SIDE * 2;

    let cols = Math.floor((usable + GAP) / (minCard + GAP));
    cols = Math.max(2, Math.min(5, cols));

    const cardW = Math.floor((usable - GAP * (cols - 1)) / cols);

    return {
      numColumns: cols,
      cardWidth: cardW,
    };
  }, [width]);

  const normalizeMovies = useCallback((results = []) => {
    if (!Array.isArray(results)) return [];

    return results
      .filter((movie) => movie?.id && (movie?.title || movie?.name))
      .map((movie) => ({
        id: movie.id,
        title: movie.title || movie.name || "Untitled",
        poster_path: movie.poster_path || null,
        vote_average: movie.vote_average || 0,
        release_date: movie.release_date || "",
      }));
  }, []);

  const fetchFromTMDB = useCallback(
    async (endpointName) => {
      if (!TMDB_KEY) {
        console.warn("❌ SimilarFilmsTab: Missing TMDB key");
        return [];
      }

      if (!validMovieId) {
        console.warn("❌ SimilarFilmsTab: Missing valid movie id");
        return [];
      }

      const url = `${TMDB_BASE_URL}/movie/${validMovieId}/${endpointName}?api_key=${TMDB_KEY}&language=en-US&page=1`;

      console.log(`🎬 Fetching ${endpointName} films:`, url);

      const res = await fetch(url);
      const data = await res.json();

      console.log(`🎬 ${endpointName} response:`, {
        status: res.status,
        total_results: data?.total_results,
        results_length: Array.isArray(data?.results) ? data.results.length : 0,
        error: data?.status_message,
      });

      if (!res.ok) {
        throw new Error(
          data?.status_message || `TMDB ${endpointName} request failed`
        );
      }

      return normalizeMovies(data?.results);
    },
    [validMovieId, normalizeMovies]
  );

  const fetchSimilar = useCallback(async () => {
    if (!validMovieId) {
      console.warn("⚠️ SimilarFilmsTab: invalid movieId:", movieId);
      setSimilarMovies([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      let movies = await fetchFromTMDB("similar");

      if (!movies.length) {
        console.log("⚠️ No similar films found. Trying recommendations fallback...");
        movies = await fetchFromTMDB("recommendations");
      }

      const cleaned = movies.filter(
        (movie) => Number(movie.id) !== Number(validMovieId)
      );

      console.log("✅ Final similar/recommended movies:", cleaned.length);

      setSimilarMovies(cleaned);
    } catch (err) {
      console.warn("❌ Failed to fetch similar films:", err?.message || err);
      setSimilarMovies([]);
    } finally {
      setLoading(false);
    }
  }, [validMovieId, movieId, fetchFromTMDB]);

  useEffect(() => {
    fetchSimilar();
  }, [fetchSimilar]);

  const openMovie = (id) => {
    if (!id) return;

    if (onNavigateToMovie) {
      onNavigateToMovie(id);
      return;
    }

    if (navigate) {
      navigate("Movie", { id: String(id) });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#a855f7" />
        <Text style={styles.loadingTxt}>
          {t("Loading similar films...")}
        </Text>
      </View>
    );
  }

  if (!similarMovies.length) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="film-outline"
          size={34}
          color="rgba(255,255,255,0.35)"
        />
        <Text style={styles.emptyTxt}>
          {t("No similar films found.")}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={similarMovies}
      key={numColumns}
      keyExtractor={(item, index) => String(item?.id ?? index)}
      numColumns={numColumns}
      scrollEnabled={false}
      columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : null}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => {
        const poster = item?.poster_path
          ? `${TMDB_POSTER}${item.poster_path}`
          : null;

        return (
          <TouchableOpacity
            style={[styles.card, { width: cardWidth }]}
            onPress={() => openMovie(item.id)}
            activeOpacity={0.8}
          >
            {poster ? (
              <Image
                source={{ uri: poster }}
                style={styles.poster}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.poster, styles.posterFallback]}>
                <Ionicons
                  name="film-outline"
                  size={30}
                  color="rgba(255,255,255,0.35)"
                />
              </View>
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
  center: {
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingTxt: {
    marginTop: 8,
    color: "#888",
    fontSize: 13,
  },

  emptyTxt: {
    marginTop: 8,
    color: "#888",
    fontSize: 13,
  },

  listContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: 26,
  },

  columnWrapper: {
    gap: 10,
  },

  card: {
    marginBottom: 16,
  },

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

  posterFallback: {
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    marginTop: 6,
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    fontFamily: "PixelifySans_700Bold",
  },
});

