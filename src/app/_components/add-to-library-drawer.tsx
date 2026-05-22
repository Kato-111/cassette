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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTrackUpload } from "@/hooks/use-track-upload";
import { useUrlImport } from "@/hooks/use-url-import";
import { useImporter } from "@/contexts/importer-context";

export const AddToLibraryDrawer = () => {
  const upload = useTrackUpload({ maxFiles: 20 });
  const { enabled: importerEnabled } = useImporter();
  const urlImport = useUrlImport();

  const onUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void urlImport.startImport();
  };

  const jobErrors = urlImport.job?.errors ?? [];

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

          {importerEnabled ? (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    or
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Import from URL</p>
                  <p className="text-sm text-muted-foreground">
                    Paste a YouTube playlist or video URL.
                  </p>
                </div>
                <Form className="flex flex-col gap-3" onSubmit={onUrlSubmit}>
                  <Field>
                    <FieldLabel className="sr-only">URL</FieldLabel>
                    <Input
                      name="url"
                      type="url"
                      value={urlImport.url}
                      onChange={(e) => urlImport.setUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      disabled={urlImport.loading}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="library-import-limit">
                      Limit (optional)
                    </FieldLabel>
                    <Input
                      id="library-import-limit"
                      name="limit"
                      inputMode="numeric"
                      value={urlImport.limit}
                      onChange={(e) => urlImport.setLimit(e.target.value)}
                      placeholder="All tracks"
                      disabled={urlImport.loading}
                    />
                    <FieldDescription>
                      Import only the first N tracks from a playlist.
                    </FieldDescription>
                  </Field>
                  {urlImport.progressLabel ? (
                    <p className="text-sm text-muted-foreground">
                      {urlImport.progressLabel}
                    </p>
                  ) : null}
                  {urlImport.error ? (
                    <p className="text-sm text-destructive">{urlImport.error}</p>
                  ) : null}
                  {jobErrors.length > 0 ? (
                    <ul className="max-h-32 space-y-1 overflow-y-auto text-sm text-destructive">
                      {jobErrors.map((entry) => (
                        <li key={`${entry.sourceItemId}-${entry.message}`}>
                          {entry.title}: {entry.message}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <Button
                    type="submit"
                    loading={urlImport.loading}
                    disabled={!urlImport.url.trim()}
                    className="self-start"
                  >
                    Import from URL
                  </Button>
                </Form>
              </div>
            </>
          ) : null}
        </DrawerPanel>
      </DrawerPopup>
    </Drawer>
  );
};
