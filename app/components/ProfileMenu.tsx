// app/components/ProfileMenu.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ProfileMenuProps = {
  visible: boolean;
  onClose: () => void;
};

const SESSION_KEY = "user_session";
const USER_DATA_KEY = "user_data";

export default function ProfileMenu({ visible, onClose }: ProfileMenuProps) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSettings = () => {
    onClose();
    router.push("/(tabs)/profile");
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear session data
              await AsyncStorage.removeItem(SESSION_KEY);
              await AsyncStorage.removeItem(USER_DATA_KEY);
              await AsyncStorage.removeItem("loginTime");
              onClose();
              // Navigate to login
              router.replace("/(auth)/login");
            } catch (error) {
              Alert.alert("Error", "Failed to logout");
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.profileMenuContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Profile Header */}
          <LinearGradient
            colors={["#a855f7", "#7c3aed"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.menuHeader}
          >
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle" size={56} color="#ffffff" />
            </View>
            <Text style={styles.userName}>Alex Johnson</Text>
            <Text style={styles.userEmail}>alex@mathprep.com</Text>
          </LinearGradient>

          {/* Menu Items */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSettings}
            activeOpacity={0.6}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="settings-outline" size={22} color="#475569" />
            </View>
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
            activeOpacity={0.6}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            </View>
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
            <Ionicons name="chevron-forward" size={18} color="#ef4444" />
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  profileMenuContainer: {
    marginHorizontal: 20,
    marginBottom: Platform.OS === "ios" ? 100 : 90,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 25,
  },
  menuHeader: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
  },
  menuIconContainer: {
    width: 36,
    marginRight: 12,
    alignItems: "center",
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
  },
  logoutItem: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  logoutText: {
    color: "#ef4444",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 20,
  },
});