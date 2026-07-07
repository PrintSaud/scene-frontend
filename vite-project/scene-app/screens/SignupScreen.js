import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import api from "../../../shared/api/api";
import { useLanguage } from "../../../shared/context/LanguageContext";
import useTranslate from "../../../shared/utils/useTranslate";

const SCENE_PURPLE = "#B327F6";

export default function SignupScreen() {
  const navigation = useNavigation();
  const { language, setLanguage } = useLanguage();
  const t = useTranslate();

  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [selectedLanguage, setSelectedLanguage] = useState(language || "en");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [usernameValid, setUsernameValid] = useState(true);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [emailValid, setEmailValid] = useState(true);
  const [emailTaken, setEmailTaken] = useState(false);
  const [emailCheckBusy, setEmailCheckBusy] = useState(false);
  const [emailDeliverable, setEmailDeliverable] = useState(null);

  const isValidUsername = (u) => /^[a-zA-Z0-9_]{3,20}$/.test(u);
  const validateEmailFormat = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const showSceneToast = (message, variant = "success") => {
    Toast.show({
      type: "scene",
      text1: message,
      props: { title: message, variant },
    });
  };

  const handleLanguageSelect = async (lang) => {
    try {
      setSelectedLanguage(lang);
      setLanguage(lang);
      await AsyncStorage.setItem("language", lang);

      showSceneToast(
        lang === "ar" ? t("Arabic selected") : t("English selected"),
        "success"
      );
    } catch (err) {
      console.log("Failed to save language locally:", err?.message || err);
    }
  };

  const handlePickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!res.canceled) {
      const img = res.assets[0];

      const manip = await ImageManipulator.manipulateAsync(
        img.uri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.PNG }
      );

      setAvatar(manip);
      setAvatarPreview(manip.uri);
    }
  };

  const showError = (msg) => {
    setError(msg);
    setIsLoading(false);
    showSceneToast(msg, "error");
  };

  const handleSignup = async () => {
    setError("");
    setIsLoading(true);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!avatar) return showError(t("Please upload an avatar."));
    if (!isValidUsername(cleanUsername)) return showError(t("Invalid username format."));
    if (usernameTaken) return showError(t("Username already taken."));
    if (!validateEmailFormat(cleanEmail)) return showError(t("Invalid email."));
    if (emailTaken) return showError(t("Email already in use."));
    if (password.length < 4) return showError(t("Password too short."));

    try {
      const res = await api.post(`/api/auth/register`, {
        username: cleanUsername,
        email: cleanEmail,
        password,
        language: selectedLanguage,
      });

      if (!res.data?.user || !res.data?.token) {
        throw new Error("Invalid signup response");
      }

      const mergedUser = {
        ...res.data.user,
        token: res.data.token,
        language: res.data.user?.language || selectedLanguage,
      };

      await AsyncStorage.setItem("language", mergedUser.language);
      setLanguage(mergedUser.language);

      await AsyncStorage.setItem("user", JSON.stringify(mergedUser));

      if (avatar) {
        const formData = new FormData();

        formData.append("avatar", {
          uri: avatar.uri,
          type: "image/png",
          name: "avatar.png",
        });

        await api.post(`/api/upload/avatar/${mergedUser._id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${mergedUser.token}`,
          },
        });
      }

      showSceneToast(t("Account created!"), "success");
      navigation.replace("VerifyEmail");
    } catch (err) {
      console.error(err);

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        t("Signup failed. Try again.");

      if (String(message).toLowerCase().includes("username")) {
        setUsernameTaken(true);
        setError(t("Username already taken."));
        showSceneToast(t("Username already taken."), "error");
      } else if (String(message).toLowerCase().includes("email")) {
        setEmailTaken(true);
        setError(t("Email already in use."));
        showSceneToast(t("Email already in use."), "error");
      } else {
        setError(message);
        showSceneToast(message, "error");
      }

      Alert.alert(t("Error"), message);
    } finally {
      setIsLoading(false);
    }
  };

  const languageLabel = selectedLanguage === "en" ? "English" : "العربية";

  return (
    <KeyboardAvoidingView
      style={styles.keyboardRoot}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.logo}>{t("Join Scene")} 🎬</Text>
        <Text style={styles.welcome}>{t("Create your account to log your films")} ✨</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.avatarBox} onPress={handlePickAvatar}>
          {avatarPreview ? (
            <Image source={{ uri: avatarPreview }} style={styles.avatar} />
          ) : (
            <Text style={styles.avatarPlaceholder}>{t("Upload Avatar")}</Text>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder={t("Username")}
          placeholderTextColor="#888"
          autoCapitalize="none"
          value={username}
          onChangeText={(value) => {
            setUsername(value);
            setUsernameTaken(false);
            setUsernameValid(true);
          }}
        />

        <TextInput
          style={styles.input}
          placeholder={t("Email")}
          placeholderTextColor="#888"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setEmailTaken(false);
            setEmailValid(true);
          }}
        />

        <TextInput
          style={styles.input}
          placeholder={t("Password")}
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <View style={styles.languageRow}>
          <Text style={styles.languageText}>🌐 {t("Choose Language")}</Text>

          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[
                styles.langBtn,
                selectedLanguage === "en" && styles.langBtnActive,
              ]}
              onPress={() => handleLanguageSelect("en")}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.langBtnText,
                  selectedLanguage === "en" && styles.langBtnTextActive,
                ]}
              >
                English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langBtn,
                selectedLanguage === "ar" && styles.langBtnActive,
              ]}
              onPress={() => handleLanguageSelect("ar")}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.langBtnText,
                  selectedLanguage === "ar" && styles.langBtnTextActive,
                ]}
              >
                العربية
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.selectedLanguageHint}>
          {t("Selected")}: {languageLabel}
        </Text>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t("Sign Up")}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>{t("Already have an account?")}</Text>

          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.signupLink}> {t("Log in")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
    backgroundColor: "#000",
  },

  scroll: {
    flex: 1,
    backgroundColor: "#000",
  },

  container: {
    flexGrow: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    paddingTop: 70,
    paddingBottom: 60,
  },

  logo: {
    fontFamily: "PixelifySans_700Bold",
    color: "#fff",
    fontSize: 34,
    marginBottom: 20,
    textAlign: "center",
  },

  welcome: {
    color: "#fff",
    fontFamily: "PixelifySans_700Bold",
    fontSize: 16,
    marginBottom: 22,
    textAlign: "center",
  },

  error: {
    color: "#ff4d4d",
    marginBottom: 12,
    textAlign: "center",
  },

  avatarBox: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: SCENE_PURPLE,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    overflow: "hidden",
  },

  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 55,
  },

  avatarPlaceholder: {
    color: "#ccc",
    fontSize: 13,
    fontWeight: "600",
  },

  input: {
    width: "100%",
    borderWidth: 3,
    borderColor: "#5c2e91",
    borderRadius: 12,
    color: "#fff",
    padding: 12,
    marginBottom: 12,
  },

  languageRow: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },

  languageText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },

  languageButtons: {
    flexDirection: "row",
    gap: 10,
  },

  langBtn: {
    flex: 1,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: "center",
  },

  langBtnActive: {
    backgroundColor: "rgba(179, 39, 246, 0.16)",
    borderColor: SCENE_PURPLE,
  },

  langBtnText: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: "700",
  },

  langBtnTextActive: {
    color: "#fff",
  },

  selectedLanguageHint: {
    width: "100%",
    color: "#888",
    fontSize: 12,
    marginBottom: 12,
    paddingLeft: 2,
  },

  button: {
    backgroundColor: SCENE_PURPLE,
    paddingVertical: 14,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 4,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },

  signupRow: {
    flexDirection: "row",
    marginTop: 18,
  },

  signupText: {
    color: "#ccc",
    fontSize: 13,
    fontFamily: "PixelifySans_700Bold",
  },

  signupLink: {
    color: SCENE_PURPLE,
    fontWeight: "600",
    fontSize: 13,
    textDecorationLine: "underline",
  },
});

