/**
 * Spotify Web Player Component
 * 
 * Implements the Spotify Web Playback SDK for playing full tracks
 */

import React, { useEffect, useRef, useState } from 'react';
import { spotifyAuth } from '../services/spotifyAuth';
import type { Song, SpotifyPlayerState } from '../types/music';

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

interface SpotifyPlayer {
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

interface SpotifyPlayerProps {
  onPlayerStateChange: (state: SpotifyPlayerState | null) => void;
  onPlayerReady: (deviceId: string) => void;
  onPlayerError: (error: string) => void;
}

export const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({
  onPlayerStateChange,
  onPlayerReady,
  onPlayerError,
}) => {
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    // Check if SDK is already loaded
    if (window.Spotify) {
      setIsSDKReady(true);
      initializePlayer();
      return;
    }

    // Set up SDK ready callback
    window.onSpotifyWebPlaybackSDKReady = () => {
      setIsSDKReady(true);
      initializePlayer();
    };

    // Load SDK if not already loaded
    if (!document.querySelector('script[src*="spotify-player"]')) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, []);

  const initializePlayer = async () => {
    try {
      const token = await spotifyAuth.getAccessToken();
      if (!token) {
        onPlayerError('No access token available');
        return;
      }

      const player = new window.Spotify.Player({
        name: 'Music Gallery Player',
        getOAuthToken: (cb) => {
          spotifyAuth.getAccessToken().then(token => {
            if (token) cb(token);
          });
        },
        volume: 0.7,
      });

      // Error handling
      player.addListener('initialization_error', ({ message }) => {
        console.error('Spotify Player initialization error:', message);
        onPlayerError(`Initialization error: ${message}`);
      });

      player.addListener('authentication_error', ({ message }) => {
        console.error('Spotify Player authentication error:', message);
        onPlayerError(`Authentication error: ${message}`);
      });

      player.addListener('account_error', ({ message }) => {
        console.error('Spotify Player account error:', message);
        onPlayerError(`Account error: ${message}`);
      });

      player.addListener('playback_error', ({ message }) => {
        console.error('Spotify Player playback error:', message);
        onPlayerError(`Playback error: ${message}`);
      });

      // Playback status updates
      player.addListener('player_state_changed', (state: SpotifyPlayerState | null) => {
        onPlayerStateChange(state);
      });

      // Ready
      player.addListener('ready', ({ device_id }) => {
        console.log('Spotify Player ready with Device ID:', device_id);
        setDeviceId(device_id);
        onPlayerReady(device_id);
      });

      // Not Ready
      player.addListener('not_ready', ({ device_id }) => {
        console.log('Spotify Player not ready with Device ID:', device_id);
      });

      // Connect to the player
      const connected = await player.connect();
      if (connected) {
        console.log('Successfully connected to Spotify Player');
        playerRef.current = player;
      } else {
        onPlayerError('Failed to connect to Spotify Player');
      }
    } catch (error) {
      console.error('Error initializing Spotify Player:', error);
      onPlayerError(`Failed to initialize player: ${error}`);
    }
  };

  const playTrack = async (uri: string, deviceId: string) => {
    try {
      const token = await spotifyAuth.getAccessToken();
      if (!token) throw new Error('No access token');

      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({
          uris: [uri],
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to play track: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error playing track:', error);
      onPlayerError(`Failed to play track: ${error}`);
    }
  };

  // Expose player methods
  React.useImperativeHandle(playerRef, () => ({
    play: (song: Song) => {
      if (deviceId) {
        playTrack(song.uri, deviceId);
      }
    },
    pause: () => playerRef.current?.pause(),
    resume: () => playerRef.current?.resume(),
    seek: (position: number) => playerRef.current?.seek(position),
    setVolume: (volume: number) => playerRef.current?.setVolume(volume),
    getCurrentState: () => playerRef.current?.getCurrentState(),
  }));

  return null; // This component doesn't render anything
};

export const useSpotifyPlayer = () => {
  const playerRef = useRef<any>(null);
  const [playerState, setPlayerState] = useState<SpotifyPlayerState | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string>('');

  const handlePlayerStateChange = (state: SpotifyPlayerState | null) => {
    setPlayerState(state);
  };

  const handlePlayerReady = (id: string) => {
    setDeviceId(id);
    setIsReady(true);
  };

  const handlePlayerError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const playTrack = async (song: Song) => {
    if (!deviceId) {
      setError('Player not ready');
      return;
    }

    try {
      const token = await spotifyAuth.getAccessToken();
      if (!token) throw new Error('No access token');

      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({
          uris: [song.uri],
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to play track: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error playing track:', error);
      setError(`Failed to play track: ${error}`);
    }
  };

  const pauseTrack = () => {
    playerRef.current?.pause();
  };

  const resumeTrack = () => {
    playerRef.current?.resume();
  };

  const seekTo = (position: number) => {
    playerRef.current?.seek(position);
  };

  const setVolume = (volume: number) => {
    playerRef.current?.setVolume(volume);
  };

  return {
    playerState,
    deviceId,
    isReady,
    error,
    playTrack,
    pauseTrack,
    resumeTrack,
    seekTo,
    setVolume,
    PlayerComponent: () => (
      <SpotifyPlayer
        ref={playerRef}
        onPlayerStateChange={handlePlayerStateChange}
        onPlayerReady={handlePlayerReady}
        onPlayerError={handlePlayerError}
      />
    ),
  };
};