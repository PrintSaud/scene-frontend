// src/screens/searchtabs/SearchTabDirectors.js
import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";

const TMDB_IMG = "https://image.tmdb.org/t/p/w300";

export default function SearchTabDirectors({ results, saveToRecentSearches, onPressDirector }) {
  // 🔍 filter out directors with no photo
  const filteredResults = results.filter((director) => director.profile_path);

  if (!filteredResults || filteredResults.length === 0) {
    return <Text style={styles.emptyText}>No directors found.</Text>;
  }

  return (
    <FlatList
      data={filteredResults}
      keyExtractor={(director) => String(director.id)}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item }) => {
        const imgSrc = `${TMDB_IMG}${item.profile_path}`;

        return (
          <TouchableOpacity
            onPress={() => {
              saveToRecentSearches(item.name, "directors");
              if (onPressDirector) onPressDirector(item);
            }}
            style={styles.card}
          >
            <Image source={{ uri: imgSrc }} style={styles.avatar} />
            <Text numberOfLines={1} style={styles.name}>
              {item.name}
            </Text>
            <Text style={styles.subtle}>Director</Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const screenWidth = Dimensions.get("window").width;
const GAP = 12;
const SIDE = 16;
const ITEM_W = (screenWidth - SIDE * 2 - GAP) / 2; // 2 columns with spacing
const ITEM_H = ITEM_W * 2.5; // portrait-like

const styles = StyleSheet.create({
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
  listContainer: {
    paddingHorizontal: SIDE,
    paddingTop: 12,
    paddingBottom: 20,
  },
  card: {
    width: ITEM_W,
    height: ITEM_H + 60, // room for name
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 8,
    marginBottom: 16,
  },
  avatar: {
    width: "100%",
    height: ITEM_H,
    borderRadius: 12,
    backgroundColor: "#333",
  },
  name: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
  subtle: {
    fontSize: 13,
    color: "#bbb",
    textAlign: "center",
    marginTop: 2,
  },
});
