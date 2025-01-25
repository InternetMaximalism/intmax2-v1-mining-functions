import { JsonRpcProvider } from "ethers";
import type { PublicClient } from "viem";
import { logger } from "../lib";

interface WaitForTransactionOptions {
  confirms?: number;
  timeout?: number;
}

const DEFAULT_OPTIONS: Required<WaitForTransactionOptions> = {
  confirms: 1,
  timeout: 30_000,
};

export const ethersWaitForTransactionConfirmation = async (
  ethereumClient: PublicClient,
  transactionHash: string,
  functionName: string,
  options?: WaitForTransactionOptions,
) => {
  try {
    const { confirms, timeout } = options ?? DEFAULT_OPTIONS;
    const provider = new JsonRpcProvider(ethereumClient.transport.url);
    const receipt = await provider.waitForTransaction(transactionHash, confirms, timeout);

    if (!receipt) {
      throw new Error("Transaction receipt not found");
    }

    if (receipt.status !== 1) {
      throw new Error(`Transaction failed with status: ${receipt.status}`);
    }

    logger.info(`${functionName} transaction confirmed`);

    return receipt;
  } catch (error) {
    logger.warn(
      `Failed to confirm ${functionName} transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
    );

    throw error;
  }
};
