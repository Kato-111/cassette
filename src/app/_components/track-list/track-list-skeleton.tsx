import { Frame } from "@/components/ui/frame";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const SKELETON_ROW_KEYS = [
  "sk-r0",
  "sk-r1",
  "sk-r2",
  "sk-r3",
  "sk-r4",
  "sk-r5",
  "sk-r6",
  "sk-r7",
  "sk-r8",
  "sk-r9",
] as const;

export const TrackListSkeleton = () => (
  <div className="flex min-h-0 flex-1 flex-col" aria-hidden>
    <Frame className="flex min-h-0 w-full flex-1 flex-col overflow-hidden **:data-[slot=table-container]:min-h-0 **:data-[slot=table-container]:flex-1 **:data-[slot=table-container]:overflow-y-auto max-sm:**:data-[slot=table-container]:overflow-x-hidden">
      <Table variant="card" className="w-full">
        <TableHeader
          className={cn(
            "hidden sm:table-header-group",
            "sticky top-0 z-10 [&_tr]:border-b-0",
            "[&_th]:bg-card [&_th]:font-normal [&_th]:text-muted-foreground",
          )}
        >
          <TableRow className="hover:bg-transparent">
            <TableHead className="hidden sm:table-cell w-12 min-w-12 max-w-12 text-center text-xs">
              #
            </TableHead>
            <TableHead className="text-xs">Title</TableHead>
            <TableHead className="hidden text-xs md:table-cell">
              Album
            </TableHead>
            <TableHead className="hidden sm:table-cell w-20 text-right text-xs">
              Duration
            </TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody className="h-full">
          {SKELETON_ROW_KEYS.map((key) => (
            <TableRow key={key} className="hover:bg-transparent">
              <TableCell className="w-12 min-w-12 max-w-12 max-sm:w-0 max-sm:min-w-0 max-sm:max-w-0 max-sm:p-0 max-sm:overflow-hidden">
                <Skeleton className="mx-auto size-7 rounded-sm max-sm:hidden" />
              </TableCell>
              <TableCell className="w-full max-w-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-sm" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-[min(100%,14rem)] rounded-sm" />
                    <Skeleton className="h-3 w-[min(85%,10rem)] rounded-sm" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                <Skeleton className="h-4 w-24 rounded-sm" />
              </TableCell>
              <TableCell className="hidden sm:table-cell text-right">
                <Skeleton className="ml-auto h-4 w-10 rounded-sm" />
              </TableCell>
              <TableCell className="w-10">
                <Skeleton className="size-7 rounded-sm opacity-40" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Frame>
  </div>
);
