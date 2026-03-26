// app/(tabs)/_layout.tsx
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Slot } from "expo-router";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import BottomTabBar from "../components/BottomTabBar";
import ProfileMenu from "../components/ProfileMenu";

function TabsLayoutContent() {
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const { colors, isDarkMode } = useTheme();

  const gradientColors: [string, string, string] = isDarkMode
    ? ["#0f172a", "#1e1b4b", "#2d1b69"]
    : ["#f8fafc", "#f1f5f9", "#e2e8f0"];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradientBackground}
      />
      
      <View style={styles.content}>
        <Slot />
      </View>

      <BottomTabBar onProfilePress={() => setProfileMenuVisible(true)} />

      <ProfileMenu 
        visible={profileMenuVisible} 
        onClose={() => setProfileMenuVisible(false)} 
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <ThemeProvider>
      <TabsLayoutContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
  },
});