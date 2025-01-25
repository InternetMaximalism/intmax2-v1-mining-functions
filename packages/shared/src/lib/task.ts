import type { TaskManager } from "../db";
import type { Task } from "../types";

export const getTasksForAllocation = (
  taskManager: TaskManager,
  docId: string,
  allocationDate: string,
  previousDate: string,
) => {
  return Promise.all([
    taskManager.getAllocationTask(docId, allocationDate),
    taskManager.getAllocationTask(docId, previousDate),
  ]);
};

export const determineStartBlockNumber = (
  startBlockNum: bigint,
  previousWeekTask: Task | null,
): bigint => {
  if (
    previousWeekTask?.status === "completed" &&
    previousWeekTask.data.endBlockNumber !== undefined
  ) {
    const previousEndBlock = BigInt(previousWeekTask.data.endBlockNumber);
    return previousEndBlock + 1n;
  }

  return startBlockNum;
};
