import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useLanguage } from "shared/context/LanguageContext";
import api from "shared/api/api";
import { LinearGradient } from "expo-linear-gradient";
import { useUser } from "../../App"; // adjust path if needed

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const { setUser } = useUser();   // 👈 get from context
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation();
  const { setLanguage } = useLanguage();

 


  const handleLogin = async () => {
    setError("");
    setIsLoading(true);
  
    try {
      const res = await api.post(`/api/auth/login`, { email, password });
      const mergedUser = { ...res.data.user, _id: res.data.user._id, token: res.data.token };
  
      await AsyncStorage.setItem("user", JSON.stringify(mergedUser));
      setUser(mergedUser);
      setLanguage(res.data.user?.language || "en");
  
      // 🚨 Navigate based on emailVerified
      if (res.data.user?.emailVerified === false) {
        navigation.navigate("VerifyEmail", { email: res.data.user.email });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      }
    } catch (err) {
      console.error(err);
      setError("Login failed. Please check your credentials.");
      Alert.alert("Error", "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };
  

  
  

  return (
    <View style={styles.background}>

      {/* 🔲 Purple Grid */}
      <View style={styles.grid}>
        {Array.from({ length: Math.floor(height / 40) }).map((_, row) => (
          <View
            key={`row-${row}`}
            style={[styles.gridLine, { top: row * 40, left: 0, right: 0, height: 1 }]}
          />
        ))}
        {Array.from({ length: Math.floor(width / 40) }).map((_, col) => (
          <View
            key={`col-${col}`}
            style={[styles.gridLine, { left: col * 40, top: 0, bottom: 0, width: 1 }]}
          />
        ))}
      </View>

      {/* 🌌 Gradient overlay */}
      <LinearGradient
        colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,1)"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Content */}
      <View style={styles.container}>
        <Text style={styles.logo}>
          Scene <Text style={{ fontSize: 28 }}>🎭</Text>
        </Text>
        <Text style={styles.welcome}>Welcome back! We missed you!</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={{ alignSelf: "flex-end", marginBottom: 10 }}
          onPress={() => navigation.navigate("ForgotPassword")}
        >
          <Text style={styles.forgot}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Gradient Button */}
        <TouchableOpacity onPress={handleLogin} disabled={isLoading} style={{ width: "100%" }}>
          <LinearGradient
            colors={["#a020f0", "#6a0dad"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Don’t have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.signupLink}> Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#000",
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: "absolute",
    backgroundColor: "rgba(160,32,240,0.2)", // soft purple grid lines
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
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
    fontSize: 24,
    marginBottom: 22,
    textAlign: "center",
  },
  error: {
    color: "#ff4d4d",
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 2,
    borderColor: "#5c2e91",
    borderRadius: 12,
    color: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    fontSize: 14,
  },
  forgot: {
    color: "#aaa",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 4,
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
  },
  signupLink: {
    color: "#a020f0",
    fontWeight: "600",
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
