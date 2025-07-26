/**
 * Spotify Web API Service
 * 
 * This service handles all interactions with the Spotify Web API.
 * It automatically handles authentication and provides typed responses.
 */

import { spotifyAuth } from './spotifyAuth';
import { SPOTIFY_CONFIG } from '../config/spotify';
import type { Song } from '../types/music';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: Array<{ url: string }>;
  tracks: {
    total: number;
    items: Array<{
      track: SpotifyTrack;
    }>;
  };
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
}

interface AudioFeatures {
  energy: number;
  valence: number;
  danceability: number;
  acousticness: number;
}

class SpotifyApiService {
  /**
   * Make authenticated request to Spotify API
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const accessToken = await spotifyAuth.getAccessToken();
    
    if (!accessToken) {
      throw new Error('No valid access token available');
    }

    const response = await fetch(`${SPOTIFY_CONFIG.API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        spotifyAuth.logout();
        throw new Error('Authentication expired');
      }
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get user's top tracks
   */
  async getUserTopTracks(limit: number = 20, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'): Promise<Song[]> {
    try {
      const response = await this.makeRequest<{ items: SpotifyTrack[] }>(`/me/top/tracks?limit=${limit}&time_range=${timeRange}`);
      
      // Get audio features for energy classification
      const trackIds = response.items.map(track => track.id).join(',');
      const audioFeatures = await this.getAudioFeatures(trackIds);
      
      return response.items.map((track, index) => this.convertSpotifyTrackToSong(track, audioFeatures[index]));
    } catch (error) {
      console.error('Error fetching user top tracks:', error);
      throw error;
    }
  }

  /**
   * Search for tracks
   */
  async searchTracks(query: string, limit: number = 20): Promise<Song[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await this.makeRequest<SpotifySearchResponse>(`/search?q=${encodedQuery}&type=track&limit=${limit}`);
      
      // Get audio features for energy classification
      const trackIds = response.tracks.items.map(track => track.id).join(',');
      const audioFeatures = await this.getAudioFeatures(trackIds);
      
      return response.tracks.items.map((track, index) => this.convertSpotifyTrackToSong(track, audioFeatures[index]));
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw error;
    }
  }

  /**
   * Get user's playlists
   */
  async getUserPlaylists(limit: number = 20): Promise<SpotifyPlaylist[]> {
    try {
      const response = await this.makeRequest<{ items: SpotifyPlaylist[] }>(`/me/playlists?limit=${limit}`);
      return response.items;
    } catch (error) {
      console.error('Error fetching user playlists:', error);
      throw error;
    }
  }

  /**
   * Get tracks from a playlist
   */
  async getPlaylistTracks(playlistId: string, limit: number = 50): Promise<Song[]> {
    try {
      const response = await this.makeRequest<{ items: Array<{ track: SpotifyTrack }> }>(`/playlists/${playlistId}/tracks?limit=${limit}`);
      
      // Get audio features for energy classification
      const trackIds = response.items.map(item => item.track.id).join(',');
      const audioFeatures = await this.getAudioFeatures(trackIds);
      
      return response.items.map((item, index) => this.convertSpotifyTrackToSong(item.track, audioFeatures[index]));
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
      throw error;
    }
  }

  /**
   * Get audio features for tracks (used for energy classification)
   */
  private async getAudioFeatures(trackIds: string): Promise<AudioFeatures[]> {
    try {
      const response = await this.makeRequest<{ audio_features: AudioFeatures[] }>(`/audio-features?ids=${trackIds}`);
      return response.audio_features || [];
    } catch (error) {
      console.error('Error fetching audio features:', error);
      // Return default features if API call fails
      return trackIds.split(',').map(() => ({ energy: 0.5, valence: 0.5, danceability: 0.5, acousticness: 0.5 }));
    }
  }

  /**
   * Convert Spotify track to our Song interface
   */
  private convertSpotifyTrackToSong(track: SpotifyTrack, audioFeatures?: AudioFeatures): Song {
    // Determine energy level based on audio features
    let energy: 'low' | 'medium' | 'high' = 'medium';
    if (audioFeatures) {
      if (audioFeatures.energy > 0.7) energy = 'high';
      else if (audioFeatures.energy < 0.4) energy = 'low';
    }

    // Get the best quality album art
    const albumArt = track.album.images.length > 0 
      ? track.album.images[0].url 
      : 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=400';

    // Generate color based on energy level
    const colors = {
      high: '#EF4444',
      medium: '#F59E0B', 
      low: '#6366F1'
    };

    return {
      id: track.id,
      title: track.name,
      artist: track.artists.map(artist => artist.name).join(', '),
      album: track.album.name,
      albumArt,
      previewUrl: track.preview_url || undefined,
      duration: Math.floor(track.duration_ms / 1000),
      genre: 'Unknown', // Spotify doesn't provide genre in track objects
      energy,
      color: colors[energy],
      spotifyUrl: track.external_urls.spotify,
    };
  }

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    try {
      return await this.makeRequest<{
        id: string;
        display_name: string;
        email: string;
        images: Array<{ url: string }>;
      }>('/me');
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  }
}

export const spotifyApi = new SpotifyApiService();