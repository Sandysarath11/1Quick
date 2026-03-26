import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function StatsScreen() {
  const { colors, isDarkMode } = useTheme();

  // Sample data for stats
  const stats = {
    totalTests: 24,
    averageScore: 85,
    studyHours: 48,
    streak: 7,
  };

  const recentTests = [
    { name: "Algebra Basics", score: 92, date: "Mar 20, 2026", icon: "calculator-outline" },
    { name: "Quadratic Equations", score: 78, date: "Mar 18, 2026", icon: "calculator-outline" },
    { name: "Trigonometry", score: 88, date: "Mar 15, 2026", icon: "triangle-outline" },
    { name: "Geometry", score: 95, date: "Mar 12, 2026", icon: "cube-outline" },
  ];

  const weeklyProgress = [65, 72, 80, 68, 85, 78, 82]; // Mon-Sun

  const subjects = [
    { name: "Algebra", score: 85, color: "#a855f7" },
    { name: "Geometry", score: 78, color: "#3b82f6" },
    { name: "Trigonometry", score: 92, color: "#10b981" },
    { name: "Calculus", score: 71, color: "#f59e0b" },
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      showsVerticalScrollIndicator={false}
    >
      <Header title="Statistics" showNotification={true} showThemeToggle={true} />
      
      <View style={styles.content}>
        {/* Stats Cards Row 1 */}
        <View style={styles.statsRow}>
          <LinearGradient
            colors={[colors.accent, "#7c3aed"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <Ionicons name="document-text-outline" size={24} color="#ffffff" />
            <Text style={styles.statNumber}>{stats.totalTests}</Text>
            <Text style={styles.statLabel}>Tests Taken</Text>
          </LinearGradient>

          <LinearGradient
            colors={["#3b82f6", "#06b6d4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <Ionicons name="stats-chart-outline" size={24} color="#ffffff" />
            <Text style={styles.statNumber}>{stats.averageScore}%</Text>
            <Text style={styles.statLabel}>Avg. Score</Text>
          </LinearGradient>
        </View>

        {/* Stats Cards Row 2 */}
        <View style={styles.statsRow}>
          <LinearGradient
            colors={["#f59e0b", "#ef4444"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <Ionicons name="time-outline" size={24} color="#ffffff" />
            <Text style={styles.statNumber}>{stats.studyHours}h</Text>
            <Text style={styles.statLabel}>Study Hours</Text>
          </LinearGradient>

          <LinearGradient
            colors={["#10b981", "#14b8a6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <Ionicons name="flame-outline" size={24} color="#ffffff" />
            <Text style={styles.statNumber}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </LinearGradient>
        </View>

        {/* Weekly Progress Graph */}
        <View style={[styles.graphCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={22} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Weekly Progress</Text>
          </View>
          <View style={styles.graphContainer}>
            {weeklyProgress.map((progress, index) => (
              <View key={index} style={styles.graphBarContainer}>
                <View style={styles.graphBarWrapper}>
                  <View 
                    style={[
                      styles.graphBar, 
                      { height: `${progress}%`, backgroundColor: getBarColor(progress) }
                    ]} 
                  />
                </View>
                <Text style={[styles.graphLabel, { color: colors.textSecondary }]}>
                  {["M", "T", "W", "T", "F", "S", "S"][index]}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.graphLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Score (%)</Text>
            </View>
          </View>
        </View>

        {/* Subject Performance */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="school-outline" size={22} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Subject Performance</Text>
          </View>
          
          {subjects.map((subject, index) => (
            <View key={index} style={styles.subjectItem}>
              <View style={styles.subjectHeader}>
                <Text style={[styles.subjectName, { color: colors.text }]}>{subject.name}</Text>
                <Text style={[styles.subjectScore, { color: subject.color }]}>{subject.score}%</Text>
              </View>
              <View style={styles.subjectBar}>
                <View 
                  style={[
                    styles.subjectFill, 
                    { width: `${subject.score}%`, backgroundColor: subject.color }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>

        {/* Recent Tests */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="list-outline" size={22} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Recent Tests</Text>
          </View>
          
          {recentTests.map((test, index) => (
            <View key={index} style={styles.testItem}>
              <View style={[styles.testIcon, { backgroundColor: getIconColor(test.score) }]}>
                <Ionicons name={test.icon as any} size={20} color="#ffffff" />
              </View>
              <View style={styles.testInfo}>
                <Text style={[styles.testName, { color: colors.text }]}>{test.name}</Text>
                <Text style={[styles.testDate, { color: colors.textSecondary }]}>{test.date}</Text>
              </View>
              <View style={styles.testScore}>
                <Text style={[styles.scoreText, { color: getScoreColor(test.score) }]}>
                  {test.score}%
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Achievement Badges */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="medal-outline" size={22} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Achievements</Text>
          </View>
          
          <View style={styles.badgesContainer}>
            <View style={styles.badge}>
              <LinearGradient
                colors={["#f59e0b", "#ef4444"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.badgeIcon}
              >
                <Ionicons name="flame-outline" size={28} color="#ffffff" />
              </LinearGradient>
              <Text style={[styles.badgeTitle, { color: colors.text }]}>7 Day Streak</Text>
              <Text style={[styles.badgeDesc, { color: colors.textSecondary }]}>Consistent learner</Text>
            </View>

            <View style={styles.badge}>
              <LinearGradient
                colors={["#10b981", "#14b8a6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.badgeIcon}
              >
                <Ionicons name="school-outline" size={28} color="#ffffff" />
              </LinearGradient>
              <Text style={[styles.badgeTitle, { color: colors.text }]}>Top Performer</Text>
              <Text style={[styles.badgeDesc, { color: colors.textSecondary }]}>Top 10% of class</Text>
            </View>

            <View style={styles.badge}>
              <LinearGradient
                colors={[colors.accent, "#7c3aed"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.badgeIcon}
              >
                <Ionicons name="document-text-outline" size={28} color="#ffffff" />
              </LinearGradient>
              <Text style={[styles.badgeTitle, { color: colors.text }]}>Quiz Master</Text>
              <Text style={[styles.badgeDesc, { color: colors.textSecondary }]}>10 tests completed</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// Helper functions for colors
const getBarColor = (score: number) => {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
};

const getIconColor = (score: number) => {
  if (score >= 80) return "rgba(16, 185, 129, 0.2)";
  if (score >= 60) return "rgba(245, 158, 11, 0.2)";
  return "rgba(239, 68, 68, 0.2)";
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
  },
  graphCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  card: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  graphContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 150,
    marginBottom: 16,
  },
  graphBarContainer: {
    alignItems: "center",
    flex: 1,
  },
  graphBarWrapper: {
    width: 30,
    height: 120,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 15,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  graphBar: {
    width: "100%",
    borderRadius: 15,
  },
  graphLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  graphLegend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
  },
  subjectItem: {
    marginBottom: 16,
  },
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: "500",
  },
  subjectScore: {
    fontSize: 14,
    fontWeight: "600",
  },
  subjectBar: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  subjectFill: {
    height: "100%",
    borderRadius: 4,
  },
  testItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  testIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  testDate: {
    fontSize: 12,
  },
  testScore: {
    alignItems: "flex-end",
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "700",
  },
  badgesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  badge: {
    flex: 1,
    alignItems: "center",
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
    textAlign: "center",
  },
  badgeDesc: {
    fontSize: 10,
    textAlign: "center",
  },
});