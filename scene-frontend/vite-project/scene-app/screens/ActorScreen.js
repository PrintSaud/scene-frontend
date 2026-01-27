// src/screens/ActorScreen.js
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
import { actorAwards } from "shared/data/awardsData";
import { saudiTalent } from "shared/data/saudiTalent";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_POSTER = "https://image.tmdb.org/t/p/w300";
const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";
const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";

export default function ActorScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};
  const t = useTranslate();
  const { language } = useLanguage();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [actorEn, setActorEn] = useState(null);
  const [actorAr, setActorAr] = useState(null);
  const [movies, setMovies] = useState([]);
  const [showFullBio, setShowFullBio] = useState(false);
  const [loading, setLoading] = useState(true);

  const EXPO_TMDB_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;

  const getAwards = (name = "") => {
    return (
      saudiTalent.actors[name] ||
      actorAwards[name] ||
      t("awards.imdb_fallback", { name })
    );
  };

  useEffect(() => {
    const fetchActor = async () => {
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

        setActorEn(detailsEn);
        setActorAr(detailsAr);

        const sorted = (creditsRes.cast || [])
          .filter((m) => m.poster_path)
          .sort((a, b) => b.popularity - a.popularity);
        setMovies(sorted);
      } catch (err) {
        console.error("❌ Failed to fetch actor:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchActor();
  }, [id, EXPO_TMDB_KEY]);

  // ✅ Responsive grid logic
  const { numColumns, cardWidth } = useMemo(() => {
    const SIDE = 6;
    const GAP = 8;
    const minCard = 120;

    const usable = width - SIDE * 2;
    let cols = Math.floor((usable + GAP) / (minCard + GAP));
    cols = Math.max(3, Math.min(4, cols)); // clamp 2–5
    const cardW = Math.floor((usable - GAP * (cols - 1)) / cols);

    return { numColumns: cols, cardWidth: cardW };
  }, [width]);

  if (loading || !actorEn) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#B327F6" />
        <Text style={{ color: "#fff", marginTop: 10 }}>
          {t("loading_actor")}
        </Text>
      </View>
    );
  }

  const isSaudiTalent =
    actorEn?.name && Object.keys(saudiTalent.actors).includes(actorEn.name);

  let displayName = actorEn.name;
  if (
    language === "ar" &&
    actorAr?.name &&
    actorAr.name.trim() &&
    actorAr.name !== actorEn.name
  ) {
    displayName = `${actorAr.name} / ${actorEn.name}`;
  }

  let localizedBio = actorEn.biography || "";
  if (
    language === "ar" &&
    actorAr?.biography?.trim() &&
    actorAr.biography !== actorEn.biography
  ) {
    localizedBio = actorAr.biography;
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
              uri: actorEn.profile_path
                ? TMDB_IMG + actorEn.profile_path
                : FALLBACK_AVATAR,
            }}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {displayName}
              {isSaudiTalent && (
                <Text style={{ marginLeft: 6, fontSize: 16 }}> 🇸🇦</Text>
              )}
            </Text>
            <Text style={styles.awards}>{getAwards(actorEn.name)}</Text>
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
                  height: isTablet ? 375 : 190, // ✅ 250 on iPad, 200 on phones
                  borderRadius: 8,
                  backgroundColor: "#222",
                }}
              />
            </TouchableOpacity>
          )}
        />

        {/* Saudi Message */}
        {isSaudiTalent && (
          <View style={styles.saudiMessage}>
            <Text
              style={{
                marginBottom: 12,
                textAlign: "center",
                color: "#aaa",
                lineHeight: 20,
              }}
            >
              نحتفي ونفخر بإرث السعودية السينمائي المتنامي.{"\n"}
              كمؤسس للمنصة، أنشأت Scene على أمل أن نسهم في نمو السينما
              السعودية،{"\n"}وأن نلهم الآخرين وتُسلّط الضوء على المواهب المحلية.
            </Text>
            <Text
              style={{
                textAlign: "center",
                color: "#aaa",
                lineHeight: 20,
                marginTop: 12,
              }}
            >
              We proudly celebrate Saudi Arabia’s growing film legacy.{"\n"}
              As the founder, I created Scene to help grow Saudi cinema and to
              inspire and spotlight local talent. 🇸🇦
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
