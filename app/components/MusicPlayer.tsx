// app/components/MusicPlayer.tsx
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import musicService, { Song } from "../services/musicService";

const { width } = Dimensions.get("window");

interface MusicPlayerProps {
  song: Song | null;
  playlist: Song[];
  currentIndex: number;
  visible: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function MusicPlayer({ 
  song, 
  playlist, 
  currentIndex,
  visible, 
  onClose, 
  onNext, 
  onPrevious 
}: MusicPlayerProps) {
  const { colors, isDarkMode } = useTheme();
  
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');
  const [isShuffle, setIsShuffle] = useState(false);
  const [shuffledPlaylist, setShuffledPlaylist] = useState<Song[]>([]);
  const positionInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize shuffled playlist
  useEffect(() => {
    if (isShuffle && playlist.length > 0) {
      const shuffled = [...playlist];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setShuffledPlaylist(shuffled);
    }
  }, [isShuffle, playlist]);

  useEffect(() => {
    if (visible && song) {
      playSong();
    }
    return () => {
      if (positionInterval.current) clearInterval(positionInterval.current);
    };
  }, [visible, song]);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, []);

  const playSong = async () => {
    if (!song) return;
    
    try {
      setIsLoading(true);
      setError(false);
      setPosition(0);
      setDuration(0);
      
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      
      let audioUri = song.streamUrl;
      if (!audioUri && song.uri) {
        audioUri = song.uri;
      }
      
      if (!audioUri && song.videoId) {
        audioUri = await musicService.getStreamUrl(song.videoId);
        if (!audioUri) {
          setError(true);
          setIsLoading(false);
          Alert.alert('Error', 'Cannot play this song');
          return;
        }
      }
      
      console.log(`🎵 Playing: ${song.title}`);
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);
      
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis || 0);
      }
      
      if (positionInterval.current) clearInterval(positionInterval.current);
      
      positionInterval.current = setInterval(async () => {
        try {
          const status = await newSound.getStatusAsync();
          if (status.isLoaded) {
            setPosition(status.positionMillis || 0);
            if (status.didJustFinish) {
              handleSongEnd();
            }
          }
        } catch (e) {}
      }, 1000);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Play error:", error);
      setError(true);
      setIsLoading(false);
    }
  };

  const getCurrentPlaylist = () => {
    return isShuffle && shuffledPlaylist.length > 0 ? shuffledPlaylist : playlist;
  };

  const getCurrentIndex = () => {
    const currentPlaylist = getCurrentPlaylist();
    return currentPlaylist.findIndex(s => s.id === song?.id);
  };

  const handleSongEnd = async () => {
    const currentPlaylist = getCurrentPlaylist();
    const currentIdx = getCurrentIndex();
    
    if (repeatMode === 'one') {
      await playSong();
    } else if (repeatMode === 'all' && currentIdx < currentPlaylist.length - 1) {
      onNext();
    } else if (repeatMode === 'all' && currentIdx === currentPlaylist.length - 1) {
      // Loop to first song
      const firstSong = currentPlaylist[0];
      if (firstSong) {
        if (sound) await sound.unloadAsync();
        setSound(null);
        onNext();
      }
    } else if (repeatMode === 'off' && currentIdx < currentPlaylist.length - 1) {
      onNext();
    } else if (repeatMode === 'off' && currentIdx === currentPlaylist.length - 1) {
      setIsPlaying(false);
      if (positionInterval.current) clearInterval(positionInterval.current);
    }
  };

  const togglePlayPause = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    }
  };

  const handleNext = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    onNext();
  };

  const handlePrevious = async () => {
    if (position > 3000) {
      await sound?.setPositionAsync(0);
    } else {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      onPrevious();
    }
  };

  const seekForward = async () => {
    if (sound) {
      const newPosition = Math.min(position + 10000, duration);
      await sound.setPositionAsync(newPosition);
    }
  };

  const seekBackward = async () => {
    if (sound) {
      const newPosition = Math.max(position - 10000, 0);
      await sound.setPositionAsync(newPosition);
    }
  };

  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  const formatTime = (millis: number) => {
    if (isNaN(millis) || millis === 0) return "0:00";
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  if (!song) return null;

  const getRepeatIconColor = () => {
    if (repeatMode === 'off') return colors.textSecondary;
    if (repeatMode === 'one') return colors.accent;
    return colors.accent;
  };

  const currentPlaylist = getCurrentPlaylist();
  const currentIdx = getCurrentIndex();
  const playlistLength = currentPlaylist.length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <LinearGradient colors={isDarkMode ? ["#1e1b4b", "#0f172a"] : ["#f8fafc", "#e2e8f0"]} style={styles.modalContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="chevron-down" size={30} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.playerContent}>
          {/* Album Art */}
          <View style={styles.thumbnailContainer}>
            {song.thumbnail && !thumbnailError ? (
              <Image source={{ uri: song.thumbnail }} style={styles.albumArt} onError={() => setThumbnailError(true)} />
            ) : (
              <LinearGradient colors={[colors.accent, "#7c3aed"]} style={styles.albumArt}>
                <Ionicons name="musical-note" size={80} color="#fff" />
              </LinearGradient>
            )}
          </View>
          
          {/* Song Info */}
          <Text style={[styles.songTitle, { color: colors.text }]}>{song.title}</Text>
          <Text style={[styles.artistName, { color: colors.textSecondary }]}>{song.artist}</Text>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTime(position)}</Text>
            <View style={[styles.progressBar, { backgroundColor: colors.cardBorder }]}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.accent }]} />
            </View>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTime(duration)}</Text>
          </View>
          
          {/* Playback Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={toggleRepeat} style={styles.controlButton}>
              <View>
                <Ionicons 
                  name="repeat" 
                  size={24} 
                  color={getRepeatIconColor()} 
                />
                {repeatMode === 'one' && (
                  <View style={styles.repeatOneBadge}>
                    <Text style={styles.repeatOneText}>1</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePrevious} style={styles.controlButton}>
              <Ionicons name="play-skip-back" size={32} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseButton} disabled={isLoading}>
              <LinearGradient colors={[colors.accent, "#7c3aed"]} style={styles.playPauseGradient}>
                {isLoading ? <ActivityIndicator size="large" color="#fff" /> : <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#fff" />}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext} style={styles.controlButton}>
              <Ionicons name="play-skip-forward" size={32} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleShuffle} style={styles.controlButton}>
              <Ionicons name="shuffle-outline" size={24} color={isShuffle ? colors.accent : colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          {/* Seek Buttons */}
          <View style={styles.seekRow}>
            <TouchableOpacity onPress={seekBackward} style={styles.seekButton}>
              <Ionicons name="play-back" size={20} color={colors.textSecondary} />
              <Text style={[styles.seekText, { color: colors.textSecondary }]}>10s</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={seekForward} style={styles.seekButton}>
              <Ionicons name="play-forward" size={20} color={colors.textSecondary} />
              <Text style={[styles.seekText, { color: colors.textSecondary }]}>10s</Text>
            </TouchableOpacity>
          </View>
          
          {/* Playlist Info */}
          <View style={styles.playlistInfo}>
            <Text style={[styles.playlistText, { color: colors.textSecondary }]}>
              {currentIdx + 1} / {playlistLength}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: "flex-end" },
  closeButton: { position: "absolute", top: 20, left: 20, zIndex: 10, padding: 10 },
  playerContent: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 50 },
  thumbnailContainer: { marginBottom: 30 },
  albumArt: { width: width * 0.6, height: width * 0.6, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  songTitle: { fontSize: 24, fontWeight: "700", marginBottom: 8, textAlign: "center", paddingHorizontal: 20 },
  artistName: { fontSize: 16, marginBottom: 30 },
  progressContainer: { width: "80%", flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 30 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  timeText: { fontSize: 12 },
  controlsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 20 },
  controlButton: { padding: 10, alignItems: "center", justifyContent: "center" },
  seekRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 40, marginBottom: 20 },
  seekButton: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 25, backgroundColor: "rgba(0,0,0,0.05)" },
  seekText: { fontSize: 12, fontWeight: "500" },
  playlistInfo: { marginTop: 20 },
  playlistText: { fontSize: 12 },
  playPauseButton: { width: 70, height: 70, borderRadius: 35, overflow: "hidden", shadowColor: "#a855f7", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
  playPauseGradient: { flex: 1, alignItems: "center", justifyContent: "center" },
  repeatOneBadge: {
    position: 'absolute',
    top: -2,
    right: -8,
    backgroundColor: '#a855f7',
    borderRadius: 10,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatOneText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});