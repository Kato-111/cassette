import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LibraryPageShellProps = {
  header: ReactNode;
  children: ReactNode;
  banner?: ReactNode;
  contentClassName?: string;
};

export const LibraryPageShell = ({
  header,
  children,
  banner,
  contentClassName,
}: LibraryPageShellProps) => (
  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
    {header}
    {banner}
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 max-sm:px-1",
        contentClassName,
      )}
    >
      {children}
    </div>
  </div>
);
