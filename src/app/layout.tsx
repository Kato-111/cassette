import { Inter, Ephesis } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MainTransportBar } from "@/app/_components/main-transport-bar";
import { DeckProvider } from "@/contexts/deck-context";
import { ImporterProvider } from "@/contexts/importer-context";
import { LibraryProvider } from "@/contexts/library-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getAllPlaylists } from "@/lib/queries";
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
        <DeckProvider>
          <ImporterProvider enabled={importerEnabled}>
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
              {children}
            </SidebarProvider>
            <MainTransportBar />
          </LibraryProvider>
          </ImporterProvider>
        </DeckProvider>
      </body>
    </html>
  );
};

export default RootLayout;
