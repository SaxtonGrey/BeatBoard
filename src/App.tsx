import React, { useState, useMemo } from "react";
import { Header } from "./components/Header";
import { MasonryGrid } from "./components/MasonryGrid";
import { AudioControlBar } from "./components/AudioControlBar";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useSpotifyPreviews } from "./hooks/useSpotifyPreviews";
import { mockSongs } from "./data/mockSongs";
import type { Song } from "./types/music";

function App() {
  const [energyFilter, setEnergyFilter] = useState<string>("all");
  const [songs, setSongs] = useState<Song[]>(mockSongs);
  const { playbackState, playSong, pauseSong, setVolume, seekTo } =
    useAudioPlayer();

  // Fetch Spotify preview URLs for songs
  const { songsWithPreviews, loading, error } = useSpotifyPreviews(songs);

  // Filter songs based on energy level
  const filteredSongs = useMemo(() => {
    if (energyFilter === "all") {
      return songsWithPreviews;
    }
    return songsWithPreviews.filter((song) => song.energy === energyFilter);
  }, [songsWithPreviews, energyFilter]);

  const handleShuffle = () => {
    const shuffled = [...songsWithPreviews].sort(() => Math.random() - 0.5);
    setSongs(shuffled);
  };

  const handleFilterChange = (filter: string) => {
    setEnergyFilter(filter);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Header
        onShuffle={handleShuffle}
        onFilterChange={handleFilterChange}
        currentFilter={energyFilter}
      />

      {error && (
        <div className="container mx-auto px-4 py-2">
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded-lg text-sm">
            Spotify API Error: {error}. Songs will play without preview URLs.
          </div>
        </div>
      )}

      {loading && (
        <div className="container mx-auto px-4 py-2">
          <div className="bg-spotify-green/20 border border-spotify-green text-spotify-green px-4 py-2 rounded-lg text-sm">
            Loading preview URLs from Spotify...
          </div>
        </div>
      )}

      <main className="pb-24">
        <MasonryGrid
          songs={filteredSongs}
          currentSong={playbackState.currentSong}
          isPlaying={playbackState.isPlaying}
          onSongPlay={playSong}
        />
      </main>

      <AudioControlBar
        playbackState={playbackState}
        onPlay={playSong}
        onPause={pauseSong}
        onVolumeChange={setVolume}
        onSeek={seekTo}
      />
    </div>
  );
}

export default App;