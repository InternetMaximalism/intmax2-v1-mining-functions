import { type V1MiningWithdrawValidationType, getRandomString } from "@intmax2-function/shared";
import { WITHDRAWAL_ID_LENGTH } from "../constants";
import { WithdrawalQueue } from "../lib/withdrawalQueue";

export const submitWithdrawProof = (params: V1MiningWithdrawValidationType) => {
  const withdrawalId = getRandomString(WITHDRAWAL_ID_LENGTH);

  const withdrawalQueue = WithdrawalQueue.getInstance();
  withdrawalQueue.enqueue(withdrawalId, params);

  return {
    withdrawalId: withdrawalId,
  };
};

export const getWithdrawalProofStatus = (withdrawalId: string) => {
  const withdrawalQueue = WithdrawalQueue.getInstance();
  const result = withdrawalQueue.getJob(withdrawalId);

  return result;
};
