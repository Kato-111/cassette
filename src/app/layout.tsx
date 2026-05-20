import { Inter, Ephesis } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LibraryProvider } from "@/app/_hooks/use-library";
import { DeckProvider } from "@/app/_playback/deck-context";
import { NowPlayingPanel } from "@/app/_playback/now-playing-panel";
import { TransportBar } from "@/app/_playback/transport-bar";
import { LibrarySidebar } from "@/app/_components/library-sidebar";
import { MobileTopBar } from "@/app/_components/mobile-top-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getAllPlaylists } from "@/lib/queries";
import { cn } from "@/lib/utils";

const TRANSPORT_H = "calc(5rem + env(safe-area-inset-bottom))";

const ephesis = Ephesis({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-ephesis",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Cassette",
  description: "A personal audio library.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
};

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const playlists = await getAllPlaylists();

  return (
    <html
      lang="en"
      className={cn(
        "dark bg-black h-full",
        inter.variable,
        ephesis.variable,
        "font-sans antialiased",
      )}
    >
      <body className="flex h-dvh flex-col overflow-hidden bg-black text-foreground">
        <DeckProvider>
          <LibraryProvider initialPlaylists={playlists}>
            <SidebarProvider
              style={
                {
                  "--sidebar-width": "14rem",
                  "--transport-h": TRANSPORT_H,
                } as React.CSSProperties
              }
              className="min-h-0 flex-1"
            >
              <LibrarySidebar />
              <SidebarInset className="m-2 overflow-hidden rounded-xl border border-white/12 bg-background shadow-[inset_0_1px_0_rgb(255_255_255/0.05),0_4px_12px_rgb(0_0_0/0.6)] max-md:m-0 max-md:rounded-none">
                <MobileTopBar />
                {children}
              </SidebarInset>
              <NowPlayingPanel />
            </SidebarProvider>
          </LibraryProvider>
          <TransportBar />
        </DeckProvider>
      </body>
    </html>
  );
};

export default RootLayout;
