// app/(tabs)/youtube.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResizeMode, Video } from "expo-av";
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Keyboard,
    Linking,
    Modal,
    PanResponder,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";

const { width, height } = Dimensions.get("window");

// Pexels API Configuration
const PEXELS_API_KEY = "Al03YAAzBtQu7EcHtiuovrLMVHBHLxfTslPdyb833QzxPR1BWXaEqis7";
const PEXELS_API_URL = "https://api.pexels.com/videos";

// Tamil Songs (Default Videos)
const TAMIL_SONGS: VideoItem[] = [
    { id: "tamil1", title: "Arabic Kuthu - Beast", artist: "Anirudh", duration: 260, thumbnail: "", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
    { id: "tamil2", title: "Vaathi Coming - Master", artist: "Anirudh", duration: 220, thumbnail: "", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
    { id: "tamil3", title: "Naa Ready - Leo", artist: "Anirudh", duration: 240, thumbnail: "", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" },
    { id: "tamil4", title: "Jimikki Ponnu", artist: "Anirudh", duration: 235, thumbnail: "", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" },
    { id: "tamil5", title: "Enjoy Enjaami", artist: "Dhee ft. Arivu", duration: 280, thumbnail: "", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4" },
    { id: "tamil6", title: "Rowdy Baby", artist: "Dhanush | Dhee", duration: 270, thumbnail: "", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4" },
    { id: "tamil7", title: "Kaattu Payale", artist: "G.V. Prakash", duration: 260, thumbnail: "", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4" },
    { id: "tamil8", title: "Pathala Pathala", artist: "Kamal Haasan", duration: 230, thumbnail: "", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCar.mp4" },
    { id: "tamil9", title: "Otha Sollaala", artist: "G.V. Prakash", duration: 245, thumbnail: "", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
    { id: "tamil10", title: "Azhagiya Soodana Poovey", artist: "Karthik", duration: 250, thumbnail: "", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
    { id: "tamil11", title: "Kannazhaga", artist: "Anirudh", duration: 255, thumbnail: "", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" },
    { id: "tamil12", title: "Kutty Story", artist: "Anirudh", duration: 265, thumbnail: "", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" },
];

// Sample videos (fallback if API fails)
const SAMPLE_VIDEOS: VideoItem[] = TAMIL_SONGS;

interface VideoItem {
    id: string;
    title: string;
    artist: string;
    duration: number;
    thumbnail: string;
    videoUrl: string;
    isLocal?: boolean;
    uri?: string;
    pexelsUrl?: string;
}

export default function YouTubeScreen() {
    const { colors, isDarkMode } = useTheme();

    // State
    const [activeMode, setActiveMode] = useState<'offline' | 'online'>('online');
    const [searchQuery, setSearchQuery] = useState("");
    const [onlineVideos, setOnlineVideos] = useState<VideoItem[]>(TAMIL_SONGS);
    const [localVideos, setLocalVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
    const [showPlayer, setShowPlayer] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [hasPermission, setHasPermission] = useState(false);
    const [isLandscape, setIsLandscape] = useState(false);
    const [brightness, setBrightness] = useState(0.5);
    const [volume, setVolume] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [showVolumeBrightness, setShowVolumeBrightness] = useState(false);
    const [adjustmentType, setAdjustmentType] = useState<'brightness' | 'volume' | null>(null);
    const [adjustmentValue, setAdjustmentValue] = useState(0);
    const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);
    const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
    const videoRef = useRef<Video>(null);

    // PanResponder for VLC-style controls (left side brightness, right side volume)
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 10;
            },
            onPanResponderMove: (_, gestureState) => {
                const screenWidth = Dimensions.get('window').width;
                const isLeftSide = gestureState.x0 < screenWidth / 2;
                const deltaY = -gestureState.dy / 300;

                if (isLeftSide) {
                    setAdjustmentType('brightness');
                    const newBrightness = Math.min(1, Math.max(0, brightness + deltaY));
                    setBrightness(newBrightness);
                    setAdjustmentValue(newBrightness);
                } else {
                    setAdjustmentType('volume');
                    const newVolume = Math.min(1, Math.max(0, volume + deltaY));
                    setVolume(newVolume);
                    setAdjustmentValue(newVolume);
                    if (videoRef.current) {
                        videoRef.current.setVolumeAsync(newVolume);
                    }
                }
                setShowVolumeBrightness(true);

                // Reset inactivity timer when user interacts
                resetInactivityTimer();

                if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
                controlsTimeout.current = setTimeout(() => {
                    setShowVolumeBrightness(false);
                    setAdjustmentType(null);
                }, 1500);
            },
            onPanResponderRelease: () => {
                setTimeout(() => {
                    setShowVolumeBrightness(false);
                    setAdjustmentType(null);
                }, 1000);
            },
        })
    ).current;

    // Load local videos on mount
    useEffect(() => {
        checkPermissionAndLoadVideos();
    }, []);

    // Auto-hide controls after 5 seconds
    useEffect(() => {
        if (showPlayer && showControls) {
            if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
            controlsTimeout.current = setTimeout(() => {
                setShowControls(false);
            }, 5000);
        }
        return () => {
            if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        };
    }, [showPlayer, showControls]);

    // Reset inactivity timer when user interacts
    const resetInactivityTimer = () => {
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
        }
        const timer = setTimeout(() => {
            if (isPlaying && videoRef.current) {
                videoRef.current.pauseAsync();
                setIsPlaying(false);
                setShowControls(true);
                Alert.alert("Auto Paused", "Video paused due to inactivity");
            }
        }, 50000); // 50 seconds
        setInactivityTimer(timer);
    };

    // Start inactivity timer when video starts playing
    useEffect(() => {
        if (isPlaying && showPlayer) {
            resetInactivityTimer();
        }
        return () => {
            if (inactivityTimer) {
                clearTimeout(inactivityTimer);
            }
        };
    }, [isPlaying, showPlayer]);

    const checkPermissionAndLoadVideos = async () => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            setHasPermission(status === 'granted');
            await loadLocalVideos();
        } catch (error) {
            console.error('Permission error:', error);
        }
    };

    const loadLocalVideos = async () => {
        try {
            const saved = await AsyncStorage.getItem(LOCAL_VIDEOS_KEY);
            if (saved) {
                setLocalVideos(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Load error:', error);
        }
    };

    const saveLocalVideos = async (videos: VideoItem[]) => {
        try {
            await AsyncStorage.setItem(LOCAL_VIDEOS_KEY, JSON.stringify(videos));
        } catch (error) {
            console.error('Save error:', error);
        }
    };

    // Scan device for videos
    const scanDeviceVideos = async () => {
        if (!hasPermission) {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Required", "Grant access to scan videos");
                return;
            }
            setHasPermission(true);
        }

        setScanning(true);
        try {
            const media = await MediaLibrary.getAssetsAsync({
                mediaType: ['video'],
                first: 100,
                sortBy: [[MediaLibrary.SortBy.creationTime, false]],
            });

            const videos: VideoItem[] = [];
            for (const asset of media.assets) {
                const fileName = asset.filename.replace(/\.[^/.]+$/, "") || 'Unknown Video';
                videos.push({
                    id: asset.id,
                    title: fileName,
                    artist: 'Local File',
                    duration: asset.duration || 0,
                    thumbnail: asset.uri,
                    videoUrl: asset.uri,
                    isLocal: true,
                    uri: asset.uri,
                });
            }

            setLocalVideos(videos);
            await saveLocalVideos(videos);
            Alert.alert('Scan Complete', `Found ${videos.length} videos!`);
        } catch (error) {
            Alert.alert('Error', 'Failed to scan videos');
        } finally {
            setScanning(false);
        }
    };

    // Pick video file
    const pickVideoFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['video/*', 'video/mp4', 'video/mkv', 'video/avi'],
                copyToCacheDirectory: true,
                multiple: true,
            });

            if (result.canceled) return;

            if (result.assets && result.assets.length > 0) {
                const newVideos: VideoItem[] = [];
                for (const asset of result.assets) {
                    const fileName = asset.name.replace(/\.[^/.]+$/, "") || 'Unknown Video';
                    newVideos.push({
                        id: asset.uri,
                        title: fileName,
                        artist: 'Local File',
                        duration: 0,
                        thumbnail: '',
                        videoUrl: asset.uri,
                        isLocal: true,
                        uri: asset.uri,
                    });
                }
                const updated = [...newVideos, ...localVideos];
                setLocalVideos(updated);
                saveLocalVideos(updated);
                Alert.alert('Success', `Added ${newVideos.length} videos!`);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick videos');
        }
    };

    const deleteLocalVideo = async (videoId: string) => {
        Alert.alert('Delete Video', 'Remove from library?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    const updated = localVideos.filter(v => v.id !== videoId);
                    setLocalVideos(updated);
                    saveLocalVideos(updated);
                }
            }
        ]);
    };

    // Search videos using Pexels API
    const searchWebVideos = async () => {
        if (!searchQuery.trim()) {
            setOnlineVideos(TAMIL_SONGS);
            return;
        }

        setSearching(true);
        Keyboard.dismiss();

        try {
            const response = await fetch(
                `${PEXELS_API_URL}/search?query=${encodeURIComponent(searchQuery)}&per_page=12&orientation=landscape`,
                {
                    headers: {
                        'Authorization': PEXELS_API_KEY,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.videos && data.videos.length > 0) {
                const videos: VideoItem[] = data.videos.map((video: any) => {
                    const videoFile = video.video_files?.find((file: any) =>
                        file.quality === 'hd' || file.quality === 'sd' || file.width >= 1280
                    ) || video.video_files?.[0];

                    const thumbnail = video.image || video.video_pictures?.[0]?.picture || '';

                    return {
                        id: video.id.toString(),
                        title: video.url?.split('/').pop()?.replace(/-/g, ' ') || video.user?.name || 'Pexels Video',
                        artist: video.user?.name || 'Pexels',
                        duration: video.duration || 0,
                        thumbnail: thumbnail,
                        videoUrl: videoFile?.link || '',
                        pexelsUrl: video.url,
                    };
                }).filter((v: VideoItem) => v.videoUrl);

                setOnlineVideos(videos);
                if (videos.length === 0) {
                    Alert.alert("No results", "No videos found for this search term");
                }
            } else {
                setOnlineVideos(TAMIL_SONGS);
                Alert.alert("No results", "Showing Tamil songs");
            }
        } catch (error) {
            console.error("Pexels API error:", error);
            setOnlineVideos(TAMIL_SONGS);
            Alert.alert("API Error", "Showing Tamil songs");
        } finally {
            setSearching(false);
        }
    };

    // Play video
    const playVideo = (video: VideoItem) => {
        setSelectedVideo(video);
        setShowPlayer(true);
        setIsPlaying(true);
        setPosition(0);
        setDuration(0);
        setIsLandscape(false);
        setShowControls(true);
        setVolume(1);
        setBrightness(0.5);
        StatusBar.setHidden(true);
        // Reset inactivity timer
        resetInactivityTimer();
    };

    // Close player
    const closePlayer = () => {
        setShowPlayer(false);
        setSelectedVideo(null);
        setIsPlaying(false);
        setPosition(0);
        setDuration(0);
        setIsLandscape(false);
        StatusBar.setHidden(false);
        setShowVolumeBrightness(false);
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        if (inactivityTimer) clearTimeout(inactivityTimer);
    };

    // Toggle orientation
    const toggleOrientation = () => {
        setIsLandscape(!isLandscape);
    };

    // Touch to show/hide controls and reset timer
    const handleVideoTap = () => {
        setShowControls(true);
        resetInactivityTimer();
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        controlsTimeout.current = setTimeout(() => {
            setShowControls(false);
        }, 5000);
    };

    // Open in Pexels
    const openInPexels = (url: string) => {
        if (url) {
            Linking.openURL(url);
        }
    };

    // Video controls
    const togglePlayPause = async () => {
        if (videoRef.current) {
            if (isPlaying) {
                await videoRef.current.pauseAsync();
                setIsPlaying(false);
            } else {
                await videoRef.current.playAsync();
                setIsPlaying(true);
                resetInactivityTimer();
            }
        }
    };

    const seekForward = async () => {
        if (videoRef.current) {
            const newPosition = Math.min(position + 10000, duration);
            await videoRef.current.setPositionAsync(newPosition);
            resetInactivityTimer();
        }
    };

    const seekBackward = async () => {
        if (videoRef.current) {
            const newPosition = Math.max(position - 10000, 0);
            await videoRef.current.setPositionAsync(newPosition);
            resetInactivityTimer();
        }
    };

    const formatTime = (millis: number) => {
        if (isNaN(millis) || millis === 0) return "0:00";
        const minutes = Math.floor(millis / 60000);
        const seconds = ((millis % 60000) / 1000).toFixed(0);
        return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
    };

    const progress = duration > 0 ? (position / duration) * 100 : 0;

    // Format duration for display
    const formatDuration = (seconds: number) => {
        if (!seconds || seconds <= 0) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    // Render video item in grid
    const renderVideoItem = ({ item }: { item: VideoItem }) => (
        <TouchableOpacity
            style={[styles.videoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => playVideo(item)}
            activeOpacity={0.8}
        >
            <View style={styles.thumbnailContainer}>
                {item.thumbnail ? (
                    <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                ) : (
                    <View style={[styles.thumbnail, { backgroundColor: `${colors.accent}20`, alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="videocam" size={30} color={colors.accent} />
                    </View>
                )}
                <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
                </View>
            </View>
            <View style={styles.videoInfo}>
                <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={[styles.videoArtist, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.isLocal ? '📁 Local' : item.artist}
                </Text>
            </View>
            <View style={styles.playButton}>
                <Ionicons name="play-circle" size={36} color={colors.accent} />
            </View>
            {item.isLocal && (
                <TouchableOpacity style={styles.deleteButton} onPress={() => deleteLocalVideo(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Header title="Video Player" showNotification={false} showThemeToggle={true} />

            {/* Mode Switcher */}
            <View style={styles.modeContainer}>
                <TouchableOpacity
                    style={[styles.modeButton, activeMode === 'offline' && styles.activeMode]}
                    onPress={() => setActiveMode('offline')}
                >
                    <Ionicons name="phone-portrait" size={20} color={activeMode === 'offline' ? colors.accent : colors.textSecondary} />
                    <Text style={[styles.modeText, activeMode === 'offline' && { color: colors.accent }]}>Offline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeButton, activeMode === 'online' && styles.activeMode]}
                    onPress={() => setActiveMode('online')}
                >
                    <Ionicons name="globe-outline" size={20} color={activeMode === 'online' ? colors.accent : colors.textSecondary} />
                    <Text style={[styles.modeText, activeMode === 'online' && { color: colors.accent }]}>Online</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Offline Mode */}
                {activeMode === 'offline' && (
                    <>
                        <View style={styles.offlineHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>🎬 My Videos</Text>
                            <View style={styles.buttonGroup}>
                                <TouchableOpacity style={styles.actionButton} onPress={scanDeviceVideos} disabled={scanning}>
                                    <Ionicons name="scan" size={18} color={colors.accent} />
                                    <Text style={[styles.actionButtonText, { color: colors.accent }]}>
                                        {scanning ? 'Scanning...' : 'Scan'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton} onPress={pickVideoFile}>
                                    <Ionicons name="add-circle" size={18} color={colors.accent} />
                                    <Text style={[styles.actionButtonText, { color: colors.accent }]}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {scanning ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.accent} />
                                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Scanning videos...</Text>
                            </View>
                        ) : localVideos.length > 0 ? (
                            <FlatList
                                data={localVideos.slice(0, 12)}
                                renderItem={renderVideoItem}
                                keyExtractor={(item) => item.id}
                                numColumns={2}
                                columnWrapperStyle={styles.gridRow}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.gridContent}
                            />
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="videocam-outline" size={80} color={colors.textSecondary} />
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No videos found</Text>
                                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Tap "Scan" to find videos on your device</Text>
                            </View>
                        )}
                    </>
                )}

                {/* Online Mode - Tamil Songs */}
                {activeMode === 'online' && (
                    <>
                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <View style={[styles.searchInputContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                                <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
                                <TextInput
                                    style={[styles.searchInput, { color: colors.text }]}
                                    placeholder="Search Tamil songs, movies..."
                                    placeholderTextColor={colors.textSecondary}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    onSubmitEditing={searchWebVideos}
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                                        <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TouchableOpacity style={styles.searchButton} onPress={searchWebVideos} disabled={searching}>
                                <LinearGradient colors={[colors.accent, "#7c3aed"]} style={styles.searchGradient}>
                                    {searching ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Ionicons name="search" size={20} color="#fff" />
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* Trending Header */}
                        {!searchQuery && (
                            <View style={styles.trendingHeader}>
                                <Ionicons name="flame" size={18} color={colors.accent} />
                                <Text style={[styles.trendingText, { color: colors.text }]}>Tamil Trending Songs</Text>
                            </View>
                        )}

                        {/* Results Count */}
                        {searchQuery && (
                            <View style={styles.resultsHeader}>
                                <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
                                    {`"${searchQuery}"`} • {onlineVideos.length} videos
                                </Text>
                                <TouchableOpacity onPress={() => setOnlineVideos(TAMIL_SONGS)}>
                                    <Text style={[styles.clearText, { color: colors.accent }]}>Reset</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Video Grid - 12 items */}
                        {searching ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.accent} />
                                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Searching videos...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={onlineVideos.slice(0, 12)}
                                renderItem={renderVideoItem}
                                keyExtractor={(item) => item.id}
                                numColumns={2}
                                columnWrapperStyle={styles.gridRow}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.gridContent}
                            />
                        )}
                    </>
                )}
            </View>

            {/* Video Player Modal with VLC-Style Controls */}
            <Modal
                visible={showPlayer}
                transparent={false}
                animationType="slide"
                onRequestClose={closePlayer}
            >
                <View style={[styles.playerModal, isLandscape && styles.landscapeModal]}>
                    {/* Video Player with PanResponder for swipe controls */}
                    <View
                        {...panResponder.panHandlers}
                        style={styles.videoTouchable}
                        onTouchStart={handleVideoTap}
                    >
                        {selectedVideo && selectedVideo.videoUrl && (
                            <Video
                                ref={videoRef}
                                source={{ uri: selectedVideo.videoUrl }}
                                style={[styles.videoPlayer, isLandscape && styles.landscapeVideo]}
                                useNativeControls={false}
                                resizeMode={ResizeMode.CONTAIN}
                                isLooping={false}
                                volume={volume}
                                onPlaybackStatusUpdate={(status: any) => {
                                    if (status.isLoaded) {
                                        setPosition(status.positionMillis);
                                        setDuration(status.durationMillis);
                                        setIsPlaying(status.isPlaying);
                                        if (status.isPlaying) {
                                            resetInactivityTimer();
                                        }
                                    }
                                }}
                            />
                        )}
                    </View>

                    {/* VLC-Style Brightness/Volume Indicator */}
                    {showVolumeBrightness && (
                        <View style={styles.adjustmentIndicator}>
                            <Ionicons
                                name={adjustmentType === 'brightness' ? "sunny" : "volume-high"}
                                size={40}
                                color="#fff"
                            />
                            <View style={styles.adjustmentBar}>
                                <View
                                    style={[
                                        styles.adjustmentFill,
                                        { width: `${adjustmentValue * 100}%`, backgroundColor: "#a855f7" }
                                    ]}
                                />
                            </View>
                            <Text style={styles.adjustmentText}>
                                {adjustmentType === 'brightness' ? 'Brightness' : 'Volume'} {Math.round(adjustmentValue * 100)}%
                            </Text>
                        </View>
                    )}

                    {/* Controls Overlay */}
                    {showControls && (
                        <View style={styles.controlsOverlay}>
                            {/* Top Bar */}
                            <View style={styles.topBar}>
                                <TouchableOpacity onPress={closePlayer} style={styles.controlButton}>
                                    <Ionicons name="arrow-back" size={24} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.playerTitle} numberOfLines={1}>
                                    {selectedVideo?.title || "Now Playing"}
                                </Text>
                                <TouchableOpacity onPress={toggleOrientation} style={styles.controlButton}>
                                    <Ionicons name={isLandscape ? "contract" : "expand"} size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            {/* Center Controls */}
                            <View style={styles.centerControls}>
                                <TouchableOpacity onPress={seekBackward} style={styles.centerControlButton}>
                                    <Ionicons name="play-back" size={40} color="#fff" />
                                    <Text style={styles.controlLabel}>10s</Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={togglePlayPause} style={styles.centerPlayButton}>
                                    <LinearGradient colors={["#a855f7", "#7c3aed"]} style={styles.playPauseGradient}>
                                        <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#fff" />
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={seekForward} style={styles.centerControlButton}>
                                    <Ionicons name="play-forward" size={40} color="#fff" />
                                    <Text style={styles.controlLabel}>10s</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Bottom Controls */}
                            <View style={styles.bottomControls}>
                                {/* Progress Bar */}
                                <View style={styles.progressContainer}>
                                    <Text style={styles.timeText}>{formatTime(position)}</Text>
                                    <View style={styles.progressBar}>
                                        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: "#a855f7" }]} />
                                    </View>
                                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
}

const LOCAL_VIDEOS_KEY = 'local_videos';

const styles = StyleSheet.create({
    container: { flex: 1 },
    modeContainer: {
        flexDirection: "row",
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 12,
        borderRadius: 30,
        backgroundColor: "rgba(0,0,0,0.05)",
        padding: 4,
    },
    modeButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        borderRadius: 25,
        gap: 6,
    },
    activeMode: { backgroundColor: "rgba(168, 85, 247, 0.2)" },
    modeText: { fontSize: 13, fontWeight: "600" },
    content: { flex: 1, paddingHorizontal: 12 },
    offlineHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 4 },
    sectionTitle: { fontSize: 18, fontWeight: "700" },
    buttonGroup: { flexDirection: "row", gap: 8 },
    actionButton: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(168,85,247,0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    actionButtonText: { fontSize: 12, fontWeight: "500" },
    searchContainer: { flexDirection: "row", gap: 10, marginBottom: 12 },
    searchInputContainer: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 25, borderWidth: 1, gap: 8 },
    searchInput: { flex: 1, fontSize: 14, padding: 0 },
    searchButton: { borderRadius: 25, overflow: "hidden" },
    searchGradient: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    trendingHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
    trendingText: { fontSize: 14, fontWeight: "600" },
    resultsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingHorizontal: 4 },
    resultsText: { fontSize: 11 },
    clearText: { fontSize: 11, fontWeight: "500" },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },
    loadingText: { marginTop: 8, fontSize: 13 },
    gridContent: { paddingBottom: 100 },
    gridRow: { justifyContent: "space-between", marginBottom: 12 },
    videoCard: { width: (width - 36) / 2, borderRadius: 12, borderWidth: 1, overflow: "hidden", position: "relative" },
    thumbnailContainer: { position: "relative", width: "100%", height: 110 },
    thumbnail: { width: "100%", height: "100%", resizeMode: "cover" },
    durationBadge: { position: "absolute", bottom: 6, right: 6, backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    durationText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
    videoInfo: { padding: 8 },
    videoTitle: { fontSize: 12, fontWeight: "600", marginBottom: 3, lineHeight: 16 },
    videoArtist: { fontSize: 10 },
    playButton: { position: "absolute", bottom: 8, right: 8, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 4 },
    deleteButton: { position: "absolute", bottom: 8, left: 8, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 4 },
    emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
    emptyText: { fontSize: 16, marginTop: 16 },
    emptySubtext: { fontSize: 13, marginTop: 6, textAlign: "center" },
    playerModal: { flex: 1, backgroundColor: "#000" },
    landscapeModal: { flex: 1 },
    videoTouchable: { flex: 1 },
    videoPlayer: { width: width, height: height - 100, backgroundColor: "#000" },
    landscapeVideo: { width: height, height: width, transform: [{ rotate: "90deg" }] },
    adjustmentIndicator: { position: "absolute", top: "40%", left: "35%", right: "35%", backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 20, padding: 15, alignItems: "center", gap: 10 },
    adjustmentBar: { width: 100, height: 4, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2, overflow: "hidden" },
    adjustmentFill: { height: "100%", borderRadius: 2 },
    adjustmentText: { color: "#fff", fontSize: 12 },
    controlsOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "space-between" },
    topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 50, paddingHorizontal: 20, paddingBottom: 10 },
    controlButton: { padding: 10, width: 44, alignItems: "center" },
    playerTitle: { flex: 1, color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" },
    centerControls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 40 },
    centerControlButton: { alignItems: "center", gap: 4 },
    centerPlayButton: { width: 70, height: 70, borderRadius: 35, overflow: "hidden" },
    playPauseGradient: { flex: 1, alignItems: "center", justifyContent: "center" },
    controlLabel: { color: "#fff", fontSize: 10, marginTop: 4 },
    bottomControls: { paddingHorizontal: 20, paddingBottom: 30, gap: 15 },
    progressContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
    progressBar: { flex: 1, height: 3, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2, overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 2 },
    timeText: { color: "#fff", fontSize: 11 },
});