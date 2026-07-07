import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  View,
  ActivityIndicator,
  Text,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";

import Toast from "react-native-toast-message";
import { toastConfig } from "./vite-project/scene-app/components/CustomToast";

import {
  useFonts,
  PixelifySans_400Regular,
  PixelifySans_500Medium,
  PixelifySans_600SemiBold,
  PixelifySans_700Bold,
} from "@expo-google-fonts/pixelify-sans";

import { LanguageProvider } from "./shared/context/LanguageContext";
import { NotificationProvider } from "./vite-project/scene-app/Context/NotificationContext";

// Screens
import AppIntro from "./vite-project/scene-app/screens/AppIntro";
import HomeScreen from "./vite-project/scene-app/screens/HomeScreen";
import SearchScreen from "./vite-project/scene-app/screens/SearchScreen";
import ProfileScreen from "./vite-project/scene-app/screens/ProfileScreen";
import LoginScreen from "./vite-project/scene-app/screens/LoginScreen";
import SignupScreen from "./vite-project/scene-app/screens/SignupScreen";
import VerifyEmailScreen from "./vite-project/scene-app/screens/VerifyEmailScreen";
import TrendingScreen from "./vite-project/scene-app/screens/TrendingScreen";
import MovieScreen from "./vite-project/scene-app/screens/MovieScreen";
import AddToListScreen from "./vite-project/scene-app/screens/AddToListScreen";
import ShareToFriendScreen from "./vite-project/scene-app/screens/ShareToFriendScreen";
import LogScreen from "./vite-project/scene-app/screens/LogScreen";
import ActorScreen from "./vite-project/scene-app/screens/ActorScreen";
import CinematographerScreen from "./vite-project/scene-app/screens/CinematographerScreen";
import DirectorScreen from "./vite-project/scene-app/screens/DirectorScreen";
import MovieFriendsScreen from "./vite-project/scene-app/screens/MovieFriendsScreen";
import MovieReviewsScreen from "./vite-project/scene-app/screens/MovieReviewsScreen";
import ListViewPage from "./vite-project/scene-app/screens/ListViewPage";
import CreateListScreen from "./vite-project/scene-app/screens/CreateListScreen";
import EditListScreen from "./vite-project/scene-app/screens/EditListScreen";
import EditProfileScreen from "./vite-project/scene-app/screens/EditProfileScreen";
import BackdropPickerScreen from "./vite-project/scene-app/screens/BackdropPickerScreen";
import ImportScreen from "./vite-project/scene-app/screens/ImportScreen";
import SettingsScreen from "./vite-project/scene-app/screens/SettingsScreen";
import FollowersFollowingScreen from "./vite-project/scene-app/screens/FollowersFollowingScreen";
import SceneBotScreen from "./vite-project/scene-app/screens/SceneBotScreen";
import ReviewPickerScreen from "./vite-project/scene-app/screens/ReviewPickerScreen";
import ForgotPasswordScreen from "./vite-project/scene-app/screens/ForgotPasswordScreen";
import VerifyResetCodeScreen from "./vite-project/scene-app/screens/VerifyResetCodeScreen";
import ChangePasswordScreen from "./vite-project/scene-app/screens/ChangePasswordScreen";
import NotificationsScreen from "./vite-project/scene-app/screens/NotificationsScreen";

// Review Screens
import ReviewPage from "./vite-project/scene-app/screens/review/ReviewPage";
import ChangeReviewBackdrop from "./vite-project/scene-app/screens/review/ChangeReviewBackdrop";
import RepliesPage from "./vite-project/scene-app/screens/review/RepliesPage";
import ShareReviewPage from "./vite-project/scene-app/screens/review/ShareReviewPage";

// Components
import BottomNav from "./vite-project/scene-app/components/BottomNav";
import BackdropSearchModal from "./vite-project/scene-app/components/BackdropSearchModal";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

