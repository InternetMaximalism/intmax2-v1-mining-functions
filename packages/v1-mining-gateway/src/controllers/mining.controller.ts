import { addressValidation } from "@intmax2-function/shared";
import type { Context } from "hono";
import * as miningService from "../services/mining.service";

export const checkAddressExclusion = async (c: Context) => {
  const params = c.req.param();
  const { address } = await addressValidation.parseAsync(params);
  const result = await miningService.checkAddressExclusion(address);
  return c.json(result);
};

export const getGasFees = async (c: Context) => {
  const result = await miningService.getGasFees();
  return c.json(result);
};
