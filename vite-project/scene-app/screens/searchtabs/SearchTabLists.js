// src/screens/searchtabs/ListsTab.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const FALLBACK_COVER = "https://scenesa.com/default-poster.jpg";

export default function ListsTab({
  results = [],                    // array of lists (from your search)
  saveToRecentSearches,            // (title, "lists")
  onPressList,                     // optional: (list) => navigation.navigate("List", { id: list._id })
  backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL,
  t = (s) => s,
}) {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        const u = raw ? JSON.parse(raw) : null;
        setUserId(u?._id || null);
      } catch {}
    })();
  }, []);

  if (!Array.isArray(results) || results.length === 0) {
    return <Text style={styles.emptyText}>{t("No lists found.")}</Text>;
  }

  const resolveCover = (src) => {
    if (!src) return FALLBACK_COVER;
    if (src.startsWith("http")) return src;
    return `${backendUrl}${src}`;
  };

  return (
    <FlatList
      data={results}
      keyExtractor={(l, i) => l?._id || l?.id || String(i)}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      renderItem={({ item: list }) => {
        const liked = Array.isArray(list?.likes) && userId
          ? list.likes.includes(userId)
          : false;

        return (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={async () => {
              try {
                await saveToRecentSearches?.(list?.title || "list", "lists");
              } catch {}
              onPressList?.(list);
            }}
            style={styles.card}
          >
            {/* Cover image (optional) */}
            {list?.coverImage ? (
              <Image
                source={{ uri: resolveCover(list.coverImage) }}
                style={styles.cover}
                resizeMode="cover"
              />
            ) : null}

            {/* Body */}
            <View style={styles.body}>
              <Text numberOfLines={1} style={styles.title}>
                {list?.title || t("Untitled List")}
              </Text>
              <Text style={styles.owner}>
                @{list?.user?.username || t("unknown")}
              </Text>

              <View style={styles.likesRow}>
                <MaterialIcons
                  name={liked ? "favorite" : "favorite-border"}
                  size={16}
                  color={liked ? "#B327F6" : "#999"}
                />
                <Text style={styles.likesText}>
                  {Array.isArray(list?.likes) ? list.likes.length : (list?.likes || 0)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 16,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cover: {
    width: "100%",
    height: 150,
    backgroundColor: "#111",
  },
  body: {
    padding: 10,
  },
  title: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "700",
    fontFamily: "PixelifySans_700Bold", // matches your vibe
  },
  owner: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 4,
  },
  likesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  likesText: {
    fontSize: 12,
    color: "#bbb",
  },
});
