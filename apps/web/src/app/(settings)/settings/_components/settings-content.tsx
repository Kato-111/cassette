"use client";

import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type SettingsContentProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export const SettingsContent = ({
  title,
  children,
  className,
}: SettingsContentProps) => (
  <ScrollArea className="min-h-0 w-full flex-1">
    <div className="mx-4 mb-16 flex min-h-full flex-col items-center sm:mx-10">
      <div className="flex w-full max-w-[640px] flex-col">
        <div className={cn("flex flex-col px-4 pt-6", className)}>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  </ScrollArea>
);
