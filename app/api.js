import Constants from "expo-constants";
import { Platform } from "react-native";

// Use Railway URL when available, otherwise fall back to local dev
const RAILWAY_URL = "https://tailorconnect-production.up.railway.app";

// For local dev: simulator uses localhost, physical device needs your Mac's LAN IP
const getLocalUrl = () => {
  if (RAILWAY_URL) return RAILWAY_URL;
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3001"; // Android emulator loopback
  }
  // iOS simulator & physical devices — use your Mac's LAN IP
  const debuggerHost = Constants.expoConfig?.hostUri?.split(":")[0];
  const host = debuggerHost || "192.168.18.43";
  return `http://${host}:3001`;
};

export const API_BASE_URL = getLocalUrl();

export const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${cleanUrl}`;
};

