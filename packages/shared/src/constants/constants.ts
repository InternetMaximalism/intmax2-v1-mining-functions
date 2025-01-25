import { config } from "../config";
import type { DepthLimit } from "../types";

// app
export const BASE_PATH = "v1";
export const APP_TIMEOUT = 30_000;
export const API_TIMEOUT = 10_000;
export const RATE_LIMIT = config.RATE_LIMIT;
export const SHUTDOWN_TIMEOUT = 2000;

// date
export const DATE_FORMAT = "yyyy-MM-dd";

// logger
export const SLOW_THRESHOLD = 1000;
export const CLIENT_SERVICE = "clientServiceName";

// crystal
export const CRYSTAL_API_ENDPOINT = config.CRYSTAL_API_ENDPOINT;
export const ALERT_USED_THRESHOLD = config.CRYSTAL_ALERT_USED_THRESHOLD;

// firestore
export const FIRESTORE_COLLECTIONS = {
  EVENTS: "events",
  MINING: "minings",
  CIRCULATION: "circulations",
  CIRCULATION_ADDRESSES: "addresses",
  ALLOCATION: "allocations",
  TASK_MANEGERS: "taskManagers",
} as const;

export const FIRESTORE_DOCUMENTS = {
  DEPOSIT: "deposits",
  WITHDRAWAL_ADDRESSES: "withdrawalAddresses",
  CIRCULATION_ADDRESSES: "circulationAddresses",
  SHORT_TERM_MINING_ALLOCATIONS: "shortTermMiningAllocations",
  LONG_TERM_MINING_ALLOCATIONS: "longTermMiningAllocations",
  MERKLE_COMMITMENTS: "merkleCommitments",
} as const;

export const FIRESTORE_DOCUMENT_EVENTS = {
  V1_DEPOSIT: "v1Deposits",
  V1_DEPOSITS_ANALYZED_AND_PROCESSED: "v1DepositsAnalyzedAndProcessed",
  V1_WITHDRAWN: "v1Withdrawn",
} as const;

export const FIRESTORE_MAX_BATCH_SIZE = 500;
export const FIRESTORE_IN_MAX_BATCH_SIZE = 30;

// storage
export const FILE_PATHS = {
  exchanges: "addresses/exchanges.json",
  defiProtocols: "addresses/defiProtocols.json",
  images: "images",
  tokenPrices: "tokens/tokenPrices",
};
export const GCP_STORAGE_URL = "https://storage.googleapis.com";

// mining
export const MINING_START_DATE = "2024-08-07";
export const APP_START_DATE = config.NETWORK_TYPE === "ethereum" ? "2024-10-01" : "2024-10-19";
export const MINING_FIRST_TERM_DURATION = 16;
export const TERM_TOKEN_ALLOCATION = 143_000_000;
export const INTMAX_TOKEN_DECIMALS = 18;

// term
export const SHORT_TERM_DAYS_AGO = config.NETWORK_ENVIRONMENT === "mainnet" ? 7 : 1;
export const LONG_TERM_DAYS_AGO = config.NETWORK_ENVIRONMENT === "mainnet" ? 90 : 7;
export const SHORT_TERM_RATIO = 1 / 3;
export const LONG_TERM_RATIO = 2 / 3;
export const ETHEREUM_SHORT_TERM_END_DATE = "2024-11-02";

// etherscan
export const ETHERSCAN_URL_MAPS = {
  "ethereum-mainnet": "https://api.etherscan.io/api",
  "ethereum-sepolia": "https://api-sepolia.etherscan.io/api",
  "base-mainnet": "https://api.basescan.org/api",
  "base-sepolia": "https://api-sepolia.basescan.org/api",
};

// token
export const ETH_SYMBOL = "ETH";
export const ETH_TOKEN_ID = "ethereum";
export const DEFAULT_DECIMALS = 18;

// tree
export const DEPOSIT_TREE_HEIGHT = 32;
export const ELIGIBLE_TREE_HEIGHT = 32;

// github
export const DEPOSIT_TREE_FILENAME = "depositTree";
export const ELIGIBLE_TREE_FILENAME = "eligibleTree";
export const ELIGIBLE_TREE_SHORT_TERM_FILENAME = "eligibleTree-shortTerm";
export const ELIGIBLE_TREE_LONG_TERM_FILENAME = "eligibleTree-longTerm";

// tracer
export const DEPTH_LIMIT: DepthLimit = JSON.parse(config.TRACER_DEPTH_LIMIT);
export const TRACE_MAX_CONCURRENCY = 3;
export const SIGNIFICANT_ETH_THRESHOLD_VALUE = config.SIGNIFICANT_ETH_THRESHOLD_VALUE;
export const HUB_FROM_DAYS_AGO = config.HUB_FROM_DAYS_AGO;
export const HUB_UNIQUE_ADDRESSES = 30;
export const HUB_MIN_ETH_BALANCE = BigInt(config.HUB_MIN_ETH_BALANCE);

// base
export const BASE_BLOCK_NUMBER_PER_DAY = 43200;

// block events
export const BLOCK_RANGE_MOST_RECENT = 500n;
export const BLOCK_RANGE_MINIMUM = 10000n;
export const BLOCK_RANGE_NORMAL = 30000n;
export const BLOCK_RANGE_MAX = 5000000n;

// allocation
export const REWARD_TABLE = {
  case1: {
    shortTermReward: 1,
    longTermReward: 1,
  },
  case2: {
    shortTermReward: 1,
    longTermReward: 0,
  },
  case3: {
    shortTermReward: 0.1,
    longTermReward: 0,
  },
  case4: {
    shortTermReward: 0,
    longTermReward: 0,
  },
} as const;

// transaction
export const REPLACED_TX_WAIT_TIMEOUT = 30_000;
export const WAIT_TRANSACTION_TIMEOUT = 30_000;
export const TRANSACTION_MAX_RETRIES = 3;

// errors
export const TRANSACTION_WAIT_TIMEOUT_ERROR_MESSAGE =
  "Timed out while waiting for transaction with hash";
