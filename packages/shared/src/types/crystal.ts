import { Address } from "./utils";

export interface AddMonitoringTxParams {
  address: Address;
  direction?: "deposit" | "withdrawal";
  txHash?: `0x${string}`;
  tokenId?: number;
}

export interface MonitoringTxRequest {
  token_id: number | undefined;
  tx: `0x${string}` | undefined;
  direction: "deposit" | "withdrawal";
  address: Address;
  name: string;
  currency: "eth";
}

export interface MonitoringTxResponse {
  data: TransactionData;
  meta: MetaData;
}

interface TransactionData {
  address: string;
  alert_grade: AlertGrade | null;
  alert_list: AlertList | null;
  alert_type: string[] | null;
  blocklisted_addresses: BlocklistedAddress[];
  amount: number;
  archived: boolean;
  can: {
    archive: boolean;
    flag: boolean;
    link: boolean;
    update: boolean;
  };
  changed_at: number;
  counterparty: Counterparty;
  created_at: number;
  currency: string;
  customer: {
    name: string;
    token: string;
  };
  customer_watched: boolean;
  direction: "deposit" | "withdrawal";
  fiat_code_effective: string;
  fiat_current: string;
  flagged: string;
  flag_reason: any[];
  reason: null | string;
  relay: {
    host: string;
    country: string;
    city: string;
    latitude: string;
    longitude: string;
    user_agent: string;
  };
  id: number;
  is_pool: boolean;
  riskscore: number;
  riskscore_profile: RiskscoreProfile;
  risky_volume: number;
  risky_volume_fiat: number;
  settings_id: number;
  signals: Signals;
  snapshoted_at: number;
  status: string;
  time: number;
  token_id: number;
  tx: string;
  updated_at: number;
  fiat: number;
}

export type AlertGrade = "low" | "medium" | "high";
export type AlertGradeWithUnknown = AlertGrade | "unknown";

type AlertListItem = [string, boolean];

export type AlertList = AlertListItem[];

interface BlocklistedAddress {
  address: string;
  tags: string[] | null;
  tx: string;
  type: "out_interaction" | string;
}

interface Counterparty {
  address: string;
  id: number;
  type: string;
  name: string;
  slug: string;
  subtype: string;
  received_fiat_amount: number;
  sent_fiat_amount: number;
  signals: {
    bwd: Signals;
    fwd: Signals;
  };
}

interface RiskscoreProfile {
  id: number;
  name: string;
  history_id: number;
  signals: Signals;
}

interface Signals {
  atm: number;
  child_exploitation: number;
  dark_market: number;
  dark_service: number;
  enforcement_action: number;
  exchange_fraudulent: number;
  exchange_licensed: number;
  exchange_unlicensed: number;
  gambling: number;
  illegal_service: number;
  liquidity_pools: number;
  marketplace: number;
  miner: number;
  mixer: number;
  p2p_exchange_licensed: number;
  p2p_exchange_unlicensed: number;
  payment: number;
  ransom: number;
  sanctions: number;
  scam: number;
  seized_assets: number;
  stolen_coins: number;
  terrorism_financing: number;
  wallet: number;
}

interface MetaData {
  calls_left: number;
  calls_used: number;
  error_code: number;
  error_message: string;
  fiat_code: string;
  riskscore_profile: {
    id: number;
    name: string;
  };
  server_time: number;
  validation_errors: Record<string, unknown>;
}

export interface MonitoringTxMockResponse {
  data: {
    address: string;
    alert_grade: AlertGrade | null;
    alert_list: AlertList;
    alert_type: string[];
    blocklisted_addresses: BlocklistedAddress[];
    riskscore: null | number;
  };
  meta: {
    calls_left: number;
    calls_used: number;
  };
}

export interface AMLScoreResult {
  address: Address;
  riskAssessment?: {
    alertGrade: AlertGradeWithUnknown | null;
    riskScore: number | null;
    riskFactors: string[];
  };
  error?: string;
}

export interface RiskAssessmentLog {
  eventName: string;
  requestId?: string;
  address: string;
  alertGrade: AlertGradeWithUnknown;
  riskScore: number | null;
  riskFactors: string[];
  message: string;
}

export interface ApiUsageLog {
  callsLeft: number;
  callsUsed: number;
  totalCalls: number;
  usedPercentage: number;
  message: string;
}
