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
import useTranslate from "shared/utils/useTranslate";
import { TMDB_IMG } from "shared/config";

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
  navigate,                // (screen, params) => void  e.g. navigation.navigate("Actor", { id })
  initialCount = 12,       // how many cast to show before “Show more”
}) {
  const t = useTranslate();
  const [expanded, setExpanded] = useState(false);

  const cast = useMemo(() => {
    const arr = Array.isArray(credits?.cast) ? credits.cast : [];
    // Try TMDB’s order field first, otherwise popularity descending
    const sorted = [...arr].sort((a, b) => {
      const ao = Number.isFinite(a?.order) ? a.order : 9999;
      const bo = Number.isFinite(b?.order) ? b.order : 9999;
      if (ao !== bo) return ao - bo;
      return (b?.popularity || 0) - (a?.popularity || 0);
    });
    return sorted;
  }, [credits]);

  const directors = useMemo(() => {
    const crew = Array.isArray(credits?.crew) ? credits.crew : [];
    return uniqueById(
      crew.filter((c) => (c?.job || "").toLowerCase() === "director")
    ).slice(0, 3);
  }, [credits]);

  const visibleCast = expanded ? cast : cast.slice(0, initialCount);

  if (!credits) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!cast.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{t("No cast available.")}</Text>
      </View>
    );
  }

  const openPerson = (id) => {
    if (!id) return;
    try {
      navigate?.("Actor", { id }); // your Actor screen route name
    } catch {}
  };

  return (
    <View style={{ marginTop: 16 }}>
      {/* 🎬 Directors strip (if any) */}
      {!!directors.length && (
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.sectionTitle}>{t("Director(s)")}</Text>
          <View style={styles.directorsRow}>
            {directors.map((d) => {
              const uri = d?.profile_path ? `${TMDB_IMG}${d.profile_path}` : null;
              return (
                <TouchableOpacity
                  key={d.id || d.credit_id}
                  onPress={() => openPerson(d.id)}
                  style={styles.directorChip}
                >
                  {uri ? (
                    <Image source={{ uri }} style={styles.directorAvatar} />
                  ) : (
                    <View style={[styles.directorAvatar, styles.avatarFallback]} />
                  )}
                  <Text numberOfLines={1} style={styles.directorName}>
                    {d?.name || t("Unknown")}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* ⭐ Top Billed Cast grid */}
      <FlatList
        data={visibleCast}
        keyExtractor={(p, i) => String(p?.id ?? i)}
        numColumns={3}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ paddingHorizontal: 10, gap: 10 }}
        renderItem={({ item }) => {
          const uri = item?.profile_path ? `${TMDB_IMG}${item.profile_path}` : null;
          return (
            <TouchableOpacity style={styles.card} onPress={() => openPerson(item?.id)}>
              {uri ? (
                <Image source={{ uri }} style={styles.portrait} resizeMode="cover" />
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
            <View style={{ marginTop: 6, marginBottom: 12, alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => setExpanded((e) => !e)}
                style={styles.moreBtn}
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
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 24, alignItems: "center", justifyContent: "center" },
  muted: { color: "#aaa" },

  sectionTitle: { color: "#fff", fontWeight: "700", marginBottom: 8, fontSize: 14, paddingHorizontal: 10 },
  directorsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 10 },
  directorChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  directorAvatar: { width: 22, height: 22, borderRadius: 11, marginRight: 8, backgroundColor: "#111" },
  avatarFallback: { borderWidth: 1, borderColor: "#333" },
  directorName: { color: "#ddd", maxWidth: 140, fontSize: 12 },

  card: { width: "31%", gap: 3, marginRight: 3,},
  portrait: { width: "100%", aspectRatio: 2 / 3, borderRadius: 10, backgroundColor: "#0f0f0f" },
  posterFallback: { borderWidth: 1, borderColor: "#222" },
  personName: { color: "#fff", fontSize: 13, fontWeight: "600" },
  character: { color: "#aaa", fontSize: 11 },
  moreBtn: { paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: "#333", borderRadius: 10 },
  moreTxt: { color: "#fff", fontWeight: "600" },
});
