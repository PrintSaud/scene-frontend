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

export default function VerifyResetCodeScreen() {
  const t = useTranslate();
  const navigation = useNavigation();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setError("");
    setLoading(true);
  
    const email = await AsyncStorage.getItem("resetEmail");
    if (!email) {
      setError(t("Reset flow expired. Please try again."));
      setTimeout(() => navigation.navigate("ForgotPassword"), 1200);
      setLoading(false);
      return;
    }
  
    try {
      // ✅ Just save code locally, we'll use it in ChangePasswordScreen
      await AsyncStorage.setItem("resetCode", code);
  
      Toast.show({ type: "scene", text1: "✅ " + t("Code saved, now reset password!") });
      navigation.navigate("ChangePasswordScreen");
    } catch (err) {
      console.warn("❌ Verify step failed:", err);
      setError(t("Something went wrong. Please try again."));
      Toast.show({ type: "scene", text1: "❌ " + t("Error occurred.") });
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.logo}>{t("Verify Code 📩")}</Text>

      <Text style={styles.subText}>
        {t("Enter the 6-digit code we sent to your email")}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder={t("Reset code")}
        placeholderTextColor="#888"
        value={code}
        onChangeText={setCode}
        maxLength={6}
        textAlign="center"
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t("Verify Code")}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("ForgotPassword")}
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
  error: { color: "#ff4d4d", marginBottom: 12, textAlign: "center" },
  input: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    padding: 14,
    borderRadius: 8,
    color: "#fff",
    fontSize: 18,
    letterSpacing: 6,
    marginBottom: 16,
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
