"use client";

import { IconX } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const SearchField = ({ value: initialValue }: { value?: string }) => {
  const router = useRouter();
  const [value, setValue] = useState(initialValue ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      router.replace(value ? `/?q=${encodeURIComponent(value)}` : "/");
    }, 150);
    return () => window.clearTimeout(handle);
  }, [router, value]);

  return (
    <div className="relative mb-4">
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search"
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        className="h-8 pr-8 text-xs [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => setValue("")}
          className="absolute right-1 top-1/2 -translate-y-1/2"
          aria-label="Clear search"
        >
          <IconX />
        </Button>
      ) : (
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded border border-border bg-muted font-mono text-xs text-muted-foreground">
          /
        </kbd>
      )}
    </div>
  );
};
