import { config } from "../config";
import { FILE_PATHS } from "../constants";
import type { Address, Exchange, Token } from "../types";
import { downloadData } from "./cloudStorage";
import { logger } from "./logger";

export const fetchTokenList = async () => {
  try {
    const res = await downloadData(config.GOOGLE_STORE_BUCKET, FILE_PATHS.tokenPrices);
    const tokenList = JSON.parse(res) as Token[];
    return tokenList;
  } catch {
    logger.warn("Token list not found");
    return [];
  }
};

export const fetchAddressLists = async () => {
  const [exchangesResult, defiProtocolsResult] = await Promise.all([
    downloadData(config.GOOGLE_STORE_BUCKET, FILE_PATHS.exchanges),
    downloadData(config.GOOGLE_STORE_BUCKET, FILE_PATHS.defiProtocols),
  ]);
  const exchangeAddresses = (JSON.parse(exchangesResult) as Exchange).result.rows.map(
    (exchange) => exchange.address,
  );
  const defiProtocolAddresses = (JSON.parse(defiProtocolsResult) as Address[]).map(
    (address) => address,
  );

  return [...defiProtocolAddresses, ...exchangeAddresses];
};
