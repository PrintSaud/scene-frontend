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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import api from "shared/api/api";

export default function SignupScreen() {
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [usernameValid, setUsernameValid] = useState(true);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [emailValid, setEmailValid] = useState(true);
  const [emailTaken, setEmailTaken] = useState(false);
  const [emailCheckBusy, setEmailCheckBusy] = useState(false);
  const [emailDeliverable, setEmailDeliverable] = useState(null);

  const navigation = useNavigation();

  const isValidUsername = (u) => /^[a-zA-Z0-9_]{3,20}$/.test(u);
  const validateEmailFormat = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

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

  const handleSignup = async () => {
    setError("");
    setIsLoading(true);
  
    if (!avatar) return showError("Please upload an avatar.");
    if (!isValidUsername(username)) return showError("Invalid username format.");
    if (usernameTaken) return showError("Username already taken.");
    if (!validateEmailFormat(email)) return showError("Invalid email.");
    if (emailTaken) return showError("Email already in use.");
    if (password.length < 4) return showError("Password too short.");
  
    try {
      // 📥 Register → now returns { token, user }
      const res = await api.post(`/api/auth/register`, {
        username,
        email,
        password,
      });
  
      if (!res.data?.user || !res.data?.token)
        throw new Error("Invalid signup response");
  
      const mergedUser = { ...res.data.user, token: res.data.token };
  
      // Save with token
      await AsyncStorage.setItem("user", JSON.stringify(mergedUser));
  
      // Upload avatar with token
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
  
      // Go to VerifyEmail screen
      navigation.replace("VerifyEmail");
    } catch (err) {
      console.error(err);
      setError("Signup failed.");
      Alert.alert("Error", "Signup failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };
  

  const showError = (msg) => {
    setError(msg);
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Join Scene 🎬</Text>
      <Text style={styles.welcome}>Create your account to log your films ✨</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.avatarBox} onPress={handlePickAvatar}>
        {avatarPreview ? (
          <Image source={{ uri: avatarPreview }} style={styles.avatar} />
        ) : (
          <Text style={{ color: "#ccc" }}>Upload Avatar</Text>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
      />

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

      <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <View style={styles.signupRow}>
        <Text style={styles.signupText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.signupLink}> Log in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center", padding: 24 },
  logo: { fontFamily: "PixelifySans_700Bold", color: "#fff", fontSize: 34, marginBottom: 20, textAlign: "center" },
  welcome: { color: "#fff", fontFamily: "PixelifySans_700Bold", fontSize: 16, marginBottom: 22, textAlign: "center" },
  error: { color: "#ff4d4d", marginBottom: 12, textAlign: "center" },
  avatarBox: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#a020f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    overflow: "hidden",
  },
  avatar: { width: "100%", height: "100%", borderRadius: 55 },
  input: {
    width: "100%",
    borderWidth: 3,
    borderColor: "#5c2e91",
    borderRadius: 12,
    color: "#fff",
    padding: 12,
    marginBottom: 12,
  },
  button: { backgroundColor: "#a020f0", paddingVertical: 14, borderRadius: 8, width: "100%", alignItems: "center", marginTop: 4 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  signupRow: { flexDirection: "row", marginTop: 18 },
  signupText: { color: "#ccc", fontSize: 13, fontFamily: "PixelifySans_700Bold" },
  signupLink: { color: "#a020f0", fontWeight: "600", fontSize: 13, textDecorationLine: "underline" },
});
