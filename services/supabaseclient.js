import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || "https://zwhghrbteuilgntrcrjr.supabase.co"; // Fallback URL
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3aGdocmJ0ZXVpbGdudHJjcmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1OTI3MjIsImV4cCI6MjA1NjE2ODcyMn0.2qGY82rbJnbhLELjL_QArHUsxsPv-b8Y8yVaY7bpCjo";  

console.log("Expo Config:", Constants.expoConfig);
console.log("Extra Config:", Constants.expoConfig?.extra);
console.log("Supabase URL from config:", Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL);
console.log("Supabase Anon Key from config:", Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase configuration error:", {
    supabaseUrl,
    supabaseAnonKey,
    hasExpoConfig: !!Constants.expoConfig,
    hasExtra: !!Constants.expoConfig?.extra,
  });
} else {
  console.log("Supabase URL:", supabaseUrl);
  console.log("Supabase Anon Key:", supabaseAnonKey);
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : undefined;

if (!supabase) {
  console.warn("Supabase client initialization failed, using undefined client. Check app.json configuration.");
}