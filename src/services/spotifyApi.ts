interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  preview_url: string | null;
  duration_ms: number;
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

class SpotifyAPI {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials not configured. Please add VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_CLIENT_SECRET to your .env file');
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error('Failed to get Spotify access token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Subtract 1 minute for safety

    return this.accessToken;
  }

  async searchTrack(artist: string, title: string): Promise<string | null> {
    try {
      const token = await this.getAccessToken();
      const query = encodeURIComponent(`artist:${artist} track:${title}`);
      
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        console.error('Spotify API error:', response.status, response.statusText);
        return null;
      }

      const data: SpotifySearchResponse = await response.json();
      
      if (data.tracks.items.length > 0) {
        return data.tracks.items[0].preview_url;
      }

      return null;
    } catch (error) {
      console.error('Error searching Spotify track:', error);
      return null;
    }
  }

  async getMultipleTrackPreviews(tracks: Array<{ artist: string; title: string; id: string }>): Promise<Record<string, string | null>> {
    const results: Record<string, string | null> = {};
    
    // Process tracks in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize);
      
      const promises = batch.map(async (track) => {
        const previewUrl = await this.searchTrack(track.artist, track.title);
        return { id: track.id, previewUrl };
      });

      const batchResults = await Promise.all(promises);
      
      batchResults.forEach(({ id, previewUrl }) => {
        results[id] = previewUrl;
      });

      // Add a small delay between batches to be respectful to the API
      if (i + batchSize < tracks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }
}

export const spotifyApi = new SpotifyAPI();