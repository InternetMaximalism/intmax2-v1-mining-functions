import {
  Circulation,
  FIRESTORE_DOCUMENTS,
  FirestoreDocumentKey,
  config,
  createNetworkClient,
} from "@intmax2-function/shared";
import { GAS_FEES_CACHE_KEY } from "../constants";
import { gasFeeCache } from "../lib/gasFeeCache";

export const checkAddressExclusion = async (address: string) => {
  const isInCirculation = await checkAddressInclusion(
    FIRESTORE_DOCUMENTS.CIRCULATION_ADDRESSES,
    address,
  );
  const result = {
    isExcluded: isInCirculation,
  };

  return result;
};

const checkAddressInclusion = async (doc: FirestoreDocumentKey, address: string) => {
  const circulation = new Circulation(doc);
  const isExists = await circulation.addressExists(address);
  return isExists;
};

export const getGasFees = async () => {
  const cached = gasFeeCache.get(GAS_FEES_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const publicClient = createNetworkClient(config.NETWORK_TYPE);
  const { maxFeePerGas, maxPriorityFeePerGas } = await publicClient.estimateFeesPerGas();

  const gasFees = {
    maxFeePerGas: Number(maxFeePerGas),
    maxPriorityFeePerGas: Number(maxPriorityFeePerGas),
  };

  gasFeeCache.set(GAS_FEES_CACHE_KEY, gasFees);

  return gasFees;
};
