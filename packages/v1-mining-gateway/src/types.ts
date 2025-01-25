import type { V1MiningWithdrawValidationType } from "@intmax2-function/shared";
import { Context } from "hono";
import { RESTRICTED_COUNTRY_CODES } from "./constants";

// job
type JobStatus = "pending" | "processing" | "failed" | "queued";

export interface Job {
  address: string;
  jobId: string;
  status: JobStatus;
  process: (job: Job) => Promise<void>;
}

export interface ProofResponse {
  status: string;
}

export interface ExtendedContext extends Context {
  requestStream?: ReadableStream;
  proxyStream?: ReadableStream;
}

export interface GasFees {
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
}

export type RestrictedCountryCode = keyof typeof RESTRICTED_COUNTRY_CODES;

// withdrawal
type WithdrawalJobStatus = "pending" | "processing" | "completed" | "failed";

export interface WithdrawalJob {
  id: string;
  data: V1MiningWithdrawValidationType;
  createdAt: number;
}

export interface WithdrawalJobResult {
  status: WithdrawalJobStatus;
  transactionHash?: string;
  createdAt: number;
  completedAt?: number;
}

// cache
export interface CacheEntry {
  body: string;
  status: number;
  statusText: string;
  headers: [string, string][];
}
