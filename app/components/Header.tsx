import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

type HeaderProps = {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showNotification?: boolean;
  showThemeToggle?: boolean;
};

export default function Header({ 
  title = "Quick", 
  showBack = false, 
  onBack,
  showNotification = true,
  showThemeToggle = true
}: HeaderProps) {
  const { theme, toggleTheme, colors, isDarkMode } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: "transparent" }]}>
      {showBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      
      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      
      <View style={styles.rightButtons}>
        {showThemeToggle && (
          <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
            <Ionicons 
              name={isDarkMode ? "sunny-outline" : "moon-outline"} 
              size={22} 
              color={colors.text} 
            />
          </TouchableOpacity>
        )}
        
        {showNotification && (
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  rightButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  themeButton: {
    padding: 8,
  },
  notificationButton: {
    padding: 8,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  placeholder: {
    width: 40,
  },
});