function BootScreen({ label = "Loading Scene..." }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator size="large" color="#B327F6" />
      <Text style={{ color: "#aaa", marginTop: 10 }}>
        {label}
      </Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="SceneBot" component={SceneBotScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const [fontsLoaded] = useFonts({
    PixelifySans_400Regular,
    PixelifySans_500Medium,
    PixelifySans_600SemiBold,
    PixelifySans_700Bold,
  });

  useEffect(() => {
    let isMounted = true;

    const restoreUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;

        if (isMounted && parsedUser?.token) {
          setUser(parsedUser);
        }
      } catch (err) {
        console.log("Failed to restore user:", err?.message || err);
      } finally {
        if (isMounted) {
          setBooting(false);
        }
      }
    };

    restoreUser();

    return () => {
      isMounted = false;
    };
  }, []);

  if (booting || !fontsLoaded) {
    return <BootScreen />;
  }

  return (
    <LanguageProvider>
      <UserContext.Provider value={{ user, setUser }}>
        <NotificationProvider>
          <View style={{ flex: 1, backgroundColor: "#000" }}>
            <NavigationContainer>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                  <>
                    <Stack.Screen name="MainTabs" component={MainTabs} />

                    <Stack.Screen name="Intro" component={AppIntro} />
                    <Stack.Screen name="SceneBotScreen" component={SceneBotScreen} />
                    <Stack.Screen name="Trending" component={TrendingScreen} />
                    <Stack.Screen name="Movie" component={MovieScreen} />
                    <Stack.Screen name="AddToList" component={AddToListScreen} />

                    <Stack.Screen
                      name="ShareToFriends"
                      component={ShareToFriendScreen}
                    />

                    <Stack.Screen
                      name="LogScreen"
                      component={LogScreen}
                      options={{
                        presentation: "modal",
                        animation: "slide_from_bottom",
                        contentStyle: { backgroundColor: "#0e0e0e" },
                      }}
                    />

                    <Stack.Screen name="MovieFriends" component={MovieFriendsScreen} />
                    <Stack.Screen name="MovieReviews" component={MovieReviewsScreen} />
                    <Stack.Screen name="Actor" component={ActorScreen} />

                    <Stack.Screen
                      name="Cinematographer"
                      component={CinematographerScreen}
                    />

                    <Stack.Screen name="Director" component={DirectorScreen} />
                    <Stack.Screen name="ListViewPage" component={ListViewPage} />
                    <Stack.Screen name="CreateListScreen" component={CreateListScreen} />
                    <Stack.Screen name="EditListScreen" component={EditListScreen} />
                    <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
                    <Stack.Screen name="BackdropPicker" component={BackdropPickerScreen} />

                    <Stack.Screen
                      name="BackdropSearchModal"
                      component={BackdropSearchModal}
                    />

                    <Stack.Screen name="ImportScreen" component={ImportScreen} />
                    <Stack.Screen name="SettingsScreen" component={SettingsScreen} />

                    <Stack.Screen
                      name="FollowersFollowingScreen"
                      component={FollowersFollowingScreen}
                    />

                    <Stack.Screen name="ReviewPage" component={ReviewPage} />

                    <Stack.Screen
                      name="ChangeReviewBackdrop"
                      component={ChangeReviewBackdrop}
                    />

                    <Stack.Screen name="RepliesPage" component={RepliesPage} />
                    <Stack.Screen name="ShareReviewPage" component={ShareReviewPage} />
                    <Stack.Screen
                      name="ReviewPickerScreen"
                      component={ReviewPickerScreen}
                    />
                    <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
                  </>
                ) : (
                  <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Signup" component={SignupScreen} />
                    <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
                    <Stack.Screen
                      name="ForgotPassword"
                      component={ForgotPasswordScreen}
                    />

                    <Stack.Screen
                      name="VerifyResetCodeScreen"
                      component={VerifyResetCodeScreen}
                    />

                    <Stack.Screen
                      name="ChangePasswordScreen"
                      component={ChangePasswordScreen}
                    />
                  </>
                )}
              </Stack.Navigator>
            </NavigationContainer>

            <Toast config={toastConfig} position="bottom" bottomOffset={140} />
          </View>
        </NotificationProvider>
      </UserContext.Provider>
    </LanguageProvider>
  );
}

