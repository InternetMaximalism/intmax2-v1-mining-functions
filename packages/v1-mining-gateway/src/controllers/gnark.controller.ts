import { v1GetProofValidation } from "@intmax2-function/shared";
import type { Context } from "hono";
import { handleProxyRequest } from "../lib/proxy";
import * as gnarkService from "../services/gnark.service";
import type { ExtendedContext } from "../types";

export const getHealth = async (c: Context) => handleProxyRequest(c);

export const startProof = async (c: ExtendedContext) => {
  if (c.req.raw.body) {
    const [requestStream, proxyStream] = c.req.raw.body.tee();
    c.requestStream = requestStream;
    c.proxyStream = proxyStream;
  }
  const result = await gnarkService.startProof(c);
  return c.json(result);
};

export const getProof = async (c: Context) => {
  const paramsQuery = c.req.query();
  const { jobId } = await v1GetProofValidation.parseAsync(paramsQuery);
  const result = await gnarkService.getProof(c, jobId);
  return c.json(result);
};
