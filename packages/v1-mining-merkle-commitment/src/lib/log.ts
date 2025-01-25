import { debugLog, logger } from "@intmax2-function/shared";
import type { DateInfo, EligibleData } from "../types";

export const logTreeStats = (eligibleData: EligibleData[]) => {
  const totalAmount = eligibleData.reduce((acc, { amount }) => acc + amount, BigInt(0)).toString();

  debugLog(`Number of eligible entries: ${eligibleData.length}`);
  debugLog(`Total eligibility amount: ${totalAmount}`);
};

export const logTreeInfo = (
  { twoWeekAgoAllocationDate }: DateInfo,
  depositTreeRoot: string,
  shortTermEligibleTreeRoot: string,
  longTermEligibleTreeRoot: string,
  endDepositLeafInsertedBlockNumber: bigint,
) => {
  logger.info(
    `
      previousWeekAllocationTask: ${twoWeekAgoAllocationDate}
      depositTreeRoot: ${depositTreeRoot}
      shortTermEligibleTreeRoot: ${shortTermEligibleTreeRoot}
      longTermEligibleTreeRoot: ${longTermEligibleTreeRoot}
      endDepositLeafInsertedBlockNumber: ${endDepositLeafInsertedBlockNumber}`,
  );
};
