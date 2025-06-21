import { useState, useRef, useEffect } from "react";
import type { Song, PlaybackState } from "../types/music";

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentSong: null,
    currentTime: 0,
    volume: 0.7,
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setPlaybackState((prev) => ({
        ...prev,
        currentTime: audio.currentTime,
      }));
    };

    const handleEnded = () => {
      setPlaybackState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
      }));
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [playbackState.currentSong]);

  const playSong = (song: Song) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    if (playbackState.currentSong?.id === song.id) {
      if (playbackState.isPlaying) {
        audio.pause();
        setPlaybackState((prev) => ({ ...prev, isPlaying: false }));
      } else {
        audio.play();
        setPlaybackState((prev) => ({ ...prev, isPlaying: true }));
      }
    } else {
      audio.src = song.previewUrl || "";
      audio.volume = playbackState.volume;
      audio.play();
      setPlaybackState((prev) => ({
        ...prev,
        currentSong: song,
        isPlaying: true,
        currentTime: 0,
      }));
    }
  };

  const pauseSong = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaybackState((prev) => ({ ...prev, isPlaying: false }));
    }
  };

  const setVolume = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    setPlaybackState((prev) => ({ ...prev, volume }));
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setPlaybackState((prev) => ({ ...prev, currentTime: time }));
    }
  };

  return {
    playbackState,
    playSong,
    pauseSong,
    setVolume,
    seekTo,
  };
};
