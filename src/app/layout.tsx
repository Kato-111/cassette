import { Inter } from "next/font/google";
import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LibraryProvider } from "@/app/_hooks/use-library";
import { DeckProvider } from "@/app/_playback/deck-context";
import { NowPlayingPanel } from "@/app/_playback/now-playing-panel";
import { TransportBar } from "@/app/_playback/transport-bar";
import { LibrarySidebar } from "@/app/_components/library-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getAllCollections } from "@/lib/queries";
import { cn } from "@/lib/utils";

const TRANSPORT_H = "calc(5rem + env(safe-area-inset-bottom))";

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

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  const collectionsPromise = getAllCollections();

  return (
    <html
      lang="en"
      className={cn(
        "dark bg-black h-full",
        inter.variable,
        "font-sans antialiased",
      )}
    >
      <body className="bg-black text-foreground">
        <DeckProvider>
          <Suspense fallback={null}>
            <LibraryProvider collectionsPromise={collectionsPromise}>
              <SidebarProvider
                style={
                  {
                    "--sidebar-width": "14rem",
                    "--transport-h": TRANSPORT_H,
                  } as React.CSSProperties
                }
                className="h-[calc(100dvh-var(--transport-h))]"
              >
                <LibrarySidebar />
                <SidebarInset className="m-2 overflow-hidden rounded-xl border border-white/12 bg-background shadow-[inset_0_1px_0_rgb(255_255_255/0.05),0_4px_12px_rgb(0_0_0/0.6)]">
                  {children}
                </SidebarInset>
                <NowPlayingPanel />
              </SidebarProvider>
            </LibraryProvider>
          </Suspense>
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <TransportBar />
          </div>
        </DeckProvider>
      </body>
    </html>
  );
};

export default RootLayout;
