import { logger, v1CreateProofValidation } from "@intmax2-function/shared";
import type { Context } from "hono";
import { JobQueue } from "../lib/jobQueue";
import { processJob } from "../lib/process";
import { handleProxyRequest, streamToJSON } from "../lib/proxy";
import { processError } from "../lib/utils";
import type { ExtendedContext, Job } from "../types";

export const startProof = async (c: ExtendedContext) => {
  const body = await streamToJSON(c.requestStream!);
  const { address } = v1CreateProofValidation.parse(body);

  const jobQueue = JobQueue.getInstance();
  const existedJob = jobQueue.getJobByAddress(address);

  if (existedJob) {
    return {
      jobId: existedJob.jobId,
      status: existedJob.status,
    };
  }

  const response = await handleProxyRequest(c);
  const clonedResponse = response.clone();
  const { jobId }: { jobId: string } = await clonedResponse.json();

  const job = {
    address,
    jobId,
    status: "pending" as const,
    process: async (job: Job) => {
      logger.info(`Processing job ${job.jobId}`);
      await processJob(c, job);
      logger.info(`Job ${job.jobId} completed`);
    },
  };

  const estimatedTime = jobQueue.addJob(job);

  return {
    jobId,
    status: "pending",
    estimatedTime,
  };
};

export const getProof = async (c: Context, jobId: string) => {
  const jobQueue = JobQueue.getInstance();
  const job = jobQueue.getJobByJobId(jobId);

  if (job) {
    return {
      jobId,
      status: job.status,
    };
  }

  const response = await handleProxyRequest(c);

  if (response.status !== 200) {
    const clonedResponse = response.clone();
    const text = await clonedResponse.text();
    processError(response.status, text.replace(/\n/g, "").trim());
  }

  const clonedResponse = response.clone();
  const proofData = await clonedResponse.json();

  return {
    jobId,
    ...proofData,
  };
};
