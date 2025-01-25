import {
  AllocationType,
  BLOCK_RANGE_MINIMUM,
  DEPOSIT_TREE_HEIGHT,
  DepositLeafInsertedEvent,
  DepositTree,
  ELIGIBLE_TREE_HEIGHT,
  EligibleLeaf,
  EligibleTree,
  INTMAX_TOKEN_DECIMALS,
  Mining,
  type MiningData,
  createNetworkClient,
  fetchEvents,
  v1DepositLeafInsertedEvent,
} from "@intmax2-function/shared";
import { parseUnits } from "viem";
import {
  NETWORK_TYPE,
  V1_INT1_CONTRACT_ADDRESS,
  V1_INT1_CONTRACT_DEPLOYED_BLOCK,
} from "../constants";
import { logTreeStats } from "../lib/log";
import type { AllocationWithIndex, EligibleData } from "../types";

export const generateMerkleTrees = async (endBlockNumber: bigint) => {
  const [{ allocations }, depositLeafInsertedEvents] = await Promise.all([
    fetchEligibleAllocations(endBlockNumber),
    fetchDepositLeafInsertedEvents(),
  ]);

  const endDepositLeafInsertedBlockNumber = await fetchEndDepositLeafInsertedBlockNumber(
    allocations,
    depositLeafInsertedEvents,
    endBlockNumber,
  );

  const indexedAllocations = createIndexedAllocations(allocations, depositLeafInsertedEvents);

  const depositTree = generateDepositTree(depositLeafInsertedEvents);
  const shortTermEligibleTree = generateEligibleTree(indexedAllocations, "short");
  const longTermEligibleTree = generateEligibleTree(indexedAllocations, "long");

  return {
    depositTree,
    shortTermEligibleTree,
    longTermEligibleTree,
    endDepositLeafInsertedBlockNumber,
  };
};

const fetchEligibleAllocations = async (endBlockNumber: bigint) => {
  const mining = new Mining();
  const allocations = await mining.fetchMinings({
    startBlockNumber: Number(V1_INT1_CONTRACT_DEPLOYED_BLOCK),
    endBlockNumber: Number(endBlockNumber),
  });
  const latestMining = await mining.getLatestMining();

  const sortedAllocations = [...allocations].sort(
    (a, b) => Number(a.depositId) - Number(b.depositId),
  );

  return { allocations: sortedAllocations, latestMining };
};

const fetchDepositLeafInsertedEvents = async () => {
  const ethereumClient = createNetworkClient(NETWORK_TYPE);
  const currentBlockNumber = await ethereumClient.getBlockNumber();
  const fromBlockNumber = BigInt(V1_INT1_CONTRACT_DEPLOYED_BLOCK);

  const depositLeafInsertedEvents = await fetchEvents<DepositLeafInsertedEvent>(ethereumClient, {
    startBlockNumber: fromBlockNumber,
    endBlockNumber: currentBlockNumber,
    blockRange: BLOCK_RANGE_MINIMUM,
    contractAddress: V1_INT1_CONTRACT_ADDRESS,
    eventInterface: v1DepositLeafInsertedEvent,
  });

  return depositLeafInsertedEvents;
};

const fetchEndDepositLeafInsertedBlockNumber = async (
  allocations: MiningData[],
  depositLeafInsertedEvents: DepositLeafInsertedEvent[],
  endBlockNumber: bigint,
) => {
  if (allocations.length === 0) {
    return endBlockNumber;
  }

  const lastAllocation = allocations[allocations.length - 1];
  const lastDepositHash = lastAllocation.depositHash;
  if (!lastDepositHash) {
    throw new Error("Missing deposit hash in end allocation");
  }

  const lastEvent = depositLeafInsertedEvents.find(
    (event) => event.args.depositHash === lastDepositHash,
  );
  if (!lastEvent) {
    throw new Error("Cannot find leaf insertion event for last event");
  }

  return lastEvent.blockNumber;
};

const createIndexedAllocations = (
  allocations: MiningData[],
  depositLeafInsertedEvents: DepositLeafInsertedEvent[],
) => {
  const eventArgs = depositLeafInsertedEvents.map((event) => event.args);

  const indexedAllocations = allocations.map((allocation) => {
    const { depositId, depositHash } = allocation;
    const matchingEvents = eventArgs.filter((event) => event.depositHash === depositHash);

    if (matchingEvents.length === 0) {
      throw new Error(`Missing leaf insertion event for deposit: ${depositId}`);
    }
    const depositIndex = Math.min(...matchingEvents.map((event) => event.depositIndex));

    return {
      ...allocation,
      depositIndex,
    };
  });

  return indexedAllocations;
};

const generateDepositTree = (depositLeafInsertedEvents: DepositLeafInsertedEvent[]) => {
  const depositLeafHashes = depositLeafInsertedEvents.map(
    (event) => event.args.depositHash as `0x${string}`,
  );
  const depositTree = new DepositTree(DEPOSIT_TREE_HEIGHT, depositLeafHashes);
  return depositTree;
};

const generateEligibleTree = (
  indexedAllocations: AllocationWithIndex[],
  allocationType: AllocationType,
) => {
  const eligibleData = extractEligibleData(indexedAllocations, allocationType);

  logTreeStats(eligibleData);

  const eligibleLeaves = eligibleData.map(({ depositIndex, amount }) => {
    const eligibleLeaf = new EligibleLeaf(depositIndex, amount);
    return eligibleLeaf;
  });
  const eligibleTree = new EligibleTree(ELIGIBLE_TREE_HEIGHT, eligibleLeaves);

  return eligibleTree;
};

const extractEligibleData = (
  allocations: AllocationWithIndex[],
  termType: AllocationType,
): EligibleData[] => {
  const eligibleData = allocations
    .map(({ depositIndex, shortTermAllocation, longTermAllocation }) => {
      const allocation = (termType === "short" ? shortTermAllocation : longTermAllocation) ?? 0;
      if (allocation === 0) {
        return null;
      }

      const amount = parseUnits(allocation.toString(), INTMAX_TOKEN_DECIMALS);
      return { depositIndex, amount };
    })
    .filter((data): data is EligibleData => data !== null);
  return eligibleData;
};
