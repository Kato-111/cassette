"use client";

import {
  IconDotsVertical,
  IconMusic,
  IconPlaylist,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useEffect, useRef } from "react";
import type { Collection } from "@prisma/client";
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
} from "@/components/ui/sidebar";
import {
  createCollectionAction,
  removeCollectionAction,
} from "@/app/_actions/collections";
import { useDeck } from "@/app/_playback/deck-context";
import { useLibrary } from "@/app/_hooks/use-library";
import { SearchField } from "./search-field";

const CollectionRow = ({ collection }: { collection: Collection }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { removeCollection } = useLibrary();

  const isActive = pathname === `/c/${collection.id}`;

  const onDelete = () => {
    startTransition(() => {
      removeCollection(collection.id);
    });
    if (isActive) {
      router.push("/");
    }
    void removeCollectionAction(collection.id).then(() => router.refresh());
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        size="sm"
        render={<Link href={`/c/${collection.id}`} prefetch tabIndex={0} />}
      >
        <IconPlaylist />
        <span>{collection.name}</span>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuAction showOnHover aria-label="Collection options">
              <IconDotsVertical />
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

export const LibrarySidebar = () => {
  const { collections, upsertCollection } = useLibrary();
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLDivElement>(null);
  const { registerPaneRef, handlePaneKey, setActivePane } = useDeck();

  useEffect(() => {
    registerPaneRef("sidebar", navRef);
  }, [registerPaneRef]);

  const onCreate = async () => {
    const result = await createCollectionAction();
    if (!result.ok) return;
    startTransition(() => {
      upsertCollection({
        id: result.id,
        name: "New Collection",
        coverUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
    router.push(`/c/${result.id}`);
    router.refresh();
  };

  return (
    <Sidebar
      collapsible="offcanvas"
      className="h-[calc(100svh-var(--transport-h))] bg-black"
    >
      <SidebarHeader>
        <SearchField />
      </SidebarHeader>
      <SidebarContent
        ref={navRef}
        onClick={() => setActivePane("sidebar")}
        onKeyDown={(e) => handlePaneKey(e, "sidebar")}
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
          <SidebarGroupLabel>Collections</SidebarGroupLabel>
          <SidebarGroupAction onClick={onCreate} aria-label="Add collection">
            <IconPlus />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {collections.map((c) => (
                <CollectionRow key={c.id} collection={c} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
