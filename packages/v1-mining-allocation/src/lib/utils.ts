import {
  type AllocationType,
  FIRESTORE_DOCUMENTS,
  getBlockNumbers,
} from "@intmax2-function/shared";
import { addDays, differenceInDays, subDays } from "date-fns";
import { getCurrentUTCDate, getUTCDateAndTimestamps } from "./date";

export const generateDayRangeArray = (start: Date, end: Date): number[] => {
  const daysArray: number[] = [];
  const currentDateUTC = getCurrentUTCDate();
  let tempDate = new Date(start);

  while (tempDate <= end) {
    const daysDiff = differenceInDays(currentDateUTC, tempDate);
    daysArray.push(daysDiff);
    tempDate = addDays(tempDate, 1);
  }

  return daysArray.sort((a, b) => b - a);
};

export const getDateAndStartAndBlockNumber = async (daysAgo: number) => {
  const { date, startTimestamp, endTimestamp } = getUTCDateAndTimestamps(daysAgo);
  const [startBlockNumber, endBlockNumber] = await getBlockNumbers(startTimestamp, endTimestamp);
  const previousDate = subDays(new Date(date), 1).toISOString().split("T")[0];

  return {
    startDate: date,
    previousDate,
    startBlockNumber,
    endBlockNumber,
  };
};

export const getAllocationDocId = (allocationType: AllocationType): string => {
  return allocationType === "short"
    ? FIRESTORE_DOCUMENTS.SHORT_TERM_MINING_ALLOCATIONS
    : FIRESTORE_DOCUMENTS.LONG_TERM_MINING_ALLOCATIONS;
};
