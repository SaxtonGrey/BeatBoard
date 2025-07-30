import React from "react";
import { Header } from "./components/Header";
import { MasonryGrid } from "./components/MasonryGrid";
import { AudioControlBar } from "./components/AudioControlBar";
import { LoginScreen } from "./components/LoginScreen";
import { AuthCallback } from "./components/AuthCallback";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { SearchBar } from "./components/SearchBar";
import { useAppState } from "./hooks/useAppState";
import { useSpotifyPlayer } from "./components/SpotifyPlayer";
import type { Song } from "./types/music";

function App() {
  const {
    isAuthenticated,
    user,
    filteredSongs,
    energyFilter,
    searchQuery,
    isInitialLoading,
    isLoadingSongs,
    error,
    searchTracks,
    clearSearch,
    setEnergyFilter,
    shuffleSongs,
    handleAuthComplete,
    handleLogout,
    clearError,
  } = useAppState();

  const {
    playerState,
    isReady: isPlayerReady,
    error: playerError,
    playTrack,
    pauseTrack,
    resumeTrack,
    seekTo,
    setVolume,
    PlayerComponent,
  } = useSpotifyPlayer();

  // Check if we're on the callback route
  const isCallbackRoute = window.location.pathname.includes("/callback");

  // Show loading screen during initial load
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading Music Gallery..." />
      </div>
    );
  }

  // Show callback screen during OAuth flow
  if (isCallbackRoute) {
    return <AuthCallback onAuthComplete={handleAuthComplete} />;
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const handleSongPlay = (song: Song) => {
    if (!isPlayerReady) {
      alert("Spotify player is not ready yet. Please wait a moment and try again.");
      return;
    }

    const isCurrentSong = playerState?.track_window.current_track.id === song.id;
    const isPlaying = playerState && !playerState.paused;

    if (isCurrentSong && isPlaying) {
      pauseTrack();
    } else if (isCurrentSong && !isPlaying) {
      resumeTrack();
    } else {
      playTrack(song);
    }
  };

  // Create current song object from player state
  const currentSong: Song | null = playerState?.track_window.current_track ? {
    id: playerState.track_window.current_track.id,
    title: playerState.track_window.current_track.name,
    artist: playerState.track_window.current_track.artists.map(a => a.name).join(", "),
    album: playerState.track_window.current_track.album.name,
    albumArt: playerState.track_window.current_track.album.images[0]?.url || "",
    duration: Math.floor((playerState.duration || 0) / 1000),
    uri: playerState.track_window.current_track.uri,
    genre: "Unknown",
    energy: "medium",
    color: "#1DB954",
    danceability: 0.5,
  } : null;

  const playbackStateForUI = {
    isPlaying: playerState ? !playerState.paused : false,
    currentSong,
    currentTime: Math.floor((playerState?.position || 0) / 1000),
    volume: 0.7, // We'll manage this separately
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Spotify Player Component */}
      <PlayerComponent />

      <Header
        user={user || undefined}
        onShuffle={shuffleSongs}
        onFilterChange={setEnergyFilter}
        currentFilter={energyFilter}
        onLogout={handleLogout}
      />

      {/* Search Bar */}
      <div className="container mx-auto px-4 py-6">
        <SearchBar
          onSearch={searchTracks}
          onClear={clearSearch}
          isLoading={isLoadingSongs}
        />

        {searchQuery && (
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm">
              {isLoadingSongs
                ? "Searching..."
                : `Showing results for "${searchQuery}"`}
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {(error || playerError) && (
        <div className="container mx-auto px-4 py-2">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
            <p className="text-red-400">{error || playerError}</p>
            {error && (
              <button
                onClick={clearError}
                className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      {/* Player Status */}
      {!isPlayerReady && isAuthenticated && (
        <div className="container mx-auto px-4 py-2">
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 text-center">
            <p className="text-yellow-400 text-sm">
              Setting up Spotify player... You'll be able to play full tracks once it's ready.
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoadingSongs && (
        <div className="container mx-auto px-4 py-12">
          <LoadingSpinner size="lg" message="Loading tracks..." />
        </div>
      )}

      {/* Empty State */}
      {!isLoadingSongs && filteredSongs.length === 0 && (
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-xl font-bold text-white mb-2">
              No tracks found
            </h3>
            <p className="text-gray-400">
              {searchQuery
                ? `No results found for "${searchQuery}". Try a different search term.`
                : "We couldn't load your music. Try refreshing the page or searching for tracks."}
            </p>
          </div>
        </div>
      )}

      {/* Music Grid */}
      {!isLoadingSongs && filteredSongs.length > 0 && (
        <main className="pb-24">
          <MasonryGrid
            songs={filteredSongs}
            currentSong={currentSong}
            isPlaying={playbackStateForUI.isPlaying}
            onSongPlay={handleSongPlay}
          />
        </main>
      )}

      <AudioControlBar
        playbackState={playbackStateForUI}
        onPlay={handleSongPlay}
        onPause={pauseTrack}
        onVolumeChange={setVolume}
        onSeek={(time) => seekTo(time * 1000)} // Convert to milliseconds
      />
    </div>
  );
}

export default App;