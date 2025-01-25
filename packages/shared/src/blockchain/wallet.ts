import { http, createWalletClient } from "viem";
import { mnemonicToAccount } from "viem/accounts";
import { config } from "../config";
import { networkConfig } from "./network";

type V1WalletType = "v1MinterV1Admin" | "v1Analyzer" | "v1Submit";

const V1_WALLET_MAPS: Record<V1WalletType, number> = {
  v1MinterV1Admin: 0,
  v1Analyzer: 1,
  v1Submit: 2,
};

export const getV1WalletClient = (
  type: V1WalletType,
  network: "ethereum" | "base",
): {
  account: ReturnType<typeof mnemonicToAccount>;
  walletClient: ReturnType<typeof createWalletClient>;
} => {
  const addressIndex = V1_WALLET_MAPS[type];
  if (addressIndex === undefined) {
    throw new Error(`Invalid wallet type: ${type}`);
  }
  const account = mnemonicToAccount(config.V1_OWNER_MNEMONIC, {
    accountIndex: 0,
    addressIndex,
  });

  const { chain, rpcUrl } = networkConfig[network][config.NETWORK_ENVIRONMENT];

  const client = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });

  return {
    account,
    walletClient: client,
  };
};
