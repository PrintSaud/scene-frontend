import React, { useMemo, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import useTranslate from "shared/utils/useTranslate";
import FullCastTab from "../movieTabs/FullCastTab";
import SimilarFilmsTab from "../movieTabs/SimilarFilmsTab";
import WhereToWatchTab from "../movieTabs/WhereToWatchTab";

export default function MovieTabs({
  activeTab,
  setActiveTab,
  credits,
  navigate,
  movieId,
  providers,
  selectedRegion,
  setSelectedRegion,
  onNavigateToMovie,
}) {
  const t = useTranslate();
  const [showCmd, setShowCmd] = useState(false);
  const [cmd, setCmd] = useState("");

  const tabs = useMemo(() => ([
    { key: "cast", label: t("Full Cast") },
    { key: "similar", label: t("Similar Films") },
    { key: "watch", label: t("Where to Watch") },
  ]), [t]);

  const handleCommandSubmit = useCallback(() => {
    const v = (cmd || "").trim().toLowerCase();
    const map = { c:"cast", cast:"cast", "full cast":"cast",
                  s:"similar", similar:"similar", "similar films":"similar",
                  w:"watch", watch:"watch", where:"watch", "where to watch":"watch" };
    const next = map[v];
    if (next) setActiveTab(next);
    setCmd("");
  }, [cmd, setActiveTab]);

  return (
    <View style={{ marginTop: 24 }}>
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
          >
            <Text style={[styles.tabTxt, activeTab === tab.key && styles.tabTxtActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={() => setShowCmd((s) => !s)} style={styles.kbToggle}>
        </TouchableOpacity>
      </View>

      {showCmd && (
        <View style={styles.cmdWrap}>
        </View>
      )}

      {activeTab === "cast" && <FullCastTab credits={credits} navigate={navigate} />}
      {activeTab === "similar" && (
        <SimilarFilmsTab movieId={movieId} navigate={navigate} onNavigateToMovie={onNavigateToMovie} />
      )}
      {activeTab === "watch" && (
        <WhereToWatchTab providers={providers} selectedRegion={selectedRegion} setSelectedRegion={setSelectedRegion} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: "row", marginTop: -10, alignItems: "flex-end", borderBottomWidth: 1, borderBottomColor: "#333" },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabBtnActive: { borderBottomColor: "#fff" },
  tabTxt: { fontSize: 14, color: "#888" },
  tabTxtActive: { color: "#fff", fontWeight: "700" },
  kbToggle: { paddingHorizontal: 8, paddingVertical: 8 },
  kbToggleTxt: { color: "#bbb", fontSize: 16 },
  cmdWrap: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8 },
  cmdInput: { flex: 1, borderWidth: 1, borderColor: "#333", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: "#fff" },
  cmdGo: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#444" },
  cmdGoTxt: { color: "#fff", fontWeight: "600" },
});
