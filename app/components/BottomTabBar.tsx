// app/components/BottomTabBar.tsx
import React, { useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
} from "react-native";
import { useRouter, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useTheme } from "../context/ThemeContext";

type TabButtonProps = {
  label: string;
  iconFocused: string;
  iconUnfocused: string;
  focused: boolean;
  onPress: () => void;
};

type TabType = "index" | "youtube" | "music" | "profile" | "reminder";

function AnimatedTabButton({ label, iconFocused, iconUnfocused, focused, onPress }: TabButtonProps) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.1 : 1)).current;
  const translateYAnim = useRef(new Animated.Value(focused ? -2 : 0)).current;
  const { colors } = useTheme();

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.1 : 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: focused ? -2 : 0,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  const getIconColor = () => {
    if (focused) return colors.accent;
    return colors.icon;
  };

  const getLabelColor = () => {
    if (focused) return colors.accent;
    return colors.textSecondary;
  };

  const iconName: any = focused ? iconFocused : iconUnfocused;

  return (
    <TouchableOpacity style={styles.tabButton} onPress={onPress} activeOpacity={0.7}>
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
          },
        ]}
      >
        <View style={focused ? styles.activeIconGlow : null}>
          <Ionicons name={iconName} size={24} color={getIconColor()} />
        </View>
      </Animated.View>
      <Text style={[styles.tabLabel, focused && styles.activeTabLabel, { color: getLabelColor() }]}>
        {label}
      </Text>
      {focused && <View style={styles.activeDot} />}
    </TouchableOpacity>
  );
}

type BottomTabBarProps = {
  onProfilePress: () => void;
};

export default function BottomTabBar({ onProfilePress }: BottomTabBarProps) {
  const router = useRouter();
  const segments = useSegments();
  
  const segment = (segments as any[])[1];
  const validTabs: TabType[] = ["index", "youtube", "music", "profile", "reminder"];
  const activeTab: TabType = (segment && validTabs.includes(segment)) 
    ? (segment as TabType) 
    : "index";
  
  const { colors, isDarkMode } = useTheme();

  const getBarStyle = () => {
    if (isDarkMode) {
      return {
        backgroundColor: "rgba(30, 27, 75, 0.95)",
        borderColor: "rgba(168, 85, 247, 0.3)",
      };
    } else {
      return {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "rgba(168, 85, 247, 0.2)",
      };
    }
  };

  const barStyle = getBarStyle();

  return (
    <BlurView intensity={isDarkMode ? 90 : 80} tint={isDarkMode ? "dark" : "light"} style={[styles.bottomBar, barStyle]}>
      <View style={styles.bottomBarInner}>
        {/* Home Tab */}
        <AnimatedTabButton
          label="Home"
          iconFocused="home"
          iconUnfocused="home-outline"
          focused={activeTab === "index"}
          onPress={() => router.push("/(tabs)")}
        />

        {/* YouTube Tab */}
        <AnimatedTabButton
          label="YouTube"
          iconFocused="logo-youtube"
          iconUnfocused="logo-youtube"
          focused={activeTab === "youtube"}
          onPress={() => router.push("/(tabs)/youtube")}
        />

        {/* Music Tab */}
        <AnimatedTabButton
          label="Music"
          iconFocused="musical-notes"
          iconUnfocused="musical-notes-outline"
          focused={activeTab === "music"}
          onPress={() => router.push("/(tabs)/music")}
        />

        {/* Reminder Tab */}
        <AnimatedTabButton
          label="Reminder"
          iconFocused="alarm"
          iconUnfocused="alarm-outline"
          focused={activeTab === "reminder"}
          onPress={() => router.push("/(tabs)/reminder")}
        />

        {/* Profile Tab with Menu Trigger */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onProfilePress}
          style={styles.tabButton}
        >
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                transform: [{ scale: activeTab === "profile" ? 1.1 : 1 }],
              },
            ]}
          >
            <View style={activeTab === "profile" ? styles.activeIconGlow : null}>
              <Ionicons
                name={activeTab === "profile" ? "person-circle" : "person-circle-outline"}
                size={26}
                color={activeTab === "profile" ? colors.accent : colors.icon}
              />
            </View>
          </Animated.View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "profile" && styles.activeTabLabel,
              { color: activeTab === "profile" ? colors.accent : colors.textSecondary }
            ]}
          >
            Profile
          </Text>
          {activeTab === "profile" && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: "absolute",
    bottom: 21,
    left: 20,
    right: 20,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  bottomBarInner: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 4,
    position: "relative",
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  activeIconGlow: {
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
    letterSpacing: 0.3,
  },
  activeTabLabel: {
    fontWeight: "600",
  },
  activeDot: {
    position: "absolute",
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#a855f7",
  },
});