"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUrlImport } from "@/hooks/use-url-import";

type ImportFromUrlDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlistId?: string;
  title?: string;
  description?: string;
};

export const ImportFromUrlDialog = ({
  open,
  onOpenChange,
  playlistId,
  title = "Import from URL",
  description = "Paste a YouTube or Spotify playlist, album, or track URL. Tracks will be added to your library.",
}: ImportFromUrlDialogProps) => {
  const copy = playlistId
    ? "Paste a YouTube or Spotify playlist, album, or track URL. Tracks will be added to this playlist."
    : description;

  const importState = useUrlImport({
    playlistId,
    onComplete: () => onOpenChange(false),
  });

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) importState.reset();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void importState.startImport();
  };

  const jobErrors = importState.job?.errors ?? [];
  const isTerminal =
    importState.job?.status === "completed" ||
    importState.job?.status === "failed";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{copy}</DialogDescription>
        </DialogHeader>
        <Form className="contents" onSubmit={onSubmit}>
          <DialogPanel className="flex flex-col gap-4">
            <Field>
              <FieldLabel className="sr-only">URL</FieldLabel>
              <Input
                name="url"
                type="url"
                value={importState.url}
                onChange={(e) => importState.setUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/... or youtube.com/..."
                autoFocus
                required
                disabled={importState.loading}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="import-limit">Limit (optional)</FieldLabel>
              <Input
                id="import-limit"
                name="limit"
                inputMode="numeric"
                value={importState.limit}
                onChange={(e) => importState.setLimit(e.target.value)}
                placeholder="All tracks"
                disabled={importState.loading}
              />
              <FieldDescription>
                Import only the first N tracks from a playlist.
              </FieldDescription>
            </Field>
            {importState.progressLabel ? (
              <p className="text-sm text-muted-foreground">
                {importState.progressLabel}
              </p>
            ) : null}
            {importState.error ? (
              <p className="text-sm text-destructive">{importState.error}</p>
            ) : null}
            {isTerminal && jobErrors.length > 0 ? (
              <ul className="max-h-32 space-y-1 overflow-y-auto text-sm text-destructive">
                {jobErrors.map((entry) => (
                  <li key={`${entry.sourceItemId}-${entry.message}`}>
                    {entry.title}: {entry.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              loading={importState.loading}
              disabled={!importState.url.trim()}
            >
              Import
            </Button>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  );
};
