import { type MiningData, logger } from "@intmax2-function/shared";

export const logAllocationResults = (
  allocations: MiningData[],
  startBlockNumber: bigint,
  endBlockNumber: bigint,
) => {
  if (allocations.length === 0) {
    logger.info(`No allocations found for block range ${startBlockNumber} - ${endBlockNumber}`);
    return;
  }

  logger.info(
    `Allocations ${allocations.length} processed for block range ${startBlockNumber} - ${endBlockNumber}`,
  );
};
