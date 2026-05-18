"use client";

import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlayerSkipBackFilled,
  IconPlayerSkipForwardFilled,
  IconVolume,
  IconVolumeOff,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDeck } from "./deck-context";
import { formatDuration } from "@/lib/format";

const TrackBadge = () => {
  const { currentTrack } = useDeck();
  if (!currentTrack) return <div className="w-1/3" />;

  return (
    <div className="flex w-1/3 items-center gap-3">
      <div className="size-10 shrink-0 overflow-hidden rounded-sm bg-muted">
        {currentTrack.artworkUrl ? (
          <img
            src={currentTrack.artworkUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="min-w-0">
        <div className="max-w-[160px] truncate text-sm font-medium text-foreground sm:max-w-[240px]">
          {currentTrack.title}
        </div>
        <div className="max-w-[160px] truncate text-xs text-muted-foreground sm:max-w-[240px]">
          {currentTrack.artist}
        </div>
      </div>
    </div>
  );
};

const TransportButtons = () => {
  const {
    isPlaying,
    togglePlayPause,
    playPreviousTrack,
    playNextTrack,
    currentTrack,
  } = useDeck();

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={playPreviousTrack}
        disabled={!currentTrack}
        aria-label="Previous track"
        className="hover:bg-foreground/10 rounded-full"
      >
        <IconPlayerSkipBackFilled />
      </Button>
      <Button
        onClick={togglePlayPause}
        disabled={!currentTrack}
        aria-label={isPlaying ? "Pause" : "Play"}
        size={"icon-lg"}
        className="rounded-full border-rose bg-rose text-white shadow-rose/30 hover:bg-rose/90 data-pressed:bg-rose/90"
      >
        {isPlaying ? <IconPlayerPauseFilled /> : <IconPlayerPlayFilled />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={playNextTrack}
        disabled={!currentTrack}
        aria-label="Next track"
        className="hover:bg-foreground/10 rounded-full"
      >
        <IconPlayerSkipForwardFilled />
      </Button>
    </div>
  );
};

const ScrubBar = () => {
  const { currentTime, duration, audioRef, setCurrentTime } = useDeck();
  const barRef = useRef<HTMLDivElement>(null);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = barRef.current;
    if (!audio || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const next = pct * duration;
    audio.currentTime = next;
    setCurrentTime(next);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mt-1.5 flex w-full items-center gap-2">
      <span className="w-10 text-right text-[10px] tabular-nums text-muted-foreground">
        {formatDuration(currentTime)}
      </span>
      <div
        ref={barRef}
        onClick={seek}
        className="group/scrub relative h-1 flex-grow cursor-pointer rounded-full bg-white/10"
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-rose"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="w-10 text-[10px] tabular-nums text-muted-foreground">
        {formatDuration(duration)}
      </span>
    </div>
  );
};

const VolumeKnob = () => {
  const { audioRef, currentTrack } = useDeck();
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [open, setOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume / 100;
    }
  }, [audioRef, muted, volume]);

  const adjust = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.max(
      0,
      Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
    );
    setVolume(pct);
    setMuted(pct === 0);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={!currentTrack}
        onClick={() => {
          setMuted((m) => !m);
          setOpen((o) => !o);
        }}
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <IconVolumeOff /> : <IconVolume />}
      </Button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 rounded-md border border-border bg-popover p-2 shadow-lg">
          <div
            ref={barRef}
            onClick={adjust}
            className="relative h-1 w-20 cursor-pointer rounded-full bg-muted"
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-foreground"
              style={{ width: `${volume}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const TransportBar = () => {
  const {
    currentTrack,
    audioRef,
    setCurrentTime,
    setDuration,
    playPreviousTrack,
    playNextTrack,
    togglePlayPause,
  } = useDeck();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const tick = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    audio.addEventListener("timeupdate", tick);
    audio.addEventListener("loadedmetadata", onLoaded);
    return () => {
      audio.removeEventListener("timeupdate", tick);
      audio.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [audioRef, setCurrentTime, setDuration]);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentTrack) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album ?? undefined,
      artwork: currentTrack.artworkUrl
        ? [{ src: currentTrack.artworkUrl, sizes: "512x512" }]
        : undefined,
    });
    navigator.mediaSession.setActionHandler("play", togglePlayPause);
    navigator.mediaSession.setActionHandler("pause", togglePlayPause);
    navigator.mediaSession.setActionHandler("previoustrack", playPreviousTrack);
    navigator.mediaSession.setActionHandler("nexttrack", playNextTrack);
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (audioRef.current && details.seekTime !== undefined) {
        audioRef.current.currentTime = details.seekTime;
        setCurrentTime(details.seekTime);
      }
    });
    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("seekto", null);
    };
  }, [
    currentTrack,
    togglePlayPause,
    playPreviousTrack,
    playNextTrack,
    setCurrentTime,
    audioRef,
  ]);

  return (
    <div className="flex h-[calc(5rem+env(safe-area-inset-bottom))] items-center justify-between bg-black px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]">
      <audio ref={audioRef} />
      <TrackBadge />
      <div className="flex w-full max-w-md flex-col items-center">
        <TransportButtons />
        <ScrubBar />
      </div>
      <div className="flex w-1/3 items-center justify-end gap-2">
        <VolumeKnob />
      </div>
    </div>
  );
};
