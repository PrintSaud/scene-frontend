// src/screens/SettingsScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import api from "shared/api/api";
import useTranslate from "shared/utils/useTranslate";
import { useLanguage } from "shared/context/LanguageContext";
import * as Updates from "expo-updates";
import { useUser } from "../../App";
export default function SettingsScreen() {
  const navigation = useNavigation();
  const t = useTranslate();
  const { language, setLanguage } = useLanguage();
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(true);
  // local wrapper so you can just call showSceneToast like in other screens
const showSceneToast = (message, type = "success") => {
    Toast.show({
      type: "scene", // uses your CustomToast config
      text1: message,
      position: "bottom",
    });
  };

  // load user from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        if (stored) setUser(JSON.parse(stored));
      } catch (err) {
        console.error("❌ Failed to load user", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

// inside SettingsScreen.js



const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("user");
      setUser(null);
  
      showSceneToast("Logged out!", "success");
  
      // 👇 Reset back to Login
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }], // must match App.js exactly
      });
  
    } catch (err) {
      console.error("❌ Logout failed", err);
      showSceneToast("⚠️ Logout failed", "error");
    }
  };
  
  
  

  const saveLanguage = async (newLang) => {
    try {
      setLanguage(newLang);

      if (user?.token) {
        await api.patch(
          `/api/users/${user._id}/language`,
          { language: newLang },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
      }

      const updatedUser = { ...user, language: newLang };
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));

      Toast.show({ type: "scene", text1: "🌐 " + t("Language updated!") });
    } catch (err) {
      console.error("❌ Language update failed", err);
      Toast.show({ type: "scene", text1: t("Failed to update language") });
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "⚠️ " + t("Delete Account"),
      t("Are you sure? This cannot be undone."),
      [
        { text: t("Cancel"), style: "cancel" },
        {
          text: t("Delete"),
          style: "destructive",
          onPress: async () => {
            if (!user?.token) {
              Toast.show({
                type: "scene",
                text1: t("You must be logged in to delete your account."),
              });
              return;
            }
            try {
              await api.delete("/api/auth/account", {
                headers: { Authorization: `Bearer ${user.token}` },
              });
              await AsyncStorage.removeItem("user");
              setUser(null); // ⬅️ triggers App.js to switch to auth stack
              Toast.show({ type: "scene", text1: t("Account deleted.") });
            } catch (err) {
              console.error("❌ Delete error:", err);
              Toast.show({
                type: "scene",
                text1: t("Failed to delete account."),
              });
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#B327F6" />
        <Text style={{ color: "#aaa", marginTop: 8 }}>
          {t("Loading settings...")}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* 🔙 Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={{ color: "#fff", fontSize: 18 }}>←</Text>
      </TouchableOpacity>

      {/* ⚙️ Account Section */}
      <Text style={styles.sectionTitle}>{t("Account")}</Text>

      <TouchableOpacity style={styles.row} onPress={handleLogout}>
        <Text style={styles.rowText}>🚪 {t("Log Out")}</Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <Text style={[styles.rowText, { flex: 1 , paddingTop: 22, top:-16, }]}>
          🌐 {t("Change Language")}
        </Text>
        <TouchableOpacity
          style={styles.langBtn}
          onPress={() => saveLanguage(language === "en" ? "ar" : "en")}
        >
          <Text style={{ color: "#fff" }}>
            {language === "en" ? "English" : "العربية"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.row, { backgroundColor: "#3a1a1a" }]}
        onPress={handleDeleteAccount}
      >
        <Text style={styles.rowText}>🗑️ {t("Delete Account")}</Text>
      </TouchableOpacity>

      {/* 📧 App Info */}
      <Text style={styles.sectionTitle}>{t("App Info")}</Text>

      <View style={styles.row}>
        <Text style={styles.rowText}>📧 {t("Contact Us")}: support@scenesa.com</Text>
      </View>

      <TouchableOpacity
        style={styles.row}
        onPress={() => Linking.openURL("https://twitter.com/JoinSceneApp")}
      >
        <Text style={styles.rowText}>𝕏 : @JoinSceneApp</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => Linking.openURL("https://instagram.com/JoinScene")}
      >
        <Text style={styles.rowText}>Instagram : @JoinScene</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => Linking.openURL("https://privacy.scenesa.com")}
      >
        <Text style={styles.rowText}>🔒 {t("Privacy Policy")}</Text>
      </TouchableOpacity>


      {/* 🎬 Footer */}
      <Text style={styles.footer}>
        🎬 Scene — {t("Built with ❤️ in Saudi Arabia")}
        {"\n"}© {new Date().getFullYear()} Scene. {t("All rights reserved.")}.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e0e0e", padding: 16 },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 999,
    top: 53,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 60,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginVertical: 16,
  },
  row: {
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 10,
    marginBottom: 22,
  },
  rowText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  langBtn: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  footer: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 12,
    color: "#888",
    marginBottom: 99,
  },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
});
