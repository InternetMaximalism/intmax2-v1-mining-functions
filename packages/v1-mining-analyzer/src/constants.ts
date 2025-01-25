import { config } from "@intmax2-function/shared";

// AML
export const AML_BATCH_SIZE = 5;
export const AML_WAIT_TIME = 1_000;
export const AML_REQUEST_TIMEOUT = 120_000;
export const AML_MAX_RETRIES = 3;

// batch
export const ADDRESS_BATCH_SIZE = 10;

// blockchain
export const NETWORK_TYPE = config.NETWORK_TYPE;
export const V1_INT1_CONTRACT_DEPLOYED_BLOCK = config.V1_INT1_CONTRACT_DEPLOYED_BLOCK;
export const V1_INT1_CONTRACT_ADDRESS = config.V1_INT1_CONTRACT_ADDRESS as `0x${string}`;
