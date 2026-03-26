// app/(tabs)/music.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Modal,
  Dimensions,
  Alert,
  Image,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

// Tamil Music Websites Search URLs
const SEARCH_ENGINES = [
  { name: "Masstamilan", url: "https://masstamilan.in/", searchParam: "s" },
  { name: "Tamil Songs", url: "https://tamilmp3songs.com/", searchParam: "s" },
  { name: "Isaimini", url: "https://isaimini.in/", searchParam: "q" },
];

// Sample Tamil Songs Database (for fallback)
const TAMIL_SONGS_DB = [
  { id: "v1", title: "Veeram - Thangame Thangame", artist: "Devi Sri Prasad", duration: 280, thumbnail: "", videoId: "v1", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", type: "song", album: "Veeram" },
  { id: "v2", title: "Veeram - Kadal Kadal", artist: "Devi Sri Prasad", duration: 270, thumbnail: "", videoId: "v2", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", type: "song", album: "Veeram" },
  { id: "a1", title: "Anjaan - Sirippu Enakku", artist: "Devi Sri Prasad", duration: 260, thumbnail: "", videoId: "a1", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", type: "song", album: "Anjaan" },
  { id: "a2", title: "Anjaan - Ek Do Theen", artist: "Shreya Ghoshal", duration: 280, thumbnail: "", videoId: "a2", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", type: "song", album: "Anjaan" },
  { id: "k1", title: "Kabali - Neruppu Da", artist: "Sanath", duration: 240, thumbnail: "", videoId: "k1", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", type: "song", album: "Kabali" },
  { id: "m1", title: "Maari - Maari Thara Local", artist: "Anirudh", duration: 260, thumbnail: "", videoId: "m1", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", type: "song", album: "Maari" },
];

interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  videoId: string;
  streamUrl?: string;
  type?: string;
  album?: string;
  isLocal?: boolean;
  uri?: string;
}

interface HistoryEntry {
  id: string;
  songId: string;
  title: string;
  artist: string;
  thumbnail: string;
  playedAt: number;
  duration: number;
}

const LOCAL_SONGS_KEY = 'local_songs';
const HISTORY_KEY = 'music_history';

export default function MusicScreen() {
  const { colors, isDarkMode } = useTheme();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [localSongs, setLocalSongs] = useState<Song[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<'search' | 'local' | 'history'>('search');
  const [isExpanded, setIsExpanded] = useState(true);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Load data on mount
  useEffect(() => {
    loadLocalSongs();
    loadRecentlyPlayed();
    requestMediaPermission();
  }, []);

  // Update mini-player visibility
  useEffect(() => {
    if (currentSong) {
      Animated.spring(slideAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
      setShowPlayer(true);
    } else {
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [currentSong]);

  // Update position every second
  useEffect(() => {
    if (sound) {
      const interval = setInterval(async () => {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setPosition(status.positionMillis || 0);
          if (status.didJustFinish) {
            handleSongEnd();
          }
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sound]);

  const requestMediaPermission = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  const loadLocalSongs = async () => {
    try {
      const saved = await AsyncStorage.getItem(LOCAL_SONGS_KEY);
      if (saved) setLocalSongs(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveLocalSongs = async (songs: Song[]) => {
    try {
      await AsyncStorage.setItem(LOCAL_SONGS_KEY, JSON.stringify(songs));
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const loadRecentlyPlayed = async () => {
    try {
      const saved = await AsyncStorage.getItem(HISTORY_KEY);
      if (saved) setRecentlyPlayed(JSON.parse(saved));
    } catch (error) {
      console.error('Load history error:', error);
    }
  };

  const saveRecentlyPlayed = async (song: Song) => {
    try {
      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        songId: song.id,
        title: song.title,
        artist: song.artist,
        thumbnail: song.thumbnail,
        playedAt: Date.now(),
        duration: song.duration,
      };
      const updated = [newEntry, ...recentlyPlayed.filter(h => h.songId !== song.id)].slice(0, 20);
      setRecentlyPlayed(updated);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Save history error:', error);
    }
  };

  // Search for songs (simulates website search)
  const searchSongs = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Error", "Please enter a song or movie name");
      return;
    }

    setSearchLoading(true);
    
    // Simulate searching from websites like masstamilan
    // In real implementation, you would need to scrape the website
    // For now, we'll filter from our Tamil songs database
    setTimeout(() => {
      const lowerQuery = searchQuery.toLowerCase();
      const results = TAMIL_SONGS_DB.filter(song =>
        song.title.toLowerCase().includes(lowerQuery) ||
        song.artist.toLowerCase().includes(lowerQuery) ||
        (song.album && song.album.toLowerCase().includes(lowerQuery))
      );
      
      setSearchResults(results);
      setSearchLoading(false);
      
      if (results.length === 0) {
        Alert.alert("No Results", `No songs found for "${searchQuery}". Try different search term.`);
      }
    }, 500);
  };

  // Scan local device for MP3 files
  const scanLocalSongs = async () => {
    if (!hasPermission) {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert("Permission Required", "Grant access to scan music");
        return;
      }
    }

    setScanning(true);
    try {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: ['audio'],
        first: 500,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      const songs: Song[] = [];
      for (const asset of media.assets) {
        const fileName = asset.filename.replace(/\.[^/.]+$/, "") || 'Unknown Song';
        songs.push({
          id: asset.id,
          title: fileName,
          artist: 'Local File',
          duration: asset.duration || 180,
          thumbnail: '',
          videoId: asset.id,
          uri: asset.uri,
          isLocal: true,
          type: 'song',
        });
      }
      setLocalSongs(songs);
      await saveLocalSongs(songs);
      Alert.alert('Scan Complete', `Found ${songs.length} songs!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to scan songs');
    } finally {
      setScanning(false);
    }
  };

  const deleteLocalSong = async (songId: string) => {
    Alert.alert('Delete Song', 'Remove from library?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const updated = localSongs.filter(s => s.id !== songId);
        setLocalSongs(updated);
        saveLocalSongs(updated);
      }}
    ]);
  };

  const playSong = async (song: Song) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      
      let audioUri = song.streamUrl;
      if (!audioUri && song.uri) {
        audioUri = song.uri;
      }
      
      if (!audioUri) {
        Alert.alert('Error', 'Cannot play this song');
        return;
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setCurrentSong(song);
      setIsPlaying(true);
      
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis || 0);
      }
      
      await saveRecentlyPlayed(song);
    } catch (error) {
      console.error('Play error:', error);
      Alert.alert('Error', 'Failed to play song');
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

  const stopSong = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
    setCurrentSong(null);
    setIsPlaying(false);
    setPosition(0);
    setShowPlayer(false);
  };

  const handleSongEnd = () => {
    setIsPlaying(false);
    setPosition(0);
  };

  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  const renderSongItem = ({ item }: { item: Song }) => (
    <TouchableOpacity
      style={[styles.songItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={() => playSong(item)}
    >
      <View style={[styles.songThumbnail, { backgroundColor: `${colors.accent}20` }]}>
        <Ionicons name="musical-note" size={30} color={colors.accent} />
      </View>
      <View style={styles.songInfo}>
        <Text style={[styles.songTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.songArtist, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.isLocal ? '📁 Local' : item.artist}
        </Text>
        {item.album && (
          <Text style={[styles.songAlbum, { color: colors.textSecondary }]}>{item.album}</Text>
        )}
      </View>
      <Text style={[styles.songDuration, { color: colors.textSecondary }]}>
        {formatTime(item.duration * 1000)}
      </Text>
      <TouchableOpacity onPress={() => playSong(item)} style={styles.playButton}>
        <Ionicons name="play-circle" size={32} color={colors.accent} />
      </TouchableOpacity>
      {item.isLocal && (
        <TouchableOpacity onPress={() => deleteLocalSong(item.id)} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: HistoryEntry }) => (
    <TouchableOpacity
      style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={() => playSong({
        id: item.songId,
        title: item.title,
        artist: item.artist,
        duration: item.duration,
        thumbnail: item.thumbnail,
        videoId: item.songId,
        type: 'song',
      })}
    >
      <View style={[styles.historyIcon, { backgroundColor: `${colors.accent}20` }]}>
        <Ionicons name="musical-note" size={20} color={colors.accent} />
      </View>
      <View style={styles.historyInfo}>
        <Text style={[styles.historyTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.historyArtist, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.artist}
        </Text>
        <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
          {new Date(item.playedAt).toLocaleDateString()}
        </Text>
      </View>
      <Ionicons name="play-circle" size={28} color={colors.accent} />
    </TouchableOpacity>
  );

  const MiniPlayer = () => (
    <Animated.View
      style={[
        styles.miniPlayer,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0],
            })
          }],
        }
      ]}
    >
      {currentSong && (
        <>
          <View style={styles.miniPlayerContent}>
            <View style={styles.miniPlayerInfo}>
              <View style={[styles.miniPlayerIcon, { backgroundColor: `${colors.accent}20` }]}>
                <Ionicons name="musical-note" size={20} color={colors.accent} />
              </View>
              <View style={styles.miniPlayerText}>
                <Text style={[styles.miniPlayerTitle, { color: colors.text }]} numberOfLines={1}>
                  {currentSong.title}
                </Text>
                <Text style={[styles.miniPlayerArtist, { color: colors.textSecondary }]} numberOfLines={1}>
                  {currentSong.artist}
                </Text>
              </View>
            </View>
            
            <View style={styles.miniPlayerControls}>
              <TouchableOpacity onPress={togglePlayPause} style={styles.miniPlayBtn}>
                <LinearGradient colors={[colors.accent, "#7c3aed"]} style={styles.miniPlayGradient}>
                  <Ionicons name={isPlaying ? "pause" : "play"} size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={stopSong} style={styles.miniCloseBtn}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.miniProgressBar}>
            <View style={[styles.miniProgressFill, { width: `${progress}%`, backgroundColor: colors.accent }]} />
          </View>
        </>
      )}
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Music Player" showNotification={false} showThemeToggle={true} />

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        {['search', 'local', 'history'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, activeTab === tab && { color: colors.accent }]}>
              {tab === 'search' ? 'Search' : tab === 'local' ? 'My Music' : 'History'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {/* Search Tab */}
        {activeTab === 'search' && (
          <>
            <View style={styles.searchContainer}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="Search Tamil songs, movies, artists..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchSongs}
              />
              <TouchableOpacity style={styles.searchButton} onPress={searchSongs}>
                <LinearGradient colors={[colors.accent, "#7c3aed"]} style={styles.searchGradient}>
                  <Ionicons name="search" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {searchLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Searching...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSongItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={80} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Search for songs
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Type a song or movie name and tap search
                </Text>
              </View>
            )}
          </>
        )}

        {/* Local Music Tab */}
        {activeTab === 'local' && (
          <>
            <View style={styles.localHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>🎵 My Music</Text>
              <TouchableOpacity style={styles.scanButton} onPress={scanLocalSongs} disabled={scanning}>
                <Ionicons name="scan" size={20} color={colors.accent} />
                <Text style={[styles.scanButtonText, { color: colors.accent }]}>
                  {scanning ? 'Scanning...' : 'Scan'}
                </Text>
              </TouchableOpacity>
            </View>

            {scanning ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Scanning device...</Text>
              </View>
            ) : localSongs.length > 0 ? (
              <FlatList
                data={localSongs}
                renderItem={renderSongItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="musical-notes-outline" size={80} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No local music found
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Tap "Scan" to find MP3 files on your device
                </Text>
              </View>
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <>
            <View style={styles.historyHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📜 Recently Played</Text>
              {recentlyPlayed.length > 0 && (
                <TouchableOpacity onPress={async () => {
                  await AsyncStorage.removeItem(HISTORY_KEY);
                  setRecentlyPlayed([]);
                }}>
                  <Text style={[styles.clearText, { color: colors.accent }]}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {recentlyPlayed.length > 0 ? (
              <FlatList
                data={recentlyPlayed}
                renderItem={renderHistoryItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={80} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No history
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Songs you play will appear here
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Mini Player */}
      <MiniPlayer />

      {/* Full Player Modal */}
      <Modal visible={showPlayer} transparent animationType="slide" onRequestClose={stopSong}>
        <LinearGradient colors={isDarkMode ? ["#1e1b4b", "#0f172a"] : ["#f8fafc", "#e2e8f0"]} style={styles.playerModal}>
          <TouchableOpacity style={styles.closeButton} onPress={stopSong}>
            <Ionicons name="chevron-down" size={30} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.playerContent}>
            <LinearGradient colors={[colors.accent, "#7c3aed"]} style={styles.albumArt}>
              <Ionicons name="musical-note" size={80} color="#fff" />
            </LinearGradient>
            
            {currentSong && (
              <>
                <Text style={[styles.playerTitle, { color: colors.text }]}>{currentSong.title}</Text>
                <Text style={[styles.playerArtist, { color: colors.textSecondary }]}>{currentSong.artist}</Text>
              </>
            )}
            
            <View style={styles.progressContainer}>
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTime(position)}</Text>
              <View style={[styles.progressBar, { backgroundColor: colors.cardBorder }]}>
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.accent }]} />
              </View>
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTime(duration)}</Text>
            </View>
            
            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseButton}>
                <LinearGradient colors={[colors.accent, "#7c3aed"]} style={styles.playPauseGradient}>
                  <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  activeTab: { backgroundColor: "rgba(168, 85, 247, 0.2)" },
  tabText: { fontSize: 14, fontWeight: "600" },
  content: { flex: 1, paddingHorizontal: 20 },
  searchContainer: { flexDirection: "row", gap: 12, marginBottom: 16 },
  searchInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 25, fontSize: 16 },
  searchButton: { borderRadius: 25, overflow: "hidden" },
  searchGradient: { width: 50, height: 50, alignItems: "center", justifyContent: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },
  loadingText: { marginTop: 10, fontSize: 14 },
  listContent: { paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  localHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  scanButton: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(168,85,247,0.1)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 25 },
  scanButtonText: { fontSize: 14, fontWeight: "500" },
  songItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 15, borderWidth: 1, marginBottom: 10 },
  songThumbnail: { width: 50, height: 50, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  songInfo: { flex: 1, marginLeft: 12 },
  songTitle: { fontSize: 16, fontWeight: "600" },
  songArtist: { fontSize: 12, marginTop: 2 },
  songAlbum: { fontSize: 10, marginTop: 2 },
  songDuration: { fontSize: 12, marginRight: 10 },
  playButton: { padding: 5 },
  deleteButton: { padding: 5 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
  emptyText: { fontSize: 16, marginTop: 20 },
  emptySubtext: { fontSize: 14, marginTop: 8, textAlign: "center" },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  clearText: { fontSize: 14, fontWeight: "500" },
  historyCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 15, borderWidth: 1, marginBottom: 10, gap: 12 },
  historyIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  historyInfo: { flex: 1 },
  historyTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  historyArtist: { fontSize: 12 },
  historyDate: { fontSize: 10, marginTop: 2 },
  miniPlayer: { position: "absolute", bottom: 80, left: 16, right: 16, borderRadius: 16, borderWidth: 1, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  miniPlayerContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12 },
  miniPlayerInfo: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  miniPlayerIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  miniPlayerText: { flex: 1 },
  miniPlayerTitle: { fontSize: 14, fontWeight: "600" },
  miniPlayerArtist: { fontSize: 11 },
  miniPlayerControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  miniPlayBtn: { width: 32, height: 32, borderRadius: 16, overflow: "hidden" },
  miniPlayGradient: { flex: 1, alignItems: "center", justifyContent: "center" },
  miniCloseBtn: { padding: 6 },
  miniProgressBar: { height: 2, backgroundColor: "rgba(0,0,0,0.1)" },
  miniProgressFill: { height: "100%", borderRadius: 1 },
  playerModal: { flex: 1, justifyContent: "flex-end" },
  closeButton: { position: "absolute", top: 20, left: 20, zIndex: 10, padding: 10 },
  playerContent: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 50 },
  albumArt: { width: width * 0.6, height: width * 0.6, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 30 },
  playerTitle: { fontSize: 24, fontWeight: "700", marginBottom: 8, textAlign: "center", paddingHorizontal: 20 },
  playerArtist: { fontSize: 16, marginBottom: 30 },
  progressContainer: { width: "80%", flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 30 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  timeText: { fontSize: 12 },
  controlsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  playPauseButton: { width: 70, height: 70, borderRadius: 35, overflow: "hidden", shadowColor: "#a855f7", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
  playPauseGradient: { flex: 1, alignItems: "center", justifyContent: "center" },
});