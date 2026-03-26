// app/services/musicService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  videoId: string;
  streamUrl?: string;
  type?: 'song' | 'movie';
  album?: string;
  year?: string;
  uri?: string;
  isLocal?: boolean;
}

export interface HistoryEntry {
  id: string;
  songId: string;
  title: string;
  artist: string;
  thumbnail: string;
  playedAt: number;
  duration: number;
  type?: 'song' | 'movie';
  uri?: string;
}

const HISTORY_KEY = 'music_history';
const LOCAL_SONGS_KEY = 'local_songs';

// Tamil Songs Database (Real Tamil Songs)
export const TAMIL_SONGS: Song[] = [
  { id: "t1", title: "Veeram - Thangame Thangame", artist: "Devi Sri Prasad, Karthik", duration: 280, thumbnail: "", videoId: "veeram1", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", type: "song", album: "Veeram", year: "2014" },
  { id: "t2", title: "Veeram - Kadal Kadal", artist: "Devi Sri Prasad, Shreya Ghoshal", duration: 270, thumbnail: "", videoId: "veeram2", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", type: "song", album: "Veeram", year: "2014" },
  { id: "t3", title: "Veeram - Neeleya", artist: "Devi Sri Prasad, Ranjith", duration: 260, thumbnail: "", videoId: "veeram3", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", type: "song", album: "Veeram", year: "2014" },
  { id: "t4", title: "Anjaan - Sirippu Enakku", artist: "Devi Sri Prasad, Sunidhi Chauhan", duration: 260, thumbnail: "", videoId: "anjaan1", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", type: "song", album: "Anjaan", year: "2014" },
  { id: "t5", title: "Anjaan - Ek Do Theen", artist: "Shreya Ghoshal, Arijit Singh", duration: 280, thumbnail: "", videoId: "anjaan2", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", type: "song", album: "Anjaan", year: "2014" },
  { id: "t6", title: "Anjaan - Bang Bang Bang", artist: "Devi Sri Prasad, Vishal Dadlani", duration: 245, thumbnail: "", videoId: "anjaan3", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", type: "song", album: "Anjaan", year: "2014" },
  { id: "t7", title: "Kabali - Neruppu Da", artist: "Sanath, Arunraja Kamaraj", duration: 240, thumbnail: "", videoId: "kabali1", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", type: "song", album: "Kabali", year: "2016" },
  { id: "t8", title: "Kabali - Maya Nadhi", artist: "Pradeep Kumar, Ananthu", duration: 280, thumbnail: "", videoId: "kabali2", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", type: "song", album: "Kabali", year: "2016" },
  { id: "t9", title: "Maari - Maari Thara Local", artist: "Anirudh, Dhanush", duration: 260, thumbnail: "", videoId: "maari1", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3", type: "song", album: "Maari", year: "2015" },
  { id: "t10", title: "Maari - Don U Don", artist: "Anirudh", duration: 250, thumbnail: "", videoId: "maari2", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", type: "song", album: "Maari", year: "2015" },
];

class MusicService {
  // Get all Tamil songs
  getAllTamilSongs(): Song[] {
    return TAMIL_SONGS;
  }

  // Search songs by query
  async searchSongs(query: string): Promise<Song[]> {
    if (!query.trim()) return TAMIL_SONGS;
    
    const lowerQuery = query.toLowerCase();
    const results = TAMIL_SONGS.filter(song =>
      song.title.toLowerCase().includes(lowerQuery) ||
      song.artist.toLowerCase().includes(lowerQuery) ||
      (song.album && song.album.toLowerCase().includes(lowerQuery))
    );
    
    return results.length > 0 ? results : TAMIL_SONGS;
  }

  async searchSongsOnly(query: string): Promise<Song[]> {
    return this.searchSongs(query);
  }

  async searchMovies(query: string): Promise<Song[]> {
    const lowerQuery = query.toLowerCase();
    return TAMIL_SONGS.filter(song => 
      song.album && song.album.toLowerCase().includes(lowerQuery)
    );
  }

  async getStreamUrl(videoId: string): Promise<string | undefined> {
    const song = TAMIL_SONGS.find(s => s.videoId === videoId);
    return song?.streamUrl;
  }

  async getSuggestions(query: string): Promise<{ text: string; type: string }[]> {
    const suggestions = [
      { text: "Veeram songs", type: "movie" },
      { text: "Anjaan songs", type: "movie" },
      { text: "Kabali songs", type: "movie" },
      { text: "Maari songs", type: "movie" },
      { text: `${query} tamil song`, type: "song" },
    ];
    return suggestions.filter(s => s.text.toLowerCase().includes(query.toLowerCase()));
  }

  async getTrendingContent(): Promise<{ songs: Song[], movies: Song[] }> {
    return {
      songs: TAMIL_SONGS.slice(0, 5),
      movies: TAMIL_SONGS.filter(s => s.album === "Veeram" || s.album === "Anjaan")
    };
  }

  async getTrendingSongs(): Promise<Song[]> {
    return TAMIL_SONGS.slice(0, 5);
  }

  async getTrendingMovies(): Promise<Song[]> {
    return TAMIL_SONGS.filter(s => s.album === "Veeram" || s.album === "Anjaan");
  }

  async searchTamilSongs(query: string): Promise<Song[]> {
    return this.searchSongs(query);
  }

  async searchBollywoodSongs(query: string): Promise<Song[]> {
    return this.searchSongs(query);
  }

  async getRelatedSongs(videoId: string): Promise<Song[]> {
    return TAMIL_SONGS.slice(0, 5);
  }

  async getRelatedContent(videoId: string): Promise<Song[]> {
    return this.getRelatedSongs(videoId);
  }

  async searchMovieSoundtrack(movieName: string): Promise<Song[]> {
    return this.searchMovies(movieName);
  }

  async getPopularMovies(category: string = 'hollywood'): Promise<Song[]> {
    return TAMIL_SONGS.filter(s => s.album).slice(0, 5);
  }

  async getPopularSongs(genre: string = 'pop'): Promise<Song[]> {
    return TAMIL_SONGS.slice(0, 5);
  }

  // Local songs methods
  async saveLocalSongs(songs: Song[]) {
    await AsyncStorage.setItem(LOCAL_SONGS_KEY, JSON.stringify(songs));
  }

  async getLocalSongs(): Promise<Song[]> {
    const data = await AsyncStorage.getItem(LOCAL_SONGS_KEY);
    return data ? JSON.parse(data) : [];
  }

  async addLocalSong(song: Song) {
    const songs = await this.getLocalSongs();
    const updated = [song, ...songs.filter(s => s.id !== song.id)];
    await this.saveLocalSongs(updated);
  }

  async deleteLocalSong(songId: string) {
    const songs = await this.getLocalSongs();
    const updated = songs.filter(s => s.id !== songId);
    await this.saveLocalSongs(updated);
  }

  // History methods
  async addToHistory(song: Song) {
    const history = await this.getHistory();
    const newEntry: HistoryEntry = {
      id: song.id,
      songId: song.id,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail || '',
      playedAt: Date.now(),
      duration: song.duration || 180,
      type: song.type,
      uri: song.uri,
    };
    const updated = [newEntry, ...history.filter(h => h.songId !== song.id)].slice(0, 50);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }

  async getHistory(): Promise<HistoryEntry[]> {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  }

  async deleteHistoryEntry(id: string) {
    const history = await this.getHistory();
    const updated = history.filter(h => h.id !== id);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }

  async clearHistory() {
    await AsyncStorage.removeItem(HISTORY_KEY);
  }

  async getRecentlyPlayed(limit: number = 10): Promise<HistoryEntry[]> {
    const history = await this.getHistory();
    return history.slice(0, limit);
  }
}

export default new MusicService();