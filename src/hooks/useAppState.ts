/**
 * Centralized App State Hook
 * 
 * Manages all application state in one place to avoid duplication
 */

import { useState, useEffect, useCallback } from 'react';
import { spotifyAuth } from '../services/spotifyAuth';
import { spotifyApi } from '../services/spotifyApi';
import type { Song, User } from '../types/music';

interface AppState {
  // Authentication
  isAuthenticated: boolean;
  user: User | null;
  
  // Songs and filtering
  songs: Song[];
  filteredSongs: Song[];
  energyFilter: string;
  searchQuery: string;
  
  // Loading states
  isInitialLoading: boolean;
  isLoadingSongs: boolean;
  
  // Error handling
  error: string | null;
}

export const useAppState = () => {
  const [state, setState] = useState<AppState>({
    isAuthenticated: false,
    user: null,
    songs: [],
    filteredSongs: [],
    energyFilter: 'all',
    searchQuery: '',
    isInitialLoading: true,
    isLoadingSongs: false,
    error: null,
  });

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  // Filter songs when songs or filter changes
  useEffect(() => {
    const filtered = state.energyFilter === 'all' 
      ? state.songs 
      : state.songs.filter(song => song.energy === state.energyFilter);
    
    setState(prev => ({ ...prev, filteredSongs: filtered }));
  }, [state.songs, state.energyFilter]);

  const initializeApp = async () => {
    try {
      // Check if we're on the callback route
      if (window.location.pathname.includes('/callback')) {
        setState(prev => ({ ...prev, isInitialLoading: false }));
        return;
      }

      const authenticated = spotifyAuth.isAuthenticated();
      
      if (authenticated) {
        setState(prev => ({ ...prev, isAuthenticated: true }));
        await Promise.all([loadUserData(), loadUserTopTracks()]);
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to initialize app',
        isAuthenticated: false 
      }));
    } finally {
      setState(prev => ({ ...prev, isInitialLoading: false }));
    }
  };

  const loadUserData = async () => {
    try {
      const userData = await spotifyApi.getCurrentUser();
      const user: User = {
        id: userData.id,
        displayName: userData.display_name || userData.id,
        email: userData.email,
        profileImage: userData.images?.[0]?.url,
      };
      setState(prev => ({ ...prev, user }));
    } catch (error) {
      console.error('Error loading user data:', error);
      setState(prev => ({ ...prev, error: 'Failed to load user data' }));
    }
  };

  const loadUserTopTracks = async () => {
    setState(prev => ({ ...prev, isLoadingSongs: true, error: null }));
    try {
      const tracks = await spotifyApi.getUserTopTracks(50);
      setState(prev => ({ 
        ...prev, 
        songs: tracks,
        searchQuery: '' // Clear search when loading top tracks
      }));
    } catch (error) {
      console.error('Error loading top tracks:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load your top tracks',
        songs: [] 
      }));
    } finally {
      setState(prev => ({ ...prev, isLoadingSongs: false }));
    }
  };

  const searchTracks = useCallback(async (query: string) => {
    if (!query.trim()) {
      loadUserTopTracks();
      return;
    }

    setState(prev => ({ ...prev, isLoadingSongs: true, error: null, searchQuery: query }));
    try {
      const tracks = await spotifyApi.searchTracks(query, 50);
      setState(prev => ({ ...prev, songs: tracks }));
    } catch (error) {
      console.error('Error searching tracks:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to search tracks',
        songs: [] 
      }));
    } finally {
      setState(prev => ({ ...prev, isLoadingSongs: false }));
    }
  }, []);

  const clearSearch = useCallback(() => {
    setState(prev => ({ ...prev, searchQuery: '' }));
    loadUserTopTracks();
  }, []);

  const setEnergyFilter = useCallback((filter: string) => {
    setState(prev => ({ ...prev, energyFilter: filter }));
  }, []);

  const shuffleSongs = useCallback(() => {
    setState(prev => ({
      ...prev,
      songs: [...prev.songs].sort(() => Math.random() - 0.5)
    }));
  }, []);

  const handleAuthComplete = useCallback((success: boolean) => {
    if (success) {
      setState(prev => ({ ...prev, isAuthenticated: true }));
      loadUserData();
      loadUserTopTracks();
    } else {
      setState(prev => ({ ...prev, isAuthenticated: false, error: 'Authentication failed' }));
    }
  }, []);

  const handleLogout = useCallback(() => {
    spotifyAuth.logout();
    setState({
      isAuthenticated: false,
      user: null,
      songs: [],
      filteredSongs: [],
      energyFilter: 'all',
      searchQuery: '',
      isInitialLoading: false,
      isLoadingSongs: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    searchTracks,
    clearSearch,
    setEnergyFilter,
    shuffleSongs,
    handleAuthComplete,
    handleLogout,
    clearError,
    refreshTopTracks: loadUserTopTracks,
  };
};