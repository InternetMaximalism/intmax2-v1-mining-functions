import type { PublicClient } from "viem";

interface GasPriceData {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

const PRECISION = 10n;

const calculateAdjustedGasPrices = (multiplier: number, gasPriceData: GasPriceData) => {
  const multiplierScaled = BigInt(Math.round(multiplier * Number(PRECISION)));

  const maxFeePerGas = (gasPriceData.maxFeePerGas * multiplierScaled) / PRECISION;
  const maxPriorityFeePerGas = (gasPriceData.maxPriorityFeePerGas * multiplierScaled) / PRECISION;

  return {
    maxFeePerGas,
    maxPriorityFeePerGas,
    l2GasPrice: maxFeePerGas,
  };
};

export const calculateGasMultiplier = (attempt: number, incrementRate: number = 0.2) => {
  if (attempt === 0) return 1;

  return 1 + attempt * incrementRate;
};

export const getMaxGasMultiplier = async (publicClient: PublicClient, multiplier: number) => {
  const gasPriceData = await publicClient.estimateFeesPerGas();
  const { maxFeePerGas, maxPriorityFeePerGas } = calculateAdjustedGasPrices(
    multiplier,
    gasPriceData,
  );

  return { maxFeePerGas, maxPriorityFeePerGas };
};

export const calculateIncreasedGasFees = (
  previousMaxFeePerGas: bigint,
  previousMaxPriorityFeePerGas: bigint,
  currentMaxFeePerGas: bigint,
  currentMaxPriorityFeePerGas: bigint,
) => {
  const newMaxFeePerGas =
    previousMaxFeePerGas > currentMaxFeePerGas ? previousMaxFeePerGas + 1n : currentMaxFeePerGas;

  const newMaxPriorityFeePerGas =
    previousMaxPriorityFeePerGas > currentMaxPriorityFeePerGas
      ? previousMaxPriorityFeePerGas
      : currentMaxPriorityFeePerGas;

  return {
    newMaxFeePerGas,
    newMaxPriorityFeePerGas,
  };
};
