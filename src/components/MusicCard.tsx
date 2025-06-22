import React from "react";
import { Play, Pause, AlertCircle } from "lucide-react";
import type { Song } from "../types/music";

interface MusicCardProps {
  song: Song;
  isPlaying: boolean;
  isCurrentSong: boolean;
  onPlay: (song: Song) => void;
  className?: string;
}

export const MusicCard: React.FC<MusicCardProps> = ({
  song,
  isPlaying,
  isCurrentSong,
  onPlay,
  className = "",
}) => {
  const getEnergyStyles = () => {
    switch (song.energy) {
      case "high":
        return "border-red-400 shadow-red-400/20";
      case "medium":
        return "border-yellow-400 shadow-yellow-400/20";
      case "low":
        return "border-blue-400 shadow-blue-400/20";
      default:
        return "border-gray-400 shadow-gray-400/20";
    }
  };

  const handleClick = () => {
    onPlay(song);
  };

  const hasPreview = song.previewUrl && song.previewUrl.trim() !== "";

  return (
    <div
      className={`
        group relative bg-gradient-to-br from-gray-900 to-gray-800 
        rounded-xl overflow-hidden cursor-pointer transition-all duration-300
        hover:scale-105 hover:shadow-2xl border-2 ${getEnergyStyles()}
        ${isCurrentSong && isPlaying ? "animate-pulse-slow" : ""}
        ${!hasPreview ? "opacity-75" : ""}
        ${className}
      `}
      onClick={handleClick}
      style={{
        boxShadow: isCurrentSong ? `0 0 30px ${song.color}40` : undefined,
      }}
    >
      {/* Album Art */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={song.albumArt}
          alt={`${song.album} by ${song.artist}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Play/Pause Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className={`rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300 ${
            hasPreview ? "bg-spotify-green" : "bg-gray-600"
          }`}>
            {!hasPreview ? (
              <AlertCircle className="w-8 h-8 text-white" />
            ) : isCurrentSong && isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </div>
        </div>

        {/* Energy Indicator */}
        <div className="absolute top-3 right-3">
          <div
            className={`
            w-3 h-3 rounded-full
            ${song.energy === "high" ? "bg-red-400" : ""}
            ${song.energy === "medium" ? "bg-yellow-400" : ""}
            ${song.energy === "low" ? "bg-blue-400" : ""}
            ${isCurrentSong && isPlaying ? "animate-bounce-gentle" : ""}
          `}
          />
        </div>

        {/* No Preview Indicator */}
        {!hasPreview && (
          <div className="absolute top-3 left-3">
            <div className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
              No Preview
            </div>
          </div>
        )}
      </div>

      {/* Song Info */}
      <div className="p-4 space-y-2">
        <h3 className="text-white font-semibold text-lg truncate group-hover:text-spotify-green transition-colors">
          {song.title}
        </h3>
        <p className="text-gray-400 text-sm truncate">{song.artist}</p>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span className="bg-gray-700 px-2 py-1 rounded-full">
            {song.genre}
          </span>
          <span>
            {Math.floor(song.duration / 60)}:
            {(song.duration % 60).toString().padStart(2, "0")}
          </span>
        </div>
        {!hasPreview && (
          <p className="text-xs text-gray-500 italic">
            Preview not available
          </p>
        )}
      </div>

      {/* Playing Indicator */}
      {isCurrentSong && isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-spotify-green animate-pulse" />
      )}
    </div>
  );
};