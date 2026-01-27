import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import api from "shared/api/api";
import useTranslate from "shared/utils/useTranslate";
import { useNavigation } from "@react-navigation/native";

export default function ChangePasswordScreen() {
  const t = useTranslate();
  const navigation = useNavigation();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password || password.length < 6) {
      setError(t("Password must be at least 6 characters."));
      return;
    }

    if (password !== confirm) {
      setError(t("Passwords do not match."));
      return;
    }

    setLoading(true);
    try {
      const email = await AsyncStorage.getItem("resetEmail");
      const code = await AsyncStorage.getItem("resetCode");

      if (!email || !code) {
        setError(t("Reset flow expired. Please try again."));
        navigation.navigate("ForgotPassword");
        setLoading(false);
        return;
      }

      await api.post("/api/auth/reset-password", {
        email,
        code,
        newPassword: password,
      });

      Toast.show({ type: "scene", text1: "✅ " + t("Password updated!") });

      await AsyncStorage.removeItem("resetEmail");
      await AsyncStorage.removeItem("resetCode");

      navigation.navigate("Login");
    } catch (err) {
      console.warn("❌ Reset password failed:", err);
      setError(err.response?.data?.error || t("Failed to reset password."));
      Toast.show({ type: "scene", text1: "❌ " + t("Something went wrong.") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>{t("Reset Your Password")}</Text>

      <Text style={styles.subText}>
        {t("Enter your new password below to complete the reset.")}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        placeholder={t("New password")}
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TextInput
        placeholder={t("Confirm password")}
        placeholderTextColor="#888"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleReset}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t("Update Password")}</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0e0e",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  error: { color: "red", marginBottom: 12, textAlign: "center" },
  input: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 8,
    color: "#fff",
    marginBottom: 14,
  },
  button: {
    backgroundColor: "#B327F6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
