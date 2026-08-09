"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone, type FileError, type FileRejection } from "react-dropzone";
import { uploadTrackAction } from "@/app/_actions/uploads";
import { ACCEPTED_AUDIO_MIME_TYPES } from "@/lib/audio-mime";

interface FileWithPreview extends File {
  preview?: string;
  errors: readonly FileError[];
}

type UseTrackUploadOptions = {
  maxFileSize?: number;
  maxFiles?: number;
  allowedMimeTypes?: string[];
};

export type UseTrackUploadReturn = ReturnType<typeof useTrackUpload>;

const DEFAULT_MAX_BYTES = 50 * 1024 * 1024;

export const useTrackUpload = (options: UseTrackUploadOptions = {}) => {
  const {
    maxFileSize = DEFAULT_MAX_BYTES,
    maxFiles = 20,
    allowedMimeTypes = ACCEPTED_AUDIO_MIME_TYPES,
  } = options;

  const [filesRaw, setFilesRaw] = useState<FileWithPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name: string; message: string }[]>([]);
  const [successes, setSuccesses] = useState<string[]>([]);

  const normalize = useCallback(
    (list: FileWithPreview[]): FileWithPreview[] => {
      if (list.length > maxFiles) return list;
      let changed = false;
      const next = list.map((file) => {
        if (file.errors.some((e) => e.code === "too-many-files")) {
          file.errors = file.errors.filter(
            (e) => e.code !== "too-many-files",
          );
          changed = true;
        }
        return file;
      });
      return changed ? next : list;
    },
    [maxFiles],
  );

  const setFiles = useCallback<
    React.Dispatch<React.SetStateAction<FileWithPreview[]>>
  >(
    (updater) => {
      setFilesRaw((prev) => {
        const candidate =
          typeof updater === "function" ? updater(prev) : updater;
        const next = normalize(candidate);
        if (next.length === 0) setErrors([]);
        return next;
      });
    },
    [normalize],
  );

  const files = filesRaw;

  const isSuccess = useMemo(() => {
    if (errors.length === 0 && successes.length === 0) return false;
    if (errors.length === 0 && successes.length === files.length) return true;
    return false;
  }, [errors.length, successes.length, files.length]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setFiles((prev) => {
        const validFiles = acceptedFiles
          .filter((file) => !prev.find((x) => x.name === file.name))
          .map((file) => {
            (file as FileWithPreview).errors = [];
            return file as FileWithPreview;
          });

        const invalidFiles = fileRejections.map(
          ({ file, errors: rejErrors }) => {
            (file as FileWithPreview).errors = rejErrors;
            return file as FileWithPreview;
          },
        );

        return [...prev, ...validFiles, ...invalidFiles];
      });
    },
    [setFiles],
  );

  const accept = useMemo(
    () =>
      allowedMimeTypes.reduce<Record<string, string[]>>(
        (acc, type) => ({ ...acc, [type]: [] }),
        {},
      ),
    [allowedMimeTypes],
  );

  const dropzoneProps = useDropzone({
    onDrop,
    noClick: true,
    accept,
    maxSize: maxFileSize,
    maxFiles,
    multiple: maxFiles !== 1,
  });

  const onUpload = useCallback(async () => {
    setLoading(true);

    const failedNames = new Set(errors.map((e) => e.name));
    const filesToUpload =
      failedNames.size > 0
        ? files.filter(
            (f) => failedNames.has(f.name) || !successes.includes(f.name),
          )
        : files.filter((f) => !successes.includes(f.name));

    const responses = await Promise.all(
      filesToUpload.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await uploadTrackAction(null, formData);
        return res.ok
          ? { name: file.name, message: undefined as string | undefined }
          : { name: file.name, message: res.error };
      }),
    );

    setErrors(
      responses
        .filter((r): r is { name: string; message: string } => !!r.message)
        .map((r) => ({ name: r.name, message: r.message })),
    );
    setSuccesses((prev) =>
      Array.from(
        new Set([
          ...prev,
          ...responses.filter((r) => !r.message).map((r) => r.name),
        ]),
      ),
    );
    setLoading(false);
  }, [files, errors, successes]);

  return {
    files,
    setFiles,
    successes,
    isSuccess,
    loading,
    errors,
    setErrors,
    onUpload,
    maxFileSize,
    maxFiles,
    allowedMimeTypes,
    ...dropzoneProps,
  };
};
