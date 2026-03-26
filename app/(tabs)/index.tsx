// app/(tabs)/index.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";

export default function HomeScreen() {
  const { colors } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // Just refresh the time
    setCurrentTime(new Date());
    setTimeout(() => setRefreshing(false), 500);
  };

  // Format date in Tamil
  const formatDate = (date: Date) => {
    const days = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
    const months = ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${dayName}, ${day} ${monthName} ${year}`;
  };

  // Format time
  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'மாலை' : 'காலை';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes}:${seconds} ${ampm}`;
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} />
      }
    >
      <Header title="Quick" showNotification={false} showThemeToggle={true} />
      
      <View style={styles.content}>
        {/* Date and Time Card */}
        <LinearGradient
          colors={[colors.accent, "#7c3aed"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dateTimeCard}
        >
          <View style={styles.dateTimeContent}>
            <View style={styles.dateTimeIcon}>
              <Ionicons name="time-outline" size={32} color="#fff" />
            </View>
            <View style={styles.dateTimeText}>
              <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
              <Text style={styles.timeTextLarge}>{formatTime(currentTime)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Optional: Welcome Message */}
        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            Welcome to Quick
          </Text>
          <Text style={[styles.subText, { color: colors.textSecondary }]}>
            தமிழ் செய்திகள் | Music | Videos
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { 
    flex: 1, 
    paddingHorizontal: 20, 
    paddingTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dateTimeCard: {
    borderRadius: 24,
    width: "100%",
    overflow: "hidden",
    marginBottom: 30,
  },
  dateTimeContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    gap: 20,
  },
  dateTimeIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  dateTimeText: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 6,
  },
  timeTextLarge: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
  },
  welcomeContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    textAlign: "center",
  },
});