import { logger } from "@intmax2-function/shared";
import { MAX_CONCURRENT_JOBS } from "../constants";
import type { Job } from "../types";

export class JobQueue {
  private static instance: JobQueue | undefined;
  private activeJobs: Map<string, Job> = new Map();
  private queuedJobs: Job[] = [];
  private readonly baseJobTime = 60_000;
  private readonly additionalJobTime = 10_000;

  constructor(private maxConcurrentJobs: number = MAX_CONCURRENT_JOBS) {}

  public static getInstance() {
    if (!this.instance) {
      this.instance = new JobQueue();
    }
    return this.instance;
  }

  addJob(job: Job) {
    const estimatedTime = this.calculateEstimatedTime();

    if (this.maxConcurrentJobs > this.activeJobs.size) {
      this.startJob(job);
    } else {
      job.status = "queued";
      this.queuedJobs.push(job);
    }

    return estimatedTime;
  }

  getJobByAddress(address: string) {
    const activeJob = this.activeJobs.get(address);
    if (activeJob) {
      return activeJob;
    }

    const queuedJob = this.queuedJobs.find((job) => job.address === address);
    return queuedJob ? queuedJob : null;
  }

  getJobByJobId(jobId: string) {
    const activeJob = this.findJobByJobId(jobId);
    if (activeJob) {
      return activeJob;
    }

    const queuedJob = this.queuedJobs.find((job) => job.jobId === jobId);
    return queuedJob ? queuedJob : null;
  }

  private findJobByJobId(jobId: string) {
    for (const [_, job] of this.activeJobs) {
      if (job.jobId === jobId) {
        return job;
      }
    }
    return null;
  }

  private startJob(job: Job) {
    job.status = "processing";
    this.activeJobs.set(job.address, job);
    this.processJobs(job);
  }

  private async processJobs(job: Job) {
    try {
      await job.process(job);
    } catch (error) {
      logger.error(`Error processing job ${job.jobId}: ${error}`);
    } finally {
      this.activeJobs.delete(job.address);
      this.checkQueuedJobs();
    }
  }

  private checkQueuedJobs() {
    if (this.queuedJobs.length > 0 && this.activeJobs.size < this.maxConcurrentJobs) {
      const nextJob = this.queuedJobs.shift();
      if (nextJob) {
        this.startJob(nextJob);
      }
    }
  }

  private calculateEstimatedTime() {
    const totalJobs = this.activeJobs.size + this.queuedJobs.length;
    const estimatedTime = this.baseJobTime + this.additionalJobTime * totalJobs;
    return estimatedTime;
  }
}
