import {
  type ContractCallOptions,
  type ContractCallParameters,
  type RetryOptions,
  type V1MiningWithdrawValidationType,
  calculateGasMultiplier,
  calculateIncreasedGasFees,
  config,
  createNetworkClient,
  ethersWaitForTransactionConfirmation,
  executeTransaction,
  getMaxGasMultiplier,
  getNonce,
  getV1WalletClient,
  l2V1Int1Abi,
  logger,
  replacedTransaction,
  v1Int1Abi,
} from "@intmax2-function/shared";
import type { Abi, PublicClient } from "viem";
import {
  ETHERS_CONFIRMATIONS,
  ETHERS_WAIT_TRANSACTION_TIMEOUT_MESSAGE,
  INCREMENT_RATE,
  TRANSACTION_MAX_RETRIES,
  WITHDRAWAL_WAIT_TRANSACTION_TIMEOUT,
} from "../constants";

export const submitWithdrawProofToContract = async (params: V1MiningWithdrawValidationType) => {
  const ethereumClient = createNetworkClient(config.NETWORK_TYPE);
  const walletClientData = getV1WalletClient("v1Submit", config.NETWORK_TYPE);
  const abi = getAbi(config.NETWORK_TYPE);

  const retryOptions: RetryOptions = {
    nonce: null,
    maxFeePerGas: null,
    maxPriorityFeePerGas: null,
  };

  for (let attempt = 0; attempt < TRANSACTION_MAX_RETRIES; attempt++) {
    try {
      const { transactionHash, nonce } = await submitWithdraw(
        ethereumClient,
        walletClientData,
        params,
        abi,
        retryOptions,
        attempt,
      );

      retryOptions.nonce = nonce;

      await ethersWaitForTransactionConfirmation(ethereumClient, transactionHash, "withdraw", {
        confirms: ETHERS_CONFIRMATIONS,
        timeout: WITHDRAWAL_WAIT_TRANSACTION_TIMEOUT,
      });

      return transactionHash;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.warn(`Error sending transaction: ${message}`);

      if (attempt === TRANSACTION_MAX_RETRIES - 1) {
        throw new Error("Transaction Max retries reached");
      }

      if (message.includes(ETHERS_WAIT_TRANSACTION_TIMEOUT_MESSAGE)) {
        logger.warn(`Attempt ${attempt + 1} failed. Retrying with higher gas...`);
        continue;
      }

      throw error;
    }
  }

  throw new Error("Unexpected end of transaction");
};

export const submitWithdraw = async (
  ethereumClient: PublicClient,
  walletClientData: ReturnType<typeof getV1WalletClient>,
  params: V1MiningWithdrawValidationType,
  abi: Abi,
  retryOptions: RetryOptions,
  attempt: number,
) => {
  const contractCallParams: ContractCallParameters = {
    contractAddress: config.V1_INT1_CONTRACT_ADDRESS as `0x${string}`,
    abi,
    functionName: "withdraw",
    account: walletClientData.account,
    args: [params.publicInputs, params.proof],
  };

  const multiplier = calculateGasMultiplier(attempt, INCREMENT_RATE);

  const [{ pendingNonce }, gasPriceData] = await Promise.all([
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
    nonce: retryOptions.nonce ?? pendingNonce,
    maxFeePerGas,
    maxPriorityFeePerGas,
  };

  if (attempt > 0) {
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

const getAbi = (network: "ethereum" | "base") => {
  const abi = network === "ethereum" ? v1Int1Abi : l2V1Int1Abi;
  return abi as Abi;
};
