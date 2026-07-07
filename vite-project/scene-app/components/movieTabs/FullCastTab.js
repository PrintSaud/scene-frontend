import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import useTranslate from "../../../../shared/utils/useTranslate";
import { TMDB_IMG } from "../../../../shared/config";

function uniqueById(list) {
  const seen = new Set();

  return list.filter((p) => {
    const id = p?.id ?? p?.credit_id;
    if (!id || seen.has(id)) return false;

    seen.add(id);
    return true;
  });
}

export default function FullCastTab({
  credits,                 // { cast: [], crew: [] } from TMDB
  navigate,                // (screen, params) => void
  initialCount = 12,       // how many cast to show before “Show more”
}) {
  const t = useTranslate();
  const [expanded, setExpanded] = useState(false);

  const cast = useMemo(() => {
    const arr = Array.isArray(credits?.cast) ? credits.cast : [];

    const sorted = [...arr].sort((a, b) => {
      const ao = Number.isFinite(a?.order) ? a.order : 9999;
      const bo = Number.isFinite(b?.order) ? b.order : 9999;

      if (ao !== bo) return ao - bo;

      return (b?.popularity || 0) - (a?.popularity || 0);
    });

    return sorted;
  }, [credits]);

  const cinematographers = useMemo(() => {
    const crew = Array.isArray(credits?.crew) ? credits.crew : [];

    const cameraCrew = crew.filter((c) => {
      const job = String(c?.job || "").toLowerCase();
      const department = String(c?.department || "").toLowerCase();

      return (
        job === "director of photography" ||
        job === "cinematography" ||
        job.includes("cinematographer") ||
        department === "camera"
      );
    });

    return uniqueById(cameraCrew).slice(0, 2);
  }, [credits]);

  const visibleCast = expanded ? cast : cast.slice(0, initialCount);

  const openActor = (id) => {
    if (!id) return;

    try {
      navigate?.("Actor", { id });
    } catch {}
  };

  const openCinematographer = (id) => {
    if (!id) return;

    try {
      navigate?.("Cinematographer", { id });
    } catch {
      navigate?.("Actor", { id });
    }
  };

  if (!credits) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#a855f7" />
      </View>
    );
  }

  if (!cast.length && !cinematographers.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{t("No cast available.")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🎥 Cinematographers */}
      {!!cinematographers.length && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Cinematography")}</Text>

          <View style={styles.cinematographersRow}>
            {cinematographers.map((person) => {
              const uri = person?.profile_path
                ? `${TMDB_IMG}${person.profile_path}`
                : null;

              return (
                <TouchableOpacity
                  key={person.id || person.credit_id}
                  onPress={() => openCinematographer(person.id)}
                  style={styles.cinematographerCard}
                  activeOpacity={0.8}
                >
                  {uri ? (
                    <Image
                      source={{ uri }}
                      style={styles.cinematographerAvatar}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.cinematographerAvatar,
                        styles.avatarFallback,
                      ]}
                    />
                  )}

                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={styles.cinematographerName}>
                      {person?.name || t("Unknown")}
                    </Text>

                    {!!person?.job && (
                      <Text numberOfLines={1} style={styles.cinematographerJob}>
                        {person.job}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* ⭐ Full Cast */}
      {!!cast.length && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("Full Cast")}</Text>

          <FlatList
            data={visibleCast}
            keyExtractor={(p, i) => String(p?.id ?? p?.credit_id ?? i)}
            numColumns={3}
            scrollEnabled={false}
            columnWrapperStyle={styles.castColumnWrapper}
            contentContainerStyle={styles.castContent}
            renderItem={({ item }) => {
              const uri = item?.profile_path ? `${TMDB_IMG}${item.profile_path}` : null;

              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => openActor(item?.id)}
                  activeOpacity={0.8}
                >
                  {uri ? (
                    <Image
                      source={{ uri }}
                      style={styles.portrait}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.portrait, styles.posterFallback]} />
                  )}

                  <Text numberOfLines={1} style={styles.personName}>
                    {item?.name || t("Unknown")}
                  </Text>

                  {!!item?.character && (
                    <Text numberOfLines={2} style={styles.character}>
                      {item.character}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            }}
            ListFooterComponent={
              cast.length > initialCount ? (
                <View style={styles.footer}>
                  <TouchableOpacity
                    onPress={() => setExpanded((e) => !e)}
                    style={styles.moreBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.moreTxt}>
                      {expanded ? t("Show less") : t("Show more")}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
  },

  center: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  muted: {
    color: "#aaa",
  },

  section: {
    marginBottom: 18,
  },

  sectionTitle: {
    color: "#fff",
    fontWeight: "700",
    marginBottom: 10,
    fontSize: 15,
    paddingHorizontal: 16,
    fontFamily: "PixelifySans_700Bold",
  },

  cinematographersRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
  },

  cinematographerCard: {
    flex: 1,
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 18,
  },

  cinematographerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: "#111",
  },

  avatarFallback: {
    borderWidth: 1,
    borderColor: "#333",
  },

  cinematographerName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  cinematographerJob: {
    color: "#888",
    fontSize: 11,
    marginTop: 2,
  },

  castContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  castColumnWrapper: {
    gap: 10,
  },

  card: {
    width: "31.8%",
    marginBottom: 16,
  },

  portrait: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 10,
    backgroundColor: "#0f0f0f",
  },

  posterFallback: {
    borderWidth: 1,
    borderColor: "#222",
  },

  personName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
  },

  character: {
    color: "#aaa",
    fontSize: 11,
    marginTop: 2,
  },

  footer: {
    marginTop: 6,
    marginBottom: 12,
    alignItems: "center",
  },

  moreBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
  },

  moreTxt: {
    color: "#fff",
    fontWeight: "600",
  },
});

