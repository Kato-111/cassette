"use client";

import { IconSearch, IconX } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

export const SearchField = ({
  value: initialValue,
  basePath = "/",
  preventAutoFocus = false,
  size = "default",
  className,
}: {
  value?: string;
  basePath?: string;
  preventAutoFocus?: boolean;
  size?: "sm" | "default";
  className?: string;
}) => {
  const router = useRouter();
  const [value, setValue] = useState(initialValue ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue ?? "");
  }, [initialValue]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      router.replace(
        value ? `${basePath}?q=${encodeURIComponent(value)}` : basePath,
      );
    }, 150);
    return () => window.clearTimeout(handle);
  }, [router, value, basePath]);

  return (
    <InputGroup className={className}>
      <InputGroupAddon align="inline-start">
        <IconSearch aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        type="search"
        size={size}
        placeholder="Search"
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        className={cn(
          "[&::-webkit-search-cancel-button]:appearance-none",
          size === "sm" && "text-xs",
        )}
        aria-label="Search tracks"
        tabIndex={preventAutoFocus ? -1 : undefined}
      />
      <InputGroupAddon align="inline-end">
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setValue("")}
            aria-label="Clear search"
          >
            <IconX />
          </Button>
        ) : size === "default" ? (
          <kbd className="hidden h-5 w-5 items-center justify-center rounded border border-border bg-muted font-mono text-xs text-muted-foreground md:flex">
            /
          </kbd>
        ) : null}
      </InputGroupAddon>
    </InputGroup>
  );
};
