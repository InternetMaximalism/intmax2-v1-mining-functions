import {
  BLOCK_RANGE_MINIMUM,
  type DepositEvent,
  type DepositsAnalyzedAndProcessedEvent,
  type EventData,
  fetchEvents,
  getStartBlockNumber,
  logger,
  v1DepositedEvent,
  v1DepositsAnalyzedAndProcessedEvent,
  v1Int1Abi,
  validateBlockRange,
} from "@intmax2-function/shared";
import type { Abi, PublicClient } from "viem";
import { V1_INT1_CONTRACT_ADDRESS, V1_INT1_CONTRACT_DEPLOYED_BLOCK } from "../constants";

export const getV1DepositedEvent = async (
  ethereumClient: PublicClient,
  currentBlockNumber: bigint,
  lastProcessedEvent: EventData | null,
) => {
  try {
    const startBlockNumber = getStartBlockNumber(
      lastProcessedEvent,
      V1_INT1_CONTRACT_DEPLOYED_BLOCK,
    );
    validateBlockRange("v1INT1 v1Deposited events", startBlockNumber, currentBlockNumber);

    const depositEvents = await fetchEvents<DepositEvent>(ethereumClient, {
      startBlockNumber,
      endBlockNumber: currentBlockNumber,
      blockRange: BLOCK_RANGE_MINIMUM,
      contractAddress: V1_INT1_CONTRACT_ADDRESS,
      eventInterface: v1DepositedEvent,
    });
    const depositEventLogs = depositEvents.map((event) => event.args);

    if (depositEventLogs.length !== 0 && lastProcessedEvent === null) {
      const lastProcessedDepositId = (await ethereumClient.readContract({
        address: V1_INT1_CONTRACT_ADDRESS,
        abi: v1Int1Abi as Abi,
        functionName: "getLastProcessedDepositId",
        args: [],
        blockNumber: currentBlockNumber,
      })) as bigint;

      const filteredLogs = depositEventLogs.filter((log) => log.depositId > lastProcessedDepositId);
      return filteredLogs;
    }

    return depositEventLogs;
  } catch (error) {
    logger.error(
      `Error fetching v1Deposited events: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    throw error;
  }
};
export const getV1DepositsAnalyzedAndProcessedEvent = async (
  ethereumClient: PublicClient,
  currentBlockNumber: bigint,
  lastProcessedEvent: EventData | null,
) => {
  try {
    const startBlockNumber = getStartBlockNumber(
      lastProcessedEvent,
      V1_INT1_CONTRACT_DEPLOYED_BLOCK,
    );
    validateBlockRange(
      "v1INT1 v1DepositsAnalyzedAndProcessedEvent events",
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
    const depositsAnalyzedAndProcessedEventLogs = depositsAnalyzedAndProcessedEvents.map(
      (event) => event.args,
    );

    const rejectedIndices = depositsAnalyzedAndProcessedEventLogs.map((log) => log.rejectedIndices);

    return rejectedIndices.flat();
  } catch (error) {
    logger.error(
      `Error fetching v1DepositsAnalyzedAndProcessedEvent events: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    throw error;
  }
};
