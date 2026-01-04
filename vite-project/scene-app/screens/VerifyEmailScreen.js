// src/screens/VerifyEmailScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "shared/api/api";
import { useUser } from "../../App";  // ✅ global user context

export default function VerifyEmailScreen() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const { setUser } = useUser();

  // ⏳ cooldown effect
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((t) => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError("Enter a valid 6-digit code.");
      return;
    }

    setIsLoading(true);
    try {
      const stored = await AsyncStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;

      const res = await api.post("/api/auth/verify-email-code", {
        email: user?.email,
        code,
      });

      if (res.data?.user && res.data?.token) {
        const fullUser = { ...res.data.user, token: res.data.token };

        // ✅ Save verified user with token
        await AsyncStorage.setItem("user", JSON.stringify(fullUser));
        setUser(fullUser); // triggers App.js to show MainTabs

        showSceneToast("✅ Welcome to Scene! 🎬", "success");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed.");
      showSceneToast("❌ Verification failed. Try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      const stored = await AsyncStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;

      await api.post("/api/auth/resend-email-code", {
        email: user?.email,
      });

      setCooldown(30);
      showSceneToast("📩 New code sent to your inbox!", "success");
    } catch (err) {
      showSceneToast("⚠️ Could not resend code. Try again later.", "error");
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Verify Your Email</Text>

      <Text style={styles.instructions}>
        We’ve sent a 6-digit code to your inbox.{"\n"}
        Enter it below to activate your account.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.codeInput}
        placeholder="Enter code"
        placeholderTextColor="#555"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleVerify}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.resendButton,
          (resending || cooldown > 0) && { opacity: 0.6 },
        ]}
        onPress={handleResend}
        disabled={resending || cooldown > 0}
      >
        {resending ? (
          <ActivityIndicator color="#a020f0" />
        ) : cooldown > 0 ? (
          <Text style={styles.resendText}>Resend in {cooldown}s</Text>
        ) : (
          <Text style={styles.resendText}>Resend Code</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    fontFamily: "PixelifySans_700Bold",
    color: "#fff",
    fontSize: 28,
    marginBottom: 16,
  },
  instructions: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  error: {
    color: "#ff4d4d",
    marginBottom: 12,
    fontWeight: "500",
  },
  codeInput: {
    width: "100%",
    borderWidth: 3,
    borderColor: "#5c2e91",
    borderRadius: 12,
    color: "#fff",
    padding: 12,
    textAlign: "center",
    letterSpacing: 8,
    fontSize: 18,
    marginBottom: 18,
  },
  button: {
    backgroundColor: "#a020f0",
    paddingVertical: 14,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  resendButton: {
    marginTop: 16,
  },
  resendText: {
    color: "#a020f0",
    fontWeight: "600",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
