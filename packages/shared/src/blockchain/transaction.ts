import { BaseError, ContractFunctionRevertedError, type PublicClient } from "viem";
import { logger } from "../lib";
import { ContractCallOptions, ContractCallParameters } from "../types";
import { getV1WalletClient } from "./wallet";

interface TransactionExecutionParams {
  ethereumClient: PublicClient;
  walletClientData: ReturnType<typeof getV1WalletClient>;
  contractCallParams: ContractCallParameters;
  contractCallOptions?: ContractCallOptions;
}

export const executeTransaction = async ({
  ethereumClient,
  walletClientData,
  contractCallParams,
  contractCallOptions,
}: TransactionExecutionParams) => {
  const { functionName, contractAddress, abi, account, args } = contractCallParams;
  const { nonce, maxFeePerGas, maxPriorityFeePerGas } = contractCallOptions ?? {};

  try {
    logger.info(
      `functionName: ${functionName}, args: ${args}, nonce: ${nonce}, maxFeePerGas: ${Number(maxFeePerGas ?? 0)}, maxPriorityFeePerGas: ${Number(maxPriorityFeePerGas ?? 0)}`,
    );

    const { request } = await ethereumClient.simulateContract({
      address: contractAddress,
      abi,
      functionName,
      account,
      args,
      nonce,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });

    const transactionHash = await walletClientData.walletClient.writeContract(request);
    logger.info(`${functionName} transaction initiated with hash: ${transactionHash}`);

    return {
      transactionHash,
      nonce: request.nonce,
    };
  } catch (error) {
    handleContractError(`${functionName} failed`, error);

    throw error;
  }
};

export const replacedTransaction = async ({
  ethereumClient,
  walletClientData,
  contractCallParams,
  contractCallOptions,
}: TransactionExecutionParams) => {
  logger.warn(`Transaction was replaced. Sending new transaction...`);

  try {
    const transactionResult = await executeTransaction({
      ethereumClient,
      walletClientData,
      contractCallParams,
      contractCallOptions,
    });

    return transactionResult;
  } catch (error) {
    logger.warn(
      `Failed to send replaced transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
    );

    throw error;
  }
};

export const waitForTransactionConfirmation = async (
  ethereumClient: PublicClient,
  transactionHash: `0x${string}`,
  functionName: string,
  options?: {
    timeout?: number;
  },
) => {
  const { timeout } = options ?? {};

  try {
    const receipt = await ethereumClient.waitForTransactionReceipt({
      hash: transactionHash,
      timeout,
      retryCount: 6,
    });

    if (receipt.status !== "success") {
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

const handleContractError = (errorMessage: string, error: unknown) => {
  if (error instanceof BaseError) {
    const revertError = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName ?? "Unknown contract error";
      const shortMessage = revertError.shortMessage ?? "Unknown shortMessage";
      logger.warn(`${errorMessage}: Contract revert error - ${errorName} - ${shortMessage}`);
    } else {
      logger.warn(`${errorMessage}: Base error - ${error.message}`);
    }
  } else if (error instanceof Error) {
    logger.warn(`${errorMessage}: Unexpected error - ${error.message}`);
  } else {
    logger.warn(`${errorMessage}: Unknown error occurred`);
  }
};

export const handleApiContractError = (error: unknown) => {
  let errorMessage = "An internal server error occurred.";

  if (error instanceof BaseError) {
    const revertError = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName ?? "Unknown error";
      const shortMessage = revertError.shortMessage ?? "Unknown shortMessage";
      logger.warn(`Contract revert error - ${errorName} - ${shortMessage}`);
      errorMessage = `Error occurred during contract execution: ${errorName}`;
    } else {
      logger.warn(`Base error: ${error.message}`);
      errorMessage = `A base error occurred: ${error.message}`;
    }
  } else if (error instanceof Error) {
    logger.warn(`Unexpected error:, ${error.message}`);
    errorMessage = `An unexpected error occurred: ${error.message}`;
  } else {
    logger.warn("Unknown error occurred");
    errorMessage = "An unknown error occurred";
  }

  return errorMessage;
};
