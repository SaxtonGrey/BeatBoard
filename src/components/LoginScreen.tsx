/**
 * Login Screen Component
 * 
 * This component displays the login interface and handles Spotify authentication.
 * It includes helpful setup instructions for developers.
 */

import React, { useState } from 'react';
import { Music, ExternalLink, Settings, AlertCircle } from 'lucide-react';
import { spotifyAuth } from '../services/spotifyAuth';
import { validateSpotifyConfig } from '../config/spotify';

export const LoginScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSetupHelp, setShowSetupHelp] = useState(false);
  
  const isConfigValid = validateSpotifyConfig();

  const handleLogin = async () => {
    if (!isConfigValid) {
      setShowSetupHelp(true);
      return;
    }

    setIsLoading(true);
    try {
      await spotifyAuth.initiateAuth();
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        {/* Main Login Card */}
        <div className="bg-card-bg border border-gray-700 rounded-2xl p-8 text-center shadow-2xl">
          <div className="mb-8">
            <div className="bg-spotify-green p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Music className="w-10 h-10 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Music Gallery
            </h1>
            <p className="text-gray-400">
              Connect with Spotify to discover your music
            </p>
          </div>

          {!isConfigValid && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Setup Required</span>
              </div>
              <p className="text-sm text-red-300">
                Spotify API credentials are missing. Please check your .env file.
              </p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading || !isConfigValid}
            className="w-full bg-spotify-green hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold py-4 px-6 rounded-full transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="w-5 h-5" />
                Connect with Spotify
              </>
            )}
          </button>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <button
              onClick={() => setShowSetupHelp(!showSetupHelp)}
              className="text-gray-400 hover:text-white text-sm flex items-center gap-2 mx-auto transition-colors"
            >
              <Settings className="w-4 h-4" />
              Developer Setup Help
            </button>
          </div>
        </div>

        {/* Setup Help Card */}
        {showSetupHelp && (
          <div className="mt-4 bg-card-bg border border-gray-700 rounded-2xl p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-white mb-4">Setup Instructions</h3>
            
            <div className="space-y-4 text-sm text-gray-300">
              <div>
                <h4 className="font-medium text-white mb-2">1. Create Spotify App</h4>
                <p>Visit the <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-spotify-green hover:underline">Spotify Developer Dashboard</a> and create a new app.</p>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">2. Configure Redirect URI</h4>
                <p>Add <code className="bg-gray-800 px-2 py-1 rounded">http://localhost:5173/callback</code> to your app's redirect URIs.</p>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">3. Update Environment Variables</h4>
                <p>Copy your Client ID and Client Secret to the <code className="bg-gray-800 px-2 py-1 rounded">.env</code> file:</p>
                <div className="mt-2 bg-gray-800 p-3 rounded text-xs font-mono">
                  <div>VITE_SPOTIFY_CLIENT_ID=your_client_id</div>
                  <div>VITE_SPOTIFY_CLIENT_SECRET=your_client_secret</div>
                  <div>VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">4. Restart Development Server</h4>
                <p>After updating the .env file, restart your development server for changes to take effect.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};