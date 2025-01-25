import {
  APP_START_DATE,
  ETHEREUM_SHORT_TERM_END_DATE,
  LONG_TERM_DAYS_AGO,
  isOverNDays,
} from "@intmax2-function/shared";
import { NETWORK_TYPE } from "../constants";

export const shouldSubmitShortTermTree = () => {
  if (NETWORK_TYPE === "base") {
    return true;
  }

  return new Date() < new Date(ETHEREUM_SHORT_TERM_END_DATE);
};

export const shouldSubmitLongTermTree = () => {
  return isOverNDays(APP_START_DATE, LONG_TERM_DAYS_AGO);
};
