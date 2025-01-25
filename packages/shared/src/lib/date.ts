import {
  addDays,
  differenceInDays,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfWeek,
  subDays,
  subWeeks,
} from "date-fns";
import { config } from "../config";
import { DATE_FORMAT } from "../constants";

const getLastMondayAtMidnightUTC = (date: Date) => {
  const copiedDate = new Date(date);
  const dayOfWeek = copiedDate.getUTCDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  copiedDate.setUTCDate(copiedDate.getUTCDate() - daysToSubtract);
  copiedDate.setUTCHours(0, 0, 0, 0);
  return copiedDate;
};

export const getMondayAtMidnightUTC = (date: Date, weeksAgo: number) => {
  const lastMonday = getLastMondayAtMidnightUTC(date);
  lastMonday.setUTCDate(lastMonday.getUTCDate() - 7 * weeksAgo);
  return lastMonday;
};

export const calculateThreeWeeklyTimestampRange = () => {
  if (config.IS_DAILY_REWARD_ENABLED) {
    return calculateYesterdayTimestampRange();
  }

  const currentDate = new Date();
  const thisWeekMonday = getMondayAtMidnightUTC(currentDate, 0);
  const lastWeekMonday = getMondayAtMidnightUTC(currentDate, 1);
  const twoWeeksAgoMonday = getMondayAtMidnightUTC(currentDate, 2);

  return {
    currentMondayTimestamp: thisWeekMonday.getTime(),
    lastWeekMondayTimestamp: lastWeekMonday.getTime(),
    twoWeeksAgoMondayTimestamp: twoWeeksAgoMonday.getTime(),
  };
};

export const getPreviousWeekDates = (referenceDate: Date = new Date()) => {
  if (config.IS_DAILY_REWARD_ENABLED) {
    return getPreviousDateDates(referenceDate);
  }

  const previousMonday = startOfWeek(addDays(referenceDate, -7), { weekStartsOn: 1 });
  const previousSunday = endOfWeek(previousMonday, { weekStartsOn: 1 });

  const dates: string[] = [];
  let currentDate = previousMonday;

  while (currentDate <= previousSunday) {
    dates.push(format(currentDate, "yyyy-MM-dd"));
    currentDate = addDays(currentDate, 1);
  }

  return dates;
};

export const getDates = (currentMondayTimestamp: number) => {
  if (config.IS_DAILY_REWARD_ENABLED) {
    return getYesterdayDates(currentMondayTimestamp);
  }

  const currentDate = new Date(currentMondayTimestamp);
  const oneWeekAgo = subWeeks(currentDate, 1);
  const twoWeekAgo = subDays(subWeeks(currentDate, 2), 1);
  return [
    format(currentDate, DATE_FORMAT),
    format(oneWeekAgo, DATE_FORMAT),
    format(twoWeekAgo, DATE_FORMAT),
  ];
};

const calculateYesterdayTimestampRange = () => {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const utcYesterday = subDays(now, 1);
  return {
    currentMondayTimestamp: now.getTime(),
    lastWeekMondayTimestamp: now.getTime(),
    twoWeeksAgoMondayTimestamp: utcYesterday.getTime(),
  };
};

const getYesterdayDates = (currentMondayTimestamp: number) => {
  const currentDate = new Date(currentMondayTimestamp);
  const yesterday = subDays(currentDate, 1);
  return [
    format(currentDate, DATE_FORMAT),
    format(yesterday, DATE_FORMAT),
    format(yesterday, DATE_FORMAT),
  ];
};

const getPreviousDateDates = (referenceDate: Date = new Date()) => {
  const previousDate = subDays(referenceDate, 1);
  return [format(previousDate, DATE_FORMAT)];
};

export const isOverNDays = (targetDate: string, days: number): boolean => {
  const parsedDate = parseISO(targetDate);
  if (!isValid(parsedDate)) {
    throw new Error("Invalid date format. Please use ISO 8601 format (YYYY-MM-DD)");
  }

  const today = new Date();
  const diffDays = differenceInDays(today, parsedDate);

  return diffDays > days;
};
