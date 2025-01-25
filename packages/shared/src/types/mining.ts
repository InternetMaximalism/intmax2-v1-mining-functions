import type { RewardTableKeys } from "./allocation";
import type { V1DepositData } from "./blockchain";
import type { FirebaseTimestamp } from "./utils";

export interface MiningInput {
  depositId: string;
  depositHash: string;
  depositedAt: FirebaseTimestamp;
  blockNumber: number;
  address: string;
  amount: string;
  term: number;
  points: number;
  isEligible: boolean;
  rejectReason?: RejectReason | null;
}

export interface MiningUpdateInput {
  depositId: string;
  isEligible: boolean;
  rejectReason?: RejectReason | null;
  shortTermAllocation?: number;
  longTermAllocation?: number;
  rewardCase?: {
    shortTerm?: RewardTableKeys;
    longTerm?: RewardTableKeys;
  };
}

export interface MiningData {
  depositId: string;
  depositHash: string;
  depositedAt: FirebaseTimestamp;
  blockNumber: number;
  address: string;
  amount: string;
  term: number;
  points: number;
  isEligible: boolean;
  rejectReason?: RejectReason | null;
  shortTermAllocation?: number;
  longTermAllocation?: number;
  rewardCase?: {
    shortTerm?: RewardTableKeys;
    longTerm?: RewardTableKeys;
  };
}

export interface MiningFilters {
  address?: string;
  startBlockNumber?: number;
  endBlockNumber?: number;
  isEligible?: boolean;
}

export enum RejectReason {
  ALREADY_IN_CIRCULATION = "Address is already in db circulation.",
  INTMAX_LIQUIDITY_CONTRACT = "INTMAX Liquidity contract address found in from addresses.",
  IN_CIRCULATION = "Address is in circulation.",
  CHILD_IN_CIRCULATION = "Child address is in circulation.",
}

export interface MiningEntries extends CategorizedMiningEntries {
  newCirculationAddresses: string[];
}

export interface EligibleMiningEntry extends V1DepositData {
  rejectReason?: RejectReason | null;
  rewardCase?: {
    shortTerm?: RewardTableKeys;
    longTerm?: RewardTableKeys;
  };
}

export interface CategorizedMiningEntries {
  nonCirculationMiningEntries: MiningData[];
  circulationMiningEntries: MiningData[];
}
