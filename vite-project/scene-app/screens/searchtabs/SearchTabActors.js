import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { Dimensions } from "react-native";

const TMDB_IMG = "https://image.tmdb.org/t/p/w300";
const FALLBACK_AVATAR = "https://scenesa.com/default-avatar.png";

export default function SearchTabActors({ results, saveToRecentSearches, onPressActor }) {
  if (!results || results.length === 0) {
    return (
      <Text style={styles.emptyText}>No actors found.</Text>
    );
  }

  return (
    <FlatList
      data={results}
      keyExtractor={(actor) => String(actor.id)}
      numColumns={2} // 2 per row, like movie grid
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item }) => {
        const imgSrc = item.profile_path
          ? `${TMDB_IMG}${item.profile_path}`
          : FALLBACK_AVATAR;

        return (
          <TouchableOpacity
            onPress={() => {
              saveToRecentSearches(item.name, "actors");
              if (onPressActor) onPressActor(item);
            }}
            style={styles.card}
          >
            <Image source={{ uri: imgSrc }} style={styles.avatar} />
            <Text numberOfLines={1} style={styles.name}>
              {item.name}
            </Text>
            <Text style={styles.subtle}>
              {item.known_for_department || "Actor"}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}


const screenWidth = Dimensions.get("window").width;
const ITEM_W = (screenWidth - 16 * 2 - 12) / 2; // 2 per row with padding + gap

const styles = StyleSheet.create({
  card: {
    width: ITEM_W,
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 1,
    marginLeft: 11,    // move right a bit
    marginBottom: 20, // lift up relative to bottom of header
  },
  avatar: {
    width: ITEM_W - 20,          // keep some padding
    height: (ITEM_W - 20) * 1.5, // 👈 portrait ratio (taller)
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: "#333",
  },
  name: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 6, // now actually visible spacing
  },
  subtle: {
    fontSize: 13,
    color: "#bbb",
    textAlign: "center",
  },
});

