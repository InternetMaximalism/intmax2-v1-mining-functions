import type { PublicClient } from "viem";

export const getNonce = async (publicClient: PublicClient, address: `0x${string}`) => {
  const [currentNonce, pendingNonce] = await Promise.all([
    publicClient.getTransactionCount({
      address,
    }),
    publicClient.getTransactionCount({
      address,
      blockTag: "pending",
    }),
  ]);
  const lastNonce = currentNonce - 1;

  return { pendingNonce, currentNonce, lastNonce };
};
