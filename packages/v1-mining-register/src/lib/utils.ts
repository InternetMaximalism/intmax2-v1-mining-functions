import {
  type DepositLogDataWithBlockNumber,
  ETH_SYMBOL,
  v1MiningTokens,
} from "@intmax2-function/shared";

export const getIsMiningToken = (depositLog: DepositLogDataWithBlockNumber) => {
  const ethToken = v1MiningTokens.find(({ symbol }) => symbol === ETH_SYMBOL);
  if (!ethToken) {
    throw new Error(`ETH token not found in v1MiningTokens`);
  }
  const matchingPoint = ethToken.points.find(({ amount }) => BigInt(amount) === depositLog.amount);

  return {
    isMiningToken: !!matchingPoint,
    points: matchingPoint?.points ?? 0,
  };
};
