import { UTCDate } from "@date-fns/utc";
import { endOfDay, startOfDay, subDays } from "date-fns";

export const getCurrentUTCDate = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const parseDate = (date: string | Date) => {
  if (date instanceof Date) {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  }

  const [year, month, day] = date.split("/").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export const validateDateRange = (startDate: string | Date, endDate: string | Date) => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (end < start) {
    throw new Error("End date must be after start date");
  }

  return { start, end };
};

export const getUTCDateAndTimestamps = (daysAgo: number) => {
  const today = new UTCDate();
  const targetDate = subDays(today, daysAgo);
  const utcTarget = new UTCDate(targetDate);

  const dayStart = startOfDay(utcTarget);
  const dayEnd = endOfDay(utcTarget);

  return {
    date: utcTarget.toISOString().split("T")[0],
    startTimestamp: dayStart.getTime(),
    endTimestamp: dayEnd.getTime(),
  };
};
