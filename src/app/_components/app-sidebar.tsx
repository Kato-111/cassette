"use client";

import {
  IconChevronDown,
  IconDotsVertical,
  IconHelp,
  IconMusic,
  IconPlaylist,
  IconPlus,
  IconSearch,
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
  createCollectionAction,
  removeCollectionAction,
} from "@/app/_actions/collections";
import { useDeck } from "@/app/_playback/deck-context";
import { useLibrary } from "@/app/_hooks/use-library";
import { SearchField } from "./search-field";

type IconType = React.ComponentType<{ className?: string }>;

const NavLink = ({
  icon: Icon,
  label,
  href,
  active = false,
}: {
  icon: IconType;
  label: string;
  href: string;
  active?: boolean;
}) => (
  <Link
    href={href}
    prefetch
    className={`flex h-7 w-full items-center gap-2 rounded-md px-2 text-sm transition-colors ${
      active
        ? "bg-white/[0.08] text-white"
        : "text-white/65 hover:bg-white/[0.04] hover:text-white"
    }`}
  >
    <Icon className="size-4 shrink-0" />
    <span className="truncate">{label}</span>
  </Link>
);

const SectionHeader = ({ label }: { label: string }) => (
  <button
    type="button"
    className="flex h-6 w-full items-center gap-1 px-2 text-xs font-medium text-white/35 hover:text-white/60"
  >
    <span>{label}</span>
    <IconChevronDown className="size-3" />
  </button>
);

const CollectionRow = ({
  collection,
  active,
}: {
  collection: Collection;
  active: boolean;
}) => {
  const router = useRouter();
  const { removeCollection } = useLibrary();

  const onDelete = () => {
    startTransition(() => {
      removeCollection(collection.id);
    });
    if (active) {
      router.push("/");
    }
    void removeCollectionAction(collection.id).then(() => router.refresh());
  };

  return (
    <div className="group relative">
      <Link
        href={`/c/${collection.id}`}
        prefetch
        tabIndex={0}
        className={`flex h-7 w-full items-center gap-2 rounded-md px-2 pr-8 text-sm transition-colors ${
          active
            ? "bg-white/[0.08] text-white"
            : "text-white/65 hover:bg-white/[0.04] hover:text-white"
        }`}
      >
        <IconPlaylist className="size-4 shrink-0" />
        <span className="truncate">{collection.name}</span>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Collection options"
              className="absolute top-1/2 right-1 -translate-y-1/2 rounded p-1 text-white/40 opacity-0 transition-opacity hover:bg-white/[0.08] hover:text-white group-hover:opacity-100 data-[popup-open]:opacity-100"
            >
              <IconDotsVertical className="size-3.5" />
            </button>
          }
        />
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={onDelete} variant="destructive">
            <IconTrash />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const AppSidebar = () => {
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
    <aside
      ref={navRef}
      onClick={() => setActivePane("sidebar")}
      onKeyDown={(e) => handlePaneKey(e, "sidebar")}
      className="hidden h-full w-60 shrink-0 flex-col bg-black px-2 pt-3 pb-2 text-white md:flex"
    >
      <div className="flex items-center gap-1 pb-3">
        <button
          type="button"
          className="flex flex-1 items-center gap-2 rounded-md px-1.5 py-1 hover:bg-white/[0.04]"
        >
          <div className="flex size-6 items-center justify-center rounded-full bg-lime-300 text-[11px] font-semibold text-black">
            CA
          </div>
          <span className="flex-1 truncate text-left text-sm">Cassette</span>
          <IconChevronDown className="size-3.5 shrink-0 text-white/50" />
        </button>
        <button
          type="button"
          className="rounded-md p-1.5 text-white/60 hover:bg-white/[0.04]"
          aria-label="Search"
        >
          <IconSearch className="size-4" />
        </button>
        <button
          type="button"
          onClick={onCreate}
          aria-label="Add collection"
          className="rounded-md bg-white/[0.05] p-1.5 text-white/75 hover:bg-white/[0.1]"
        >
          <IconPlus className="size-4" />
        </button>
      </div>

      <SearchField />

      <div className="flex flex-col gap-0.5">
        <NavLink
          icon={IconMusic}
          label="All Tracks"
          href="/"
          active={pathname === "/"}
        />
      </div>

      <div className="mt-4 flex flex-col gap-0.5">
        <SectionHeader label="Collections" />
        {collections.map((c) => (
          <CollectionRow
            key={c.id}
            collection={c}
            active={pathname === `/c/${c.id}`}
          />
        ))}
      </div>

      <div className="mt-auto pt-2">
        <button
          type="button"
          className="rounded-md p-1.5 text-white/40 hover:bg-white/[0.04] hover:text-white/70"
          aria-label="Help"
        >
          <IconHelp className="size-4" />
        </button>
      </div>
    </aside>
  );
};
