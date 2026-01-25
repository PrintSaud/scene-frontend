import React, { useEffect, useState, createContext, useContext } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import Toast from "react-native-toast-message";
// let Notifications;
let Device;

import { toastConfig } from "./src/components/CustomToast";
import { socket } from "shared/socket";
import { LanguageProvider } from "shared/context/LanguageContext";
import { NotificationProvider } from "shared/context/NotificationContext";

import AppIntro from "./src/screens/AppIntro";
import HomeScreen from "./src/screens/HomeScreen";
import SearchScreen from "./src/screens/SearchScreen";
import ProfileScreen from "./src/screens/ProfileScreen"; // used in both tab + stack
import NotificationsScreen from "./src/screens/NotificationsScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import VerifyEmailScreen from "./src/screens/VerifyEmailScreen";
import TrendingScreen from "./src/screens/TrendingScreen";
import MovieScreen from "./src/screens/MovieScreen";
import AddToListScreen from "./src/screens/AddToListScreen";
import ShareToFriendScreen from "./src/screens/ShareToFriendScreen";
import LogScreen from "./src/screens/LogScreen";
import ActorScreen from "./src/screens/ActorScreen";
import DirectorScreen from "./src/screens/DirectorScreen";
import MovieFriendsScreen from "./src/screens/MovieFriendsScreen";
import MovieReviewsScreen from "./src/screens/MovieReviewsScreen";
import ListViewPage from "./src/screens/ListViewPage";
import BottomNav from "./src/components/BottomNav";
import CreateListScreen from "./src/screens/CreateListScreen";
import EditListScreen from "./src/screens/EditListScreen";
import EditProfileScreen from "./src/screens/EditProfileScreen";
import BackdropPickerScreen from "./src/screens/BackdropPickerScreen";
import BackdropSearchModal from "./src/components/BackdropSearchModal";
import ImportScreen from "./src/screens/ImportScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import FollowersFollowingScreen from "./src/screens/FollowersFollowingScreen";
import SceneBotScreen from "./src/screens/SceneBotScreen";
import ReviewPage from "./src/screens/review/ReviewPage";
import ChangeReviewBackdrop from "./src/screens/review/ChangeReviewBackdrop";
import RepliesPage from "./src/screens/review/RepliesPage";
import ShareReviewPage from "./src/screens/review/ShareReviewPage";
import ReviewPickerScreen from "./src/screens/ReviewPickerScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import VerifyResetCodeScreen from "./src/screens/VerifyResetCodeScreen";
import ChangePasswordScreen from "./src/screens/ChangePasswordScreen";
import { Alert } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";
import axiosInstance from "./axiosInstance"; 
import * as Notifications from 'expo-notifications';

import { LogBox } from "react-native";
// Keep warnings visible while we fix; comment out later if you want.
// LogBox.ignoreLogs(['not a valid icon name for family "anticon"']);

// ✅ Preload vector-icon fonts so glyph maps are ready on first render
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import * as Font from "expo-font";


import {
  useFonts,
  PixelifySans_400Regular,
  PixelifySans_700Bold,
} from "@expo-google-fonts/pixelify-sans";



