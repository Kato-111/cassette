"use client";

import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlayerSkipBackFilled,
  IconPlayerSkipForwardFilled,
  IconVolume,
  IconVolumeOff,
} from "@tabler/icons-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ShuffleButton } from "@/app/_components/shuffle-button";
import { Button } from "@/components/ui/button";
import { SliderPrimitive } from "@/components/ui/slider";
import { FavoriteButton } from "@/app/_components/favorite-button";
import {
  audioRef,
  useCurrentTime,
  useCurrentTrack,
  useDuration,
  useIsPlaying,
  usePlayNextTrack,
  usePlayPreviousTrack,
  useSetAudioElement,
  useSetCurrentTime,
  useTogglePlayPause,
} from "@/contexts/deck-context";
import { formatDuration } from "@/lib/format";
import { NowPlayingDrawer } from "./now-playing-drawer";

const TrackBadge = () => {
  const currentTrack = useCurrentTrack();
  if (!currentTrack) return <div className="w-1/3" />;

  return (
    <div className="flex w-1/3 items-center gap-3">
      <div className="size-10 shrink-0 overflow-hidden rounded-sm bg-muted">
        {currentTrack.artworkUrl ? (
          <Image
            src={currentTrack.artworkUrl}
            alt=""
            width={40}
            height={40}
            unoptimized
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

export const TransportButtons = () => {
  const isPlaying = useIsPlaying();
  const currentTrack = useCurrentTrack();
  const togglePlayPause = useTogglePlayPause();
  const playPreviousTrack = usePlayPreviousTrack();
  const playNextTrack = usePlayNextTrack();

  return (
    <div className="flex items-center gap-3">
      <ShuffleButton
        size="icon"
        className="hover:bg-foreground/10 rounded-full"
      />
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

const EMPTY_TIME = "--:--";

const MOBILE_TRANSPORT_HEIGHT = "calc(5rem + env(safe-area-inset-bottom))";

export const ScrubBar = () => {
  const currentTrack = useCurrentTrack();
  const currentTime = useCurrentTime();
  const duration = useDuration();
  const setCurrentTime = useSetCurrentTime();
  const [scrubValue, setScrubValue] = useState<number | null>(null);
  const hasTrack = Boolean(currentTrack);
  const seekable = hasTrack && duration > 0;
  const max = duration > 0 ? duration : 1;
  const displayTime = Math.min(scrubValue ?? currentTime, max);

  return (
    <div className="group/scrub mt-1.5 flex w-full items-center gap-2">
      <span className="w-10 text-right text-[10px] tabular-nums text-muted-foreground">
        {hasTrack ? formatDuration(displayTime) : EMPTY_TIME}
      </span>
      <SliderPrimitive.Root
        className="relative flex flex-1 touch-none select-none items-center"
        value={[displayTime]}
        min={0}
        max={max}
        step={0.1}
        onValueChange={(values) => {
          const next = Array.isArray(values) ? values[0] : (values as number);
          setScrubValue(next);
        }}
        onValueCommitted={(values) => {
          const next = Array.isArray(values) ? values[0] : (values as number);
          const audio = audioRef.current;
          if (audio && Number.isFinite(next)) {
            audio.currentTime = next;
            setCurrentTime(next);
          }
          setScrubValue(null);
        }}
        thumbAlignment="edge"
        disabled={!seekable}
        aria-label="Seek"
      >
        <SliderPrimitive.Control className="flex h-3 w-full cursor-pointer items-center data-disabled:pointer-events-none data-disabled:opacity-40">
          <SliderPrimitive.Track className="relative h-1 w-full rounded-full bg-white/10">
            <SliderPrimitive.Indicator className="rounded-full bg-rose" />
            <SliderPrimitive.Thumb
              index={0}
              className="block size-3 rounded-full bg-white opacity-0 shadow-sm shadow-rose/40 outline-none transition-opacity group-hover/scrub:opacity-100 focus-visible:opacity-100 data-dragging:opacity-100"
            />
          </SliderPrimitive.Track>
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>
      <span className="w-10 text-[10px] tabular-nums text-muted-foreground">
        {hasTrack ? formatDuration(duration) : EMPTY_TIME}
      </span>
    </div>
  );
};

const VolumeKnob = () => {
  const currentTrack = useCurrentTrack();
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!audioRef.current) return;
    const v = muted ? 0 : volume / 100;
    if (Number.isFinite(v)) audioRef.current.volume = v;
  }, [audioRef, muted, volume]);

  return (
    <div className="flex w-32 items-center gap-2">
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={!currentTrack}
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute" : "Mute"}
        className="shrink-0"
      >
        {muted || volume === 0 ? (
          <IconVolumeOff size={18} />
        ) : (
          <IconVolume size={18} />
        )}
      </Button>
      <SliderPrimitive.Root
        className="relative flex flex-1 touch-none select-none items-center"
        value={[muted ? 0 : volume]}
        min={0}
        max={100}
        onValueChange={(values) => {
          const value = values as unknown as number;
          setVolume(value);
          setMuted(value === 0);
        }}
        thumbAlignment="edge"
        disabled={!currentTrack}
        aria-label="Volume"
      >
        <SliderPrimitive.Control className="flex h-5 w-full cursor-pointer items-center data-disabled:pointer-events-none data-disabled:opacity-40">
          <SliderPrimitive.Track className="relative h-1 w-full rounded-full transition-colors  bg-white/30">
            <SliderPrimitive.Indicator className="rounded-full bg-rose" />
            <SliderPrimitive.Thumb
              index={0}
              className="block size-3 rounded-full bg-white shadow-sm shadow-rose/40 outline-none transition-opacity focus-visible:opacity-100"
            />
          </SliderPrimitive.Track>
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>
    </div>
  );
};

const MobileProgressIndicator = () => {
  const currentTrack = useCurrentTrack();
  const currentTime = useCurrentTime();
  const duration = useDuration();
  const pct =
    currentTrack && duration > 0
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0;

  return (
    <div className="absolute inset-x-0 top-0 h-0.5 bg-white/10 md:hidden">
      <div
        className="h-full bg-rose transition-[width] duration-100 ease-linear"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

const DesktopFavoriteButton = () => {
  const currentTrack = useCurrentTrack();
  return (
    <FavoriteButton
      trackId={currentTrack?.id ?? ""}
      isFavorite={currentTrack?.isFavorite ?? false}
      disabled={!currentTrack}
    />
  );
};

const MobileTrackRow = () => {
  const currentTrack = useCurrentTrack();
  const isPlaying = useIsPlaying();
  const togglePlayPause = useTogglePlayPause();

  return (
    <>
      <NowPlayingDrawer>
        <div className="size-10 shrink-0 overflow-hidden rounded-sm bg-muted">
          {currentTrack?.artworkUrl ? (
            <Image
              src={currentTrack.artworkUrl}
              alt=""
              width={40}
              height={40}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">
            {currentTrack?.title ?? ""}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {currentTrack?.artist ?? ""}
          </div>
        </div>
      </NowPlayingDrawer>
      <FavoriteButton
        trackId={currentTrack?.id ?? ""}
        isFavorite={currentTrack?.isFavorite ?? false}
        disabled={!currentTrack}
      />
      <Button
        onClick={togglePlayPause}
        disabled={!currentTrack}
        aria-label={isPlaying ? "Pause" : "Play"}
        size="icon"
        className="shrink-0 rounded-full border-rose bg-rose text-white shadow-rose/30 hover:bg-rose/90 data-pressed:bg-rose/90"
      >
        {isPlaying ? <IconPlayerPauseFilled /> : <IconPlayerPlayFilled />}
      </Button>
    </>
  );
};

export const TransportBar = () => {
  const currentTrack = useCurrentTrack();
  const currentTime = useCurrentTime();
  const duration = useDuration();
  const setAudioElement = useSetAudioElement();
  const setCurrentTime = useSetCurrentTime();
  const playPreviousTrack = usePlayPreviousTrack();
  const playNextTrack = usePlayNextTrack();
  const togglePlayPause = useTogglePlayPause();

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
    navigator.mediaSession.setActionHandler("play", () => {
      const audio = audioRef.current;
      if (audio?.paused) togglePlayPause();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) togglePlayPause();
    });
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

  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentTrack || duration <= 0)
      return;
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: audioRef.current?.playbackRate ?? 1,
      position: Math.min(currentTime, duration),
    });
  }, [currentTrack, currentTime, duration, audioRef]);

  return (
    <>
      <audio ref={setAudioElement} />

      {currentTrack ? (
        <>
          <div
            aria-hidden
            className="shrink-0 md:hidden"
            style={{ height: MOBILE_TRANSPORT_HEIGHT }}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 bg-black shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] md:hidden"
            style={{ height: MOBILE_TRANSPORT_HEIGHT }}
          >
            <MobileProgressIndicator />
            <div className="flex h-full items-center gap-3 px-3 pb-[env(safe-area-inset-bottom)]">
              <MobileTrackRow />
            </div>
          </div>
        </>
      ) : null}

      <div className="relative hidden h-[calc(5rem+env(safe-area-inset-bottom))] bg-black shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] md:block">
        <div className="flex h-full items-center justify-between px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          <TrackBadge />
          <div className="flex w-full max-w-md flex-col items-center">
            <TransportButtons />
            <ScrubBar />
          </div>
          <div className="flex w-1/3 items-center justify-end gap-2">
            <DesktopFavoriteButton />
            <VolumeKnob />
          </div>
        </div>
      </div>
    </>
  );
};
