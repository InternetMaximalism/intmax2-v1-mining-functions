import { type DepositEventLog, logger, sleep } from "@intmax2-function/shared";
import { ADDRESS_BATCH_SIZE, AML_WAIT_TIME } from "../constants";
import type { TargetProcessedResult } from "../types";

const processInBatches = async (
  logs: DepositEventLog[],
  processFunction: (
    addresses: string[],
  ) => Promise<{ address: string; amlTargetAddress: string }[]>,
): Promise<TargetProcessedResult[]> => {
  const results: TargetProcessedResult[] = [];
  const totalBatches = Math.ceil(logs.length / ADDRESS_BATCH_SIZE);

  for (let i = 0; i < logs.length; i += ADDRESS_BATCH_SIZE) {
    const batch = logs.slice(i, i + ADDRESS_BATCH_SIZE);
    const currentBatch = Math.floor(i / ADDRESS_BATCH_SIZE) + 1;

    logger.info(`processInBatches processing batch ${currentBatch} of ${totalBatches}`);

    const addresses = batch.map(({ sender }) => sender);
    const processResults = await processFunction(addresses);

    const batchResults = batch.map((log) => {
      const processResult = processResults.find((result) => result.address === log.sender);
      return {
        ...log,
        amlTargetAddress: processResult?.amlTargetAddress || log.sender,
      };
    });

    results.push(...batchResults);

    if (currentBatch < totalBatches) {
      await sleep(AML_WAIT_TIME);
    }
  }

  return results;
};

export const processBatches = (logs: DepositEventLog[]): Promise<TargetProcessedResult[]> =>
  processInBatches(logs, async (addresses) =>
    addresses.map((address) => ({ address, amlTargetAddress: address })),
  );
