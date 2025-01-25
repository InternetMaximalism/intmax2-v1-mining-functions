import {
  BLOCK_RANGE_MINIMUM,
  BLOCK_RANGE_MOST_RECENT,
  type DepositAnalyzedAndRelayedEventData,
  type DepositEvent,
  type DepositLogDataWithBlockNumber,
  type DepositsAnalyzedAndProcessedEvent,
  Mining,
  calculateOptimalFromBlockNumber,
  fetchEvents,
  logger,
  v1DepositedEvent,
  v1DepositsAnalyzedAndProcessedEvent,
  validateBlockRange,
} from "@intmax2-function/shared";
import type { PublicClient } from "viem";
import {
  DEPOSIT_EVENT_MAX_ATTEMPTS,
  V1_INT1_CONTRACT_ADDRESS,
  V1_INT1_CONTRACT_DEPLOYED_BLOCK,
} from "../constants";

export const getDepositIds = async (
  ethereumClient: PublicClient,
  currentBlockNumber: bigint,
  lastProcessedEvent: DepositAnalyzedAndRelayedEventData | null,
) => {
  const { startBlockNumber, lastUpToDepositId } = await getStartBlockInfo(lastProcessedEvent);
  validateBlockRange(
    "v1INT v1DepositsAnalyzedAndProcessed events",
    startBlockNumber,
    currentBlockNumber,
  );

  const depositsAnalyzedAndProcessedEvents = await fetchEvents<DepositsAnalyzedAndProcessedEvent>(
    ethereumClient,
    {
      startBlockNumber,
      endBlockNumber: currentBlockNumber,
      blockRange: BLOCK_RANGE_MINIMUM,
      contractAddress: V1_INT1_CONTRACT_ADDRESS,
      eventInterface: v1DepositsAnalyzedAndProcessedEvent,
    },
  );

  if (depositsAnalyzedAndProcessedEvents.length === 0) {
    return [];
  }

  const depositIds = generateDepositIds(depositsAnalyzedAndProcessedEvents, lastUpToDepositId);
  logger.info(
    `Generated deposit IDs: from ${depositIds[0]} to ${depositIds[depositIds.length - 1]}`,
  );

  return depositIds;
};

const generateDepositIds = (
  events: DepositsAnalyzedAndProcessedEvent[],
  lastUpToDepositId: number,
): number[] => {
  const latestEvent = events[events.length - 1];
  const upToDepositId = Number((latestEvent.args as { upToDepositId: bigint }).upToDepositId);

  const depositIds = Array.from(
    { length: upToDepositId - lastUpToDepositId },
    (_, index) => lastUpToDepositId + index + 1,
  );

  return depositIds;
};

const getStartBlockInfo = async (lastProcessedEvent: DepositAnalyzedAndRelayedEventData | null) => {
  if (lastProcessedEvent) {
    return {
      startBlockNumber: BigInt(lastProcessedEvent?.lastBlockNumber + 1),
      lastUpToDepositId: lastProcessedEvent.lastUpToDepositId ?? 0,
    };
  }

  const mining = new Mining();
  const latestMining = await mining.getLatestMining();

  if (!latestMining) {
    return {
      startBlockNumber: BigInt(V1_INT1_CONTRACT_DEPLOYED_BLOCK),
      lastUpToDepositId: 0,
    };
  }

  return {
    startBlockNumber: BigInt(latestMining.blockNumber + 1),
    lastUpToDepositId: Number(latestMining.depositId),
  };
};

export const getDepositLogs = async (
  ethereumClient: PublicClient,
  currentBlockNumber: bigint,
  depositIds: number[],
) => {
  const fromBlockNumber = await calculateDepositStartNumber(
    ethereumClient,
    currentBlockNumber,
    depositIds,
  );

  const depositEvents = await fetchEvents<DepositEvent>(ethereumClient, {
    startBlockNumber: fromBlockNumber,
    endBlockNumber: currentBlockNumber,
    blockRange: BLOCK_RANGE_MINIMUM,
    contractAddress: V1_INT1_CONTRACT_ADDRESS,
    eventInterface: v1DepositedEvent,
    args: {
      depositId: depositIds.map(BigInt),
    },
  });

  if (depositEvents.length !== depositIds.length) {
    logger.warn(`Expected ${depositIds.length} deposit events but found ${depositEvents.length}`);
    throw new Error("Mismatch between expected and actual deposit events");
  }

  return depositEvents.map(({ args, blockNumber }) => ({
    ...args,
    blockNumber,
  })) as DepositLogDataWithBlockNumber[];
};

const calculateDepositStartNumber = async (
  ethereumClient: PublicClient,
  currentBlockNumber: bigint,
  depositIds: number[],
) => {
  if (depositIds.length === 0) {
    throw new Error("No deposit IDs provided");
  }

  const fromBlockNumber = BigInt(V1_INT1_CONTRACT_DEPLOYED_BLOCK);
  let currentStartBlockNumber = calculateOptimalFromBlockNumber(
    fromBlockNumber,
    currentBlockNumber,
    BLOCK_RANGE_MINIMUM,
  );

  let attempts = 0;
  const minDepositId = Math.min(...depositIds);

  while (attempts < DEPOSIT_EVENT_MAX_ATTEMPTS) {
    const events = await fetchEvents<DepositEvent>(ethereumClient, {
      startBlockNumber: currentStartBlockNumber,
      endBlockNumber: currentBlockNumber,
      blockRange: BLOCK_RANGE_MOST_RECENT,
      contractAddress: V1_INT1_CONTRACT_ADDRESS,
      eventInterface: v1DepositedEvent,
      args: {
        depositId: [BigInt(minDepositId)],
      },
    });

    if (events.length > 0) {
      const minDepositBlockNumber = events[0].blockNumber;
      logger.debug(
        `calculateDepositStartNumber found deposit event at block ${minDepositBlockNumber}`,
      );
      return BigInt(minDepositBlockNumber);
    }

    currentStartBlockNumber -= BLOCK_RANGE_MOST_RECENT;
    attempts++;

    if (currentStartBlockNumber <= 0n) {
      throw new Error("Start block number would become negative");
    }
  }

  throw new Error("Failed to fetch v1Deposit events");
};
