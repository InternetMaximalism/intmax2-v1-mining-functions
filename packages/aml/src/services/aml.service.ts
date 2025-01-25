import {
  ALERT_USED_THRESHOLD,
  type AMLScoreResult,
  type Address,
  type AlertGradeWithUnknown,
  LOG_EVENT_NAMES,
  type MonitoringTxMockResponse,
  type RiskAssessmentLog,
  asyncLocalStorage,
  config,
  logger,
} from "@intmax2-function/shared";
import { BATCH_INTERVAL, BATCH_SIZE } from "../constants";
import { Crystal } from "../lib/crystal";

export const crystalHealthCheck = async () => {
  const crystal = Crystal.getInstance();
  const res = await crystal.checkHealth();
  const params = {
    status: "OK",
    timestamp: new Date().toISOString(),
    message: res,
  };
  return params;
};

export const fetchAMLScore = async (address: Address) => {
  const crystal = Crystal.getInstance();

  const {
    data: { alert_grade: alertGrade, alert_list: alertList, riskscore: riskScore },
    meta,
  } = await crystal.addMonitoringTx({ address });

  const riskFactors = alertList
    ? alertList.map((alert) => alert.map((key) => `${key}`).join(":"))
    : [];
  const normalizedAlertGrade: AlertGradeWithUnknown = alertGrade ?? "unknown";
  const normalizedRiskScore = getRiskScore(riskScore);

  await logRiskAssessment(address, normalizedAlertGrade, riskFactors, normalizedRiskScore);
  await logApiUsage(meta);

  const result: AMLScoreResult = {
    address,
    riskAssessment: {
      alertGrade: normalizedAlertGrade,
      riskScore: normalizedRiskScore,
      riskFactors,
    },
  };

  return result;
};

export const fetchAMLScoreList = async (addresses: Address[]) => {
  const results: AMLScoreResult[] = [];

  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    const batch = addresses.slice(i, i + BATCH_SIZE);

    try {
      const batchResults = await Promise.all(batch.map((address) => fetchAMLScore(address)));
      results.push(...batchResults);

      if (i + BATCH_SIZE < addresses.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_INTERVAL));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error fetching AML score for batch ${i} - ${i + BATCH_SIZE} ${message}`);

      results.push(...batch.map((address) => ({ address, error: message })));
      continue;
    }
  }

  return results;
};

const getRiskScore = (riskScore: number | null) => {
  if (!riskScore) return 0;
  const convertedNum = (riskScore * 100).toFixed(2);
  return Number(convertedNum);
};

const logRiskAssessment = async (
  address: string,
  alertGrade: AlertGradeWithUnknown,
  riskFactors: string[],
  riskScore: number | null,
) => {
  if (riskScore && riskScore >= config.AML_HIGH_RISK_SCORE) {
    const requestId = asyncLocalStorage.getStore()?.requestId;
    const message = `${alertGrade} address detected: ${address} riskScore: ${riskScore}`;
    const logData: RiskAssessmentLog = {
      eventName: LOG_EVENT_NAMES.RISK_ASSESSMENT,
      requestId,
      address,
      alertGrade,
      riskFactors,
      riskScore,
      message,
    };
    logger.warn(logData);
  }
};

const logApiUsage = async (meta: MonitoringTxMockResponse["meta"]) => {
  const { calls_left: callsLeft, calls_used: callsUsed } = meta;
  if (callsLeft === undefined || callsUsed === undefined) return;

  const totalCalls = callsLeft + callsUsed;
  const usedPercentage = (callsUsed / totalCalls) * 100;

  const message = `Crystal API Usage: ${callsUsed}/${totalCalls} (${usedPercentage.toFixed(2)}%)`;
  const logData = {
    eventName: LOG_EVENT_NAMES.API_USAGE,
    callsLeft,
    callsUsed,
    totalCalls,
    usedPercentage,
    message,
  };

  logger.info(logData);

  if (usedPercentage > ALERT_USED_THRESHOLD) {
    logger.warn(message);
  }

  if (callsLeft < totalCalls * 0.1) {
    logger.warn("API call limit is running low. Consider upgrading your plan.");
  }
};
