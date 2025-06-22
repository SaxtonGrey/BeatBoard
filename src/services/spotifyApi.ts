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
  private accessToken: string = "";
  private tokenExpiry: number = 0;

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Missing Spotify credentials:", {
        VITE_SPOTIFY_CLIENT_ID: clientId ? "Present" : "Missing",
        VITE_SPOTIFY_CLIENT_SECRET: clientSecret ? "Present" : "Missing",
      });
      throw new Error(
        "Spotify credentials not configured. Please ensure your .env file contains VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_CLIENT_SECRET"
      );
    }

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: "grant_type=client_credentials",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Spotify token request failed:",
          response.status,
          errorText
        );
        throw new Error(
          `Failed to get Spotify access token: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000; // Subtract 1 minute for safety

      return this.accessToken;
    } catch (error) {
      console.error("Error getting Spotify access token:", error);
      throw error;
    }
  }

  async searchTrack(artist: string, title: string): Promise<string | null> {
    try {
      const token = await this.getAccessToken();
      const query = encodeURIComponent(`artist:${artist} track:${title}`);

      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Spotify API search error:",
          response.status,
          response.statusText
        );
        return null;
      }

      const data: SpotifySearchResponse = await response.json();

      if (data.tracks.items.length > 0) {
        const track = data.tracks.items[0];
        const previewUrl = track.preview_url;

        // Log the result for debugging
        console.log(`Search result for "${title}" by ${artist}:`, {
          found: true,
          hasPreview: !!previewUrl,
          previewUrl: previewUrl,
        });

        return previewUrl;
      } else {
        console.log(`No tracks found for "${title}" by ${artist}`);
        return null;
      }
    } catch (error) {
      console.error("Error searching Spotify track:", error);
      return null;
    }
  }

  async getMultipleTrackPreviews(
    tracks: Array<{ artist: string; title: string; id: string }>
  ): Promise<Record<string, string | null>> {
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
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Log summary of results
    const withPreviews = Object.values(results).filter(
      (url) => url !== null
    ).length;
    const total = Object.keys(results).length;
    console.log(
      `Spotify API Results: ${withPreviews}/${total} tracks have preview URLs`
    );

    return results;
  }
}

export const spotifyApi = new SpotifyAPI();
