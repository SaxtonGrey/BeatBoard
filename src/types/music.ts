export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  previewUrl?: string;
  duration: number;
  genre: string;
  energy: 'low' | 'medium' | 'high';
  color: string; // Dominant color from album art
  spotifyUrl?: string; // Link to Spotify track
}

export interface PlaybackState {
  isPlaying: boolean;
  currentSong: Song | null;
  currentTime: number;
  volume: number;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  profileImage?: string;
}