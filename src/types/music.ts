export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  genre: string;
  energy: "low" | "medium" | "high";
  color: string;
  spotifyUrl?: string;
  uri: string;
  danceability: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentSong: Song | null;
  position: number;
  duration: number;
  volume: number;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  profileImage?: string;
}

export interface SpotifyPlayerState {
  device_id: string;
  position: number;
  duration: number;
  paused: boolean;
  track_window: {
    current_track: {
      id: string;
      name: string;
      artists: Array<{ name: string }>;
      album: {
        name: string;
        images: Array<{ url: string }>;
      };
      uri: string;
    };
  };
}