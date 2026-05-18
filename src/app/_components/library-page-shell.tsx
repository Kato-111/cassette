import type { ReactNode } from "react";

type LibraryPageShellProps = {
  header: ReactNode;
  children: ReactNode;
  banner?: ReactNode;
};

export const LibraryPageShell = ({
  header,
  children,
  banner,
}: LibraryPageShellProps) => (
  <div className="flex flex-1 flex-col overflow-hidden">
    {header}
    {banner}
    <div className="flex flex-1 flex-col overflow-hidden px-4 pb-4">
      {children}
    </div>
  </div>
);
