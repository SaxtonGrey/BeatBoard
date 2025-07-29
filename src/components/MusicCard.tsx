import React from "react";
import { Play, Pause, AlertCircle, ExternalLink } from "lucide-react";
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

  const handleSpotifyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (song.spotifyUrl) {
      window.open(song.spotifyUrl, "_blank");
    }
  };

  return (
    <div
      className={`
        group relative bg-gradient-to-br from-card-bg to-gray-800 
        rounded-2xl overflow-hidden cursor-pointer transition-all duration-300
        hover:scale-[1.02] border ${getEnergyStyles()}
        ${isCurrentSong && isPlaying ? "animate-pulse-slow" : ""}
        backdrop-blur-sm
        ${className}
      `}
      onClick={handleClick}
      style={{
        boxShadow: isCurrentSong
          ? `0 0 40px ${song.color}30`
          : "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      {/* Album Art */}
      <div className="relative aspect-square overflow-hidden rounded-t-2xl">
        <img
          src={song.albumArt}
          alt={`${song.album} by ${song.artist}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Play/Pause Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
          <div
            className={`rounded-full p-4 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-2xl 
              bg-spotify-green hover:bg-green-400`}
          >
            {isCurrentSong && isPlaying ? (
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
            w-3 h-3 rounded-full shadow-lg border-2 border-white/20
            ${song.energy === "high" ? "bg-red-400" : ""}
            ${song.energy === "medium" ? "bg-yellow-400" : ""}
            ${song.energy === "low" ? "bg-blue-400" : ""}
            ${isCurrentSong && isPlaying ? "animate-bounce-gentle" : ""}
          `}
          />
        </div>

        {/* No Preview Indicator */}

        {/* Spotify Link Button */}
        {song.spotifyUrl && (
          <button
            onClick={handleSpotifyLink}
            className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm hover:bg-spotify-green/90 text-white hover:text-black p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
            title="Open in Spotify"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Song Info */}
      <div className="p-5 space-y-3">
        <h3 className="text-white font-bold text-lg truncate group-hover:text-spotify-green transition-colors leading-tight">
          {song.title}
        </h3>
        <p className="text-gray-400 text-base truncate font-medium">
          {song.artist}
        </p>
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span className="bg-gray-700/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
            {song.genre}
          </span>
          <span className="font-mono text-xs">
            {Math.floor(song.duration / 60)}:
            {(song.duration % 60).toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Playing Indicator */}
      {isCurrentSong && isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-spotify-green to-green-400 animate-pulse shadow-lg" />
      )}
    </div>
  );
};
