import type { ReactNode } from "react";

type LibraryPageHeaderProps = {
  title: ReactNode;
  search?: ReactNode;
  actions?: ReactNode;
};

export const LibraryPageHeader = ({
  title,
  search,
  actions,
}: LibraryPageHeaderProps) => (
  <div className="flex items-center justify-between gap-2 bg-background py-3 px-4">
    <div className="flex min-w-0 items-center gap-1">{title}</div>
    {search ? <div className="hidden w-72 md:block">{search}</div> : null}
    {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
  </div>
);
