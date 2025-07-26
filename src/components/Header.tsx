import React from 'react';
import { Music, Shuffle, Filter, LogOut, User } from 'lucide-react';
import type { User as UserType } from '../types/music';

interface HeaderProps {
  user?: UserType;
  onShuffle: () => void;
  onFilterChange: (filter: string) => void;
  currentFilter: string;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onShuffle,
  onFilterChange,
  currentFilter,
  onLogout
}) => {
  const filters = ['all', 'high', 'medium', 'low'];
  
  return (
    <header className="bg-gradient-to-r from-spotify-black to-card-bg border-b border-gray-700 sticky top-0 z-10 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-spotify-green p-3 rounded-full shadow-lg">
              <Music className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Music Gallery
              </h1>
              <p className="text-gray-400 text-sm">
                {user ? `Welcome back, ${user.displayName}` : 'Discover your vibe through sound'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User Profile */}
            {user && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-800/50 rounded-full px-3 py-2">
                  {user.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.displayName}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="text-sm text-white font-medium">
                    {user.displayName}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all duration-200"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Energy Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={currentFilter}
                onChange={(e) => onFilterChange(e.target.value)}
                className="bg-gray-800/80 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-spotify-green focus:ring-2 focus:ring-spotify-green/20 transition-all duration-200"
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
              className="flex items-center gap-2 bg-spotify-green hover:bg-green-400 text-black px-6 py-2 rounded-full font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-spotify-green/25"
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