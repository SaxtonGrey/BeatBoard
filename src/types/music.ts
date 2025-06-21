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
}

export interface PlaybackState {
  isPlaying: boolean;
  currentSong: Song | null;
  currentTime: number;
  volume: number;
}