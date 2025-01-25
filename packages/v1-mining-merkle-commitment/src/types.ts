import { MiningData } from "@intmax2-function/shared";

export interface DateInfo {
  merkleCommitmentDate: string;
  twoWeekAgoAllocationDate: string;
}

export interface DepositWithIndex {
  depositId: bigint;
  depositHash: string;
  depositIndex: number;
}

export interface AllocationWithIndex extends MiningData {
  depositIndex: number;
}

export interface EligibleData {
  depositIndex: number;
  amount: bigint;
}

export interface TreeFile {
  folderPath: string;
  filename: string;
  buffer: Buffer;
}

export interface EncodedTrees {
  encodedDepositTree: ArrayBuffer;
  shortTermEncodedEligibleTree: ArrayBuffer;
  longTermEncodedEligibleTree: ArrayBuffer;
}
