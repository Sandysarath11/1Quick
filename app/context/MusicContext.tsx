// app/context/MusicContext.tsx
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import MusicService, { Song } from '../services/musicService';

interface MusicContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  playSong: (song: Song) => Promise<void>;
  pauseSong: () => Promise<void>;
  resumeSong: () => Promise<void>;
  stopSong: () => Promise<void>;
  position: number;
  duration: number;
  nextSong: () => Promise<void>;
  previousSong: () => Promise<void>;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider = ({ children }: { children: React.ReactNode }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const positionInterval = useRef<NodeJS.Timeout | null>(null);
  const notificationId = useRef<string | null>(null);

  // Setup audio mode
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  // Update notification when song changes
  useEffect(() => {
    if (currentSong) {
      updateMediaNotification();
    }
    return () => {
      if (notificationId.current) {
        Notifications.dismissNotificationAsync(notificationId.current);
      }
    };
  }, [currentSong, isPlaying, position]);

  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  const updateMediaNotification = async () => {
    if (!currentSong) return;

    try {
      // Cancel existing notification
      if (notificationId.current) {
        await Notifications.dismissNotificationAsync(notificationId.current);
      }

      const notification = await Notifications.scheduleNotificationAsync({
        content: {
          title: currentSong.title,
          body: `${currentSong.artist} • ${formatTime(position)} / ${formatTime(duration)}`,
          data: { songId: currentSong.id, isPlaying },
          sound: false,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          badge: 1,
          ...Platform.select({
            android: {
              channelId: 'media-playback',
              color: '#a855f7',
              ongoing: isPlaying,
              autoCancel: false,
            },
          }),
        },
        trigger: null,
      });
      notificationId.current = notification;
    } catch (error) {
      console.log('Notification error:', error);
    }
  };

  // Setup notification channel for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('media-playback', {
        name: 'Media Playback',
        importance: Notifications.AndroidImportance.HIGH,
        sound: null,
        vibrationPattern: [0, 0],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });
    }
  }, []);

  const playSong = async (song: Song) => {
    try {
      if (sound) {
        await sound.unloadAsync();
        if (positionInterval.current) clearInterval(positionInterval.current);
      }

      setCurrentSong(song);
      setIsPlaying(true);
      setPosition(0);
      setDuration(0);

      let streamUrl = song.streamUrl;
      if (!streamUrl && song.uri) {
        streamUrl = song.uri;
      }

      if (!streamUrl) {
        console.error("No stream URL available");
        setIsPlaying(false);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: streamUrl },
        { shouldPlay: true }
      );

      setSound(newSound);
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) setDuration(status.durationMillis || 0);

      await MusicService.addToHistory(song);

      // Update playlist
      setPlaylist(prev => {
        if (!prev.find(s => s.id === song.id)) {
          return [...prev, song];
        }
        return prev;
      });
      setCurrentIndex(playlist.findIndex(s => s.id === song.id));

      positionInterval.current = setInterval(async () => {
        if (!newSound) return;
        const status = await newSound.getStatusAsync();
        if (status.isLoaded) {
          setPosition(status.positionMillis || 0);
          setIsPlaying(status.isPlaying);
        }
      }, 1000);
    } catch (err) {
      console.error("Playback error:", err);
      setIsPlaying(false);
    }
  };

  const pauseSong = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const resumeSong = async () => {
    if (sound) {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const stopSong = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setPosition(0);
      setCurrentSong(null);
      if (positionInterval.current) clearInterval(positionInterval.current);
      if (notificationId.current) {
        await Notifications.dismissNotificationAsync(notificationId.current);
        notificationId.current = null;
      }
    }
  };

  const nextSong = async () => {
    if (playlist.length > 0 && currentIndex + 1 < playlist.length) {
      const next = playlist[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      await playSong(next);
    }
  };

  const previousSong = async () => {
    if (position > 3000) {
      await sound?.setPositionAsync(0);
    } else if (playlist.length > 0 && currentIndex - 1 >= 0) {
      const prev = playlist[currentIndex - 1];
      setCurrentIndex(currentIndex - 1);
      await playSong(prev);
    }
  };

  return (
    <MusicContext.Provider value={{ 
      currentSong, 
      isPlaying, 
      playSong, 
      pauseSong, 
      resumeSong, 
      stopSong, 
      position, 
      duration,
      nextSong,
      previousSong,
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used within a MusicProvider");
  return context;
};

export default MusicProvider;