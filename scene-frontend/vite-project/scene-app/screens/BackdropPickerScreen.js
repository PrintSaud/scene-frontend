// src/screens/BackdropPickerScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { backend } from "shared/api/api";
import useTranslate from "shared/utils/useTranslate";
import filterMovies from "shared/utils/filterMovies";

const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";

export default function BackdropPickerScreen() {
  const navigation = useNavigation();
  const t = useTranslate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [backdrops, setBackdrops] = useState([]);
  const [selectedBackdrop, setSelectedBackdrop] = useState(null);
  const [loading, setLoading] = useState(false);

  const doneRef = useRef(null);

  // 🔍 debounce search
  useEffect(() => {
    const h = setTimeout(() => {
      if (query.trim()) fetchMovies(query.trim());
      else setResults([]);
    }, 400);
    return () => clearTimeout(h);
  }, [query]);

  const fetchMovies = async (q) => {
    try {
      const res = await api.get(`${backend}/api/movies/search?q=${q}`);
      const movies = res.data.results || [];

      const normalized = movies.map((m) => ({
        ...m,
        poster_path:
          m.poster_path ||
          (m.poster
            ? m.poster.replace("https://image.tmdb.org/t/p/w500", "")
            : null),
        backdrop_path: m.backdrop_path || null,
        title: m.title_en || m.title,
        overview: m.overview || "",
      }));

      const filtered = filterMovies(normalized);
      setResults(filtered);
    } catch (err) {
      console.error("❌ Search failed:", err);
    }
  };

  const fetchBackdrops = async (movie) => {
    setSelectedMovie(movie);
    setLoading(true);
    try {
      const res = await api.get(`${backend}/api/movies/${movie.id}`);
      setBackdrops(res.data.backdrops || []);
    } catch (err) {
      console.error("❌ Backdrop fetch failed:", err);
      setBackdrops([]);
    }
    setLoading(false);
  };

  const handleBackdropSelect = (url) => {
    setSelectedBackdrop(url);
    setTimeout(() => {
      doneRef.current?.scrollTo({ y: 9999, animated: true });
    }, 100);
  };

  const handleSave = async () => {
    if (!selectedMovie || !selectedBackdrop) return;
    try {
      await AsyncStorage.setItem(
        "chosenBackdrop",
        JSON.stringify({
          movieId: selectedMovie.id,
          backdrop: selectedBackdrop,
        })
      );
    } catch (err) {
      console.error("❌ Failed to save backdrop locally", err);
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => {
          if (selectedMovie) {
            setSelectedMovie(null);
            setBackdrops([]);
            setSelectedBackdrop(null);
          } else {
            navigation.goBack();
          }
        }}
        style={styles.backBtn}
      >
        <Text style={{ color: "#fff", fontSize: 18 }}>←</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text style={styles.header}>{t("Change Backdrop")}</Text>

        {/* Search input if no movie chosen */}
        {!selectedMovie && (
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("Search for a movie")}
            placeholderTextColor="#888"
            style={styles.search}
          />
        )}

        {/* Movie grid */}
        {!selectedMovie && (
          <View style={styles.grid}>
            {results.map((movie) => {
              const poster =
                movie.poster ||
                (movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                  : movie.backdrop_path
                  ? `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`
                  : FALLBACK_POSTER);
              return (
                <TouchableOpacity
                  key={movie.id}
                  onPress={() => fetchBackdrops(movie)}
                  style={styles.movieCard}
                >
                  <Image
                    source={{ uri: poster }}
                    style={styles.moviePoster}
                    resizeMode="cover"
                  />
                  <Text numberOfLines={2} style={styles.movieTitle}>
                    {movie.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Backdrop previews */}
        {selectedMovie && (
          <View style={{ marginTop: 20 }}>
            {loading ? (
              <Text style={{ color: "#888", textAlign: "center" }}>
                {t("Loading backdrops...")}
              </Text>
            ) : (
              backdrops.map((url, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleBackdropSelect(url)}
                >
                  <Image
                    source={{ uri: url }}
                    style={[
                      styles.backdropImg,
                      selectedBackdrop === url && styles.backdropSelected,
                    ]}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))
            )}

            {selectedBackdrop && (
              <TouchableOpacity
                ref={doneRef}
                onPress={handleSave}
                style={styles.doneBtn}
              >
                <Text style={styles.doneTxt}>✅ {t("Done")}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e0e0e" },
  backBtn: {
    position: "absolute",
    top: 30,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 40,
  },
  search: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 6,
    padding: 10,
    color: "#fff",
    fontSize: 14,
    marginBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  movieCard: {
    width: "48%",
    backgroundColor: "#111",
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
  },
  moviePoster: { width: "100%", aspectRatio: 2 / 3, backgroundColor: "#222" },
  movieTitle: {
    color: "#fff",
    fontSize: 13,
    textAlign: "center",
    padding: 6,
  },
  backdropImg: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  backdropSelected: {
    borderColor: "#fff",
    borderWidth: 3,
  },
  doneBtn: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  doneTxt: { fontWeight: "700", fontSize: 14, color: "#000" },
});
