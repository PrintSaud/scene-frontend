import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Modal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import api from "../../../shared/api/api";
import useTranslate from "../../../shared/utils/useTranslate";
import GifSearchModal from "../components/GifSearchModal";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Ionicons } from "@expo/vector-icons";

const TMDB_IMG = "https://image.tmdb.org/t/p";
const FALLBACK_POSTER = "https://scenesa.com/default-poster.jpg";
const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || "";

/** Auto-sizing media that NEVER crops (full content via contain) */
function MediaAuto({ uri, initialWidth = null, initialHeight = null }) {
  const [aspect, setAspect] = useState(
    initialWidth && initialHeight ? initialWidth / initialHeight : null
  );
  const [triedLoad, setTriedLoad] = useState(false);

  useEffect(() => {
    setAspect(initialWidth && initialHeight ? initialWidth / initialHeight : null);
    setTriedLoad(false);
  }, [uri, initialWidth, initialHeight]);

  useEffect(() => {
    if (!uri || aspect) return;
    Image.getSize(
      uri,
      (w, h) => {
        if (w && h) setAspect(w / h);
      },
      () => {}
    );
  }, [uri, aspect]);

  const onLoad = (e) => {
    const wh = e?.nativeEvent?.source;
    if (!aspect && wh?.width && wh?.height) setAspect(wh.width / wh.height);
    setTriedLoad(true);
  };

  if (!aspect) {
    return (
      <View style={styles.mediaShell}>
        <Image
          source={{ uri }}
          onLoad={onLoad}
          style={{ width: "100%", height: 260, resizeMode: "contain" }}
        />
        {!triedLoad && (
          <View style={styles.mediaOverlayLoader}>
            <ActivityIndicator color="#B327F6" />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.mediaShell}>
      <Image
        source={{ uri }}
        style={{ width: "100%", aspectRatio: aspect, resizeMode: "contain" }}
      />
    </View>
  );
}

const normalizeFavoriteCharacter = (character) => {
  if (!character) return null;

  return {
    characterId:
      character.characterId ??
      character.cast_id ??
      character.order ??
      null,
    actorId: character.actorId ?? character.id ?? null,
    characterName:
      character.characterName ??
      character.character ??
      "",
    actorName:
      character.actorName ??
      character.name ??
      "",
    profilePath:
      character.profilePath ??
      character.profile_path ??
      "",
  };
};

const getCharacterKey = (character) => {
  if (!character) return "";
  return String(
    character.actorId ||
      character.id ||
      character.characterId ||
      character.cast_id ||
      character.characterName ||
      character.character ||
      ""
  );
};

const getProfileImage = (character) => {
  const path = character?.profilePath || character?.profile_path;
  return path ? `${TMDB_IMG}/w185${path}` : FALLBACK_POSTER;
};

const formatTeamHashtag = (name) => {
  if (!name) return "";

  const mainName = String(name)
    .split(/[\/|,]/)[0]
    .trim();

  const cleaned = mainName.replace(/\s+/g, "");

  return cleaned ? `#Team${cleaned}` : "";
};

export default function LogScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const t = useTranslate();

  const {
    editLogId,
    logId: legacyLogId,
    movieId,
    movie: movieParam,
  } = route.params || {};

  const effectiveLogId = editLogId || legacyLogId || null;

  const [loading, setLoading] = useState(!!effectiveLogId);
  const [submitting, setSubmitting] = useState(false);

  const [movieData, setMovieData] = useState(null);
  const [rating, setRating] = useState(0);
  const [rewatchCount, setRewatchCount] = useState(0);
  const [review, setReview] = useState("");
  const [gifUrl, setGifUrl] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedSize, setUploadedSize] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [animatingFav, setAnimatingFav] = useState(false);
  const [showGifModal, setShowGifModal] = useState(false);

  // ✅ Favorite Character feature
  const [cast, setCast] = useState([]);
  const [castLoading, setCastLoading] = useState(false);
  const [showCastModal, setShowCastModal] = useState(false);
  const [selectedFavoriteCharacter, setSelectedFavoriteCharacter] = useState(null);
  const [favoriteCharacterTouched, setFavoriteCharacterTouched] = useState(false);

  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch {}
    })();
  }, []);

  const showSceneToast = (msg, variant = "success") => {
    Toast.show({ type: "scene", text1: msg, props: { title: msg, variant } });
  };

  const fetchMovieById = async (id) => {
    if (!id) return null;

    try {
      const { data } = await api.get(`/api/movies/${id}`);

      const poster = data?.poster_path
        ? `${TMDB_IMG}/w500${data.poster_path}`
        : FALLBACK_POSTER;

      return {
        id: data?.id || id,
        title: data?.title || data?.original_title || "Untitled",
        poster_path: data?.poster_path || null,
        poster,
        backdrop_path: data?.backdrop_path || null,
      };
    } catch (e) {
      return {
        id,
        title: "Untitled",
        poster: FALLBACK_POSTER,
        poster_path: null,
        backdrop_path: null,
      };
    }
  };

  const fetchCastByMovieId = async (id) => {
    if (!id) return [];

    // ✅ First try your backend if you already have/proxy credits there
    try {
      const { data } = await api.get(`/api/movies/${id}/credits`);
      const backendCast = data?.cast || data?.credits?.cast || [];
      if (Array.isArray(backendCast) && backendCast.length > 0) {
        return backendCast;
      }
    } catch {}

    // ✅ Fallback: direct TMDB call using Expo public env key
    if (!TMDB_API_KEY) return [];

    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${id}/credits?api_key=${TMDB_API_KEY}`
      );
      const data = await res.json();
      return Array.isArray(data?.cast) ? data.cast : [];
    } catch (err) {
      console.warn("⚠️ Failed to fetch movie cast:", err?.message);
      return [];
    }
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!effectiveLogId) {
          if (movieParam && typeof movieParam === "object") {
            alive &&
              setMovieData({
                id: movieParam.id || movieId,
                title: movieParam.title || "Untitled",
                poster:
                  movieParam.posterOverride ||
                  movieParam.poster ||
                  (movieParam.poster_path
                    ? `${TMDB_IMG}/w500${movieParam.poster_path}`
                    : FALLBACK_POSTER),
                poster_path: movieParam.poster_path || null,
                backdrop_path: movieParam.backdrop_path || null,
              });
          } else if (movieId) {
            const m = await fetchMovieById(movieId);
            alive && setMovieData(m);
          }
          return;
        }

        setLoading(true);

        const { data } = await api.get(`/api/logs/${effectiveLogId}`);

        const r = Number(data?.rating ?? 0);
        const rw = Number(data?.rewatchCount ?? data?.rewatch ?? 0);

        alive && setRating(isNaN(r) ? 0 : r);
        alive && setRewatchCount(isNaN(rw) ? 0 : rw);
        alive && setReview(data?.review || "");
        alive && setGifUrl(data?.gif || null);

        // ✅ Prefill favorite character when editing
        if (data?.favoriteCharacter?.characterName) {
          alive && setSelectedFavoriteCharacter(data.favoriteCharacter);
        }

        let mObj = null;

        if (data?.movie && typeof data.movie === "object") {
          mObj = {
            id: data.movie.id || data.movie._id || movieId,
            title: data.movie.title || "Untitled",
            poster:
              data.movie.posterOverride ||
              data.movie.poster ||
              (data.movie.poster_path
                ? `${TMDB_IMG}/w500${data.movie.poster_path}`
                : FALLBACK_POSTER),
            poster_path: data.movie.poster_path || null,
            backdrop_path: data.movie.backdrop_path || null,
          };
        } else {
          const mid = data?.movie || movieId;
          mObj = await fetchMovieById(mid);
        }

        alive && setMovieData(mObj);

        if (user?._id) {
          try {
            const favRes = await api.get(`/api/users/${user._id}/favorites`);
            const favIds = Array.isArray(favRes?.data?.favorites)
              ? favRes.data.favorites.map((m) => m?.id ?? m)
              : [];

            alive && setIsFavorite(favIds.includes(Number(mObj?.id)));
          } catch {}
        }
      } catch (err) {
        console.error("❌ Failed to load log:", err?.response?.data || err?.message);
        showSceneToast(t("log_failed"), "error");
      } finally {
        alive && setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [effectiveLogId, movieId, movieParam?.id, user?._id]);

  // ✅ Load cast when movie is ready
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!movieData?.id) return;

      try {
        setCastLoading(true);
        const castData = await fetchCastByMovieId(movieData.id);

        if (alive) {
          setCast(Array.isArray(castData) ? castData.slice(0, 60) : []);
        }
      } finally {
        alive && setCastLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [movieData?.id]);

  const visibleCharacters = useMemo(() => {
    const topSix = cast.slice(0, 6);

    if (!selectedFavoriteCharacter) return topSix;

    const selectedKey = getCharacterKey(selectedFavoriteCharacter);
    const alreadyInTopSix = topSix.some(
      (c) => getCharacterKey(c) === selectedKey
    );

    if (alreadyInTopSix) return topSix;

    // ✅ If user selected from full cast, keep only 6 visible and show selected in the grid
    return [...topSix.slice(0, 5), selectedFavoriteCharacter];
  }, [cast, selectedFavoriteCharacter]);

  const handleSelectCharacter = (character) => {
    const normalized = normalizeFavoriteCharacter(character);
    const currentKey = getCharacterKey(selectedFavoriteCharacter);
    const nextKey = getCharacterKey(normalized);

    setFavoriteCharacterTouched(true);

    // Tap selected again = remove selection
    if (currentKey && currentKey === nextKey) {
      setSelectedFavoriteCharacter(null);
    } else {
      setSelectedFavoriteCharacter(normalized);
    }

    setShowCastModal(false);
  };

  const handleStarClick = (index, isHalf) => {
    setRating(isHalf ? index + 0.5 : index + 1);
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!res.canceled) {
      const asset = res.assets?.[0];

      setUploadedImage(asset?.uri || null);

      if (asset?.width && asset?.height) {
        setUploadedSize({ w: asset.width, h: asset.height });
      } else {
        setUploadedSize(null);
      }

      setGifUrl(null);
    }
  };

  const handleSubmit = async () => {
    if (!movieData?.id) {
      showSceneToast(t("log_failed"), "error");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      formData.append("movieId", String(movieData.id));
      if (user?._id) formData.append("userId", String(user._id));

      formData.append("review", review || "");
      formData.append("rating", String(rating || 0));
      formData.append("rewatch", rewatchCount > 0 ? "true" : "false");
      formData.append("rewatchCount", String(rewatchCount || 0));
      formData.append("watchedAt", new Date().toISOString());
      formData.append("gif", gifUrl || "");
      formData.append("title", movieData.title || "Untitled");

      const finalPoster =
        movieData?.posterOverride ||
        movieData?.poster ||
        (movieData?.poster_path
          ? `${TMDB_IMG}/w500${movieData.poster_path}`
          : FALLBACK_POSTER);

      formData.append("poster", finalPoster);
      formData.append("backdrop", movieData.backdrop_path || "");

      // ✅ Favorite Character feature
      // Create mode: always send it.
      // Edit mode: only send null if user touched it, so old value doesn't get deleted accidentally.
      if (selectedFavoriteCharacter) {
        formData.append(
          "favoriteCharacter",
          JSON.stringify(selectedFavoriteCharacter)
        );
      } else if (!effectiveLogId || favoriteCharacterTouched) {
        formData.append("favoriteCharacter", JSON.stringify(null));
      }

      if (uploadedImage) {
        formData.append("image", {
          uri: uploadedImage,
          type: "image/jpeg",
          name: "log_upload.jpg",
        });
      }

      if (effectiveLogId) {
        await api.patch(`/api/logs/${effectiveLogId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        showSceneToast(t("log_updated"), "success");
        navigation.replace("ReviewPage", { id: effectiveLogId });
      } else {
        const { data } = await api.post(`/api/logs/full`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        showSceneToast(t("log_submitted"), "success");

        if ((review || "").trim() || gifUrl || uploadedImage) {
          navigation.replace("ReviewPage", { id: data?.log?._id });
        } else {
          navigation.replace("Movie", { id: movieData.id });
        }
      }

      if (isFavorite && user?._id) {
        try {
          await api.post(`/api/users/${user._id}/favorites/${movieData.id}`);
        } catch {}
      }
    } catch (err) {
      console.error("❌ Submit log failed:", err?.response?.data || err?.message);
      showSceneToast(t("log_failed"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const renderCharacterCard = (character, compact = false) => {
    const normalized = normalizeFavoriteCharacter(character);
    const selectedKey = getCharacterKey(selectedFavoriteCharacter);
    const thisKey = getCharacterKey(normalized);
    const selected = selectedKey && selectedKey === thisKey;

    return (
      <TouchableOpacity
        key={`${thisKey}-${normalized?.characterName}`}
        activeOpacity={0.85}
        onPress={() => handleSelectCharacter(character)}
        style={[
          compact ? styles.characterCardCompact : styles.characterCard,
          selected && styles.characterCardSelected,
        ]}
      >
        <Image
          source={{ uri: getProfileImage(normalized) }}
          style={compact ? styles.characterImageCompact : styles.characterImage}
        />

        <Text
          style={compact ? styles.characterNameCompact : styles.characterName}
          numberOfLines={1}
        >
          {normalized?.characterName || "Unknown"}
        </Text>

        <Text
          style={compact ? styles.actorNameCompact : styles.actorName}
          numberOfLines={1}
        >
          {normalized?.actorName || ""}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#B327F6" size="large" />
        <Text style={{ color: "#fff", marginTop: 10 }}>{t("loading")}</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: "#fff", fontSize: 22 }}>←</Text>
        </TouchableOpacity>

        {/* Poster + Info */}
        <View style={styles.row}>
          <Image
            source={{
              uri:
                movieData?.poster ||
                (movieData?.poster_path
                  ? `${TMDB_IMG}/w300${movieData?.poster_path}`
                  : FALLBACK_POSTER),
            }}
            style={styles.poster}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{movieData?.title || "Untitled"}</Text>

            {/* Stars */}
            <View style={{ flexDirection: "row", marginTop: 6 }}>
              {[...Array(5)].map((_, i) => {
                const isFull = i + 1 <= rating;
                const isHalf = rating >= i + 0.5 && rating < i + 1;

                return (
                  <View key={i} style={{ position: "relative", width: 32, height: 32 }}>
                    <TouchableOpacity
                      style={{
                        position: "absolute",
                        left: 0,
                        width: "50%",
                        height: "100%",
                        zIndex: 2,
                      }}
                      onPress={() => handleStarClick(i, true)}
                    />

                    <TouchableOpacity
                      style={{
                        position: "absolute",
                        right: 0,
                        width: "50%",
                        height: "100%",
                        zIndex: 2,
                      }}
                      onPress={() => handleStarClick(i, false)}
                    />

                    {isFull ? (
                      <FontAwesome name="star" size={28} color="#B327F6" />
                    ) : isHalf ? (
                      <FontAwesome name="star-half-full" size={28} color="#B327F6" />
                    ) : (
                      <FontAwesome name="star-o" size={28} color="#777" />
                    )}
                  </View>
                );
              })}
            </View>

            <Text style={{ marginTop: 4, fontSize: 12, color: "#aaa" }}>
              {rating > 0 ? `${rating.toFixed(1)} / 5` : t("no_rating_yet")}
            </Text>

            {/* Favorite */}
            <TouchableOpacity
              onPress={() => {
                setIsFavorite((p) => !p);
                setAnimatingFav(true);
                setTimeout(() => setAnimatingFav(false), 300);
              }}
              style={styles.favRow}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={isFavorite ? "#B327F6" : "#9BA1A6"}
                style={{ transform: [{ scale: animatingFav ? 1.2 : 1 }] }}
              />

              <Text style={{ color: "#aaa", marginLeft: 6 }}>
                {isFavorite ? t("marked_as_favorite") : t("mark_as_favorite")}
              </Text>
            </TouchableOpacity>

            {/* Rewatch */}
            <TouchableOpacity
              onPress={() => setRewatchCount((p) => p + 1)}
              style={styles.rewatchRow}
            >
              <MaterialIcons name="refresh" size={20} color="#aaa" />

              <Text style={{ color: "#aaa", marginLeft: 6 }}>
                {rewatchCount > 0 ? `${rewatchCount}x` : t("mark_as_rewatch")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Review */}
        <TextInput
          style={styles.textInput}
          multiline
          placeholder={t("write_your_thoughts")}
          placeholderTextColor="#777"
          value={review}
          onChangeText={setReview}
        />

        {/* ✅ Favorite Character */}
        <View style={styles.favoriteCharacterSection}>
          <View style={styles.favoriteCharacterHeader}>
            <Text style={styles.favoriteCharacterTitle}>Favorite character</Text>

            {selectedFavoriteCharacter?.characterName ? (
  <Text style={styles.teamPreview} numberOfLines={1}>
    {formatTeamHashtag(selectedFavoriteCharacter.characterName)}
  </Text>
) : null}
          </View>

          {castLoading ? (
            <View style={styles.castLoadingBox}>
              <ActivityIndicator color="#B327F6" />
            </View>
          ) : visibleCharacters.length > 0 ? (
            <>
              <View style={styles.characterGrid}>
                {visibleCharacters.map((character) => renderCharacterCard(character))}
              </View>

              <TouchableOpacity
                onPress={() => setShowCastModal(true)}
                style={styles.moreCharactersBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.moreCharactersText}>More →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.noCastText}>No cast found for this movie.</Text>
          )}
        </View>

        {/* Photo preview */}
        {uploadedImage && !gifUrl ? (
          <View style={styles.previewBox}>
            <MediaAuto
              uri={uploadedImage}
              initialWidth={uploadedSize?.w}
              initialHeight={uploadedSize?.h}
            />

            <TouchableOpacity
              onPress={() => setUploadedImage(null)}
              style={styles.removeBtn}
            >
              <Text style={{ color: "#fff" }}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* GIF preview */}
        {gifUrl ? (
          <View style={styles.previewBox}>
            <MediaAuto uri={gifUrl} />

            <TouchableOpacity
              onPress={() => setGifUrl(null)}
              style={styles.removeBtn}
            >
              <Text style={{ color: "#fff" }}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Upload + Gif */}
        <View style={styles.row}>
          <TouchableOpacity onPress={pickImage} style={styles.uploadBtn}>
            <Text style={{ color: "#fff" }}>Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowGifModal(true)}
            style={styles.uploadBtn}
          >
            <Text style={{ color: "#fff" }}>GIF</Text>
          </TouchableOpacity>
        </View>

        {showGifModal ? (
          <GifSearchModal
            visible={showGifModal}
            onSelect={(url) => {
              setGifUrl(url);
              setUploadedImage(null);
              setShowGifModal(false);
            }}
            onClose={() => setShowGifModal(false)}
          />
        ) : null}

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.submitBtn, submitting && { opacity: 0.5 }]}
        >
          <Text style={{ color: "#000", fontWeight: "600" }}>
            {effectiveLogId ? t("update") : t("log")}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ✅ Full Cast Modal */}
      <Modal
        visible={showCastModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCastModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.castModal}>
            <View style={styles.castModalHeader}>
              <TouchableOpacity
                onPress={() => setShowCastModal(false)}
                style={styles.castModalClose}
              >
                <Text style={{ color: "#fff", fontSize: 22 }}>←</Text>
              </TouchableOpacity>

              <Text style={styles.castModalTitle}>Choose character</Text>

              <View style={{ width: 36 }} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              <View style={styles.fullCastGrid}>
                {cast.map((character) => renderCharacterCard(character, true))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0e0e",
    padding: 20,
    paddingBottom: 10,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0e0e0e",
  },

  backBtn: {
    marginBottom: 52,
    top: 33,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  poster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: "#222",
  },

  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },

  favRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  rewatchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  textInput: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    color: "#fff",
    padding: 12,
    minHeight: 100,
    marginBottom: 14,
  },

  favoriteCharacterSection: {
    marginBottom: 18,
  },

  favoriteCharacterHeader: {
    marginBottom: 10,
  },

  favoriteCharacterTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  teamPreview: {
    color: "#B327F6",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },

  castLoadingBox: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },

  characterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  characterCard: {
    width: "31.5%",
    backgroundColor: "#171717",
    borderRadius: 14,
    padding: 7,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#242424",
  },

  characterCardSelected: {
    borderColor: "#B327F6",
    shadowColor: "#B327F6",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },

  characterImage: {
    width: "100%",
    height: 118,
    borderRadius: 11,
    backgroundColor: "#222",
    marginBottom: 7,
    resizeMode: "cover",
  },

  characterName: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },

  actorName: {
    color: "#888",
    fontSize: 9,
    marginTop: 2,
    textAlign: "center",
  },

  moreCharactersBtn: {
    alignSelf: "center",
    marginTop: 2,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },

  moreCharactersText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },

  noCastText: {
    color: "#777",
    fontSize: 12,
    marginTop: 4,
  },

  mediaShell: {
    width: "100%",
    alignSelf: "center",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#111",
  },

  mediaOverlayLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },

  previewBox: {
    marginTop: 12,
    position: "relative",
  },

  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 4,
  },

  uploadBtn: {
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
  },

  submitBtn: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },

  castModal: {
    height: "88%",
    backgroundColor: "#0e0e0e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 14,
  },

  castModalHeader: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  castModalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
  },

  castModalTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  fullCastGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  characterCardCompact: {
    width: "31.5%",
    backgroundColor: "#171717",
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#242424",
  },

  characterImageCompact: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: "#222",
    marginBottom: 7,
  },

  characterNameCompact: {
    color: "#fff",
    fontSize: 10.5,
    fontWeight: "700",
    textAlign: "center",
  },

  actorNameCompact: {
    color: "#888",
    fontSize: 8.5,
    marginTop: 2,
    textAlign: "center",
  },
});

