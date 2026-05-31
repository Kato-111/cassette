"use client";

import {
  IconArrowLeft,
  IconDots,
  IconHeartFilled,
  IconLink,
  IconMusic,
  IconPlus,
  IconSettings,
  IconUser,
  IconTrash,
} from "@tabler/icons-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, startTransition, useEffect, useRef, useState } from "react";
import { Playlist } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { useDeckPane } from "@/contexts/deck-context";
import { useImporter } from "@/contexts/importer-context";
import { useLibrary } from "@/contexts/library-context";
import { SearchField } from "./search-field";
import { PlaylistAvatar } from "./playlist-avatar";
import { ImportFromUrlDialog } from "./import-from-url-dialog";
import type { AlbumSummary } from "@/lib/albums";

const AlbumRow = ({ album }: { album: AlbumSummary }) => {
  const pathname = usePathname();
  const isActive = pathname === `/album/${album.id}`;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        size="sm"
        render={<Link href={`/album/${album.id}`} prefetch tabIndex={0} />}
      >
        <PlaylistAvatar name={album.name} coverUrl={album.coverUrl} />
        <span className="truncate" title={`${album.name} · ${album.artist}`}>
          {album.name}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const PlaylistRow = ({ playlist }: { playlist: Playlist }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { removePlaylist } = useLibrary();
  const { enabled: importerEnabled } = useImporter();
  const [importOpen, setImportOpen] = useState(false);

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
        <PlaylistAvatar name={playlist.name} coverUrl={playlist.coverUrl} />
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
          {importerEnabled ? (
            <DropdownMenuItem onClick={() => setImportOpen(true)}>
              <IconLink />
              Import song
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onClick={onDelete} variant="destructive">
            <IconTrash />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {importerEnabled ? (
        <ImportFromUrlDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          playlistId={playlist.id}
        />
      ) : null}
    </SidebarMenuItem>
  );
};

const MobileSearchField = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <SearchField
      value={searchParams.get("q") ?? ""}
      basePath={pathname}
      preventAutoFocus
      size="sm"
    />
  );
};

