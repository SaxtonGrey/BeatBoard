import React, { useState, useMemo, useEffect } from "react";
import { Header } from "./components/Header";
import { MasonryGrid } from "./components/MasonryGrid";
import { AudioControlBar } from "./components/AudioControlBar";
import { LoginScreen } from "./components/LoginScreen";
import { AuthCallback } from "./components/AuthCallback";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { SearchBar } from "./components/SearchBar";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { spotifyAuth } from "./services/spotifyAuth";
import { spotifyApi } from "./services/spotifyApi";
import type { Song, User } from "./types/music";

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showCallback, setShowCallback] = useState(false);

  // App state
  const [energyFilter, setEnergyFilter] = useState<string>("all");
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { playbackState, playSong, pauseSong, setVolume, seekTo } =
    useAudioPlayer();

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we're on the callback route
        if (window.location.pathname === "/callback") {
          setShowCallback(true);
          setIsLoading(false);
          return;
        }

        const authenticated = spotifyAuth.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          await loadUserData();
          await loadUserTopTracks();
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Load user profile data
  const loadUserData = async () => {
    try {
      const userData = await spotifyApi.getCurrentUser();
      setUser({
        id: userData.id,
        displayName: userData.display_name || userData.id,
        email: userData.email,
        profileImage: userData.images?.[0]?.url,
      });
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  // Load user's top tracks
  const loadUserTopTracks = async () => {
    setIsLoadingSongs(true);
    try {
      const tracks = await spotifyApi.getUserTopTracks(50);
      setSongs(tracks);
    } catch (error) {
      console.error("Error loading top tracks:", error);
      // Fallback to empty array if API fails
      setSongs([]);
    } finally {
      setIsLoadingSongs(false);
    }
  };

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsLoadingSongs(true);
    try {
      const tracks = await spotifyApi.searchTracks(query, 50);
      setSongs(tracks);
    } catch (error) {
      console.error("Error searching tracks:", error);
      setSongs([]);
    } finally {
      setIsLoadingSongs(false);
    }
  };

  // Clear search and load top tracks
  const handleClearSearch = () => {
    setSearchQuery("");
    loadUserTopTracks();
  };

  // Handle authentication callback
  const handleAuthComplete = (success: boolean) => {
    setShowCallback(false);
    if (success) {
      setIsAuthenticated(true);
      loadUserData();
      loadUserTopTracks();
    } else {
      setIsAuthenticated(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    spotifyAuth.logout();
    setIsAuthenticated(false);
    setUser(null);
    setSongs([]);
    setSearchQuery("");
  };

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

  // Show loading screen during initial load
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading Music Gallery..." />
      </div>
    );
  }

  // Show callback screen during OAuth flow
  if (showCallback) {
    return <AuthCallback onAuthComplete={handleAuthComplete} />;
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Header
        user={user || undefined}
        onShuffle={handleShuffle}
        onFilterChange={handleFilterChange}
        currentFilter={energyFilter}
        onLogout={handleLogout}
      />

      {/* Search Bar */}
      <div className="container mx-auto px-4 py-6">
        <SearchBar
          onSearch={handleSearch}
          onClear={handleClearSearch}
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

      {/* Loading State */}
      {isLoadingSongs && (
        <div className="container mx-auto px-4 py-12">
          <LoadingSpinner size="lg" message="Loading tracks..." />
        </div>
      )}

      {/* Empty State */}
      {!isLoadingSongs && songs.length === 0 && (
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
      {!isLoadingSongs && songs.length > 0 && (
        <main className="pb-24">
          <MasonryGrid
            songs={filteredSongs}
            currentSong={playbackState.currentSong}
            isPlaying={playbackState.isPlaying}
            onSongPlay={playSong}
          />
        </main>
      )}

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
