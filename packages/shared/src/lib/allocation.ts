import {
  MINING_FIRST_TERM_DURATION,
  REWARD_TABLE,
  SHORT_TERM_RATIO,
  TERM_TOKEN_ALLOCATION,
} from "../constants";
import type { AllocationInput, MiningData } from "../types";

export const getCurrentTermDuration = (term: number) => {
  const currentTermDuration = MINING_FIRST_TERM_DURATION * 2 ** (term - 1);
  return currentTermDuration;
};

export const calculateAllocation = ({ term, minings, options }: AllocationInput) => {
  const isShortTerm = options.type === "short";

  const ratio = isShortTerm ? SHORT_TERM_RATIO : 1 - SHORT_TERM_RATIO;

  const allocations: MiningData[] = [];
  let dailyBurnAmount = 0;

  const currentTermDuration = getCurrentTermDuration(term);
  const dailyAllocation = (TERM_TOKEN_ALLOCATION / currentTermDuration) * ratio;

  if (minings.length === 0) {
    dailyBurnAmount = dailyAllocation;
  }

  const totalDailyPoints = minings.reduce(
    (sum, mining) =>
      sum +
      mining.points *
        REWARD_TABLE[isShortTerm ? mining.rewardCase?.shortTerm! : mining.rewardCase?.longTerm!][
          isShortTerm ? "shortTermReward" : "longTermReward"
        ],
    0,
  );

  minings.forEach((mining) => {
    const { points } = mining;
    const rewardRatio =
      REWARD_TABLE[isShortTerm ? mining.rewardCase?.shortTerm! : mining.rewardCase?.longTerm!][
        isShortTerm ? "shortTermReward" : "longTermReward"
      ];

    const userAllocation =
      totalDailyPoints === 0 ? 0 : ((points * rewardRatio) / totalDailyPoints) * dailyAllocation;
    const roundedAllocation = Math.floor(userAllocation * 1000) / 1000;
    dailyBurnAmount += userAllocation - roundedAllocation;

    const baseAllocation = {
      ...mining,
      shortTermAllocation: isShortTerm ? roundedAllocation : mining.shortTermAllocation || 0,
      longTermAllocation: isShortTerm ? mining.longTermAllocation || 0 : roundedAllocation,
    };

    allocations.push(baseAllocation);
  });

  if (totalDailyPoints === 0) {
    dailyBurnAmount = dailyAllocation;
  }

  return {
    allocations,
    burnAmount: dailyBurnAmount,
  };
};
