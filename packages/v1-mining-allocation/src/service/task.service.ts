import {
  TaskManager,
  debugLog,
  determineStartBlockNumber,
  getMiningTerm,
  getTasksForAllocation,
} from "@intmax2-function/shared";
import type { DateAndBlock } from "../types";

export const validateTaskStatus = async (
  taskManager: TaskManager,
  { startDate: allocationDate, previousDate, startBlockNumber }: DateAndBlock,
  docId: string,
) => {
  const [allocationTask, previousTask] = await getTasksForAllocation(
    taskManager,
    docId,
    allocationDate,
    previousDate,
  );

  const calculatedStartBlockNumber = determineStartBlockNumber(startBlockNumber, previousTask);
  const term = getMiningTerm(new Date(allocationDate));

  debugLog({
    allocationDate,
    previousDate,
    allocationTask,
    previousTask,
  });

  return {
    isCompleted: allocationTask?.status === "completed",
    allocationTask,
    previousTask,
    calculatedStartBlockNumber,
    term,
  };
};
