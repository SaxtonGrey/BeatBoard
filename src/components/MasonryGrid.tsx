import React from "react";
import type { Song } from "../types/music";
import { MusicCard } from "./MusicCard";

interface MasonryGridProps {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onSongPlay: (song: Song) => void;
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({
  songs,
  currentSong,
  isPlaying,
  onSongPlay,
}) => {
  // Group songs by energy for better visual distribution
  const groupedSongs = songs.reduce((acc, song) => {
    if (!acc[song.energy]) {
      acc[song.energy] = [];
    }
    acc[song.energy].push(song);
    return acc;
  }, {} as Record<string, Song[]>);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {songs.map((song, index) => (
          <div
            key={song.id}
            className="break-inside-avoid animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <MusicCard
              song={song}
              isPlaying={isPlaying}
              isCurrentSong={currentSong?.id === song.id}
              onPlay={onSongPlay}
              className="mb-6"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
