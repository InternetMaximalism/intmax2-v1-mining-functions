import { type AllocationType, TaskManager, logger, sleep } from "@intmax2-function/shared";
import { ALLOCATION_COMPLETED_SLEEP_TIME } from "../constants";
import { validateDateRange } from "../lib/date";
import {
  generateDayRangeArray,
  getAllocationDocId,
  getDateAndStartAndBlockNumber,
} from "../lib/utils";
import { processAllocation } from "./allocation.service";
import { validateTaskStatus } from "./task.service";

export const processJobAllocation = async (
  startDate: string | Date,
  endDate: string | Date,
  allocationType: AllocationType,
) => {
  const { start, end } = validateDateRange(startDate, endDate);
  logger.info(`ProcessJobAllocation from ${start.toISOString()} to ${end.toISOString()}`);
  const dayRanges = generateDayRangeArray(start, end);

  for (const days of dayRanges) {
    logger.info(`Processing allocation for ${days} days ago`);
    await processTermAllocation(days, allocationType);
  }
};

export const processTermAllocation = async (
  timeDaysAgo: number,
  allocationType: AllocationType,
) => {
  const docId = getAllocationDocId(allocationType);

  const dateAndBlock = await getDateAndStartAndBlockNumber(timeDaysAgo);
  const { startDate: allocationDate, endBlockNumber } = dateAndBlock;

  const taskManager = new TaskManager();
  const { isCompleted, calculatedStartBlockNumber, term } = await validateTaskStatus(
    taskManager,
    dateAndBlock,
    docId,
  );
  if (isCompleted) {
    logger.info(`Allocation task is already completed for ${allocationDate}`);
    await sleep(ALLOCATION_COMPLETED_SLEEP_TIME);
    return;
  }

  const { burnAmount } = await processAllocation(
    calculatedStartBlockNumber,
    endBlockNumber,
    term,
    allocationType,
  );

  await taskManager.createOrUpdateTask(
    {
      date: allocationDate,
      status: "completed",
      data: {
        term,
        startBlockNumber: Number(calculatedStartBlockNumber),
        endBlockNumber: Number(endBlockNumber),
        burnAmount,
      },
    },
    docId,
  );
};
