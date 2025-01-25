import { v1GetSubmitProofValidation, v1MiningWithdrawValidation } from "@intmax2-function/shared";
import type { Context } from "hono";
import * as withdrawalService from "../services/withdrawal.service";

export const submitProof = async (c: Context) => {
  const body = await c.req.json();
  const parsed = await v1MiningWithdrawValidation.parseAsync(body);
  const result = withdrawalService.submitWithdrawProof(parsed);
  return c.json(result);
};

export const getWithdrawalProofStatus = async (c: Context) => {
  const params = c.req.param();
  const { withdrawalId } = await v1GetSubmitProofValidation.parseAsync(params);
  const result = withdrawalService.getWithdrawalProofStatus(withdrawalId);
  return c.json(result);
};
