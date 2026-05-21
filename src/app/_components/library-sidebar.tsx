"use client";

import {
  IconDots,
  IconMusic,
  IconPlaylist,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, startTransition, useEffect, useRef } from "react";
import { Playlist } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  createPlaylistAction,
  removePlaylistAction,
} from "@/app/_actions/playlists";
import { useDeck } from "@/app/_playback/deck-context";
import { useLibrary } from "@/app/_hooks/use-library";
import { SearchField } from "./search-field";

const PlaylistRow = ({ playlist }: { playlist: Playlist }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { removePlaylist } = useLibrary();

  const isActive = pathname === `/playlist/${playlist.id}`;

  const onDelete = () => {
    startTransition(() => {
      removePlaylist(playlist.id);
    });
    if (isActive) {
      router.push("/");
    }
    void removePlaylistAction(playlist.id).then(() => router.refresh());
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        size="sm"
        render={
          <Link href={`/playlist/${playlist.id}`} prefetch tabIndex={0} />
        }
      >
        <IconPlaylist />
        <span>{playlist.name}</span>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuAction showOnHover aria-label="Playlist options">
              <IconDots />
            </SidebarMenuAction>
          }
        />
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={onDelete} variant="destructive">
            <IconTrash />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

const MobileSearchField = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <SearchField value={searchParams.get("q") ?? ""} basePath={pathname} />
  );
};

export const LibrarySidebar = () => {
  const { playlists, upsertPlaylist } = useLibrary();
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLDivElement>(null);
  const { registerPaneRef, handlePaneKey, setActivePane } = useDeck();
  const { isMobile } = useSidebar();

  useEffect(() => {
    registerPaneRef("sidebar", navRef);
  }, [registerPaneRef]);

  const onCreate = async () => {
    const result = await createPlaylistAction();
    if (!result.ok) return;
    startTransition(() => {
      upsertPlaylist({
        id: result.id,
        name: "New Playlist",
        coverUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
    router.push(`/playlist/${result.id}`);
    router.refresh();
  };

  return (
    <Sidebar
      collapsible="offcanvas"
      variant="floating"
      className="h-[calc(100svh-var(--transport-h))] pr-0"
      innerClassName="rounded-xl border border-white/12 bg-background shadow-[inset_0_1px_0_rgb(255_255_255/0.05),0_4px_12px_rgb(0_0_0/0.6)]"
    >
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold font-ephesis">Cassette</h1>
        </div>
        {isMobile ? (
          <div className="mt-2">
            <Suspense fallback={<SearchField basePath={pathname} />}>
              <MobileSearchField />
            </Suspense>
          </div>
        ) : null}
      </SidebarHeader>
      <SidebarContent
        ref={navRef}
        onClick={() => setActivePane("sidebar")}
        onKeyDown={(e) => handlePaneKey(e, "sidebar")}
        className="mt-4"
      >
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/"}
                  size="sm"
                  render={<Link href="/" prefetch tabIndex={0} />}
                >
                  <IconMusic />
                  <span>All Tracks</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Playlists</SidebarGroupLabel>
          <SidebarGroupAction onClick={onCreate} aria-label="Add playlist">
            <IconPlus />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {playlists.map((p) => (
                <PlaylistRow key={p.id} playlist={p} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
