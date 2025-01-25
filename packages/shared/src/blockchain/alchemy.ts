import {
  Alchemy as AlchemyInstance,
  AssetTransfersCategory,
  type AssetTransfersParams,
  Network,
  SortingOrder,
} from "alchemy-sdk";
import { toHex } from "viem";
import { config } from "../config";
import { debugLog, logger, sleep } from "../lib";

interface GetAssetTransfersOptions {
  category?: AssetTransfersCategory[];
  fromBlock?: string | number;
  toBlock?: string | number;
  order?: SortingOrder;
  fromAddress?: string;
  toAddress?: string;
  contractAddresses?: string[];
  excludeZeroValue?: boolean;
  maxCount?: number;
  pageKey?: string;
  withMetadata?: boolean;
}

export class Alchemy {
  private alchemy: AlchemyInstance;
  private requestTimestamps: number[] = [];
  private readonly MAX_REQUESTS_PER_SECOND = 30;
  private alchemyCount = 0;
  private networkKey = `${config.NETWORK_TYPE}-${config.NETWORK_ENVIRONMENT}`;

  constructor(apiKey = config.ALCHEMY_API_KEY) {
    const network = this.getNetwork();
    const settings = {
      apiKey: apiKey,
      network,
      maxRetries: 5,
    };
    this.alchemy = new AlchemyInstance({ ...settings });
  }

  private getNetwork = () => {
    switch (this.networkKey) {
      case "ethereum-mainnet":
        return Network.ETH_MAINNET;
      case "ethereum-sepolia":
        return Network.ETH_SEPOLIA;
      case "base-mainnet":
        return Network.BASE_MAINNET;
      case "base-sepolia":
        return Network.BASE_SEPOLIA;
      default:
        throw new Error(`Unsupported network: ${this.networkKey}. Please check the configuration.`);
    }
  };

  async getLatestBlock() {
    return this.alchemy.core.getBlock("latest");
  }

  async getBalance(address: string) {
    return this.alchemy.core.getBalance(address);
  }

  async getBlock(blockNumber: bigint) {
    const blockHashOrBlockTag = `0x${Number(blockNumber).toString(16)}`;
    return this.alchemy.core.getBlock(blockHashOrBlockTag);
  }

  async getAssetTransfers(options: GetAssetTransfersOptions) {
    const maxRetries = 3;
    const baseDelay = 1000;

    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        this.alchemyCount += 1;
        debugLog("alchemyCount", this.alchemyCount.toString());
        await this.rateLimit();

        const category = this.getCategory();
        const defaultOptions: GetAssetTransfersOptions = {
          category,
          toBlock: "latest",
          fromBlock: config.V1_INT1_CONTRACT_DEPLOYED_BLOCK,
          order: SortingOrder.DESCENDING,
          withMetadata: true,
        };

        const params = {
          ...defaultOptions,
          ...options,
        } as AssetTransfersParams;

        if (typeof params.fromBlock === "number") {
          params.fromBlock = toHex(params.fromBlock);
        }
        if (typeof params.toBlock === "number") {
          params.toBlock = toHex(params.toBlock);
        }

        const result = await this.alchemy.core.getAssetTransfers(params);
        return result;
      } catch (error) {
        lastError = error;
        const isLastAttempt = attempt === maxRetries - 1;
        if (isLastAttempt) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        logger.error(
          `Attempt ${attempt + 1} failed, retrying in ${delay}ms: ${(error as Error).message}`,
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  private getCategory() {
    const network = this.getNetwork();

    if (network === Network.ETH_MAINNET) {
      return [
        AssetTransfersCategory.ERC20,
        AssetTransfersCategory.INTERNAL,
        AssetTransfersCategory.EXTERNAL,
      ];
    }

    return [AssetTransfersCategory.ERC20, AssetTransfersCategory.EXTERNAL];
  }

  private async rateLimit() {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter((timestamp) => now - timestamp < 1000);

    if (this.requestTimestamps.length >= this.MAX_REQUESTS_PER_SECOND) {
      const oldestTimestamp = this.requestTimestamps[0];
      const delay = 1000 - (now - oldestTimestamp);
      if (delay > 0) {
        await sleep(delay);
      }
    }

    this.requestTimestamps.push(Date.now());
  }
}
