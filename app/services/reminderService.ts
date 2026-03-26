// app/services/reminderService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface Reminder {
  id: string;
  title: string;
  description: string;
  dateTime: Date;
  isCompleted: boolean;
  createdAt: Date;
}

const REMINDERS_KEY = 'app_reminders';

class ReminderService {
  // Configure notification handler
  configureNotifications() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,  // Add this
        shouldShowList: true,     // Add this
      }),
    });
  }

  // Request permission for notifications
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }
    return true;
  }

  // Get all reminders
  async getReminders(): Promise<Reminder[]> {
    try {
      const saved = await AsyncStorage.getItem(REMINDERS_KEY);
      if (saved) {
        const reminders = JSON.parse(saved);
        return reminders.map((r: any) => ({
          ...r,
          dateTime: new Date(r.dateTime),
          createdAt: new Date(r.createdAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('Get reminders error:', error);
      return [];
    }
  }

  // Add a new reminder
  async addReminder(title: string, description: string, dateTime: Date): Promise<Reminder | null> {
    try {
      const reminders = await this.getReminders();
      const newReminder: Reminder = {
        id: Date.now().toString(),
        title,
        description,
        dateTime,
        isCompleted: false,
        createdAt: new Date(),
      };
      
      const updated = [newReminder, ...reminders];
      await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
      
      // Schedule notification for this reminder
      await this.scheduleNotification(newReminder);
      
      return newReminder;
    } catch (error) {
      console.error('Add reminder error:', error);
      return null;
    }
  }

  // Schedule a notification
  async scheduleNotification(reminder: Reminder): Promise<void> {
    try {
      const trigger = new Date(reminder.dateTime);
      const now = new Date();
      
      // Only schedule if reminder time is in the future
      if (trigger > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: reminder.title,
            body: reminder.description,
            data: { reminderId: reminder.id },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE, // Add type
            date: trigger,
          } as Notifications.DateTriggerInput,
        });
        console.log(`Notification scheduled for ${reminder.title} at ${trigger}`);
      }
    } catch (error) {
      console.error('Schedule notification error:', error);
    }
  }

  // Complete a reminder
  async completeReminder(id: string): Promise<void> {
    const reminders = await this.getReminders();
    const updated = reminders.map(r => 
      r.id === id ? { ...r, isCompleted: true } : r
    );
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
  }

  // Delete a reminder
  async deleteReminder(id: string): Promise<void> {
    const reminders = await this.getReminders();
    const updated = reminders.filter(r => r.id !== id);
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
    
    // Cancel scheduled notifications and reschedule
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const reminder of updated) {
      if (!reminder.isCompleted) {
        await this.scheduleNotification(reminder);
      }
    }
  }

  // Get upcoming reminders
  async getUpcomingReminders(): Promise<Reminder[]> {
    const reminders = await this.getReminders();
    const now = new Date();
    return reminders
      .filter(r => !r.isCompleted && new Date(r.dateTime) > now)
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }

  // Get today's reminders
  async getTodayReminders(): Promise<Reminder[]> {
    const reminders = await this.getReminders();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return reminders
      .filter(r => !r.isCompleted && new Date(r.dateTime) >= today && new Date(r.dateTime) < tomorrow)
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }
}

export default new ReminderService();