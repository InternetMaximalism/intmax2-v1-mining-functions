import { url, bool, cleanEnv, email, num, str } from "envalid";

export const config = cleanEnv(process.env, {
  // app
  NODE_ENV: str({
    choices: ["development", "production", "test"],
    default: "development",
  }),
  PORT: num({ default: 3000 }),
  LOG_LEVEL: str({
    choices: ["fatal", "error", "warn", "info", "debug", "trace"],
    default: "debug",
  }),
  RATE_LIMIT: num({ default: 1000 }),
  // auth
  AUTH_JWT_SECRET: str({ devDefault: "dummy" }),
  AUTH_IP_ALLOW_LIST: str({ devDefault: "127.0.0.1,::1" }),
  // gcp
  K_SERVICE: str({ default: process.env.CLOUD_RUN_JOB || "default-service" }),
  K_REVISION: str({ default: process.env.CLOUD_RUN_EXECUTION || "default-revision" }),
  GOOGLE_CLOUD_PROJECT: str({ devDefault: "local-project" }),
  GOOGLE_STORE_BUCKET: str({ devDefault: "local-bucket" }),
  // firestore
  FIRESTORE_DATABASE_ID: str({ devDefault: "(default)" }),
  // crystal
  CRYSTAL_API_ENDPOINT: str({ devDefault: "http://localhost:4000" }),
  CRYSTAL_ALERT_USED_THRESHOLD: num({ devDefault: 30 }),
  CRYSTAL_REQUEST_NAME: str({ default: "INTMAX V1 Mining Local Analyzer" }),
  CRYSTAL_API_KEY: str({ devDefault: "dummy" }),
  AML_API_URL: url({ devDefault: "http://localhost:3001" }),
  AML_JWT: str({ devDefault: "dummy" }),
  AML_HIGH_RISK_SCORE: num({ default: 30 }),
  // network
  NETWORK_TYPE: str({
    choices: ["ethereum", "base"],
    default: "ethereum",
  }),
  NETWORK_ENVIRONMENT: str({
    choices: ["mainnet", "sepolia"],
    default: "sepolia",
  }),
  // blockchain
  ALCHEMY_API_KEY: str({ devDefault: "dummy" }),
  ETHERSCAN_API_KEY: str({ devDefault: "dummy" }),
  // v1 contract (set must be lowercase for contract addresses)
  V1_INT1_CONTRACT_ADDRESS: str({ devDefault: "0x" }),
  V1_INT1_CONTRACT_DEPLOYED_BLOCK: num({ devDefault: 0 }),
  V1_MINTER_V1_CONTRACT_ADDRESS: str({ devDefault: "0x" }),
  // private key
  V1_OWNER_MNEMONIC: str({ devDefault: "" }),
  // zkp prover
  ZKP_PROVER_JWT: str({ devDefault: "dummy" }),
  ZKP_PROVER_HTTP_ENDPOINT: url({ devDefault: "http://localhost:3002" }),
  // git
  GITHUB_ACCESS_TOKEN: str({ devDefault: "dummy" }),
  GITHUB_MINING_REPO_URL: str({ devDefault: "dummy" }),
  GITHUB_MINING_REPO_TREES_FOLDER_NAME: str({ devDefault: "data" }),
  GITHUB_CONFIG_NAME: str({ devDefault: "dummy" }),
  GITHUB_CONFIG_EMAIL: email({ devDefault: "dummy@example.com" }),
  // tracer
  TRACER_DEPOSIT_DEPTH: num({ devDefault: 1 }),
  TRACER_MINING_DEPTH: num({ devDefault: 1 }),
  TRACER_DEPTH_LIMIT: str(),
  SIGNIFICANT_ETH_THRESHOLD_VALUE: num({ devDefault: 1 }),
  HUB_FROM_DAYS_AGO: num({ devDefault: 1 }),
  HUB_MIN_ETH_BALANCE: str({ devDefault: "1" }),
  MINUTES_THRESHOLD: num({ devDefault: 1 }),
  REQUIRED_SIMILAR_COUNT: num({ devDefault: 1 }),
  // allocation
  ALLOCATION_JOB_START_DATE: str({ default: "2024/01/01" }),
  ALLOCATION_JOB_END_DATE: str({ default: "2024/01/02" }),
  IS_DAILY_REWARD_ENABLED: bool({ devDefault: true }),
  // cli
  V1_MINING_CLI_MINIMUM_VERSION: str({ devDefault: "1.0.0" }),
});
