/**
 * Spotify Web API Configuration
 * 
 * This file contains all Spotify API related configuration.
 * Make sure to set your credentials in the .env file:
 * - VITE_SPOTIFY_CLIENT_ID: Your Spotify app's client ID
 * - VITE_SPOTIFY_CLIENT_SECRET: Your Spotify app's client secret  
 * - VITE_SPOTIFY_REDIRECT_URI: Your app's redirect URI (must match Spotify app settings)
 */

export const SPOTIFY_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
  CLIENT_SECRET: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
  REDIRECT_URI: import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://localhost:5173/callback',
  SCOPES: [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state'
  ].join(' '),
  API_BASE_URL: 'https://api.spotify.com/v1',
  AUTH_URL: 'https://accounts.spotify.com/authorize',
  TOKEN_URL: 'https://accounts.spotify.com/api/token'
};

// Validate required environment variables
export const validateSpotifyConfig = (): boolean => {
  const required = ['CLIENT_ID', 'CLIENT_SECRET', 'REDIRECT_URI'];
  const missing = required.filter(key => !SPOTIFY_CONFIG[key as keyof typeof SPOTIFY_CONFIG]);
  
  if (missing.length > 0) {
    console.error('Missing Spotify configuration:', missing);
    return false;
  }
  
  return true;
};