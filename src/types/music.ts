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
  currentTime: number;
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

export interface SpotifyPlayer {
  addListener: (event: string, callback: (data: any) => void) => void;
  removeListener: (event: string, callback?: (data: any) => void) => void;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  getCurrentState: () => Promise<SpotifyPlayerState | null>;
  setName: (name: string) => Promise<void>;
  getVolume: () => Promise<number>;
  setVolume: (volume: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  previousTrack: () => Promise<void>;
  nextTrack: () => Promise<void>;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume: number;
      }) => SpotifyPlayer;
    };
  }
}