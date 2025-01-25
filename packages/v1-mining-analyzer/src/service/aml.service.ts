import { type AMLScoreResult, type Address, config, logger } from "@intmax2-function/shared";
import axios from "axios";
import { AML_BATCH_SIZE, AML_MAX_RETRIES, AML_REQUEST_TIMEOUT, AML_WAIT_TIME } from "../constants";
import type { TargetProcessedResult } from "../types";

export const processAMLBatches = async (batches: TargetProcessedResult[]) => {
  const uniqueAddresses = [...new Set(batches.map((log) => log.amlTargetAddress))];
  const processedScores: AMLScoreResult[] = [];

  for (let i = 0; i < uniqueAddresses.length; i += AML_BATCH_SIZE) {
    const batchAddresses = uniqueAddresses.slice(i, i + AML_BATCH_SIZE);
    const result = await fetchAMLScoreList(batchAddresses);
    processedScores.push(...result);
  }

  return batches.map((batch) => {
    const amlResult = processedScores.find((score) => score.address === batch.amlTargetAddress);
    if (!amlResult) {
      throw new Error(`Failed to find AML score for address ${batch.amlTargetAddress}`);
    }

    return {
      ...batch,
      isRejected: amlResult.riskAssessment!.riskScore! >= config.AML_HIGH_RISK_SCORE,
      amlScore: amlResult.riskAssessment,
    };
  });
};

const fetchAMLScoreList = async (addresses: Address[]): Promise<AMLScoreResult[]> => {
  let lastError: Error | null = null;
  const params = new URLSearchParams();
  addresses.forEach((address) => {
    params.append("addresses", address);
  });

  for (let attempt = 1; attempt <= AML_MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get<AMLScoreResult[]>(
        `${config.AML_API_URL}/v1/aml/score/list`,
        {
          params,
          headers: { Authorization: `Bearer ${config.AML_JWT}` },
          timeout: AML_REQUEST_TIMEOUT,
        },
      );

      if (response.status !== 200) {
        throw new Error(`Failed to fetch AML score list: ${response.status}`);
      }

      return response.data;
    } catch (error) {
      lastError = error as Error;
      logger.warn(
        `Attempt ${attempt}/${AML_MAX_RETRIES} failed to fetch aml score list: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
      );

      if (attempt < AML_MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, AML_WAIT_TIME));
      }
    }
  }

  throw new Error(
    `Failed to get AML score list after ${AML_MAX_RETRIES} attempts. Last error: ${lastError?.message}`,
  );
};
