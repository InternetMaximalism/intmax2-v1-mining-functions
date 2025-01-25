export const LOG_EVENT_NAMES = {
  SLOW_REQUEST: "slowRequest",
  RISK_ASSESSMENT: "riskAssessment",
  API_USAGE: "apiUsage",
} as const;

export type LogEventName = (typeof LOG_EVENT_NAMES)[keyof typeof LOG_EVENT_NAMES];