const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
export const UserContext = createContext();
export const useUser = () => useContext(UserContext);

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="SceneBot" component={SceneBotScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      {/* Tab version of profile = always current user */}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  const [fontsLoaded] = useFonts({
    PixelifySans_400Regular,
    PixelifySans_700Bold,
  });

    // ✅ Ensure icon fonts are loaded (prevents "family anticon" / missing glyph issues)
    useEffect(() => {
      (async () => {
         try {
           await Font.loadAsync({
            ...AntDesign.font,
             ...MaterialIcons.font, // optional, but you use it in ReviewHeader
           });
        } catch (e) {
          console.warn("Failed to load icon fonts", e);
       }
      })();
     }, []);

 // useEffect(() => {
  //  const clearStorage = async () => {
    //  try {
      //  await AsyncStorage.clear();
      //  console.log("🧹 AsyncStorage cleared on app start");
     // } catch (err) {
       // console.error("❌ Failed to clear storage:", err);
    //  }
  //  };

  //  clearStorage();
 // }, []);


  // Load user on start
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        setUser(stored ? JSON.parse(stored) : null);
      } catch {
        setUser(null);
      }
    })();
  }, []);

  // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YzI4MmExZDk0MjEwNGZkMDVhNGQ5YiIsImlhdCI6MTc1NzU3NzkyMiwiZXhwIjoxNzYwMTY5OTIyfQ.qHEO3QjVbgumFr-ext1trErl9Di7colsgSaubF67emM

    useEffect(() => {
      const debugUser = async () => {
        const raw = await AsyncStorage.getItem("user");
        console.log("🔹 AsyncStorage User:", raw);
      };
      debugUser();
    }, []);

    useEffect(() => {
      let fcmUnsubscribe;
    
      const registerPushTokens = async () => {
        try {
          const raw = await AsyncStorage.getItem("user");
          const user = raw ? JSON.parse(raw) : null;
          if (!user?.token) return;
    
          // Check device (Expo / real device)
          if (Platform.OS === "ios" || Platform.OS === "android") {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
let finalStatus = existingStatus;

if (existingStatus !== "granted") {
  const { status } = await Notifications.requestPermissionsAsync();
  finalStatus = status;
}

if (finalStatus !== "granted") {
  console.log("Notifications permission not granted");
  return;
}

    
            // Expo push token (iOS/Android via Expo)
            const expoTokenData = await Notifications.getExpoPushTokenAsync();
            await axiosInstance.post("/api/users/save-token", {
              deviceToken: expoTokenData.data,
              provider: "expo",
            });
    
            // FCM token (Android)
            const fcmToken = await messaging().getToken();
            if (fcmToken) {
              console.log("✅ FCM token:", fcmToken);
              await axiosInstance.post("/api/users/save-token", {
                deviceToken: fcmToken,
                provider: "fcm",
              });
            }
    
            // Listen for FCM token refresh
            fcmUnsubscribe = messaging().onTokenRefresh(async (newToken) => {
              console.log("♻️ FCM token refreshed:", newToken);
              await axiosInstance.post("/api/users/save-token", {
                deviceToken: newToken,
                provider: "fcm",
              });
            });
          }
        } catch (err) {
          console.error("❌ Failed to register push tokens:", err);
        }
      };
    
      registerPushTokens();
    
      return () => {
        if (fcmUnsubscribe) fcmUnsubscribe();
      };
    }, [user?.token]);
    
    
    
    


  // Connect socket for live notifications
  useEffect(() => {
    if (!user?._id) return;
    socket.connect();
    socket.emit("join", user._id);
    socket.off("notification").on("notification", () => {
      console.log("🔔 Live notification received");
    });
    return () => socket.disconnect();
  }, [user?._id]);

  useEffect(() => {
    async function initAds() {
      // ✅ Register emulator/your device as test device
      await setTestDeviceIDAsync("EMULATOR");
    }
    initAds();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <LanguageProvider>
        <NotificationProvider>
          <>
            <View style={{ flex: 1 }}>
              <ActionSheetProvider>
              <NavigationContainer key={user ? "app" : "auth"}>
                  {!fontsLoaded ? (
                    <View
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "#000",
                      }}
                    >
                      <ActivityIndicator size="large" color="#fff" />
                    </View>
                  ) : (




<Stack.Navigator screenOptions={{ headerShown: false }}>
{user ? (
  // 🚀 Always allow login to main app
  <Stack.Group>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="Intro" component={AppIntro} />
    <Stack.Screen name="SceneBotScreen" component={SceneBotScreen} />
    <Stack.Screen name="Trending" component={TrendingScreen} />
    <Stack.Screen name="Movie" component={MovieScreen} />
    <Stack.Screen name="AddToList" component={AddToListScreen} />
    <Stack.Screen name="ShareToFriends" component={ShareToFriendScreen} />
    <Stack.Screen
      name="LogScreen"
      component={LogScreen}
      options={{
        headerShown: false,
        presentation: Platform.OS === "ios" ? "modal" : "modal",
        animation: "slide_from_bottom",
        contentStyle: { backgroundColor: "#0e0e0e" },
      }}
    />
    <Stack.Screen name="MovieFriends" component={MovieFriendsScreen} />
    <Stack.Screen name="MovieReviews" component={MovieReviewsScreen} />
    <Stack.Screen name="Actor" component={ActorScreen} />
    <Stack.Screen name="Director" component={DirectorScreen} />
    <Stack.Screen name="ListViewPage" component={ListViewPage} />
    <Stack.Screen name="CreateListScreen" component={CreateListScreen} />
    <Stack.Screen name="EditListScreen" component={EditListScreen} />
    <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
    <Stack.Screen name="BackdropPicker" component={BackdropPickerScreen} />
    <Stack.Screen name="BackdropSearchModal" component={BackdropSearchModal} />
    <Stack.Screen name="ImportScreen" component={ImportScreen} />
    <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
    <Stack.Screen name="ReviewPage" component={ReviewPage} />
    <Stack.Screen name="FollowersFollowingScreen" component={FollowersFollowingScreen} />
    <Stack.Screen name="ChangeReviewBackdrop" component={ChangeReviewBackdrop} />
    <Stack.Screen name="RepliesPage" component={RepliesPage} />
    <Stack.Screen name="ShareReviewPage" component={ShareReviewPage} />
    <Stack.Screen name="ReviewPickerScreen" component={ReviewPickerScreen} />
    <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
  </Stack.Group>
) : (
  // 🔑 Not logged in → auth stack
  <Stack.Group>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
    <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="VerifyResetCodeScreen" component={VerifyResetCodeScreen} />
    <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
  </Stack.Group>
)}

</Stack.Navigator>



                  )}
                </NavigationContainer>
              </ActionSheetProvider>
            </View>
            <Toast config={toastConfig} position="bottom" bottomOffset={140} />
          </>
        </NotificationProvider>
      </LanguageProvider>
    </UserContext.Provider>
  );
}
