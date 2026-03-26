// app/(tabs)/reminder.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";
import reminderService, { Reminder } from "../services/reminderService";

export default function ReminderScreen() {
  const { colors, isDarkMode } = useTheme();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'upcoming' | 'today'>('upcoming');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReminders();
    setupNotifications();
  }, []);

  const setupNotifications = async () => {
    reminderService.configureNotifications();
    const granted = await reminderService.requestPermissions();
    if (!granted) {
      Alert.alert("Permission Required", "Please allow notifications to get reminders");
    }
  };

  const loadReminders = async () => {
    setLoading(true);
    const reminders = await reminderService.getReminders();
    setReminders(reminders);
    setLoading(false);
  };

  const addReminder = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    const reminder = await reminderService.addReminder(title, description, selectedDate);
    if (reminder) {
      await loadReminders();
      setShowModal(false);
      setTitle("");
      setDescription("");
      setSelectedDate(new Date());
      Alert.alert("Success", `Reminder set for ${selectedDate.toLocaleString()}`);
    }
  };

  const deleteReminder = async (id: string) => {
    Alert.alert("Delete Reminder", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await reminderService.deleteReminder(id);
        await loadReminders();
      }}
    ]);
  };

  const completeReminder = async (id: string) => {
    await reminderService.completeReminder(id);
    await loadReminders();
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('ta-IN', options);
  };

  const getUpcomingReminders = () => {
    const now = new Date();
    return reminders.filter(r => !r.isCompleted && new Date(r.dateTime) > now);
  };

  const getTodayReminders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return reminders.filter(r => !r.isCompleted && new Date(r.dateTime) >= today && new Date(r.dateTime) < tomorrow);
  };

  const displayReminders = activeTab === 'upcoming' ? getUpcomingReminders() : getTodayReminders();

  const renderReminderItem = ({ item }: { item: Reminder }) => {
    const isPast = new Date(item.dateTime) < new Date();
    return (
      <View style={[styles.reminderCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.reminderHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.accent}20` }]}>
            <Ionicons name="alarm-outline" size={24} color={colors.accent} />
          </View>
          <View style={styles.reminderInfo}>
            <Text style={[styles.reminderTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.reminderDesc, { color: colors.textSecondary }]}>{item.description || "No description"}</Text>
            <Text style={[styles.reminderTime, { color: colors.accent }]}>
              <Ionicons name="time-outline" size={12} color={colors.accent} /> {formatDate(new Date(item.dateTime))}
            </Text>
          </View>
          <View style={styles.reminderActions}>
            {!item.isCompleted && !isPast && (
              <TouchableOpacity onPress={() => completeReminder(item.id)} style={styles.actionBtn}>
                <Ionicons name="checkmark-circle" size={28} color="#10b981" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => deleteReminder(item.id)} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Reminders" showNotification={false} showThemeToggle={true} />

      {/* Add Reminder Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
        <LinearGradient colors={[colors.accent, "#7c3aed"]} style={styles.addGradient}>
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && { color: colors.accent }]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'today' && styles.activeTab]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[styles.tabText, activeTab === 'today' && { color: colors.accent }]}>
            Today
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reminders List */}
      <FlatList
        data={displayReminders}
        renderItem={renderReminderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="alarm-outline" size={80} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No reminders
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Tap + to set a new reminder
            </Text>
          </View>
        }
      />

      {/* Add Reminder Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Set Reminder</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Title</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.cardBorder }]}
                  placeholder="e.g., Meeting with Team"
                  placeholderTextColor={colors.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.cardBorder }]}
                  placeholder="Optional details..."
                  placeholderTextColor={colors.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Date & Time</Text>
                <TouchableOpacity
                  style={[styles.dateTimeButton, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.accent} />
                  <Text style={[styles.dateTimeText, { color: colors.text }]}>
                    {selectedDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dateTimeButton, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color={colors.accent} />
                  <Text style={[styles.dateTimeText, { color: colors.text }]}>
                    {selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={addReminder}>
                <LinearGradient colors={[colors.accent, "#7c3aed"]} style={styles.saveGradient}>
                  <Text style={styles.saveButtonText}>Set Reminder</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    const newDate = new Date(selectedDate);
                    newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                    setSelectedDate(newDate);
                  }
                }}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowTimePicker(false);
                  if (date) {
                    const newDate = new Date(selectedDate);
                    newDate.setHours(date.getHours(), date.getMinutes());
                    setSelectedDate(newDate);
                  }
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addButton: {
    position: "absolute",
    bottom: 90,
    right: 20,
    zIndex: 10,
  },
  addGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 16,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 25,
  },
  activeTab: {
    backgroundColor: "rgba(168, 85, 247, 0.2)",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  reminderCard: {
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
  },
  reminderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  reminderDesc: {
    fontSize: 12,
    marginBottom: 4,
  },
  reminderTime: {
    fontSize: 11,
  },
  reminderActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  dateTimeText: {
    fontSize: 16,
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 30,
    borderRadius: 12,
    overflow: "hidden",
  },
  saveGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});