import { type MiningData, config, getTimestamp } from "@intmax2-function/shared";
import { BigNumber } from "bignumber.js";
import { RUSH_PERIOD } from "../constants";
import { TransferCheck } from "./transferCheck";

const filterNonRushDeposits = (deposits: MiningData[]) =>
  deposits.filter((deposit) => {
    const depositTime = getTimestamp(deposit.depositedAt);
    return depositTime < RUSH_PERIOD.START || depositTime > RUSH_PERIOD.END;
  });

export const checkCompletedWithinTwoWeek = (miningDetails: MiningData[]) => {
  const TWO_WEEK = 14 * 24 * 60 * 60 * 1000;
  const firstMining = miningDetails[0];
  const lastMining = miningDetails[miningDetails.length - 1];

  if (config.NETWORK_TYPE === "ethereum") {
    return true;
  }

  return getTimestamp(lastMining.depositedAt) - getTimestamp(firstMining.depositedAt) <= TWO_WEEK;
};

export const hasHighFrequencyDeposits = (miningDetails: MiningData[]) => {
  const FOUR_HOURS = 4 * 60 * 60 * 1000;

  const filteredDeposits = filterNonRushDeposits(miningDetails);
  const sortedDeposits = [...filteredDeposits].sort(
    (a, b) => getTimestamp(a.depositedAt) - getTimestamp(b.depositedAt),
  );

  const blackGroups = new Set();

  for (let i = 0; i < sortedDeposits.length - 2; i++) {
    const baseDeposit = sortedDeposits[i];
    const baseTime = getTimestamp(baseDeposit.depositedAt);

    const groupDeposits = [baseDeposit];

    for (let j = i + 1; j < sortedDeposits.length; j++) {
      const compareDeposit = sortedDeposits[j];
      const compareTime = getTimestamp(compareDeposit.depositedAt);

      const timeDiff = compareTime - baseTime;

      if (timeDiff <= FOUR_HOURS) {
        groupDeposits.push(compareDeposit);
      } else {
        break;
      }
    }

    if (groupDeposits.length >= 3) {
      groupDeposits.forEach((deposit) => {
        blackGroups.add(deposit.depositId);
      });
    }
  }

  const isBlacklisted = blackGroups.size >= 5;
  return isBlacklisted;
};

export const checkSimilarTimingDeposits = (miningDetails: MiningData[]) => {
  const MINUTES_THRESHOLD = config.MINUTES_THRESHOLD;
  const REQUIRED_SIMILAR_COUNT = config.REQUIRED_SIMILAR_COUNT;
  const MS_PER_MINUTE = 60 * 1000;

  const filteredDeposits = filterNonRushDeposits(miningDetails);
  const sortedMinings = [...filteredDeposits].sort((a, b) => {
    return getTimestamp(a.depositedAt) - getTimestamp(b.depositedAt);
  });

  const intervals: number[] = [];
  for (let i = 0; i < sortedMinings.length - 1; i++) {
    const current = getTimestamp(sortedMinings[i].depositedAt);
    const next = getTimestamp(sortedMinings[i + 1].depositedAt);
    intervals.push((next - current) / MS_PER_MINUTE);
  }

  if (intervals.length < REQUIRED_SIMILAR_COUNT) {
    return false;
  }

  const sortedIntervals = Array.from(intervals.entries()).sort((a, b) => a[1] - b[1]);
  for (let i = 0; i < sortedIntervals.length - (REQUIRED_SIMILAR_COUNT - 1); i++) {
    const [, smallInterval] = sortedIntervals[i];
    const [, largeInterval] = sortedIntervals[i + (REQUIRED_SIMILAR_COUNT - 1)];
    if (largeInterval > 7 * 60) {
      continue;
    }

    if (largeInterval - smallInterval < 2 * MINUTES_THRESHOLD) {
      return true;
    }
  }

  return false;
};

export const checkOverThresholdReturn = async (address: string, miningDetails: MiningData[]) => {
  const totalMining = miningDetails.reduce(
    (acc, mining) => acc.plus(new BigNumber(mining.amount) || 0),
    new BigNumber(0),
  );
  const transferCheck = TransferCheck.getInstance();
  const ethPrice = transferCheck.addressTracer.getEthPrice();
  const totalDepositedUsdValue = totalMining.multipliedBy(ethPrice);

  const lastMining = miningDetails[miningDetails.length - 1];
  const sortedTransfers = await transferCheck.getSortedTransfersByMarketValue(
    address,
    lastMining.blockNumber,
  );
  const totalReturnedAmount = sortedTransfers.reduce(
    (acc, transfer) => acc.plus(transfer.totalUsdValueSent || 0),
    new BigNumber(0),
  );
  const returnRate = totalReturnedAmount.dividedBy(totalDepositedUsdValue).multipliedBy(100);
  return returnRate.isGreaterThanOrEqualTo(30);
};
