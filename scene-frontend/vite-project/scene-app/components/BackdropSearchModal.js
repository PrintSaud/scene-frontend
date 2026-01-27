// src/components/BackdropSearchModal.js
import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import axios from "axios";
import filterMovies from "shared/utils/filterMovies"; // ⬅️ use the shared filter
import useTranslate from "shared/utils/useTranslate";
import { useLanguage } from "shared/context/LanguageContext";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_ORIGINAL = "https://image.tmdb.org/t/p/original";
const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";

// ✅ Expo env only
const TMDB_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;

export default function BackdropSearchModal({ visible, onClose, onSelect }) {
  const t = useTranslate();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [backdrops, setBackdrops] = useState([]);
  const [loadingBackdrops, setLoadingBackdrops] = useState(false);

  const tmdbLang = language === "ar" ? "ar-SA" : "en-US";

  // debounce search
  useEffect(() => {
    if (!visible || selectedMovie) return;
    const h = setTimeout(() => {
      if (query.trim()) fetchResults(query.trim());
      else setResults([]);
    }, 400);
    return () => clearTimeout(h);
  }, [query, visible, tmdbLang, selectedMovie]);

  const fetchResults = async (term) => {
    if (!TMDB_KEY) {
      console.warn("❌ Missing TMDB API key");
      Toast.show({ type: "scene", text1: t("Missing TMDB API key") });
      return;
    }
    setLoading(true);
    try {
      let url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(
        term
      )}&include_adult=false&language=${tmdbLang}`;
      let { data } = await axios.get(url);
  
      // fallback to en-US if Arabic search yields no results
      if ((data?.results || []).length === 0 && tmdbLang !== "en-US") {
        url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(
          term
        )}&include_adult=false&language=en-US`;
        data = (await axios.get(url)).data;
      }
  
      // ✅ filter through shared utils
      const filtered = filterMovies(data?.results || []);
      setResults(filtered);
    } catch (e) {
      console.error("❌ Backdrop search failed", e.message);
      Toast.show({ type: "scene", text1: t("Search failed.") });
    } finally {
      setLoading(false);
    }
  };
  

  const fetchBackdrops = async (movie) => {
    if (!TMDB_KEY) return;
    setSelectedMovie(movie);
    setLoadingBackdrops(true);
    try {
      const url = `https://api.themoviedb.org/3/movie/${movie.id}/images?api_key=${TMDB_KEY}`;
      const { data } = await axios.get(url);
      const urls = (data?.backdrops || [])
        .map((b) => `${TMDB_ORIGINAL}${b.file_path}`)
        .filter(Boolean);
      setBackdrops(urls);
    } catch (e) {
      console.error("❌ Failed to fetch backdrops", e.message);
      Toast.show({ type: "scene", text1: t("Failed to load backdrops.") });
    } finally {
      setLoadingBackdrops(false);
    }
  };

  const renderMovie = ({ item }) => {
    const posterUri = item.poster_path
      ? `${TMDB_IMG}${item.poster_path}`
      : FALLBACK_POSTER;

    return (
      <TouchableOpacity style={styles.card} onPress={() => fetchBackdrops(item)}>
        <Image source={{ uri: posterUri }} style={styles.poster} resizeMode="cover" />
        <Text numberOfLines={2} style={styles.cardTitle}>
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderBackdrop = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        onSelect?.(item); // ✅ just URL string
        onClose?.();
      }}
      style={{ marginBottom: 16 }}
    >
      <Image source={{ uri: item }} style={styles.backdrop} resizeMode="cover" />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingTop: insets.top + 22 }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => {
                if (selectedMovie) {
                  setSelectedMovie(null);
                  setBackdrops([]);
                } else {
                  onClose?.();
                }
              }}
              style={styles.backBtn}
            >
              <Text style={styles.backTxt}>← {t("Back")}</Text>
            </TouchableOpacity>
            {!selectedMovie && (
              <TextInput
                placeholder={t("Search For a movie")}
                placeholderTextColor="#888"
                value={query}
                onChangeText={setQuery}
                style={styles.search}
                autoFocus
                returnKeyType="search"
              />
            )}
          </View>

          {/* Results or backdrops */}
          {selectedMovie ? (
            loadingBackdrops ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator color="#B327F6" />
                <Text style={{ color: "#aaa", marginTop: 8 }}>
                  {t("Loading backdrops...")}
                </Text>
              </View>
            ) : (
              <FlatList
                data={backdrops}
                keyExtractor={(url, idx) => `${idx}`}
                renderItem={renderBackdrop}
                contentContainerStyle={{ padding: 12 }}
              />
            )
          ) : loading ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator color="#B327F6" />
              <Text style={{ color: "#aaa", marginTop: 8 }}>{t("Loading...")}</Text>
            </View>
          ) : query.trim().length > 0 && results.length === 0 ? (
            <Text style={{ color: "#aaa", padding: 16 }}>{t("No results found.")}</Text>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(m) => String(m.id)}
              numColumns={3}
              contentContainerStyle={{ padding: 12 }}
              columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 12 }}
              renderItem={renderMovie}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)" },
  sheet: { flex: 1, backgroundColor: "#0e0e0e" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  backBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    marginRight: 8,
  },
  backTxt: { color: "#fff", fontSize: 14, fontWeight: "600" },
  search: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
    backgroundColor: "#111",
    color: "#fff",
    fontSize: 14,
  },
  card: {
    width: "32%",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    overflow: "hidden",
  },
  poster: { width: "100%", height: 200, backgroundColor: "#222" },
  cardTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    padding: 6,
    textAlign: "center",
  },
  backdrop: {
    width: "100%",
    height: 210,
    borderRadius: 12,
    marginBottom: 18,
    backgroundColor: "#111",
  },
});
