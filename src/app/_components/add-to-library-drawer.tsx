"use client";

import { IconPlus } from "@tabler/icons-react";
import {
  Drawer,
  DrawerDescription,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/dropzone";
import { useTrackUpload } from "@/hooks/use-track-upload";

export const AddToLibraryDrawer = () => {
  const upload = useTrackUpload({ maxFiles: 20 });

  return (
    <Drawer position="bottom">
      <DrawerTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Add to library">
            <IconPlus />
          </Button>
        }
      />
      <DrawerPopup className="mx-auto w-full max-w-2xl" showBar>
        <DrawerPanel className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col gap-1">
            <DrawerTitle>Add to library</DrawerTitle>
            <DrawerDescription>
              Drop audio files to upload. Metadata and embedded artwork are
              extracted automatically.
            </DrawerDescription>
          </div>
          <Dropzone {...upload}>
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>
        </DrawerPanel>
      </DrawerPopup>
    </Drawer>
  );
};
