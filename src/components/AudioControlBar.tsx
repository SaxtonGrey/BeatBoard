import React from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import type { PlaybackState, Song } from "../types/music";

interface AudioControlBarProps {
  playbackState: PlaybackState;
  onPlay: (song: Song) => void;
  onPause: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
}

export const AudioControlBar: React.FC<AudioControlBarProps> = ({
  playbackState,
  onPlay,
  onPause,
  onVolumeChange,
  onSeek,
}) => {
  const { isPlaying, currentSong, currentTime, volume } = playbackState;

  if (!currentSong) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage = (currentTime / currentSong.duration) * 100;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * currentSong.duration;
    onSeek(newTime);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-900 to-black border-t border-gray-700 p-4 animate-fade-in">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        {/* Song Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img
            src={currentSong.albumArt}
            alt={currentSong.album}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="min-w-0">
            <h4 className="text-white font-medium truncate">
              {currentSong.title}
            </h4>
            <p className="text-gray-400 text-sm truncate">
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex flex-col items-center gap-2 flex-2">
          <div className="flex items-center gap-4">
            <button
              onClick={isPlaying ? onPause : () => onPlay(currentSong)}
              className="bg-spotify-green hover:bg-green-400 rounded-full p-2 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-black" />
              ) : (
                <Play className="w-5 h-5 text-black ml-0.5" />
              )}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2 w-full max-w-md">
            <span className="text-xs text-gray-400 min-w-[35px]">
              {formatTime(currentTime)}
            </span>
            <div
              className="flex-1 h-1 bg-gray-600 rounded-full cursor-pointer group"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-spotify-green rounded-full relative group-hover:bg-green-400 transition-colors"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="text-xs text-gray-400 min-w-[35px]">
              {formatTime(currentSong.duration)}
            </span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
          <button
            onClick={() => onVolumeChange(volume > 0 ? 0 : 0.7)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {volume > 0 ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-20 accent-spotify-green"
          />
        </div>
      </div>
    </div>
  );
};
