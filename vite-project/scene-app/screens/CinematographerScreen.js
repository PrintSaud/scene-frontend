// src/screens/CinematographerScreen.js
import React, { useEffect, useMemo, useState } from "react";
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
  Modal,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";

import api from "../../../shared/api/api";
import useTranslate from "../../../shared/utils/useTranslate";
import { useLanguage } from "../../../shared/context/LanguageContext";

import { cinematographerAwards } from "../../../shared/data/awardsData";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_POSTER = "https://image.tmdb.org/t/p/w300";
const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";
const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";

export default function CinematographerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};

  const t = useTranslate();
  const { language } = useLanguage();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;
  const EXPO_TMDB_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "";

  const [personEn, setPersonEn] = useState(null);
  const [personAr, setPersonAr] = useState(null);
  const [movies, setMovies] = useState([]);
  const [showFullBio, setShowFullBio] = useState(false);
  const [loading, setLoading] = useState(true);

  const [friendsBreakdown, setFriendsBreakdown] = useState([]);
  const [myCareerPercent, setMyCareerPercent] = useState(0);
  const [friendsAveragePercent, setFriendsAveragePercent] = useState(0);
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  const [myCareerMovies, setMyCareerMovies] = useState([]);
  const [selectedCareerUser, setSelectedCareerUser] = useState(null);
  const [showCareerMoviesModal, setShowCareerMoviesModal] = useState(false);

  const getLogMovieId = (log) => {
    const tmdbId =
      log?.tmdbId ??
      log?.movie?.id ??
      log?.movieId ??
      (typeof log?.movie === "number" ? log.movie : null);

    const num = Number(tmdbId);
    return Number.isFinite(num) ? num : null;
  };

  const normalizeMovieIds = (logs = []) => {
    const ids = new Set();

    logs.forEach((log) => {
      const tmdbId = getLogMovieId(log);
      if (tmdbId) ids.add(tmdbId);
    });

    return ids;
  };

  const calcPercent = (watchedIdsSet, personMovieIds) => {
    if (!personMovieIds.length) return 0;

    const watchedCount = personMovieIds.filter((movieId) =>
      watchedIdsSet.has(Number(movieId))
    ).length;

    return Math.round((watchedCount / personMovieIds.length) * 100);
  };

  const buildAvatarUri = (avatar) => {
    if (!avatar) return FALLBACK_AVATAR;

    if (typeof avatar === "string" && avatar.startsWith("http")) {
      return avatar;
    }

    if (typeof avatar === "string" && avatar.startsWith("/")) {
      return BACKEND_URL ? `${BACKEND_URL}${avatar}` : FALLBACK_AVATAR;
    }

    return FALLBACK_AVATAR;
  };

  const buildPosterUri = (movie) => {
    if (movie?.posterOverride) return movie.posterOverride;
    if (movie?.poster) return movie.poster;
    if (movie?.poster_path) return `${TMDB_POSTER}${movie.poster_path}`;
    return FALLBACK_POSTER;
  };

  const getCinematographerWatchedMovies = (logs = [], personMovies = []) => {
    const personMovieMap = new Map();

    personMovies.forEach((movie) => {
      if (movie?.id) {
        personMovieMap.set(Number(movie.id), movie);
      }
    });

    const seen = new Map();

    logs.forEach((log) => {
      const tmdbId = getLogMovieId(log);
      if (!tmdbId || !personMovieMap.has(tmdbId)) return;

      const personMovie = personMovieMap.get(tmdbId);

      const existing = seen.get(tmdbId);
      const existingDate = existing?.watchedAt
        ? new Date(existing.watchedAt).getTime()
        : 0;

      const nextDate = log?.watchedAt
        ? new Date(log.watchedAt).getTime()
        : log?.createdAt
        ? new Date(log.createdAt).getTime()
        : 0;

      if (!existing || nextDate >= existingDate) {
        seen.set(tmdbId, {
          id: tmdbId,
          title:
            personMovie?.title ||
            personMovie?.original_title ||
            log?.movie?.title ||
            log?.title ||
            "Untitled",
          job: personMovie?.job || "",
          poster_path:
            personMovie?.poster_path ||
            log?.movie?.poster_path ||
            null,
          poster: log?.poster || log?.movie?.poster || null,
          posterOverride:
            log?.posterOverride || log?.movie?.posterOverride || null,
          rating: Number(log?.rating || 0),
          review: log?.review || "",
          watchedAt: log?.watchedAt || log?.createdAt || null,
        });
      }
    });

    return Array.from(seen.values()).sort((a, b) => {
      const da = a.watchedAt ? new Date(a.watchedAt).getTime() : 0;
      const db = b.watchedAt ? new Date(b.watchedAt).getTime() : 0;
      return db - da;
    });
  };

  const openCareerMovies = (careerUser, closeFriendsFirst = false) => {
    const watchedMovies = Array.isArray(careerUser?.watchedMovies)
      ? careerUser.watchedMovies
      : [];

    // ✅ Do not open empty modal
    if (watchedMovies.length === 0) return;

    const safeCareerUser = {
      ...(careerUser || {}),
      watchedMovies,
    };

    setSelectedCareerUser(safeCareerUser);

    // ✅ Prevent two transparent modals from stacking and freezing touches
    if (closeFriendsFirst) {
      setShowFriendsModal(false);

      setTimeout(() => {
        setShowCareerMoviesModal(true);
      }, 250);

      return;
    }

    setShowCareerMoviesModal(true);
  };

  const closeCareerMoviesModal = () => {
    setShowCareerMoviesModal(false);

    setTimeout(() => {
      setSelectedCareerUser(null);
    }, 200);
  };

  const getAwards = (name = "") => {
    if (!name) return `🎥 ${t("Cinematographer")} • ${t("Award data coming soon")}`;
  
    const normalized = String(name).trim().toLowerCase();
  
    const awardKey = Object.keys(cinematographerAwards || {}).find(
      (key) => String(key).trim().toLowerCase() === normalized
    );
  
    if (awardKey) return cinematographerAwards[awardKey];
  
    return `🎥 ${t("Cinematographer")} • ${t("Award data coming soon")}`;
  };

  useEffect(() => {
    const fetchPerson = async () => {
      try {
        setLoading(true);

        if (!id || !EXPO_TMDB_KEY) {
          console.warn("⚠️ Missing cinematographer id or TMDB key:", {
            id,
            hasKey: !!EXPO_TMDB_KEY,
          });

          setPersonEn(null);
          setPersonAr(null);
          setMovies([]);
          return;
        }

        const [detailsEnRes, detailsArRes, creditsResRaw] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/person/${id}?api_key=${EXPO_TMDB_KEY}&language=en-US`
          ),
          fetch(
            `https://api.themoviedb.org/3/person/${id}?api_key=${EXPO_TMDB_KEY}&language=ar-SA`
          ),
          fetch(
            `https://api.themoviedb.org/3/person/${id}/movie_credits?api_key=${EXPO_TMDB_KEY}&language=en-US`
          ),
        ]);

        

        const detailsEn = await detailsEnRes.json();
        const detailsAr = await detailsArRes.json();
        const creditsRes = await creditsResRaw.json();

        if (!detailsEnRes.ok || detailsEn?.success === false) {
          console.warn("⚠️ TMDB cinematographer details failed:", detailsEn);
          setPersonEn(null);
          setPersonAr(null);
          setMovies([]);
          return;
        }

        setPersonEn(detailsEn);
        setPersonAr(detailsArRes.ok ? detailsAr : null);

        const cinematographyMovies = (creditsRes?.crew || [])
          .filter((movie) => {
            const job = String(movie?.job || "").toLowerCase();
            const department = String(movie?.department || "").toLowerCase();

            return (
              movie?.id &&
              (
                department === "camera" ||
                job === "director of photography" ||
                job === "cinematography" ||
                job.includes("cinematographer")
              )
            );
          })
          .sort((a, b) => {
            const bp = Number(b?.popularity || 0);
            const ap = Number(a?.popularity || 0);
            return bp - ap;
          });

        setMovies(cinematographyMovies);
      } catch (err) {
        console.error("❌ Failed to fetch cinematographer:", err);
        setPersonEn(null);
        setPersonAr(null);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPerson();
  }, [id, EXPO_TMDB_KEY]);

  useEffect(() => {
    const fetchCareerStats = async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        const me = stored ? JSON.parse(stored) : null;

        if (!me?._id || !movies.length) return;

        const personMovieIds = movies.map((movie) => Number(movie.id)).filter(Boolean);

        const myLogsRes = await api.get(`/api/logs/user/${me._id}`);
        const myLogs = Array.isArray(myLogsRes.data) ? myLogsRes.data : [];
        const myWatchedIds = normalizeMovieIds(myLogs);
        const myWatchedMovies = getCinematographerWatchedMovies(myLogs, movies);

        setMyCareerPercent(calcPercent(myWatchedIds, personMovieIds));
        setMyCareerMovies(myWatchedMovies);

        const profileRes = await api.get(`/api/users/${me._id}`);
        const userProfile = profileRes.data || {};

        const following = Array.isArray(userProfile.following)
          ? userProfile.following
          : [];

        const followers = Array.isArray(userProfile.followers)
          ? userProfile.followers
          : [];

        const getFriendId = (friend) =>
          String(friend?._id || friend?.id || friend || "");

        const followingIds = new Set(
          following.map((friend) => getFriendId(friend)).filter(Boolean)
        );

        const mutuals = followers.filter((friend) =>
          followingIds.has(getFriendId(friend))
        );

        const friendStats = await Promise.all(
          mutuals.map(async (friend) => {
            const friendId = getFriendId(friend);
            if (!friendId) return null;

            try {
              let friendProfile =
                typeof friend === "object" && friend !== null ? friend : {};

              if (!friendProfile?.username || !friendProfile?.avatar) {
                try {
                  const profile = await api.get(`/api/users/${friendId}`);
                  friendProfile = {
                    ...friendProfile,
                    ...(profile?.data || {}),
                  };
                } catch {}
              }

              const res = await api.get(`/api/logs/user/${friendId}`);
              const friendLogs = Array.isArray(res.data) ? res.data : [];
              const watchedIds = normalizeMovieIds(friendLogs);
              const watchedMovies = getCinematographerWatchedMovies(
                friendLogs,
                movies
              );
              const percent = calcPercent(watchedIds, personMovieIds);

              return {
                _id: String(friendId),
                username:
                  friendProfile?.username ||
                  friendProfile?.name ||
                  "User",
                avatar: friendProfile?.avatar || null,
                percent,
                watchedMovies,
              };
            } catch {
              return null;
            }
          })
        );

        // ✅ Only show friends who watched at least 1 movie from this cinematographer
        const cleaned = friendStats
          .filter((friend) => {
            const watchedCount = Array.isArray(friend?.watchedMovies)
              ? friend.watchedMovies.length
              : 0;

            return watchedCount > 0;
          })
          .sort((a, b) => b.percent - a.percent);

        setFriendsBreakdown(cleaned);

        const avg =
          cleaned.length > 0
            ? Math.round(
                cleaned.reduce((sum, friend) => sum + friend.percent, 0) /
                  cleaned.length
              )
            : 0;

        setFriendsAveragePercent(avg);
      } catch (err) {
        console.error("❌ Failed to fetch cinematographer career stats:", err);
      }
    };

    if (movies.length) fetchCareerStats();
  }, [movies]);

  const { numColumns, cardWidth } = useMemo(() => {
    const SIDE = 16;
    const GAP = 10;
    const minCard = isTablet ? 150 : 105;

    const usable = width - SIDE * 2;
    let cols = Math.floor((usable + GAP) / (minCard + GAP));

    cols = Math.max(3, Math.min(isTablet ? 5 : 3, cols));

    const cardW = Math.floor((usable - GAP * (cols - 1)) / cols);

    return { numColumns: cols, cardWidth: cardW };
  }, [width, isTablet]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#B327F6" />
        <Text style={styles.loadingText}>{t("Loading cinematographer...")}</Text>
      </View>
    );
  }

  if (!personEn) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>{t("Cinematographer not found.")}</Text>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.emptyBackBtn}>
          <Text style={styles.emptyBackTxt}>{t("Go Back")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const personName = personEn.name || "Unknown";

  let displayName = personName;

  if (
    language === "ar" &&
    personAr?.name &&
    personAr.name.trim() &&
    personAr.name !== personEn.name
  ) {
    displayName = `${personAr.name} / ${personEn.name}`;
  }

  let localizedBio = personEn.biography || "";

  if (
    language === "ar" &&
    personAr?.biography?.trim() &&
    personAr.biography !== personEn.biography
  ) {
    localizedBio = personAr.biography;
  }

  const awardText = getAwards(personName);

  const knownDepartment =
  personEn.known_for_department === "Camera"
    ? t("Cinematographer")
    : personEn.known_for_department || t("Camera Department");

  const profileUri = personEn.profile_path
    ? `${TMDB_IMG}${personEn.profile_path}`
    : FALLBACK_AVATAR;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.hero}>
          <Image source={{ uri: profileUri }} style={styles.avatar} />

          <View style={styles.heroInfo}>
            <Text style={styles.roleText}>🎥 {knownDepartment}</Text>

            <Text style={styles.name}>{displayName}</Text>

            <Text style={styles.metaText}>
  {movies.length} {t("cinematography credits on Scene")}
