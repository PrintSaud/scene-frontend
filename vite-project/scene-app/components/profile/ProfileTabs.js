// src/components/profile/ProfileTabs.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import useTranslate from "shared/utils/useTranslate";

export default function ProfileTabs({ activeTab, setActiveTab }) {
  const t = useTranslate();

  const tabs = ["Profile", "Reviews", "Watchlist", "Lists", "Films"];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tab,
            activeTab === tab && styles.activeTab,
          ]}
          onPress={() => setActiveTab(tab)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText,
            ]}
          >
            {t(tab)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    justifyContent: "space-around",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#B327F6",
  },
  tabText: {
    fontSize: 10,
    color: "#888",
  },
  activeTabText: {
    fontWeight: "bold",
    color: "#fff",
  },
});
