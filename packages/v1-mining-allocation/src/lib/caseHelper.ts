import { type MiningData, getTimestamp } from "@intmax2-function/shared";
import type { Pattern } from "../types";
import {
  checkCompletedWithinTwoWeek,
  checkSimilarTimingDeposits,
  hasHighFrequencyDeposits,
} from "./miningPatternAnalysis";

export const getRelevantChunk = (
  details: MiningData[],
  depositId: string,
  chunkSize: number,
): MiningData[] => {
  const chunks: MiningData[][] = [];
  for (let i = 0; i < details.length; i += chunkSize) {
    chunks.push(details.slice(i, i + chunkSize));
  }
  const relevantChunk = chunks.find((chunk) => chunk.some((item) => item.depositId === depositId));
  return relevantChunk || [];
};

export const isEligible = (miningDetails: MiningData[]) => {
  return miningDetails.every((mining) => mining.isEligible);
};

export const sortByTimestamp = (miningDetails: MiningData[]) => {
  return [...miningDetails].sort(
    (a, b) => getTimestamp(a.depositedAt) - getTimestamp(b.depositedAt),
  );
};

export const LESS_PATTERNS = [
  {
    name: "highFrequency",
    check: hasHighFrequencyDeposits,
  },
  {
    name: "similarTiming",
    check: checkSimilarTimingDeposits,
  },
];

export const STANDARD_PATTERNS = [
  ...LESS_PATTERNS,
  {
    name: "twoWeekCompletion",
    check: (details: MiningData[]) => !checkCompletedWithinTwoWeek(details),
  },
];

export const checkPatterns = (details: MiningData[], patterns: Pattern[]) => {
  return patterns.some(({ check }) => check(details));
};
