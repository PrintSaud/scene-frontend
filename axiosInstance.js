// axiosInstance.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const axiosInstance = axios.create({
  baseURL: "https://backend.scenesa.com", // your backend URL
  timeout: 10000,
});

// Automatically attach token if exists
axiosInstance.interceptors.request.use(async (config) => {
  const raw = await AsyncStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

export default axiosInstance;
