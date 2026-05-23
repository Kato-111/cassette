import { Inter, Ephesis } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SerwistProvider } from "@/app/_components/serwist-provider";
import { LibrarySidebar } from "@/app/_components/library-sidebar";
import { MainTransportBar } from "@/app/_components/main-transport-bar";
import { NowPlayingAside } from "@/app/_playback/now-playing-aside";
import { MobileTopBar } from "@/app/_components/mobile-top-bar";
import { DeckProvider } from "@/contexts/deck-context";
import { ImporterProvider } from "@/contexts/importer-context";
import { LibraryProvider } from "@/contexts/library-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getAllAlbums, getAllPlaylists } from "@/lib/queries";
import { isImporterConfigured } from "@/lib/importer";
import { cn } from "@/lib/utils";

const TRANSPORT_H = "calc(5rem + env(safe-area-inset-bottom))";

const ephesis = Ephesis({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-ephesis",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  applicationName: "Cassette",
  title: {
    default: "Cassette",
    template: "%s · Cassette",
  },
  description: "A personal audio library.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cassette",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
};

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const [playlists, albums] = await Promise.all([
    getAllPlaylists(),
    getAllAlbums(),
  ]);
  const importerEnabled = isImporterConfigured();

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
        <SerwistProvider swUrl="/serwist/sw.js">
          <DeckProvider>
            <ImporterProvider enabled={importerEnabled}>
              <LibraryProvider
                initialPlaylists={playlists}
                initialAlbums={albums}
              >
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
                  <SidebarInset className="m-2 min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-white/12 bg-background shadow-[inset_0_1px_0_rgb(255_255_255/0.05),0_4px_12px_rgb(0_0_0/0.6)] max-md:m-0 max-md:rounded-none">
                    <MobileTopBar />
                    <div className="flex min-h-0 flex-1 flex-col">
                      {children}
                    </div>
                  </SidebarInset>
                  <NowPlayingAside />
                </SidebarProvider>
                <MainTransportBar />
              </LibraryProvider>
            </ImporterProvider>
          </DeckProvider>
        </SerwistProvider>
      </body>
    </html>
  );
};

export default RootLayout;
