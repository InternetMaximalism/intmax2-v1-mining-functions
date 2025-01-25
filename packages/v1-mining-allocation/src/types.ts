import type { MiningData } from "@intmax2-function/shared";

export interface DateAndBlock {
  startDate: string;
  previousDate: string;
  startBlockNumber: bigint;
  endBlockNumber: bigint;
}

export interface Pattern {
  name: string;
  check: (details: MiningData[]) => boolean;
}
