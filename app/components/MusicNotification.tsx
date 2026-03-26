// app/components/MusicNotification.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Song } from "../services/musicService";

interface MusicNotificationProps {
  visible: boolean;
  song: Song | null;
  onClose: () => void;
  onPress: () => void;
}

export default function MusicNotification({ visible, song, onClose, onPress }: MusicNotificationProps) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && song) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        closeNotification();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      closeNotification();
    }
  }, [visible, song]);

  const closeNotification = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  if (!song) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity style={styles.content} onPress={onPress} activeOpacity={0.9}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.accent}20` }]}>
          <Ionicons name="musical-note" size={24} color={colors.accent} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {song.title}
          </Text>
          <Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
            {song.artist}
          </Text>
        </View>
        <TouchableOpacity onPress={closeNotification} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 1000,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  artist: {
    fontSize: 12,
  },
  closeButton: {
    padding: 8,
  },
});