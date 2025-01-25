import {
  APP_START_DATE,
  AllocationType,
  LONG_TERM_DAYS_AGO,
  SHORT_TERM_DAYS_AGO,
  config,
  isOverNDays,
  logger,
} from "@intmax2-function/shared";
import { TransferCheck } from "../lib/transferCheck";
import { processJobAllocation, processTermAllocation } from "./process.service";

export const performJob = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const type = args[0]?.toLowerCase();

  await TransferCheck.getInstance().initialize();

  switch (type) {
    case "job":
      await processJobAllocation(
        config.ALLOCATION_JOB_START_DATE,
        config.ALLOCATION_JOB_END_DATE,
        args[1]?.toLocaleLowerCase() as AllocationType,
      );
      break;
    case "short":
      logger.info(`Checking short-term allocation`);
      await processTermAllocation(SHORT_TERM_DAYS_AGO, "short");
      break;
    case "long":
      logger.info(`Checking long-term allocation`);
      if (!isOverNDays(APP_START_DATE, LONG_TERM_DAYS_AGO)) {
        logger.info(`Not over ${LONG_TERM_DAYS_AGO} days`);
        process.exit(0);
      }

      await processTermAllocation(LONG_TERM_DAYS_AGO, "long");
      break;
    default:
      logger.error(`Invalid type: ${type}`);
      process.exit(1);
  }
};
