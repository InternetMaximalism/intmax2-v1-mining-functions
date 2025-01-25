import { config, l2V1MinterV1 } from "@intmax2-function/shared";

// batch
export const BATCH_SIZE = 200;
export const MULTICALL_SIZE = 4096;

// blockchain
export const NETWORK_TYPE = config.NETWORK_TYPE;
export const V1_INT1_CONTRACT_ADDRESS = config.V1_INT1_CONTRACT_ADDRESS as `0x${string}`;
export const V1_INT1_CONTRACT_DEPLOYED_BLOCK = config.V1_INT1_CONTRACT_DEPLOYED_BLOCK;
export const V1_MINTER_V1_CONTRACT_ADDRESS = config.V1_MINTER_V1_CONTRACT_ADDRESS as `0x${string}`;

export const MINTER_ABI_MAP = {
  ethereum: l2V1MinterV1,
  base: l2V1MinterV1,
} as const;
