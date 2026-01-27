// src/screens/search/tabs/RecentTab.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import useTranslate from "shared/utils/useTranslate";

export default function RecentTab({ recentSearches = [], onSearch }) {
  const t = useTranslate();

  if (!Array.isArray(recentSearches) || recentSearches.length === 0) return null;

  const tabLabels = {
    films: t("Movies"),
    users: t("Users"),
    lists: t("Lists"),
    actors: t("Actors"),
    directors: t("Directors"),
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("Recent Searches")}</Text>

      <View style={{ gap: 12 }}>
        {recentSearches.map((item, index) => (
          <TouchableOpacity
            key={`${item.query}-${item.tab}-${index}`}
            onPress={() => onSearch?.(item.query, item.tab)}
            style={styles.row}
            activeOpacity={0.8}
          >
            <Text style={styles.queryText} numberOfLines={1}>
              {item.query}
            </Text>

            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {tabLabels[item.tab] || item.tab}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 100, // leave room for bottom nav
  },
  title: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 12,
    // If you want Pixelify on the title:
    // fontFamily: "PixelifySans_700Bold",
  },
  row: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  queryText: {
    color: "#fff",
    fontSize: 16,
    flexShrink: 1,
  },
  chip: {
    backgroundColor: "#333",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  chipText: {
    color: "#ccc",
    fontSize: 12,
    // fontFamily: "PixelifySans_700Bold",
  },
});
