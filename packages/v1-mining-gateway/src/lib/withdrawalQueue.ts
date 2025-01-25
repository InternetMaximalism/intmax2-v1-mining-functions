import { logger } from "@intmax2-function/shared";
import type { WithdrawalJob, WithdrawalJobResult } from "../types";
import { submitWithdrawProofToContract } from "./submitProof";

export class WithdrawalQueue {
  private static instance: WithdrawalQueue | undefined;
  private queue: WithdrawalJob[] = [];
  private processing = false;
  private jobStatuses: Map<string, WithdrawalJobResult> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private queueInterval: NodeJS.Timeout | null = null;
  private readonly QUEUE_CHECK_INTERVAL = 1000;

  private constructor() {
    this.startQueueProcessor();
    this.startCleanupInterval();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new WithdrawalQueue();
    }
    return this.instance;
  }

  private startQueueProcessor() {
    this.queueInterval = setInterval(() => {
      void this.processQueue();
    }, this.QUEUE_CHECK_INTERVAL);

    logger.info("Started withdrawal queue processor");
    void this.processQueue();
  }

  enqueue(id: string, data: any) {
    const now = Date.now();
    this.queue.push({ id, data, createdAt: now });
    this.jobStatuses.set(id, { status: "pending", createdAt: now });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    const job = this.queue.shift();

    if (job) {
      try {
        this.jobStatuses.set(job.id, { status: "processing", createdAt: job.createdAt });
        const transactionHash = await this.processJob(job);
        this.jobStatuses.set(job.id, {
          status: "completed",
          createdAt: job.createdAt,
          transactionHash,
          completedAt: Date.now(),
        });
      } catch (error) {
        logger.error(`Error processing job ${job.id}: ${(error as Error).message}`);
        this.jobStatuses.set(job.id, { status: "failed", createdAt: job.createdAt });
      }
    }

    this.processing = false;
  }

  private async processJob(job: WithdrawalJob) {
    logger.info(`Processing job ${job.id}`);
    const transactionHash = await submitWithdrawProofToContract(job.data);
    logger.info(`Completed job ${job.id}`);

    return transactionHash;
  }

  getJob(id: string) {
    return this.jobStatuses.get(id) || { status: "not_found" };
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getJobStatuses() {
    return Array.from(this.jobStatuses.entries());
  }

  private startCleanupInterval() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  private cleanup() {
    logger.info(`Running cleanup ${this.getJobStatuses().length} jobs`);

    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const twoHourAgo = Date.now() - 2 * 60 * 60 * 1000;

    for (const [id, jobResult] of this.jobStatuses.entries()) {
      if (jobResult.status !== "completed" && jobResult.createdAt < twoHourAgo) {
        this.jobStatuses.delete(id);
        logger.info(`Cleaned up job (not completed) ${id}`);
      }

      if (
        jobResult.status === "completed" &&
        jobResult.completedAt &&
        jobResult.completedAt < oneHourAgo
      ) {
        this.jobStatuses.delete(id);
        logger.info(`Cleaned up job ${id}`);
      }
    }
  }

  public dispose() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.queueInterval) {
      clearInterval(this.queueInterval);
    }
    logger.info("Queue disposed successfully");
  }
}
