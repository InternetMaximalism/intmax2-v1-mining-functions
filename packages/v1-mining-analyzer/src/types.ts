import type { DepositEventLog } from "@intmax2-function/shared";

export interface TargetProcessedResult extends DepositEventLog {
  amlTargetAddress: string;
}

export interface AMLProcessedResult extends DepositEventLog {
  isRejected: boolean;
}
