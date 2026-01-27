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

export default function ForgotPasswordScreen() {
  const t = useTranslate();
  const navigation = useNavigation();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !email) {
      setError("⚠️ " + (t("Please enter both username and email.") || "Missing fields"));
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const res = await api.post("/api/auth/request-reset-code", {
        username,
        email,
      });

      await AsyncStorage.setItem("resetEmail", email); // save for next step
      Toast.show({ type: "scene", text1: "📧 " + t("Verification code sent!") });
      navigation.navigate("VerifyResetCodeScreen");
    } catch (err) {
      console.warn("❌ Reset request failed:", err);
      setError(err.response?.data?.error || "Something went wrong.");
      Toast.show({ type: "scene", text1: "❌ " + t("Failed to send reset code.") });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.logo}>Forgot Password?</Text>

      <Text style={styles.subText}>
        {t("Enter your Scene username and email to receive a reset code.")}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        placeholder={t("Your Scene username")}
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />

      <TextInput
        placeholder={t("Your email address")}
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
      />

      <TouchableOpacity
        onPress={handleSubmit}
        style={styles.button}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t("Send Reset Code")}</Text>
        )}
      </TouchableOpacity>

      {/* 👇 Go Back button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ marginTop: 16 }}
      >
        <Text style={styles.backLink}>← {t("Go back")}</Text>
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
  logo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
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
  backLink: { color: "#B327F6", fontSize: 13, fontWeight: "600" },
});
