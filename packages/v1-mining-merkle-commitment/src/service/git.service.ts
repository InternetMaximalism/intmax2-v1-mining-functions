import {
  APP_START_DATE,
  DEPOSIT_TREE_FILENAME,
  type DepositTree,
  DepositTreeEncoder,
  ELIGIBLE_TREE_LONG_TERM_FILENAME,
  ELIGIBLE_TREE_SHORT_TERM_FILENAME,
  type EligibleTree,
  EligibleTreeEncoder,
  LONG_TERM_DAYS_AGO,
  config,
  gitOperations,
  isOverNDays,
  logger,
} from "@intmax2-function/shared";
import { shouldSubmitShortTermTree } from "../lib/helper.js";
import type { EncodedTrees, TreeFile } from "../types";

export const pushTreesToGithub = async (
  depositTree: DepositTree,
  shortTermEligibleTree: EligibleTree,
  longTermEligibleTree: EligibleTree,
  allocationDate: string,
  endDepositLeafInsertedBlockNumber: bigint,
) => {
  const encodedTrees = encodeTrees(
    depositTree,
    shortTermEligibleTree,
    longTermEligibleTree,
    endDepositLeafInsertedBlockNumber,
  );
  const treeFiles = createTreeFiles(encodedTrees, allocationDate);

  if (treeFiles.length !== 0) {
    await gitOperations(treeFiles);
    logger.info(`Trees successfully pushed to GitHub (Block ${endDepositLeafInsertedBlockNumber})`);
    return;
  }

  logger.info("No trees to push to GitHub");
};

const encodeTrees = (
  depositTree: DepositTree,
  shortTermTree: EligibleTree,
  longTermTree: EligibleTree,
  blockNumber: bigint,
) => {
  const depositEncoder = DepositTreeEncoder.fromDepositTree(depositTree, blockNumber);
  const shortTermEncoder = EligibleTreeEncoder.fromEligibleTree(shortTermTree, blockNumber);
  const longTermEncoder = EligibleTreeEncoder.fromEligibleTree(longTermTree, blockNumber);

  return {
    encodedDepositTree: depositEncoder.encode(),
    shortTermEncodedEligibleTree: shortTermEncoder.encode(),
    longTermEncodedEligibleTree: longTermEncoder.encode(),
  };
};

const createTreeFiles = (encodedTrees: EncodedTrees, allocationDate: string) => {
  const files: TreeFile[] = [];

  if (shouldSubmitShortTermTree()) {
    files.push(
      ...[
        {
          folderPath: config.GITHUB_MINING_REPO_TREES_FOLDER_NAME,
          filename: `${allocationDate}-${DEPOSIT_TREE_FILENAME}.txt`,
          buffer: Buffer.from(encodedTrees.encodedDepositTree),
        },
        {
          folderPath: config.GITHUB_MINING_REPO_TREES_FOLDER_NAME,
          filename: `${allocationDate}-${ELIGIBLE_TREE_SHORT_TERM_FILENAME}.txt`,
          buffer: Buffer.from(encodedTrees.shortTermEncodedEligibleTree),
        },
      ],
    );
  }

  if (isOverNDays(APP_START_DATE, LONG_TERM_DAYS_AGO)) {
    files.push({
      folderPath: config.GITHUB_MINING_REPO_TREES_FOLDER_NAME,
      filename: `${allocationDate}-${ELIGIBLE_TREE_LONG_TERM_FILENAME}.txt`,
      buffer: Buffer.from(encodedTrees.longTermEncodedEligibleTree),
    });
  }

  return files;
};
