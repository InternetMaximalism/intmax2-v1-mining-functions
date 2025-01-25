import { REWARD_TABLE } from "../constants";
import type { MiningData } from "./mining";

export type AllocationType = "short" | "long";

export interface AllocationInput {
  term: number;
  minings: MiningData[];
  options: {
    type: AllocationType;
  };
}

export interface RewardCaseResult {
  address: string;
  amount: string;
  rewardCase: RewardTableKeys;
}

export type RewardTableKeys = keyof typeof REWARD_TABLE;
