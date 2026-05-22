"use client";

import { usePathname } from "next/navigation";
import { TransportBar } from "@/app/_playback/transport-bar";

export const MainTransportBar = () => {
  const pathname = usePathname();
  if (pathname.startsWith("/playground")) return null;
  return <TransportBar />;
};
