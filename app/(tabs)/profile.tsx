import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";

export default function ProfileScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <Header title="Profile" showNotification={true} showThemeToggle={true} />
      
      <View style={styles.content}>
        {/* Profile Card */}
        <LinearGradient
          colors={[colors.accent, "#7c3aed"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#ffffff" />
          </View>
          <Text style={styles.userName}>Alex Johnson</Text>
          <Text style={styles.userEmail}>alex@mathprep.com</Text>
          <View style={styles.userStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>156</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Tests</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>89%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Settings Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Settings</Text>
          
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.settingIcon}>
              <Ionicons name="person-outline" size={22} color={colors.accent} />
            </View>
            <Text style={[styles.settingText, { color: colors.text }]}>Personal Information</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.settingIcon}>
              <Ionicons name="notifications-outline" size={22} color={colors.accent} />
            </View>
            <Text style={[styles.settingText, { color: colors.text }]}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.settingIcon}>
              <Ionicons name="lock-closed-outline" size={22} color={colors.accent} />
            </View>
            <Text style={[styles.settingText, { color: colors.text }]}>Privacy & Security</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.settingIcon}>
              <Ionicons name="color-palette-outline" size={22} color={colors.accent} />
            </View>
            <Text style={[styles.settingText, { color: colors.text }]}>Appearance</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
          
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.settingIcon}>
              <Ionicons name="help-circle-outline" size={22} color={colors.accent} />
            </View>
            <Text style={[styles.settingText, { color: colors.text }]}>Help Center</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.settingIcon}>
              <Ionicons name="chatbubble-outline" size={22} color={colors.accent} />
            </View>
            <Text style={[styles.settingText, { color: colors.text }]}>Feedback</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.settingIcon}>
              <Ionicons name="information-circle-outline" size={22} color={colors.accent} />
            </View>
            <Text style={[styles.settingText, { color: colors.text }]}>About</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  profileCard: {
    marginBottom: 24,
    padding: 24,
    borderRadius: 28,
    alignItems: "center",
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 20,
  },
  userStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 8,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  settingIcon: {
    width: 32,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
});