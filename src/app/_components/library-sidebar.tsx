"use client";

import {
  IconDots,
  IconHeart,
  IconLink,
  IconMusic,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
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
import { useDeck } from "@/contexts/deck-context";
import { useImporter } from "@/contexts/importer-context";
import { useLibrary } from "@/contexts/library-context";
import { SearchField } from "./search-field";
import { PlaylistAvatar } from "./playlist-avatar";
import { ImportFromUrlDialog } from "./import-from-url-dialog";

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
    <SearchField value={searchParams.get("q") ?? ""} basePath={pathname} />
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

export const LibrarySidebar = () => {
  const { playlists } = useLibrary();
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const { registerPaneRef, handlePaneKey, setActivePane } = useDeck();
  const { isMobile } = useSidebar();

  useEffect(() => {
    registerPaneRef("sidebar", navRef);
  }, [registerPaneRef]);

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
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/favorites"}
                  size="sm"
                  render={<Link href="/favorites" prefetch tabIndex={0} />}
                >
                  <IconHeart />
                  <span>Favorites</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Playlists</SidebarGroupLabel>
          <CreatePlaylistDialog />
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
