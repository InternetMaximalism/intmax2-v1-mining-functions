import { BLOCK_RANGE_MAX } from "../constants";
import type { EventData } from "../types";

export const getStartBlockNumber = (
  lastProcessedEvent: EventData | null,
  deployedBlockNumber: number,
) => {
  return BigInt(
    lastProcessedEvent?.lastBlockNumber
      ? lastProcessedEvent.lastBlockNumber + 1
      : deployedBlockNumber,
  );
};

export const calculateOptimalFromBlockNumber = (
  fromBlockNumber: bigint,
  currentBlock: bigint,
  blockRangeLimit = BLOCK_RANGE_MAX,
): bigint => {
  const minimumStartBlock = currentBlock - blockRangeLimit;

  return fromBlockNumber > minimumStartBlock ? fromBlockNumber : minimumStartBlock;
};
