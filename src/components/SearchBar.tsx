/**
 * Search Bar Component
 * 
 * Allows users to search for tracks using the Spotify API
 */

import React, { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onClear,
  isLoading = false,
  placeholder = "Search for songs, artists, or albums..."
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  }, [query, onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    onClear();
  }, [onClear]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="w-full bg-card-bg border border-gray-600 rounded-full py-4 pl-12 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-spotify-green focus:ring-2 focus:ring-spotify-green/20 transition-all duration-200 disabled:opacity-50"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {isLoading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </form>
    </div>
  );
};