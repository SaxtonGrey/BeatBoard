/**
 * Spotify Web API Service
 *
 * This service handles all interactions with the Spotify Web API.
 * It automatically handles authentication and provides typed responses.
 */

import { spotifyAuth } from "./spotifyAuth";
import { SPOTIFY_CONFIG } from "../config/spotify";
import type { Song } from "../types/music";

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
  uri: string;
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
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const accessToken = await spotifyAuth.getAccessToken();

    if (!accessToken) {
      throw new Error("No valid access token available");
    }

    const response = await fetch(`${SPOTIFY_CONFIG.API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        spotifyAuth.logout();
        throw new Error("Authentication expired");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API request failed: ${errorData.error?.message || response.statusText}`);
    }

    return response.json();
  }

  async getUserTopTracks(limit: number = 50): Promise<Song[]> {
    try {
      const response = await this.makeRequest<{ items: SpotifyTrack[] }>(
        `/me/top/tracks?limit=${limit}&time_range=medium_term`
      );

      if (!response.items || response.items.length === 0) {
        return [];
      }

      // Get audio features for energy classification
      const trackIds = response.items.map((track) => track.id).join(",");
      const audioFeatures = await this.getAudioFeatures(trackIds);

      return response.items.map((track, index) =>
        this.convertSpotifyTrackToSong(track, audioFeatures[index])
      );
    } catch (error) {
      console.error("Error fetching user top tracks:", error);
      throw error;
    }
  }

  private async getAudioFeatures(trackIds: string): Promise<AudioFeatures[]> {
    try {
      const response = await this.makeRequest<{
        audio_features: (AudioFeatures | null)[];
      }>(`/audio-features?ids=${trackIds}`);
      
      // Filter out null values and provide defaults
      return response.audio_features.map(features => features || {
        energy: 0.5,
        valence: 0.5,
        danceability: 0.5,
        acousticness: 0.5,
      });
    } catch (error) {
      console.error("Error fetching audio features:", error);
      // Return default features if API call fails
      return trackIds.split(",").map(() => ({
        energy: 0.5,
        valence: 0.5,
        danceability: 0.5,
        acousticness: 0.5,
      }));
    }
  }

  async searchTracks(query: string, limit: number = 20): Promise<Song[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await this.makeRequest<SpotifySearchResponse>(
        `/search?q=${encodedQuery}&type=track&limit=${limit}`
      );

      if (!response.tracks.items || response.tracks.items.length === 0) {
        return [];
      }

      // Get audio features for energy classification
      const trackIds = response.tracks.items.map((track) => track.id).join(",");
      const audioFeatures = await this.getAudioFeatures(trackIds);

      return response.tracks.items.map((track, index) =>
        this.convertSpotifyTrackToSong(track, audioFeatures[index])
      );
    } catch (error) {
      console.error("Error searching tracks:", error);
      throw error;
    }
  }

  private convertSpotifyTrackToSong(
    track: SpotifyTrack,
    audioFeatures?: AudioFeatures
  ): Song {
    // Determine energy level based on danceability
    let energy: "low" | "medium" | "high" = "medium";
    if (audioFeatures) {
      if (audioFeatures.danceability > 0.7) energy = "high";
      else if (audioFeatures.danceability < 0.4) energy = "low";
    }

    // Get the best quality album art
    const albumArt =
      track.album.images.length > 0
        ? track.album.images[0].url
        : "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=400";

    // Generate color based on energy level
    const colors = {
      high: "#EF4444",
      medium: "#F59E0B",
      low: "#6366F1",
    };

    return {
      id: track.id,
      title: track.name,
      artist: track.artists.map((artist) => artist.name).join(", "),
      album: track.album.name,
      albumArt,
      duration: Math.floor(track.duration_ms / 1000),
      genre: "Unknown",
      energy,
      color: colors[energy],
      spotifyUrl: track.external_urls.spotify,
      uri: track.uri,
      danceability: audioFeatures?.danceability || 0.5,
    };
  }

  async getCurrentUser() {
    try {
      return await this.makeRequest<{
        id: string;
        display_name: string;
        email: string;
        images: Array<{ url: string }>;
      }>("/me");
    } catch (error) {
      console.error("Error fetching current user:", error);
      throw error;
    }
  }
}

export const spotifyApi = new SpotifyApiService();