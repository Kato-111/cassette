import {
  requestNotificationPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import * as Haptics from "expo-haptics";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api } from "@/lib/api";
import type { Track } from "@/lib/types";

type PlayerContextValue = {
  currentTrack: Track | null;
  queue: Track[];
  playing: boolean;
  buffering: boolean;
  currentTime: number;
  duration: number;
  playTrack: (track: Track, context?: Track[]) => Promise<void>;
  toggle: () => void;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seek: (seconds: number) => Promise<void>;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const finishingRef = useRef(false);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    });
  }, []);

  const activate = useCallback(
    async (track: Track) => {
      setCurrentTrack(track);
      player.replace({ uri: api.streamUrl(track.storageKey) });
      player.setActiveForLockScreen(true, {
        title: track.title,
        artist: track.artist,
        albumTitle: track.album ?? undefined,
        artworkUrl: track.artworkUrl ?? undefined,
      });
      await requestNotificationPermissionsAsync().catch(() => undefined);
      player.play();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [player],
  );

  const playTrack = useCallback(
    async (track: Track, context: Track[] = []) => {
      const index = context.findIndex((item) => item.id === track.id);
      setQueue(index >= 0 ? context.slice(index + 1) : []);
      await activate(track);
    },
    [activate],
  );

  const next = useCallback(async () => {
    const [track, ...rest] = queue;
    if (!track) {
      player.pause();
      return;
    }
    setQueue(rest);
    await activate(track);
  }, [activate, player, queue]);

  const previous = useCallback(async () => {
    if (status.currentTime > 4) {
      await player.seekTo(0);
      return;
    }
    await player.seekTo(0);
  }, [player, status.currentTime]);

  useEffect(() => {
    if (!status.didJustFinish || finishingRef.current) return;
    finishingRef.current = true;
    void next().finally(() => {
      finishingRef.current = false;
    });
  }, [next, status.didJustFinish]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      currentTrack,
      queue,
      playing: status.playing,
      buffering: status.isBuffering,
      currentTime: status.currentTime,
      duration: status.duration || currentTrack?.durationSec || 0,
      playTrack,
      toggle: () => (status.playing ? player.pause() : player.play()),
      next,
      previous,
      seek: (seconds) => player.seekTo(seconds),
    }),
    [currentTrack, next, playTrack, player, previous, queue, status],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used inside PlayerProvider");
  return context;
};
