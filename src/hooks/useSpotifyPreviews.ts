import { useState, useEffect } from 'react';
import { spotifyApi } from '../services/spotifyApi';
import type { Song } from '../types/music';

export const useSpotifyPreviews = (songs: Song[]) => {
  const [songsWithPreviews, setSongsWithPreviews] = useState<Song[]>(songs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreviews = async () => {
      // Only fetch if songs don't already have preview URLs
      const songsNeedingPreviews = songs.filter(song => !song.previewUrl);
      
      if (songsNeedingPreviews.length === 0) {
        setSongsWithPreviews(songs);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const trackData = songsNeedingPreviews.map(song => ({
          id: song.id,
          artist: song.artist,
          title: song.title
        }));

        const previewUrls = await spotifyApi.getMultipleTrackPreviews(trackData);

        const updatedSongs = songs.map(song => ({
          ...song,
          previewUrl: song.previewUrl || previewUrls[song.id] || undefined
        }));

        setSongsWithPreviews(updatedSongs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch preview URLs');
        setSongsWithPreviews(songs); // Fallback to original songs
      } finally {
        setLoading(false);
      }
    };

    fetchPreviews();
  }, [songs]);

  return { songsWithPreviews, loading, error };
};