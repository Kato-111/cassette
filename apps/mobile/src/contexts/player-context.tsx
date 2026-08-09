import Constants, { AppOwnership } from "expo-constants";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
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

type PlayerActionsContextValue = {
  playTrack: (track: Track, context?: Track[]) => void;
};

type PlayerStateContextValue = {
  currentTrack: Track | null;
  playing: boolean;
  buffering: boolean;
  currentTime: number;
  duration: number;
  hasPrevious: boolean;
  hasNext: boolean;
  toggle: () => void;
  previous: () => Promise<void>;
  next: () => void;
  seek: (seconds: number) => Promise<void>;
};

const PlayerActionsContext = createContext<PlayerActionsContextValue | null>(null);
const PlayerStateContext = createContext<PlayerStateContextValue | null>(null);
const supportsNativeMediaSession = Constants.appOwnership !== AppOwnership.Expo;

export function PlayerProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [orderLength, setOrderLength] = useState(0);
  const orderRef = useRef<Track[]>([]);
  const indexRef = useRef(-1);
  const advancingRef = useRef(false);
  const lockScreenActiveRef = useRef(false);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    });
  }, []);

  useEffect(() => {
    return () => {
      player.clearLockScreenControls();
      lockScreenActiveRef.current = false;
    };
  }, [player]);

  const activate = useCallback(
    (track: Track, index: number) => {
      indexRef.current = index;
      setCurrentIndex(index);
      setCurrentTrack(track);
      player.replace({ uri: api.streamUrl(track.storageKey) });

      const metadata = {
        title: track.title,
        artist: track.artist,
        albumTitle: track.album ?? undefined,
        artworkUrl: track.artworkUrl ?? undefined,
      };

      if (!supportsNativeMediaSession) {
        player.play();
        return;
      }

      if (lockScreenActiveRef.current) {
        player.updateLockScreenMetadata(metadata);
      } else {
        player.setActiveForLockScreen(true, metadata, {
          showSeekBackward: true,
          showSeekForward: true,
        });
        lockScreenActiveRef.current = true;
      }

      player.play();
    },
    [player],
  );

  const playTrack = useCallback(
    (track: Track, context: Track[] = []) => {
      const order = context.some((item) => item.id === track.id) ? context : [track];
      const index = Math.max(
        order.findIndex((item) => item.id === track.id),
        0,
      );
      orderRef.current = order;
      setOrderLength(order.length);
      activate(track, index);
    },
    [activate],
  );

  const next = useCallback(() => {
    const nextIndex = indexRef.current + 1;
    const nextTrack = orderRef.current[nextIndex];
    if (!nextTrack) {
      player.pause();
      return;
    }
    activate(nextTrack, nextIndex);
  }, [activate, player]);

  const previous = useCallback(async () => {
    if (status.currentTime > 3 || indexRef.current <= 0) {
      await player.seekTo(0);
      return;
    }
    const previousIndex = indexRef.current - 1;
    activate(orderRef.current[previousIndex], previousIndex);
  }, [activate, player, status.currentTime]);

  useEffect(() => {
    if (!status.didJustFinish || advancingRef.current) return;
    advancingRef.current = true;
    next();
    advancingRef.current = false;
  }, [next, status.didJustFinish]);

  const actions = useMemo<PlayerActionsContextValue>(() => ({ playTrack }), [playTrack]);
  const state = useMemo<PlayerStateContextValue>(
    () => ({
      currentTrack,
      playing: status.playing,
      buffering: status.isBuffering,
      currentTime: status.currentTime,
      duration: status.duration || currentTrack?.durationSec || 0,
      hasPrevious: currentTrack !== null,
      hasNext: currentIndex >= 0 && currentIndex < orderLength - 1,
      toggle: () => {
        if (status.playing) player.pause();
        else if (status.duration > 0 && status.currentTime >= status.duration) {
          void player.seekTo(0).then(() => player.play());
        } else player.play();
      },
      previous,
      next,
      seek: (seconds) => player.seekTo(seconds),
    }),
    [currentIndex, currentTrack, next, orderLength, player, previous, status],
  );

  return (
    <PlayerActionsContext.Provider value={actions}>
      <PlayerStateContext.Provider value={state}>{children}</PlayerStateContext.Provider>
    </PlayerActionsContext.Provider>
  );
}

export function usePlayerActions() {
  const context = useContext(PlayerActionsContext);
  if (!context) throw new Error("usePlayerActions must be used inside PlayerProvider");
  return context;
}

export function usePlayerState() {
  const context = useContext(PlayerStateContext);
  if (!context) throw new Error("usePlayerState must be used inside PlayerProvider");
  return context;
}
