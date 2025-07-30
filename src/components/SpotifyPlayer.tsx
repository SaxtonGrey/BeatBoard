/**
 * Spotify Web Player Component
 * 
 * Implements the Spotify Web Playback SDK for playing full tracks
 */

import React, { useEffect, useRef, useState } from 'react';
import { spotifyAuth } from '../services/spotifyAuth';
import type { Song, SpotifyPlayerState, SpotifyPlayer } from '../types/music';

interface SpotifyPlayerProps {
  onPlayerStateChange: (state: SpotifyPlayerState | null) => void;
  onPlayerReady: (deviceId: string) => void;
  onPlayerError: (error: string) => void;
}

export const SpotifyPlayerComponent: React.FC<SpotifyPlayerProps> = ({
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

  return null; // This component doesn't render anything
};

export const useSpotifyPlayer = () => {
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

  const pauseTrack = async () => {
    try {
      const token = await spotifyAuth.getAccessToken();
      if (!token) throw new Error('No access token');

      await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error pausing track:', error);
    }
  };

  const resumeTrack = async () => {
    try {
      const token = await spotifyAuth.getAccessToken();
      if (!token) throw new Error('No access token');

      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error resuming track:', error);
    }
  };

  const seekTo = async (position: number) => {
    try {
      const token = await spotifyAuth.getAccessToken();
      if (!token) throw new Error('No access token');

      await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${position}&device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const setVolume = async (volume: number) => {
    try {
      const token = await spotifyAuth.getAccessToken();
      if (!token) throw new Error('No access token');

      const volumePercent = Math.round(volume * 100);
      await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volumePercent}&device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error setting volume:', error);
    }
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
      <SpotifyPlayerComponent
        onPlayerStateChange={handlePlayerStateChange}
        onPlayerReady={handlePlayerReady}
        onPlayerError={handlePlayerError}
      />
    ),
  };
};