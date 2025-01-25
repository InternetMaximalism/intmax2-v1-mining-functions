import {
  type AllocationType,
  type FirebaseTimestamp,
  type MiningData,
  type RewardCaseResult,
  getTimestamp,
} from "@intmax2-function/shared";
import { MAINNET_INITIAL_CASE_DATE } from "../constants";
import { fetchMinerMiningDetails } from "./allocation.service";
import { determineMiningRewardCase } from "./case.service";

const isInitialMining = (depositedAt: FirebaseTimestamp) => {
  return getTimestamp(depositedAt) < new Date(MAINNET_INITIAL_CASE_DATE).getTime();
};

const getRewardCaseKey = (type: AllocationType) => {
  return type === "short" ? "shortTerm" : "longTerm";
};

const applyRewardCase = (
  mining: MiningData,
  rewardCaseValue: string,
  allocationType: AllocationType,
): MiningData => {
  const rewardCaseKey = getRewardCaseKey(allocationType);

  if (rewardCaseKey === "longTerm") {
    const shortTermReward = mining.rewardCase?.shortTerm;
    if (!shortTermReward) {
      throw new Error("Short term reward is not set");
    }

    if (rewardCaseValue === "case1" && shortTermReward !== "case1") {
      return updateRewardCase(mining, rewardCaseKey, shortTermReward);
    }
  }

  return updateRewardCase(mining, rewardCaseKey, rewardCaseValue);
};

const updateRewardCase = (mining: MiningData, rewardCaseKey: string, rewardValue: string) => {
  return {
    ...mining,
    rewardCase: {
      ...mining.rewardCase,
      [rewardCaseKey]: rewardValue,
    },
  };
};

export const determineRewardCase = async (
  eligibleMining: MiningData,
  minerMiningDetails: Awaited<ReturnType<typeof fetchMinerMiningDetails>>,
  allocationType: AllocationType,
  rewardCases: RewardCaseResult[],
) => {
  const { depositedAt, address, amount } = eligibleMining;
  if (isInitialMining(depositedAt)) {
    return applyRewardCase(eligibleMining, "case1", allocationType);
  }

  const existingCase = rewardCases.find((rc) => rc.address === address && rc.amount === amount);
  if (existingCase) {
    return applyRewardCase(eligibleMining, existingCase.rewardCase, allocationType);
  }

  const miningDetails = minerMiningDetails.find((detail) => detail.address === address);
  const rewardCase = await determineMiningRewardCase(
    eligibleMining,
    miningDetails?.eligibleMinings ?? [],
  );
  rewardCases.push(rewardCase);

  return applyRewardCase(eligibleMining, rewardCase.rewardCase, allocationType);
};

export const processRewardCases = async (
  eligibleMinings: MiningData[],
  miningDetails: Awaited<ReturnType<typeof fetchMinerMiningDetails>>,
  allocationType: AllocationType,
) => {
  const rewardCases: RewardCaseResult[] = [];
  const rewardQueries = eligibleMinings.map(
    async (mining) => await determineRewardCase(mining, miningDetails, allocationType, rewardCases),
  );

  const rewardResults = await Promise.all(rewardQueries);
  return rewardResults;
};

export const processNonEligibleRewardCases = async (
  nonEligibleMinings: MiningData[],
  allocationType: AllocationType,
) => {
  const rewardQueries = nonEligibleMinings.map(async (mining) => {
    return applyRewardCase(mining, "case4", allocationType);
  });

  const rewardResults = await Promise.all(rewardQueries);
  return rewardResults;
};
