import {
  TRANSACTION_MAX_RETRIES,
  TransactionParameters,
  config,
  dispatchTransaction,
  getV1WalletClient,
  v1Int1Abi,
} from "@intmax2-function/shared";
import type { Abi, PublicClient } from "viem";
import { V1_INT1_CONTRACT_ADDRESS } from "../constants";
import type { AMLProcessedResult } from "../types";

export const summarizeDepositAnalysis = async (
  results: AMLProcessedResult[],
  existingRejectDepositIds: bigint[],
) => {
  const sortedDepositIds = results.map((result) => result.depositId).sort((a, b) => Number(b - a));

  const upToDepositId = sortedDepositIds[0] as bigint;
  if (!upToDepositId) {
    throw new Error("No upToDepositId found.");
  }

  const rejectDepositIds = results
    .filter((result) => result.isRejected)
    .map((result) => result.depositId);

  const filterRejectDepositIds = rejectDepositIds.filter(
    (rejectDepositId) => !existingRejectDepositIds.includes(rejectDepositId),
  );

  return [upToDepositId!, filterRejectDepositIds];
};

export const submitAnalyzeAndProcessDeposits = async (
  ethereumClient: PublicClient,
  depositSummary: (bigint | bigint[])[],
) => {
  const walletClientData = getV1WalletClient("v1Analyzer", config.NETWORK_TYPE);
  const transactionParams: TransactionParameters = {
    contractAddress: V1_INT1_CONTRACT_ADDRESS,
    abi: v1Int1Abi as Abi,
    functionName: "analyzeAndProcessDeposits",
    args: depositSummary,
    transactionMaxRetries: TRANSACTION_MAX_RETRIES,
  };
  return dispatchTransaction(ethereumClient, walletClientData, transactionParams);
};
