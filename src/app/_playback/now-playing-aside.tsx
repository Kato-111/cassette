"use client";

import { usePathname } from "next/navigation";
import { NowPlayingPanel } from "@/app/_playback/now-playing-panel";

export const NowPlayingAside = () => {
  const pathname = usePathname();
  if (pathname.startsWith("/settings")) return null;
  return <NowPlayingPanel />;
};
