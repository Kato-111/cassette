import { NowPlayingPanel } from "@/app/_playback/now-playing-panel";
import { LibrarySidebar } from "@/app/_components/library-sidebar";
import { MobileTopBar } from "@/app/_components/mobile-top-bar";
import { SidebarInset } from "@/components/ui/sidebar";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <LibrarySidebar />
      <SidebarInset className="m-2 min-h-0 flex-1 overflow-hidden rounded-xl border border-white/12 bg-background shadow-[inset_0_1px_0_rgb(255_255_255/0.05),0_4px_12px_rgb(0_0_0/0.6)] max-md:m-0 max-md:rounded-none">
        <MobileTopBar />
        {children}
      </SidebarInset>
      <NowPlayingPanel />
    </>
  );
};

export default MainLayout;
