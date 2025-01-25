// availability
export const AVAILABILITY_MESSAGE = {
  update: "Please update to the latest version",
  available: "V1 Mining Gateway is available",
  migration:
    "Please migrate to Mining CLI V2. Visit https://intmax.io for instructions on how to upgrade.",
} as const;

export const DEFAULT_V1_EXPIRATION_TIME = "2025-12-31T23:59:59Z";
export const TOKEN_CLAIM_MINIMUM_VERSION = "1.2.0";

// process job
export const MAX_DURATION = 5 * 60 * 1000;
export const RETRY_DELAY = 15 * 1000;
export const MAX_CONCURRENT_JOBS = 6;

// cache
export const GAS_FEES_CACHE_KEY = "gas-fees";
export const CACHE_TIMEOUTS = {
  DETAIL: 180_000,
} as const;

// blockchain
export const TRANSACTION_MAX_RETRIES = 5;
export const WITHDRAWAL_WAIT_TRANSACTION_TIMEOUT = 30_000;
export const INCREMENT_RATE = 0.3;
export const ETHERS_WAIT_TRANSACTION_TIMEOUT_MESSAGE = "timeout";
export const ETHERS_CONFIRMATIONS = 1;

// withdrawal
export const WITHDRAWAL_ID_LENGTH = 32;

// country codes
export const RESTRICTED_COUNTRY_CODES = {
  US: "United States",
  KP: "North Korea",
  IR: "Iran",
  SY: "Syria",
  CU: "Cuba",
  RU: "Russia",
  MM: "Myanmar",
  SD: "Sudan",
  YE: "Yemen",
  BY: "Belarus",
} as const;
