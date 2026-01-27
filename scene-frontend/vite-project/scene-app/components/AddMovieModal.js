// src/screens/AddMovieModal.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Pressable,
  useWindowDimensions,
} from "react-native";
import axios from "axios";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import useTranslate from "shared/utils/useTranslate";
import { useLanguage } from "shared/context/LanguageContext";
import filterMovies from "shared/utils/filterMovies";
import api from "shared/api/api";

const TMDB_IMG_W300 = "https://image.tmdb.org/t/p/w300";
const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";

const TMDB_KEY =
  process.env.EXPO_PUBLIC_TMDB_API_KEY ||
  process.env.TMDB_API_KEY ||
  global?.TMDB_API_KEY ||
  "";

const getMovieId = (m) => m?.id ?? m?.tmdbId ?? m?._id ?? m?.movieId;

function posterFor(m) {
  if (!m) return FALLBACK_POSTER;
  if (m.posterOverride) return m.posterOverride;
  if (m.poster_path) return `${TMDB_IMG_W300}${m.poster_path}`;
  if (m.movie?.poster_path) return `${TMDB_IMG_W300}${m.movie.poster_path}`;
  return FALLBACK_POSTER;
}

export default function AddMovieModal({
  visible,
  onClose,
  onSelect,
  existing = [],
  userId,
}) {
  const t = useTranslate();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const tmdbLang = useMemo(() => (language === "ar" ? "ar-SA" : "en-US"), [language]);

  const existingIdSet = useMemo(() => {
    const s = new Set();
    (existing || []).forEach((x) => {
      const id = typeof x === "object" ? getMovieId(x) : x;
      if (id != null) s.add(String(id));
    });
    return s;
  }, [existing]);

  useEffect(() => {
    if (!visible) return;
    const h = setTimeout(() => {
      if (query.trim()) fetchResults(query.trim());
      else setResults([]);
    }, 400);
    return () => clearTimeout(h);
  }, [query, tmdbLang, visible]);

  const fetchResults = async (term) => {
    if (!TMDB_KEY) {
      Toast.show({ type: "scene", text1: t("Missing TMDB API key") });
      return;
    }
    setLoading(true);
    try {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(
        term
      )}&include_adult=false&language=${tmdbLang}`;
      const { data } = await axios.get(url);

      let filtered = filterMovies(data?.results || []);

      if (filtered.length === 0 && /^\d+$/.test(term)) {
        try {
          const { data: m } = await axios.get(
            `https://api.themoviedb.org/3/movie/${term}?api_key=${TMDB_KEY}&language=${tmdbLang}`
          );
          const single = filterMovies([m]);
          if (single.length > 0) filtered = single;
        } catch {}
      }

      if (filtered.length > 0 && userId) {
        const ids = filtered.map((f) => getMovieId(f)).filter(Boolean);
        try {
          const res = await api.post("/api/posters/batch", { movieIds: ids, userId });
          const posters = res.data || {};
          filtered = filtered.map((f) => {
            const id = String(getMovieId(f));
            return { ...f, posterOverride: posters[id] ?? f.posterOverride ?? null };
          });
        } catch (err) {
          console.warn("❌ Failed to fetch custom posters", err);
        }
      }

      setResults(filtered);
    } catch (e) {
      console.error("TMDB search failed", e);
      Toast.show({ type: "scene", text1: t("Search failed.") });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (movie) => {
    const id = String(getMovieId(movie));
    if (existingIdSet.has(id)) return;
    onSelect?.(movie);
    onClose?.();
  };

  // ✅ Responsive grid logic
  const { numColumns, cardWidth, posterHeight } = useMemo(() => {
    const SIDE = 12;
    const GAP = 12;
    const minCard = 100;

    const usable = width - SIDE * 2;
    let cols = Math.floor((usable + GAP) / (minCard + GAP));
    cols = isTablet ? Math.min(5, cols) : Math.min(3, cols);
    cols = Math.max(2, cols);

    const cardW = Math.floor((usable - GAP * (cols - 1)) / cols);
    const posterH = isTablet ? 250 : 180;

    return { numColumns: cols, cardWidth: cardW, posterHeight: posterH };
  }, [width, isTablet]);

  const renderItem = ({ item }) => {
    const already = existingIdSet.has(String(item.id));
    return (
      <TouchableOpacity
        activeOpacity={already ? 1 : 0.9}
        onPress={() => (!already ? handleAdd(item) : null)}
        style={[
          styles.card,
          { width: cardWidth },
          already && { borderWidth: 2, borderColor: "#888", opacity: 0.75 },
        ]}
        disabled={already}
      >
        <Image
          source={{ uri: posterFor(item) }}
          style={{ width: cardWidth, height: posterHeight, borderRadius: 8, backgroundColor: "#222" }}
          resizeMode="cover"
        />
        {already && (
          <View style={styles.addedPill}>
            <Text style={styles.addedText}>{t("Added")}</Text>
          </View>
        )}
        <Text numberOfLines={2} style={styles.cardTitle}>
          {item.title || item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { paddingTop: insets.top + 12 }]}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} accessibilityLabel={t("Back")}>
            <Text style={styles.backTxt}>← {t("Back")}</Text>
          </TouchableOpacity>
          <TextInput
            placeholder={t("Search movies...")}
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            style={styles.search}
            autoFocus
            returnKeyType="search"
          />
        </View>

        {loading ? (
          <View style={{ padding: 12 }}>
            <ActivityIndicator color="#B327F6" />
            <Text style={{ color: "#aaa", marginTop: 8 }}>{t("Loading...")}</Text>
          </View>
        ) : query.trim().length > 0 && results.length === 0 ? (
          <Text style={{ color: "#aaa", paddingHorizontal: 16, paddingTop: 10 }}>
            {t("No results found.")}
          </Text>
        ) : null}

        <FlatList
          data={results}
          keyExtractor={(m) => String(getMovieId(m))}
          numColumns={numColumns}
          contentContainerStyle={{ padding: 12 }}
          columnWrapperStyle={{ justifyContent: "flex-start", gap: 12, marginBottom: 12 }}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)" },
  sheet: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#0e0e0e" },
  headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginBottom: 8 },
  backBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
  },
  backTxt: { color: "#fff", fontSize: 14, fontWeight: "600" },
  search: {
    flex: 1,
    marginLeft: 10,
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
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    overflow: "hidden",
  },
  cardTitle: { color: "#fff", fontWeight: "bold", fontSize: 12, padding: 6, textAlign: "center" },
  addedPill: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  addedText: { color: "#fff", fontSize: 11 },
});
