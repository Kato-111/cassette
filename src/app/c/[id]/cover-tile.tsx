"use client";

import { IconLoader2, IconUpload } from "@tabler/icons-react";
import { startTransition, useActionState } from "react";
import { uploadCollectionCoverAction } from "@/app/_actions/uploads";

export const CoverTile = ({
  url,
  collectionId,
}: {
  url: string | null;
  collectionId: string;
}) => {
  const [state, formAction, pending] = useActionState(
    uploadCollectionCoverAction,
    { ok: false as const, error: "" },
  );

  const currentUrl = state.ok ? state.coverUrl : url;

  if (currentUrl) {
    return (
      <img
        src={currentUrl}
        alt="Collection cover"
        className="size-16 rounded-md object-cover sm:size-20"
      />
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="collectionId" value={collectionId} />
      <label
        htmlFor={`cover-upload-${collectionId}`}
        className="flex size-16 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border text-muted-foreground sm:size-20"
      >
        <input
          id={`cover-upload-${collectionId}`}
          type="file"
          name="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
              alert("File exceeds 5MB limit");
              e.target.value = "";
              return;
            }
            startTransition(() => e.target.form?.requestSubmit());
          }}
        />
        {pending ? (
          <IconLoader2 className="size-5 animate-spin" />
        ) : (
          <>
            <IconUpload className="size-3" />
            <span className="mt-1 text-xs">Upload</span>
          </>
        )}
      </label>
    </form>
  );
};
