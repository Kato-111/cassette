"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { setMinAlbumTracksAction } from "@/app/_actions/settings";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import { MIN_ALBUM_TRACKS_BOUNDS } from "@/lib/settings";

type AlbumsSettingsFormProps = {
  initialMinTracks: number;
};

export const AlbumsSettingsForm = ({
  initialMinTracks,
}: AlbumsSettingsFormProps) => {
  const router = useRouter();
  const [minTracks, setMinTracks] = useState(initialMinTracks);

  const onMinChange = (value: number | null) => {
    if (value == null || !Number.isFinite(value)) return;
    setMinTracks(value);
    startTransition(() => {
      void setMinAlbumTracksAction(value).then(() => router.refresh());
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <Field>
        <FieldLabel>Minimum tracks per album</FieldLabel>
        <FieldDescription>
          Albums with fewer than this many tracks are hidden from the sidebar.
        </FieldDescription>
        <NumberField
          value={minTracks}
          min={MIN_ALBUM_TRACKS_BOUNDS.min}
          max={MIN_ALBUM_TRACKS_BOUNDS.max}
          onValueChange={onMinChange}
          size="sm"
          className="max-w-40"
        >
          <NumberFieldGroup>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldGroup>
        </NumberField>
      </Field>
    </section>
  );
};
