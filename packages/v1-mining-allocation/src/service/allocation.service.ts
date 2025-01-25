import { type AllocationType, Mining, calculateAllocation } from "@intmax2-function/shared";
import { logAllocationResults } from "../lib/log";
import { processCirculation } from "./circulation.service";
import { processNonEligibleRewardCases, processRewardCases } from "./reward.service";

export const processAllocation = async (
  startBlockNumber: bigint,
  endBlockNumber: bigint,
  term: number,
  allocationType: AllocationType,
) => {
  const miningService = new Mining();
  const minings = await miningService.fetchMinings({
    startBlockNumber: Number(startBlockNumber),
    endBlockNumber: Number(endBlockNumber),
    isEligible: true,
  });

  const miningEntries = await processCirculation(miningService, minings);
  const {
    nonCirculationMiningEntries: eligibleMinings,
    circulationMiningEntries: nonEligibleMinings,
    newCirculationAddresses,
  } = miningEntries;
  const uniqueMiningAddresses = [...new Set(eligibleMinings.map((mining) => mining.address))];
  const minerMiningDetails = await fetchMinerMiningDetails(uniqueMiningAddresses, miningService);

  const rewardResults = await processRewardCases(
    eligibleMinings,
    minerMiningDetails,
    allocationType,
  );
  if (nonEligibleMinings.length > 0) {
    const nonEligibleRewardResults = await processNonEligibleRewardCases(
      nonEligibleMinings,
      allocationType,
    );
    rewardResults.push(...nonEligibleRewardResults);
  }

  const { allocations, burnAmount } = calculateAllocation({
    term,
    minings: rewardResults,
    options: { type: allocationType },
  });

  await miningService.updateMiningsBatch([...allocations]);

  logAllocationResults(allocations, startBlockNumber, endBlockNumber);

  return { allocations, burnAmount, newCirculationAddresses };
};

export const fetchMinerMiningDetails = async (minerAddresses: string[], miningService: Mining) => {
  const miningQueries = minerAddresses.map(async (address) => {
    const eligibleMinings = await miningService.fetchMinings({ address, isEligible: true });
    return {
      address,
      eligibleMinings,
    };
  });

  const results = await Promise.all(miningQueries);
  return results;
};
