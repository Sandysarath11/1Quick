// app/_layout.tsx
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { MusicProvider } from "./context/MusicContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from 'expo-notifications';
import { Platform } from "react-native";

const SESSION_KEY = "user_session";

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [segments]);

  const checkAuth = async () => {
    try {
      const session = await AsyncStorage.getItem(SESSION_KEY);
      const inAuthGroup = segments[0] === "(auth)";
      
      if (!session && !inAuthGroup) {
        router.replace("/(auth)/login");
      } else if (session && inAuthGroup) {
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("Auth check error:", error);
    }
  };

  // Configure notifications
  useEffect(() => {
    // Request permissions
    const requestPermissions = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
    };
    
    requestPermissions();
    
    // Android channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('media-playback', {
        name: 'Media Playback',
        importance: Notifications.AndroidImportance.HIGH,
        sound: null, // Changed from false to null
        vibrationPattern: [0, 0],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        description: 'Shows currently playing music',
      });
    }
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <MusicProvider>
        <RootLayoutNav />
      </MusicProvider>
    </ThemeProvider>
  );
}