import { FIRESTORE_DOCUMENTS, TaskManager, logger } from "@intmax2-function/shared";
import { logTreeInfo } from "../lib/log";
import { pushTreesToGithub } from "./git.service";
import { submitTreeRoots } from "./submit.service";
import { getProcessDates, validateTaskStatus } from "./task.service";
import { generateMerkleTrees } from "./tree.service";

export const performJob = async () => {
  const taskManager = new TaskManager();
  const dates = getProcessDates();
  const merkleCommitmentDate = dates.merkleCommitmentDate;

  const { isCompleted, endBlockNumber } = await validateTaskStatus(taskManager, dates);
  if (isCompleted) {
    logger.info(`Merkle commitment already completed for ${merkleCommitmentDate}`);
    return;
  }

  const {
    depositTree,
    shortTermEligibleTree,
    longTermEligibleTree,
    endDepositLeafInsertedBlockNumber,
  } = await generateMerkleTrees(BigInt(endBlockNumber));

  const depositTreeRoot = depositTree.getMerkleRoot();
  const shortTermEligibleTreeRoot = shortTermEligibleTree.getMerkleRoot();
  const longTermEligibleTreeRoot = longTermEligibleTree.getMerkleRoot();

  logTreeInfo(
    dates,
    depositTreeRoot,
    shortTermEligibleTreeRoot,
    longTermEligibleTreeRoot,
    endDepositLeafInsertedBlockNumber,
  );

  await submitTreeRoots(shortTermEligibleTreeRoot, longTermEligibleTreeRoot);

  await pushTreesToGithub(
    depositTree,
    shortTermEligibleTree,
    longTermEligibleTree,
    merkleCommitmentDate,
    endDepositLeafInsertedBlockNumber,
  );

  await taskManager.createOrUpdateTask(
    {
      date: merkleCommitmentDate,
      status: "completed",
      data: {
        endBlockNumber,
        endDepositLeafInsertedBlockNumber: Number(endDepositLeafInsertedBlockNumber),
        depositTreeRoot,
        shortTermEligibleTreeRoot,
        longTermEligibleTreeRoot,
      },
    },
    FIRESTORE_DOCUMENTS.MERKLE_COMMITMENTS,
  );

  logger.info(`Merkle commitment task completed successfully for ${merkleCommitmentDate}`);
};
