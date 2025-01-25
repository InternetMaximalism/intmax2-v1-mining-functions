// app
export const ALLOCATION_COMPLETED_SLEEP_TIME = 1000;

// mining
export const MAINNET_INITIAL_CASE_DATE = "2024-10-11T00:00:00Z";
export const STANDARD_MINING_SIZE = 10;

// case
export const RUSH_PERIOD = {
  START: new Date("2024-11-14T04:48:00.000Z").getTime(),
  END: new Date("2024-11-14T15:32:00.000Z").getTime(),
} as const;
