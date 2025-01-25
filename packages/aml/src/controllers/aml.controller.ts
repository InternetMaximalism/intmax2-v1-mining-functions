import { addressValidation, addressesValidation } from "@intmax2-function/shared";
import type { Context } from "hono";
import * as amlService from "../services/aml.service";

export const crystalHealthCheck = async (c: Context) => {
  const result = await amlService.crystalHealthCheck();
  return c.json(result);
};

export const fetchAMLScore = async (c: Context) => {
  const paramsQuery = c.req.query();
  const { address } = await addressValidation.parseAsync(paramsQuery);
  const result = await amlService.fetchAMLScore(address);
  return c.json(result);
};

export const fetchAMLScoreList = async (c: Context) => {
  const paramsQueries = c.req.queries();
  const { addresses } = await addressesValidation.parseAsync(paramsQueries);
  const result = await amlService.fetchAMLScoreList(addresses);
  return c.json(result);
};
