import { type MiningData, type RewardCaseResult, config } from "@intmax2-function/shared";
import { STANDARD_MINING_SIZE } from "../constants";
import {
  LESS_PATTERNS,
  STANDARD_PATTERNS,
  checkPatterns,
  getRelevantChunk,
  isEligible,
  sortByTimestamp,
} from "../lib/caseHelper";
import { checkOverThresholdReturn } from "../lib/miningPatternAnalysis";

export const determineMiningRewardCase = async (
  miningData: MiningData,
  miningDetails: MiningData[],
): Promise<RewardCaseResult> => {
  const { address, amount } = miningData;
  const filteredDetails = miningDetails.filter((mining) => mining.amount === amount);

  if (filteredDetails.length < STANDARD_MINING_SIZE) {
    const rewardCase = analyzeLessMiningPattern(filteredDetails);
    return {
      address,
      rewardCase,
      amount,
    };
  }

  if (filteredDetails.length > STANDARD_MINING_SIZE) {
    return await analyzeOverMiningPattern(miningData, filteredDetails);
  }

  const rewardCase = await analyzeMiningPattern(address, filteredDetails);
  return {
    address,
    rewardCase,
    amount,
  };
};

const analyzeLessMiningPattern = (miningDetails: MiningData[]) => {
  if (!isEligible(miningDetails)) {
    return "case4";
  }

  const sortedDetails = sortByTimestamp(miningDetails);
  const hasCase3Pattern = checkPatterns(sortedDetails, LESS_PATTERNS);
  if (hasCase3Pattern) {
    return "case3";
  }

  if (config.NETWORK_TYPE === "ethereum") {
    return "case1";
  }

  return "case3";
};

const analyzeMiningPattern = async (address: string, miningDetails: MiningData[]) => {
  if (!isEligible(miningDetails)) {
    return "case4";
  }

  const sortedDetails = sortByTimestamp(miningDetails);
  const hasCase3Pattern = checkPatterns(sortedDetails, STANDARD_PATTERNS);
  if (hasCase3Pattern) {
    return "case3";
  }

  const isOverThreshold = await checkOverThresholdReturn(address, sortedDetails);
  if (isOverThreshold) {
    return "case2";
  }

  return "case1";
};

const analyzeOverMiningPattern = async (miningData: MiningData, filteredDetails: MiningData[]) => {
  const relevantChunk = getRelevantChunk(
    filteredDetails,
    miningData.depositId,
    STANDARD_MINING_SIZE,
  );
  return await determineMiningRewardCase(miningData, relevantChunk);
};
