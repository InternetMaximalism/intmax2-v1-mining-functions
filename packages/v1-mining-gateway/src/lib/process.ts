import { config, logger, sleep } from "@intmax2-function/shared";
import axios, { AxiosError } from "axios";
import { MAX_DURATION, RETRY_DELAY } from "../constants";
import type { ExtendedContext, Job, ProofResponse } from "../types";

export const processJob = async (c: ExtendedContext, { jobId }: Job) => {
  const path = c.env.incoming.url.replace(/\/start-proof$/, "");
  const url = `${config.ZKP_PROVER_HTTP_ENDPOINT}${path}/get-proof`;

  const startTime = Date.now();
  while (true) {
    if (Date.now() - startTime > MAX_DURATION) {
      logger.warn(`Job ${jobId} timed out after ${MAX_DURATION / 1000} seconds`);
      return false;
    }

    try {
      const res = await axios.get<ProofResponse>(url, {
        params: {
          jobId,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.ZKP_PROVER_JWT}`,
        },
      });

      if (res.data.status === "done") {
        return true;
      }

      if (res.data.status === "error") {
        logger.error(`Job ${jobId} failed`);
        return true;
      }

      logger.debug(`Job ${jobId} not yet completed, retrying...`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        logger.error(`Error fetching proof for job ${jobId}: ${axiosError.message}`);
        if (axiosError.response) {
          logger.error(`Response status: ${axiosError.response.status}`);
          logger.error(`Response data: ${JSON.stringify(axiosError.response.data)}`);
        }
      } else {
        logger.error(`Unexpected error for job ${jobId}: ${(error as Error).message}`);
      }
    }

    await sleep(RETRY_DELAY);
  }
};
