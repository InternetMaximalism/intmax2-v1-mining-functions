import BigNumber from "bignumber.js";

export interface HighValueSender {
  fromAddress: string;
  totalUsdValueSent: BigNumber;
}

export interface AddressTraceResult {
  address: string;
  fromAddressCount: number;
  transactionCount: number;
  isCirculation?: boolean;
  children: AddressTraceResult[];
  rejectedReason?: string;
  highValueSender?: HighValueSender;
}

export interface DepthLimit {
  [depth: number]: number;
}
