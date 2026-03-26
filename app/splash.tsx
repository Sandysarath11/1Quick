// app/splash.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const SESSION_KEY = "user_session";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const session = await AsyncStorage.getItem(SESSION_KEY);
      setTimeout(() => {
        if (session) {
          router.replace("/(tabs)");
        } else {
          router.replace("/(auth)/login");
        }
      }, 2000);
    };
    checkSession();
  }, []);

  return (
    <LinearGradient colors={["#0f172a", "#1e1b4b", "#2d1b69"]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>⚡</Text>
        <Text style={styles.title}>Quick</Text>
        <Text style={styles.subtitle}>Fast | Smart | Simple</Text>
        <ActivityIndicator size="large" color="#a855f7" style={styles.loader} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: { fontSize: 60, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#94a3b8", marginBottom: 40 },
  loader: { marginTop: 20 },
});