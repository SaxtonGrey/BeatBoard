import React from 'react';
import { Music, Shuffle, Filter } from 'lucide-react';

interface HeaderProps {
  onShuffle: () => void;
  onFilterChange: (filter: string) => void;
  currentFilter: string;
}

export const Header: React.FC<HeaderProps> = ({
  onShuffle,
  onFilterChange,
  currentFilter
}) => {
  const filters = ['all', 'high', 'medium', 'low'];
  
  return (
    <header className="bg-gradient-to-r from-spotify-black to-spotify-dark border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-spotify-green p-2 rounded-full">
              <Music className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Music Gallery
              </h1>
              <p className="text-gray-400 text-sm">
                Discover your vibe through sound
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Energy Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={currentFilter}
                onChange={(e) => onFilterChange(e.target.value)}
                className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-spotify-green"
              >
                <option value="all">All Energy</option>
                <option value="high">High Energy</option>
                <option value="medium">Medium Energy</option>
                <option value="low">Low Energy</option>
              </select>
            </div>

            {/* Shuffle Button */}
            <button
              onClick={onShuffle}
              className="flex items-center gap-2 bg-spotify-green hover:bg-green-400 text-black px-4 py-2 rounded-full font-medium transition-colors"
            >
              <Shuffle className="w-4 h-4" />
              Shuffle
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};