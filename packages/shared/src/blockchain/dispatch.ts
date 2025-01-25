import type { PublicClient } from "viem";
import { TRANSACTION_WAIT_TIMEOUT_ERROR_MESSAGE, WAIT_TRANSACTION_TIMEOUT } from "../constants";
import { logger } from "../lib";
import type {
  ContractCallOptions,
  ContractCallParameters,
  RetryOptions,
  TransactionParameters,
} from "../types";
import {
  calculateGasMultiplier,
  calculateIncreasedGasFees,
  getMaxGasMultiplier,
} from "./calculate";
import { getNonce } from "./nonce";
import {
  executeTransaction,
  replacedTransaction,
  waitForTransactionConfirmation,
} from "./transaction";
import { getV1WalletClient } from "./wallet";

export const dispatchTransaction = async (
  ethereumClient: PublicClient,
  walletClientData: ReturnType<typeof getV1WalletClient>,
  transactionParams: TransactionParameters,
) => {
  const retryOptions: RetryOptions = {
    maxFeePerGas: null,
    maxPriorityFeePerGas: null,
  };

  for (let attempt = 0; attempt < transactionParams.transactionMaxRetries; attempt++) {
    try {
      const multiplier = calculateGasMultiplier(attempt);

      const { transactionHash } = await submitTransaction(
        ethereumClient,
        walletClientData,
        multiplier,
        retryOptions,
        transactionParams,
      );

      const receipt = await waitForTransactionConfirmation(
        ethereumClient,
        transactionHash,
        transactionParams.functionName,
        {
          timeout: WAIT_TRANSACTION_TIMEOUT,
        },
      );

      return receipt;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.warn(`Error sending transaction: ${message}`);

      if (attempt === transactionParams.transactionMaxRetries - 1) {
        throw new Error("Transaction Max retries reached");
      }

      if (message.includes(TRANSACTION_WAIT_TIMEOUT_ERROR_MESSAGE)) {
        logger.warn(`Attempt ${attempt + 1} failed. Retrying with higher gas...`);
        continue;
      }

      throw error;
    }
  }

  throw new Error("Unexpected end of transaction");
};

const submitTransaction = async (
  ethereumClient: PublicClient,
  walletClientData: ReturnType<typeof getV1WalletClient>,
  multiplier: number,
  retryOptions: RetryOptions,
  { contractAddress, abi, functionName, args }: TransactionParameters,
) => {
  const contractCallParams: ContractCallParameters = {
    contractAddress,
    abi,
    functionName,
    account: walletClientData.account,
    args,
  };

  const [{ pendingNonce, currentNonce }, gasPriceData] = await Promise.all([
    getNonce(ethereumClient, walletClientData.account.address),
    getMaxGasMultiplier(ethereumClient, multiplier),
  ]);
  let { maxFeePerGas, maxPriorityFeePerGas } = gasPriceData;

  if (retryOptions.maxFeePerGas && retryOptions.maxPriorityFeePerGas) {
    const { newMaxFeePerGas, newMaxPriorityFeePerGas } = calculateIncreasedGasFees(
      retryOptions.maxFeePerGas,
      retryOptions.maxPriorityFeePerGas,
      maxFeePerGas,
      maxPriorityFeePerGas,
    );

    maxFeePerGas = newMaxFeePerGas;
    maxPriorityFeePerGas = newMaxPriorityFeePerGas;

    logger.info(
      `Increased gas fees multiplier: ${multiplier} - MaxFee: ${maxFeePerGas}, MaxPriorityFee: ${maxPriorityFeePerGas}`,
    );
  }

  retryOptions.maxFeePerGas = maxFeePerGas;
  retryOptions.maxPriorityFeePerGas = maxPriorityFeePerGas;

  const contractCallOptions: ContractCallOptions = {
    nonce: currentNonce,
    maxFeePerGas,
    maxPriorityFeePerGas,
  };

  if (pendingNonce > currentNonce) {
    return await replacedTransaction({
      ethereumClient,
      walletClientData,
      contractCallParams,
      contractCallOptions,
    });
  }

  const transactionResult = await executeTransaction({
    ethereumClient,
    walletClientData,
    contractCallParams,
    contractCallOptions,
  });

  return transactionResult;
};
