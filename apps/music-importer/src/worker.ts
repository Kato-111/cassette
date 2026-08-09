import { Worker } from "bullmq";
import { config } from "./lib/config.ts";
import {
  IMPORT_QUEUE_NAME,
  redisConnection,
  type ImportQueuePayload,
} from "./queue/import-queue.ts";
import { processImportJob } from "./queue/process-job.ts";

const worker = new Worker<ImportQueuePayload>(
  IMPORT_QUEUE_NAME,
  async (job) => {
    await processImportJob(job.data.jobId);
  },
  {
    connection: redisConnection,
    concurrency: config.maxConcurrentImports,
  },
);

worker.on("error", (err) => {
  console.error("Import worker error:", err.message);
});

worker.on("failed", (job, err) => {
  console.error(`Import job ${job?.data.jobId ?? "unknown"} failed:`, err.message);
});

worker.on("completed", (job) => {
  console.log(`Import job ${job.data.jobId} completed`);
});

console.log(
  `Import worker started (jobs=${config.maxConcurrentImports}, items=${config.maxConcurrentItems})`,
);
