import type { Abi, Account } from "viem";
import type { FirebaseTimestamp } from "./utils";

export interface BaseEvent {
  name: string;
  address: string;
  blockNumber: bigint;
  blockTimestamp: string;
}

export interface GetDepositData {
  depositHash: string;
  sender: string;
  isRejected: boolean;
}

export interface DepositEvent extends BaseEvent {
  args: DepositEventLog;
}

export interface DepositEventLog {
  depositId: bigint;
  sender: string;
  recipientSaltHash: string;
  tokenIndex: number;
  amount: bigint;
  depositedAt: bigint;
}

export interface DepositLogDataWithBlockNumber extends DepositEventLog {
  blockNumber: bigint;
}

export interface V1DepositData {
  depositId: string;
  depositHash: string;
  depositedAt: FirebaseTimestamp;
  blockNumber: number;
  address: string;
  amount: string;
  term: number;
  points: number;
}

interface DepositsAnalyzedAndProcessedEventLog {
  upToDepositId: bigint;
  rejectedIndices: bigint[];
  depositHashed: string[];
}

export interface DepositsAnalyzedAndProcessedEvent extends BaseEvent {
  args: DepositsAnalyzedAndProcessedEventLog;
}

export interface WithdrawnEvent extends BaseEvent {
  args: {
    recipient: string;
    nullifier: string;
    tokenIndex: number;
    amount: bigint;
  };
}

export interface ContractCallParameters {
  contractAddress: `0x${string}`;
  abi: Abi;
  functionName: string;
  account: Account;
  args: any[];
}

export interface ContractCallOptions {
  value?: bigint;
  nonce?: number;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

export interface RetryOptions {
  nonce?: number | null;
  maxFeePerGas: bigint | null;
  maxPriorityFeePerGas: bigint | null;
}

export interface TransactionParameters {
  functionName: string;
  args: unknown[];
  contractAddress: `0x${string}`;
  abi: Abi;
  transactionMaxRetries: number;
}

export interface DepositLeafInsertedEvent {
  args: {
    depositIndex: number;
    depositHash: string;
  };
  blockNumber: bigint;
}
