import {
  FIRESTORE_DOCUMENTS,
  TaskManager,
  calculateThreeWeeklyTimestampRange,
  getDates,
  logger,
} from "@intmax2-function/shared";
import type { DateInfo } from "../types";

export const getProcessDates = () => {
  const { currentMondayTimestamp } = calculateThreeWeeklyTimestampRange();
  const [merkleCommitmentDate, _, twoWeekAgoAllocationDate] = getDates(currentMondayTimestamp);
  return { merkleCommitmentDate, twoWeekAgoAllocationDate };
};

export const validateTaskStatus = async (taskManager: TaskManager, dates: DateInfo) => {
  const merkleCommitmentTask = await taskManager.getAllocationTask(
    FIRESTORE_DOCUMENTS.MERKLE_COMMITMENTS,
    dates.merkleCommitmentDate,
  );
  if (merkleCommitmentTask?.status === "completed") {
    return { isCompleted: true, endBlockNumber: 0 };
  }

  const latestAllocationTask = await taskManager.getLatestAllocationTask(
    FIRESTORE_DOCUMENTS.SHORT_TERM_MINING_ALLOCATIONS,
  );
  logger.debug(`Latest allocation task: ${JSON.stringify(latestAllocationTask)}`);
  if (!latestAllocationTask) {
    throw new Error(`Latest allocation task not found for ${dates.twoWeekAgoAllocationDate}`);
  }

  return { isCompleted: false, endBlockNumber: latestAllocationTask.data.endBlockNumber };
};