const CreatePlaylistDialog = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { upsertPlaylist } = useLibrary();
  const router = useRouter();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setName("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    const result = await createPlaylistAction(trimmed);
    setLoading(false);
    if (!result.ok) return;

    startTransition(() => {
      upsertPlaylist({
        id: result.id,
        name: trimmed,
        coverUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
    setOpen(false);
    setName("");
    router.push(`/playlist/${result.id}`);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <SidebarGroupAction aria-label="Add playlist">
            <IconPlus />
          </SidebarGroupAction>
        }
      />
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>New playlist</DialogTitle>
          <DialogDescription>
            Give your playlist a name to get started.
          </DialogDescription>
        </DialogHeader>
        <Form className="contents" onSubmit={onSubmit}>
          <DialogPanel>
            <Field>
              <FieldLabel className="sr-only">Name</FieldLabel>
              <Input
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My playlist"
                autoFocus
                required
              />
            </Field>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" loading={loading} disabled={!name.trim()}>
              Create
            </Button>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  );
};

const navSpring = (reduceMotion: boolean | null, exiting = false) =>
  reduceMotion
    ? { duration: exiting ? 0.1 : 0.12 }
    : { type: "spring" as const, duration: exiting ? 0.2 : 0.25, bounce: 0 };

const SIDEBAR_LIST_MAX_H = "calc((100svh - var(--transport-h)) * 0.3)";

const LibrarySection = ({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <SidebarGroup className="relative">
    <SidebarGroupLabel className="shrink-0">{label}</SidebarGroupLabel>
    {action}
    <SidebarGroupContent
      className="overflow-x-hidden overflow-y-auto"
      style={{ maxHeight: SIDEBAR_LIST_MAX_H, scrollbarGutter: "stable" }}
    >
      <SidebarMenu>{children}</SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
);

const useNavSlideDirection = (mode: "library" | "settings") => {
  const prevModeRef = useRef(mode);
  const directionRef = useRef<1 | -1>(1);

  if (prevModeRef.current !== mode) {
    directionRef.current = mode === "settings" ? 1 : -1;
    prevModeRef.current = mode;
  }

  return directionRef.current;
};

const LibraryNav = ({
  playlists,
  albums,
}: {
  playlists: Playlist[];
  albums: ReturnType<typeof useLibrary>["albums"];
}) => {
  const pathname = usePathname();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SidebarGroup className="shrink-0">
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
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/favorites"}
                size="sm"
                render={<Link href="/favorites" prefetch tabIndex={0} />}
              >
                <IconHeartFilled />
                <span>Favorites</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <LibrarySection label="Playlists" action={<CreatePlaylistDialog />}>
        {playlists.map((p) => (
          <PlaylistRow key={p.id} playlist={p} />
        ))}
      </LibrarySection>

      {albums.length > 0 ? (
        <LibrarySection label="Albums">
          {albums.map((album) => (
            <AlbumRow key={album.id} album={album} />
          ))}
        </LibrarySection>
      ) : null}
    </div>
  );
};

const SettingsNav = () => {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Settings</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/settings/session"}
              size="sm"
              render={<Link href="/settings/session" prefetch tabIndex={0} />}
            >
              <IconUser />
              <span>Session</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/settings/albums"}
              size="sm"
              render={<Link href="/settings/albums" prefetch tabIndex={0} />}
            >
              <IconMusic />
              <span>Albums</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export const LibrarySidebar = () => {
  const { playlists, albums } = useLibrary();
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const { registerPaneRef, handlePaneKey, setActivePane } = useDeckPane();
  const { isMobile, setOpenMobile } = useSidebar();
  const reduceMotion = useReducedMotion();
  const mode: "library" | "settings" = pathname.startsWith("/settings")
    ? "settings"
    : "library";
  const direction = useNavSlideDirection(mode);
  const noAnimation = reduceMotion || isMobile;

  const closeIfLink = (e: React.MouseEvent) => {
    if (isMobile && (e.target as Element).closest("a")) setOpenMobile(false);
  };

  useEffect(() => {
    registerPaneRef("sidebar", navRef);
  }, [registerPaneRef]);

  return (
    <Sidebar
      collapsible="offcanvas"
      variant="floating"
      className="h-[calc(100svh-var(--transport-h))] pr-0"
      innerClassName="flex h-full flex-col rounded-xl border border-white/12 bg-background shadow-[inset_0_1px_0_rgb(255_255_255/0.05),0_4px_12px_rgb(0_0_0/0.6)]"
    >
      <SidebarHeader className="shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold font-ephesis">Cassette</h1>
        </div>
        {isMobile ? (
          <div className="mt-1.5">
            <Suspense
              fallback={
                <SearchField basePath={pathname} preventAutoFocus size="sm" />
              }
            >
              <MobileSearchField />
            </Suspense>
          </div>
        ) : null}
      </SidebarHeader>
      <SidebarContent
        ref={navRef}
        scrollable={false}
        onClick={(e) => { setActivePane("sidebar"); closeIfLink(e); }}
        onKeyDown={(e) => handlePaneKey(e, "sidebar")}
        className="mt-4 min-h-0 flex-1 overflow-hidden"
      >
        <div className="grid min-h-0 flex-1 auto-rows-fr overflow-x-clip">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={mode}
              custom={direction}
              className="col-start-1 row-start-1 flex h-full min-h-0 w-full min-w-0 flex-col gap-2"
              variants={{
                enter: (dir: 1 | -1) => ({
                  opacity: 0,
                  x: noAnimation ? 0 : `${dir * 100}%`,
                  transition: navSpring(noAnimation),
                }),
                center: {
                  opacity: 1,
                  x: 0,
                  transition: navSpring(noAnimation),
                },
                exit: (dir: 1 | -1) => ({
                  opacity: 0,
                  x: noAnimation ? 0 : `${-dir * 100}%`,
                  transition: navSpring(noAnimation, true),
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ willChange: "transform, opacity" }}
            >
              {mode === "library" ? (
                <LibraryNav playlists={playlists} albums={albums} />
              ) : (
                <SettingsNav />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </SidebarContent>
      <SidebarFooter className="shrink-0" onClick={closeIfLink}>
        <SidebarMenu>
          {mode === "settings" ? (
            <SidebarMenuItem>
              <SidebarMenuButton
                size="sm"
                render={<Link href="/" prefetch tabIndex={0} />}
              >
                <IconArrowLeft />
                <span>Back to library</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={mode === "settings"}
              size="sm"
              render={<Link href="/settings/session" prefetch tabIndex={0} />}
            >
              <IconSettings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
