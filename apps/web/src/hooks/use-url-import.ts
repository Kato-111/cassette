"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getImportJobStatusAction,
  startImportFromUrlAction,
  type ImportJobStatus,
} from "@/app/_actions/import";

const POLL_MS = 2000;
const TERMINAL = new Set(["completed", "failed"]);

type UseUrlImportOptions = {
  playlistId?: string;
  onComplete?: () => void;
};

export const useUrlImport = (options: UseUrlImportOptions = {}) => {
  const router = useRouter();
  const { playlistId, onComplete } = options;
  const [url, setUrl] = useState("");
  const [limit, setLimit] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<ImportJobStatus | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    setUrl("");
    setLimit("");
    setError(null);
    setJob(null);
    setLoading(false);
  }, [stopPolling]);

  const pollJob = useCallback(
    async (jobId: string) => {
      const result = await getImportJobStatusAction(jobId);
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        stopPolling();
        return;
      }

      setJob(result.job);

      if (TERMINAL.has(result.job.status)) {
        stopPolling();
        setLoading(false);
        router.refresh();
        onComplete?.();
      }
    },
    [onComplete, router, stopPolling],
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  const startImport = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Enter a URL");
      return;
    }

    const parsedLimit = limit.trim();
    let limitNum: number | undefined;
    if (parsedLimit) {
      limitNum = Number.parseInt(parsedLimit, 10);
      if (!Number.isFinite(limitNum) || limitNum < 1) {
        setError("Limit must be a positive number");
        return;
      }
    }

    setLoading(true);
    setError(null);
    setJob(null);
    stopPolling();

    const result = await startImportFromUrlAction(trimmed, {
      playlistId,
      limit: limitNum,
    });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    await pollJob(result.jobId);
    pollRef.current = setInterval(() => {
      void pollJob(result.jobId);
    }, POLL_MS);
  }, [limit, playlistId, pollJob, stopPolling, url]);

  const progressLabel =
    job && job.total > 0
      ? `Importing ${job.completed} / ${job.total}…`
      : job?.status === "processing"
        ? "Starting import…"
        : null;

  return {
    url,
    setUrl,
    limit,
    setLimit,
    loading,
    error,
    job,
    progressLabel,
    startImport,
    reset,
  };
};

export type UseUrlImportReturn = ReturnType<typeof useUrlImport>;
