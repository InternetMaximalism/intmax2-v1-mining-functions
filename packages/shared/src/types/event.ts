export interface EventData {
  id: string;
  lastBlockNumber: number;
}

export interface DepositAnalyzedAndRelayedEventData extends EventData {
  lastUpToDepositId: number;
}
