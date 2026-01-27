// src/screens/ImportScreen.js
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import SceneAdBanner from "../components/SceneAdBanner";
import api from "shared/api/api";
import useTranslate from "shared/utils/useTranslate";

const importEndpoints = {
  diary: "/api/letterboxd/logs",
  ratings: "/api/letterboxd/logs",
  watchlist: "/api/letterboxd/watchlist",
};

export default function ImportScreen() {
  const t = useTranslate();
  const navigation = useNavigation();

  const [files, setFiles] = useState({ diary: null, ratings: null, watchlist: null });
  const [previews, setPreviews] = useState({});
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const LABELS = useMemo(
    () => ({
      diary: ("Diary"),
      ratings: ("Ratings"),
      watchlist: ("Watchlist"),
    }),
    [t]
  );

  const anyFileSelected = !!(files.diary || files.ratings || files.watchlist);

  const pickFile = async (type) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "text/csv",
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;

      const file = res.assets[0];
      setFiles((prev) => ({ ...prev, [type]: file }));

      // preview first 3 lines
      const content = await fetch(file.uri).then((r) => r.text());
      const lines = content.split("\n").slice(1, 4);
      setPreviews((prev) => ({ ...prev, [type]: lines }));
    } catch (err) {
      console.error("❌ File pick failed", err);
      Toast.show({ type: "scene", text1: t("Preview unavailable") });
    }
  };

  const handleUpload = async () => {
    setLoading(true);
    const perTypeResults = {};

    for (const [type, file] of Object.entries(files)) {
      if (!file) continue;

      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name || `${type}.csv`,
        type: "text/csv",
      });

      try {
        await api.post(importEndpoints[type], formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        perTypeResults[type] = `✅ ${LABELS[type]} — ${t("Imported")}`;
      } catch (err) {
        console.error("❌ Import failed", err);
        perTypeResults[type] = `❌ ${t("Import failed for {{type}}", { type: LABELS[type] })}`;
      }
    }

    setResults(perTypeResults);
    setUploadComplete(true);
    setLoading(false);

    if (Object.values(perTypeResults).some((msg) => msg.startsWith("✅"))) {
      Toast.show({ type: "scene", text1: "🎬 " + t("Welcome to Scene!") });
    }
  };

  const undoImport = () => {
    setFiles({ diary: null, ratings: null, watchlist: null });
    setPreviews({});
    setResults({});
    setUploadComplete(false);
    Toast.show({ type: "scene", text1: "🗑️ " + t("Cleared last import.") });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0e0e0e" }}>
      {/* ❓ Help icon */}
      <TouchableOpacity
        style={styles.helpIcon}
        onPress={() => setShowInstructions(true)}
      >
        <MaterialIcons name="help-outline" size={26} color="#aaa" />
      </TouchableOpacity>

      {/* Back + Title */}
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={{ color: "#fff", fontSize: 18, }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t("Transfer Data from Letterboxd")}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120,}}>
        <Text style={styles.instructions}>
          {t(
            "Upload your exported files one by one from the Letterboxd data folder (watchlist.csv, ratings.csv, etc.)."
          )}
        </Text>

        {/* Upload Inputs */}
        {["diary", "ratings", "watchlist"].map((type) => {
          const file = files[type];
          const preview = previews[type];
          return (
            <View key={type} style={{ marginBottom: 10 }}>
              <Text style={styles.label}>{LABELS[type]}.csv</Text>

              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => pickFile(type)}
              >
                <Text style={{ color: "#fff" }}>
                  {file ? file.name : `📂 ${t("Choose file")}`}
                </Text>
              </TouchableOpacity>

              {preview && (
                <View style={{ marginTop: 6 }}>
                  {preview.map((line, i) => (
                    <Text key={i} style={styles.previewLine}>
                      {line}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {loading && (
          <View style={{ alignItems: "center", marginTop: 10 }}>
            <ActivityIndicator color="#B327F6" />
            <Text style={{ color: "#fff", marginTop: 6 }}>
              ⏳ {t("Uploading files...")}
            </Text>
          </View>
        )}

        {uploadComplete && (
          <View style={{ marginTop: 12 }}>
            {Object.values(results).map((msg, i) => (
              <Text key={i} style={{ color: "#ddd", fontSize: 13, marginBottom: 4 }}>
                {msg}
              </Text>
            ))}
          </View>
        )}

        {!uploadComplete ? (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: anyFileSelected ? "#111" : "#2a2a2a" },
            ]}
            disabled={!anyFileSelected || loading}
            onPress={handleUpload}
          >
            <Text style={{ color: "#fff" }}>🚀 {t("Upload All Files")}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#0f0" }]}
            onPress={() => navigation.navigate("ProfileScreen")}
          >
            <Text style={{ color: "#000", fontWeight: "bold" }}>
              ✅ {t("Continue to Profile")}
            </Text>
          </TouchableOpacity>
        )}

        {(previews.diary || previews.ratings || previews.watchlist) && (
          <TouchableOpacity style={styles.undoBtn} onPress={undoImport}>
            <Text style={{ color: "#f55", fontWeight: "600" }}>
              🗑️ {t("Undo Last Import")}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Instructions Modal */}
      <Modal visible={showInstructions} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={{ fontSize: 18, marginBottom: 12, color: "#aaa" }}>
              📥 {t("How to Import from Letterboxd")}
            </Text>
            <Text style={styles.modalLine}>
              1. {t("Go to your Letterboxd account on the website (not the app).")}
            </Text>
            <Text style={styles.modalLine}>
              2. {t("Go to Settings → Export your data.")}
            </Text>
            <Text style={styles.modalLine}>3. {t("Come back to Scene.")}</Text>
            <Text style={styles.modalLine}>
              4. {t("Upload them here in the correct fields.")}
            </Text>
            <Text style={styles.modalLine}>
              5. {t("Click Save — we'll handle the rest! 🚀")}
            </Text>
            <TouchableOpacity
              onPress={() => setShowInstructions(false)}
              style={styles.modalClose}
            >
              <Text style={{ color: "#fff" }}>{t("Close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ✅ Smart banner ad at bottom */}
      <View style={{ alignItems: "center", marginBottom: 56 }}>
      <SceneAdBanner /> 
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e0e0e", padding: 16 },
  helpIcon: { position: "absolute", marginTop: 85, right: 20, zIndex: 10 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 85,
    marginLeft: 10,
  },
  backBtn: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 16,
    width: 32,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 40,
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "600", alignItems: "center", },
  instructions: { fontSize: 10, color: "#aaa", marginBottom: 16, left: 12 },
  label: { fontSize: 13, fontWeight: "bold", color: "#fff", marginBottom: 6, left: 12 },
  uploadBtn: {
    padding: 12,
    borderWidth: 3,
    borderColor: "#444",
    borderRadius: 8,
    alignItems: "center",
    maxWidth: 450,
  },
  previewLine: { color: "#ccc", fontSize: 12 },
  actionBtn: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  undoBtn: {
    marginTop: 12,
    backgroundColor: "#331111",
    borderWidth: 1,
    borderColor: "#511",
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 20,
    maxWidth: 350,
  },
  modalLine: { color: "#ccc", fontSize: 14, marginBottom: 6 },
  modalClose: {
    marginTop: 12,
    backgroundColor: "#444",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
});
