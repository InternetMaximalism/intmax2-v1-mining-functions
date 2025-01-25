import { randomBytes } from "crypto";

export const getRandomNumber = (min: number, max: number, decimalPlaces: number = 0) => {
  const randomNumber = Math.random() * (max - min) + min;
  return Number(randomNumber.toFixed(decimalPlaces));
};

export const sleep = (ms = 1000) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const chunkArray = (arr: string[], size: number): string[][] => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
};

export const getRandomString = (length: number): string => {
  const bytes = randomBytes(Math.ceil(length / 2));
  return bytes.toString("hex").slice(0, length);
};

export const getTimestamp = (depositedAt: { toDate: () => Date }) => {
  return depositedAt.toDate().getTime();
};
