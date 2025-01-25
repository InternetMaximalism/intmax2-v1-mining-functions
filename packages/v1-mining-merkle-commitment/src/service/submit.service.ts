import {
  AllocationType,
  TRANSACTION_MAX_RETRIES,
  TransactionParameters,
  createNetworkClient,
  dispatchTransaction,
  getV1WalletClient,
} from "@intmax2-function/shared";
import type { Abi, PublicClient } from "viem";
import { MINTER_ABI_MAP, NETWORK_TYPE, V1_MINTER_V1_CONTRACT_ADDRESS } from "../constants";
import { shouldSubmitLongTermTree, shouldSubmitShortTermTree } from "../lib/helper";

export const submitTreeRoots = async (
  shortTermEligibleTreeRoot: string,
  longTermEligibleTreeRoot: string,
) => {
  const ethereumClient = createNetworkClient(NETWORK_TYPE);
  const walletClientData = getV1WalletClient("v1MinterV1Admin", NETWORK_TYPE);

  if (shouldSubmitShortTermTree()) {
    await mintINTMAXToken(ethereumClient, walletClientData);

    await submitEligibleTreeRoot(
      ethereumClient,
      walletClientData,
      shortTermEligibleTreeRoot,
      "short",
    );
  }

  if (shouldSubmitLongTermTree()) {
    await submitEligibleTreeRoot(
      ethereumClient,
      walletClientData,
      longTermEligibleTreeRoot,
      "long",
    );
  }
};

const mintINTMAXToken = async (
  ethereumClient: PublicClient,
  walletClientData: ReturnType<typeof getV1WalletClient>,
) => {
  const abi = getMinterAbi(NETWORK_TYPE);
  const transactionParams: TransactionParameters = {
    contractAddress: V1_MINTER_V1_CONTRACT_ADDRESS,
    abi,
    functionName: "mint",
    args: [],
    transactionMaxRetries: TRANSACTION_MAX_RETRIES,
  };
  return dispatchTransaction(ethereumClient, walletClientData, transactionParams);
};

const submitEligibleTreeRoot = async (
  ethereumClient: PublicClient,
  walletClientData: ReturnType<typeof getV1WalletClient>,
  eligibleTreeRoot: string,
  allocationType: AllocationType,
) => {
  const { functionName, abi } = getFunctionNameAndAbi(NETWORK_TYPE, allocationType);
  const transactionParams: TransactionParameters = {
    contractAddress: V1_MINTER_V1_CONTRACT_ADDRESS,
    abi,
    functionName,
    args: [eligibleTreeRoot],
    transactionMaxRetries: TRANSACTION_MAX_RETRIES,
  };
  return dispatchTransaction(ethereumClient, walletClientData, transactionParams);
};

const getFunctionNameAndAbi = (
  networkType: "ethereum" | "base",
  allocationType: AllocationType,
) => {
  const functionName = allocationType === "short" ? "setShortTermTreeRoot" : "setLongTermTreeRoot";

  return {
    functionName,
    abi: getMinterAbi(networkType),
  };
};

const getMinterAbi = (networkType: "ethereum" | "base"): Abi => {
  const abi = MINTER_ABI_MAP[networkType];
  if (!abi) {
    throw new Error(`Unsupported network type: ${networkType}`);
  }
  return abi as Abi;
};
