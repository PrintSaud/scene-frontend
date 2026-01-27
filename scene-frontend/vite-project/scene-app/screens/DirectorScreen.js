// src/screens/DirectorScreen.js
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import useTranslate from "shared/utils/useTranslate";
import { useLanguage } from "shared/context/LanguageContext";
import { directorAwards } from "shared/data/awardsData";
import { saudiTalent } from "shared/data/saudiTalent";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_POSTER = "https://image.tmdb.org/t/p/w300";
const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";
const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";

export default function DirectorScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};
  const t = useTranslate();
  const { language } = useLanguage();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [directorEn, setDirectorEn] = useState(null);
  const [directorAr, setDirectorAr] = useState(null);
  const [movies, setMovies] = useState([]);
  const [showFullBio, setShowFullBio] = useState(false);
  const [loading, setLoading] = useState(true);

  const EXPO_TMDB_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;

  const getAwards = (name = "") => {
    const normalized = name.trim().toLowerCase();
    const directAward = Object.keys(directorAwards).find(
      (k) => k.toLowerCase() === normalized
    );
    if (directAward) return directorAwards[directAward];

    const saudiAward = Object.keys(saudiTalent.directors).find(
      (k) => k.toLowerCase() === normalized
    );
    if (saudiAward) return saudiTalent.directors[saudiAward];

    return t("awards.imdb_fallback", { name });
  };

  useEffect(() => {
    const fetchDirector = async () => {
      try {
        setLoading(true);
        const [detailsEn, detailsAr, creditsRes] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/person/${id}?api_key=${EXPO_TMDB_KEY}&language=en-US`
          ).then((r) => r.json()),
          fetch(
            `https://api.themoviedb.org/3/person/${id}?api_key=${EXPO_TMDB_KEY}&language=ar-SA`
          ).then((r) => r.json()),
          fetch(
            `https://api.themoviedb.org/3/person/${id}/movie_credits?api_key=${EXPO_TMDB_KEY}&language=en-US`
          ).then((r) => r.json()),
        ]);

        setDirectorEn(detailsEn);
        setDirectorAr(detailsAr);

        const directed = (creditsRes.crew || [])
          .filter((c) => c.job === "Director" && c.poster_path)
          .sort((a, b) => b.popularity - a.popularity);

        setMovies(directed);
      } catch (err) {
        console.error("❌ Failed to fetch director:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDirector();
  }, [id, EXPO_TMDB_KEY]);

  // ✅ Responsive grid logic
  const { numColumns, cardWidth } = useMemo(() => {
    const SIDE = 2;
    const GAP = 8;
    const minCard = 120;

    const usable = width - SIDE * 2;
    let cols = Math.floor((usable + GAP) / (minCard + GAP));
    cols = Math.max(3, Math.min(4, cols)); // clamp between 2–5
    const cardW = Math.floor((usable - GAP * (cols - 1)) / cols);

    return { numColumns: cols, cardWidth: cardW };
  }, [width]);

  if (loading || !directorEn) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#B327F6" />
        <Text style={{ color: "#fff", marginTop: 10 }}>
          {t("loading_director")}
        </Text>
      </View>
    );
  }

  const isSaudi =
    directorEn?.name &&
    Object.keys(saudiTalent.directors).some(
      (name) => name.toLowerCase() === directorEn.name.toLowerCase()
    );

  let displayName = directorEn.name;
  if (
    language === "ar" &&
    directorAr?.name &&
    directorAr.name.trim() &&
    directorAr.name !== directorEn.name
  ) {
    displayName = `${directorAr.name} / ${directorEn.name}`;
  }

  let localizedBio = directorEn.biography || "";
  if (
    language === "ar" &&
    directorAr?.biography?.trim() &&
    directorAr.biography !== directorEn.biography
  ) {
    localizedBio = directorAr.biography;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Back */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginBottom: 50, marginTop: -25, marginLeft: 10 }}
        >
          <Text style={{ color: "#fff", fontSize: 20, top: 83, left: 8 }}>
            ←
          </Text>
        </TouchableOpacity>

        {/* Top Section */}
        <View style={styles.topSection}>
          <Image
            source={{
              uri: directorEn.profile_path
                ? TMDB_IMG + directorEn.profile_path
                : FALLBACK_AVATAR,
            }}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {displayName}
              {isSaudi && (
                <Text style={{ marginLeft: 6, fontSize: 16 }}> 🇸🇦</Text>
              )}
            </Text>
            <Text style={styles.awards}>{getAwards(directorEn.name)}</Text>
          </View>
        </View>

        {/* Bio */}
        <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
          {localizedBio ? (
            <>
              <Text
                numberOfLines={showFullBio ? undefined : 4}
                style={styles.bio}
              >
                {localizedBio}
              </Text>
              {localizedBio.length > 300 && (
                <TouchableOpacity onPress={() => setShowFullBio((p) => !p)}>
                  <Text style={styles.readMore}>
                    {showFullBio ? t("show_less") : t("read_more")}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text>{t("no_bio")}</Text>
          )}
        </View>

        {/* Movies */}
        <Text style={[styles.sectionHeader, { paddingHorizontal: 16 }]}>
          🎬 {t("all_films")}
        </Text>
        <FlatList
          data={movies}
          keyExtractor={(item) => String(item.id)}
          numColumns={numColumns}
          columnWrapperStyle={{ gap: 8, paddingHorizontal: 2 }}
          contentContainerStyle={{ marginTop: 12, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate("Movie", { id: item.id })}
              style={{ width: cardWidth }}
            >
              <Image
                source={{
                  uri: item.poster_path
                    ? TMDB_POSTER + item.poster_path
                    : FALLBACK_POSTER,
                }}
                style={{
                  width: cardWidth,
                  height: isTablet ? 370 : 190, // ✅ dynamic height
                  borderRadius: 8,
                  backgroundColor: "#222",
                }}
              />
            </TouchableOpacity>
          )}
        />

        {/* Saudi Message */}
        {isSaudi && (
          <View style={styles.saudiMessage}>
            <Text
              style={{ marginBottom: 12, textAlign: "center", color: "#aaa" }}
            >
              نحتفي ونفخر بإرث السعودية السينمائي المتنامي.{"\n"}
              كمؤسس للمنصة، أنشأت Scene على أمل أن نسهم في نمو السينما
              السعودية،{"\n"}وأن نلهم الآخرين وتُسلّط الضوء على المواهب المحلية.
            </Text>
            <Text style={{ textAlign: "center", color: "#aaa" }}>
              🇸🇦 <Text style={{ fontWeight: "bold" }}>Scene</Text> proudly
              celebrates Saudi Arabia’s growing film legacy. {"\n"}
              I created Scene to help elevate Saudi cinema and inspire new
              filmmakers.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 26,
    marginBottom: 76,
    top: 60,
    left: -10,
  },
  avatar: {
    width: 100,
    height: 150,
    borderRadius: 12,
    backgroundColor: "#222",
  },
  name: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  awards: { fontSize: 14, color: "#aaa", marginTop: 8 },
  bio: { fontSize: 14, color: "#ddd", lineHeight: 20 },
  readMore: { fontSize: 13, color: "#B327F6", marginTop: 6 },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginTop: 20,
  },
  saudiMessage: {
    marginTop: 40,
    paddingHorizontal: 16,
    marginBottom: 40,
  },
});
