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

    const handleError = (e: Event) => {
      console.error("Audio playback error:", e);
      setPlaybackState((prev) => ({
        ...prev,
        isPlaying: false,
      }));
    };

    const handleLoadStart = () => {
      console.log("Audio loading started");
    };

    const handleCanPlay = () => {
      console.log("Audio can start playing");
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [playbackState.currentSong]);

  const playSong = (song: Song) => {
    // Check if the song has a valid preview URL
    if (!song.previewUrl || song.previewUrl.trim() === "") {
      console.warn(`No preview URL available for "${song.title}" by ${song.artist}`);
      alert(`Sorry, no preview is available for "${song.title}" by ${song.artist}`);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    if (playbackState.currentSong?.id === song.id) {
      if (playbackState.isPlaying) {
        audio.pause();
        setPlaybackState((prev) => ({ ...prev, isPlaying: false }));
      } else {
        // Validate the source before playing
        if (audio.src && audio.src !== song.previewUrl) {
          audio.src = song.previewUrl;
        }
        
        audio.play().catch((error) => {
          console.error("Error playing audio:", error);
          alert(`Unable to play "${song.title}". The preview may not be available.`);
          setPlaybackState((prev) => ({ ...prev, isPlaying: false }));
        });
        
        setPlaybackState((prev) => ({ ...prev, isPlaying: true }));
      }
    } else {
      // New song - set source and play
      audio.src = song.previewUrl;
      audio.volume = playbackState.volume;
      
      audio.play().catch((error) => {
        console.error("Error playing new song:", error);
        alert(`Unable to play "${song.title}". The preview may not be available.`);
        setPlaybackState((prev) => ({ 
          ...prev, 
          currentSong: song,
          isPlaying: false,
          currentTime: 0,
        }));
        return;
      });

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
    if (audioRef.current && audioRef.current.duration) {
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