import { Queue } from "bullmq";
import IORedis from "ioredis";
import { config } from "../lib/config.ts";

export const IMPORT_QUEUE_NAME = "import-jobs";

export const redisConnection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 500, 5000),
});

redisConnection.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

export interface ImportQueuePayload {
  jobId: string;
}

export const importQueue = new Queue<ImportQueuePayload>(IMPORT_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 100,
    removeOnFail: 100,
  },
});

export const enqueueImportJob = async (jobId: string): Promise<void> => {
  await importQueue.add(
    "process-import",
    { jobId },
    { jobId: `import-${jobId}` },
  );
};