</Text>
          </View>
        </View>

        <View style={styles.awardsCard}>
        <Text style={styles.cardTitle}>{t("Awards")}</Text>
          <Text style={styles.awardsText}>{awardText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>{t("Biography")}</Text>

          {localizedBio ? (
            <>
              <Text
                numberOfLines={showFullBio ? undefined : 4}
                style={styles.bio}
              >
                {localizedBio}
              </Text>

              {localizedBio.length > 300 && (
                <TouchableOpacity onPress={() => setShowFullBio((prev) => !prev)}>
                  <Text style={styles.readMore}>
                    {showFullBio ? t("show_less") : t("read_more")}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.muted}>{t("No biography yet.")}</Text>
          )}
        </View>

        <View style={styles.progressCard}>
        <Text style={styles.cardTitle}>{t("Career Progress")}</Text>

          <View style={styles.progressRow}>
            <TouchableOpacity
              style={[
                styles.progressPill,
                myCareerMovies.length === 0 && styles.progressPillDisabled,
              ]}
              onPress={() =>
                openCareerMovies({
                  _id: "me",
                  username: "You",
                  avatar: null,
                  percent: myCareerPercent,
                  watchedMovies: myCareerMovies,
                  isMe: true,
                })
              }
              activeOpacity={myCareerMovies.length === 0 ? 1 : 0.85}
            >
<Text style={styles.progressLabel}>{t("You")}</Text>
              <Text style={styles.progressValue}>{myCareerPercent}%</Text>

              <View style={styles.progressHintRow}>
                <Ionicons name="eye-outline" size={13} color="#aaa" />
                <Text style={styles.progressHint}>
  {myCareerMovies.length} {t("watched")}
</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.progressPill}
              onPress={() => setShowFriendsModal(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.progressLabel}>{t("Friends")}</Text>
              <Text style={styles.progressValue}>{friendsAveragePercent}%</Text>

              <View style={styles.progressHintRow}>
                <Ionicons name="people-outline" size={13} color="#aaa" />
                <Text style={styles.progressHint}>
  {friendsBreakdown.length} {t("friends")}
</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
        <Text style={styles.sectionHeader}>{t("Cinematography Credits")}</Text>

          {!movies.length ? (
            <Text style={styles.muted}>{t("No cinematography credits found.")}</Text>
          ) : (
            <FlatList
              data={movies}
              key={numColumns}
              keyExtractor={(item, index) =>
                `${item.id}-${item.credit_id || index}`
              }
              numColumns={numColumns}
              columnWrapperStyle={styles.movieColumn}
              contentContainerStyle={styles.movieGrid}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const posterUri = item.poster_path
                  ? `${TMDB_POSTER}${item.poster_path}`
                  : FALLBACK_POSTER;

                return (
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Movie", { id: item.id })}
                    style={{ width: cardWidth }}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: posterUri }}
                      style={[
                        styles.poster,
                        {
                          width: cardWidth,
                          height: Math.round(cardWidth * 1.5),
                        },
                      ]}
                    />

                    <Text numberOfLines={1} style={styles.movieTitle}>
                    {item.title || item.original_title || t("Untitled")}
                    </Text>

                    {!!item.job && (
                      <Text numberOfLines={1} style={styles.movieJob}>
                        {item.job}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showFriendsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFriendsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("Friends Career %")}</Text>

              <TouchableOpacity onPress={() => setShowFriendsModal(false)}>
                <Ionicons name="close" size={22} color="#aaa" />
              </TouchableOpacity>
            </View>

            {friendsBreakdown.length === 0 ? (
              <Text style={styles.modalEmpty}>
              {t("No mutual friends have watched this cinematographer yet.")}
            </Text>
            ) : (
              <FlatList
                data={friendsBreakdown}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const avatarUri = buildAvatarUri(item.avatar);

                  return (
                    <View style={styles.friendRow}>
                      <View style={styles.friendLeft}>
                        <Image
                          source={{ uri: avatarUri }}
                          style={styles.friendAvatar}
                        />

                        <View>
                          <Text style={styles.friendName}>@{item.username}</Text>
                          <Text style={styles.friendSubText}>
  {item.watchedMovies?.length || 0} {t("watched")}
</Text>
                        </View>
                      </View>

                      <View style={styles.friendRight}>
                        <TouchableOpacity
                          style={styles.eyeBtn}
                          onPress={() => openCareerMovies(item, true)}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="eye-outline" size={17} color="#fff" />
                        </TouchableOpacity>

                        <Text style={styles.friendPercent}>{item.percent}%</Text>
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCareerMoviesModal}
        transparent
        animationType="fade"
        onRequestClose={closeCareerMoviesModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardLarge}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                {selectedCareerUser?.isMe
  ? t("Your watched credits")
  : `@${selectedCareerUser?.username || t("User")}`}
                </Text>

                

                <Text style={styles.modalSubtitle}>
                {language === "ar"
  ? `${selectedCareerUser?.percent || 0}% ${t("of credits by")} ${personName}`
  : `${selectedCareerUser?.percent || 0}% ${t("of credits by")} ${personName}`}
                </Text>
              </View>

              <TouchableOpacity onPress={closeCareerMoviesModal}>
                <Ionicons name="close" size={22} color="#aaa" />
              </TouchableOpacity>
            </View>

            {!selectedCareerUser?.watchedMovies?.length ? (
              <Text style={styles.modalEmpty}>
              {t("No watched cinematography credits yet.")}
            </Text>
            ) : (
              <FlatList
                data={selectedCareerUser.watchedMovies}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const posterUri = buildPosterUri(item);

                  return (
                    <TouchableOpacity
                      style={styles.watchedMovieRow}
                      onPress={() => {
                        closeCareerMoviesModal();
                        setShowFriendsModal(false);

                        setTimeout(() => {
                          navigation.navigate("Movie", { id: item.id });
                        }, 220);
                      }}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={{ uri: posterUri }}
                        style={styles.watchedPoster}
                      />

                      <View style={styles.watchedInfo}>
                        <Text style={styles.watchedTitle} numberOfLines={1}>
                          {item.title}
                        </Text>

                        {!!item.job && (
                          <Text style={styles.watchedCharacter} numberOfLines={1}>
                            {item.job}
                          </Text>
                        )}

                        <View style={styles.ratingMiniRow}>
                          <Ionicons
                            name="star"
                            size={12}
                            color={item.rating > 0 ? "#B327F6" : "#777"}
                          />

                          <Text style={styles.watchedRating}>
                          {item.rating > 0
  ? `${item.rating.toFixed(1)} / 5`
  : t("Logged")}
                          </Text>
                        </View>
                      </View>

                      <Ionicons name="chevron-forward" size={18} color="#777" />
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  scrollContent: {
    paddingTop: 54,
    paddingBottom: 110,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: 24,
  },

  loadingText: {
    color: "#fff",
    marginTop: 10,
    textAlign: "center",
  },

  emptyBackBtn: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },

  emptyBackTxt: {
    color: "#fff",
    fontWeight: "700",
  },

  backButton: {
    position: "absolute",
    top: 48,
    left: 14,
    zIndex: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  hero: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 36,
    marginBottom: 18,
  },

  avatar: {
    width: 112,
    height: 168,
    borderRadius: 16,
    backgroundColor: "#222",
  },

  heroInfo: {
    flex: 1,
    paddingBottom: 8,
  },

  roleText: {
    color: "#B327F6",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
  },

  name: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    fontFamily: "PixelifySans_700Bold",
  },

  metaText: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 8,
  },

  awardsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(179,39,246,0.35)",
  },

  cardTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 10,
  },

  awardsText: {
    color: "#ddd",
    fontSize: 14,
    lineHeight: 20,
  },

  section: {
    marginHorizontal: 16,
    marginBottom: 18,
  },

  sectionHeader: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 10,
  },

  bio: {
    fontSize: 14,
    color: "#ddd",
    lineHeight: 21,
  },

  muted: {
    color: "#aaa",
    fontSize: 14,
  },

  readMore: {
    fontSize: 13,
    color: "#B327F6",
    marginTop: 8,
    fontWeight: "700",
  },

  progressCard: {
    marginHorizontal: 16,
    marginBottom: 18,
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#222",
  },

  progressRow: {
    flexDirection: "row",
    gap: 10,
  },

  progressPill: {
    flex: 1,
    backgroundColor: "#181818",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },

  progressPillDisabled: {
    opacity: 0.55,
  },

  progressLabel: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 4,
  },

  progressValue: {
    color: "#B327F6",
    fontSize: 22,
    fontWeight: "900",
  },

  progressHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },

  progressHint: {
    color: "#aaa",
    fontSize: 10.5,
    fontWeight: "600",
  },

  movieGrid: {
    gap: 12,
  },

  movieColumn: {
    gap: 10,
    marginBottom: 14,
  },

  poster: {
    borderRadius: 10,
    backgroundColor: "#222",
  },

  movieTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },

  movieJob: {
    color: "#888",
    fontSize: 10,
    marginTop: 2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  modalCard: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#222",
    maxHeight: "75%",
  },

  modalCardLarge: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#222",
    maxHeight: "82%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  modalTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  modalSubtitle: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
  },

  modalEmpty: {
    color: "#888",
    textAlign: "center",
    paddingVertical: 20,
  },

  friendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#1d1d1d",
  },

  friendLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: "#222",
  },

  friendName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  friendSubText: {
    color: "#777",
    fontSize: 11,
    marginTop: 2,
  },

  friendRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  eyeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#1c1c1c",
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },

  friendPercent: {
    color: "#B327F6",
    fontSize: 15,
    fontWeight: "800",
    minWidth: 42,
    textAlign: "right",
  },

  watchedMovieRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1d1d1d",
  },

  watchedPoster: {
    width: 46,
    height: 69,
    borderRadius: 8,
    backgroundColor: "#222",
    marginRight: 12,
  },

  watchedInfo: {
    flex: 1,
  },

  watchedTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  watchedCharacter: {
    color: "#888",
    fontSize: 12,
    marginTop: 3,
  },

  ratingMiniRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },

  watchedRating: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "700",
  },
});

