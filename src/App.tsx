import React, { useState, useMemo } from "react";
import { Header } from "./components/Header";
import { MasonryGrid } from "./components/MasonryGrid";
import { AudioControlBar } from "./components/AudioControlBar";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { mockSongs } from "./data/mockSongs";
import type { Song } from "./types/music";

function App() {
  const [energyFilter, setEnergyFilter] = useState<string>("all");
  const [songs, setSongs] = useState<Song[]>(mockSongs);
  const { playbackState, playSong, pauseSong, setVolume, seekTo } =
    useAudioPlayer();

  // Filter songs based on energy level
  const filteredSongs = useMemo(() => {
    if (energyFilter === "all") {
      return songs;
    }
    return songs.filter((song) => song.energy === energyFilter);
  }, [songs, energyFilter]);

  const handleShuffle = () => {
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
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

      <div className="container mx-auto px-4 py-2">
        <div className="bg-blue-900/50 border border-blue-500 text-blue-200 px-4 py-2 rounded-lg text-sm">
          <strong>Demo Mode:</strong> This app demonstrates the music gallery interface. 
          Some songs have demo audio files for testing playback functionality.
        </div>
      </div>

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