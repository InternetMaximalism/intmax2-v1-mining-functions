import { differenceInDays, parse } from "date-fns";
import { MINING_FIRST_TERM_DURATION, MINING_START_DATE } from "../constants";

export const getMiningTerm = (date: Date = new Date()) => {
  const startDate = parse(MINING_START_DATE, "yyyy-MM-dd", new Date());
  const daysSinceStart = differenceInDays(date, startDate);

  if (daysSinceStart < 0) {
    return 0;
  }

  let termNumber = 1;
  let daysAccumulated = 0;
  let currentTermDuration = MINING_FIRST_TERM_DURATION;

  while (daysAccumulated <= daysSinceStart) {
    daysAccumulated += currentTermDuration;
    if (daysAccumulated > daysSinceStart) {
      return termNumber;
    }
    termNumber++;
    currentTermDuration *= 2;
  }

  return termNumber;
};
