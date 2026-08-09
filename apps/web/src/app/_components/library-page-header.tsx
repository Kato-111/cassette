import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type LibraryPageHeaderBreadcrumbItem = {
  label: ReactNode;
  href?: string;
};

type LibraryPageHeaderProps = {
  breadcrumb: LibraryPageHeaderBreadcrumbItem[];
  search?: ReactNode;
  actions?: ReactNode;
};

export const LibraryPageHeader = ({
  breadcrumb,
  search,
  actions,
}: LibraryPageHeaderProps) => {
  const isSingle = breadcrumb.length === 1;

  return (
    <div className="flex items-center justify-between gap-2 bg-background px-4 py-3">
      <div className="flex min-w-0 flex-1 items-center">
        {isSingle ? (
          <BreadcrumbPage className="truncate text-sm font-medium">
            {breadcrumb[0].label}
          </BreadcrumbPage>
        ) : (
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="min-w-0 gap-1 sm:gap-1.5">
              {breadcrumb.map((item, index) => {
                const isLast = index === breadcrumb.length - 1;

                return (
                  <Fragment key={index}>
                    <BreadcrumbItem
                      className={isLast ? "min-w-0 max-w-full" : "shrink-0"}
                    >
                      {isLast ? (
                        <BreadcrumbPage className="truncate text-sm font-medium">
                          {item.label}
                        </BreadcrumbPage>
                      ) : item.href ? (
                        <BreadcrumbLink
                          render={<Link href={item.href} />}
                          className="text-sm"
                        >
                          {item.label}
                        </BreadcrumbLink>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {item.label}
                        </span>
                      )}
                    </BreadcrumbItem>
                    {!isLast ? (
                      <BreadcrumbSeparator className="shrink-0 [&>svg]:size-3.5" />
                    ) : null}
                  </Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>
      {search ? <div className="hidden w-72 md:block">{search}</div> : null}
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
};
