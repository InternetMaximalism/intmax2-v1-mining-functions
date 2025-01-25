import { AssetTransfersCategory, type AssetTransfersResult } from "alchemy-sdk";
import BigNumber from "bignumber.js";
import { formatUnits, zeroAddress } from "viem";
import { Alchemy } from "../blockchain";
import { config } from "../config";
import {
  BASE_BLOCK_NUMBER_PER_DAY,
  DEPTH_LIMIT,
  ETH_TOKEN_ID,
  FIRESTORE_DOCUMENTS,
  HUB_FROM_DAYS_AGO,
  HUB_MIN_ETH_BALANCE,
  HUB_UNIQUE_ADDRESSES,
  SIGNIFICANT_ETH_THRESHOLD_VALUE,
} from "../constants";
import { Circulation } from "../db";
import { debugLog, fetchTokenList, logger } from "../lib";
import { fetchAddressLists } from "../lib/listFetcher";
import { type AddressTraceResult, type HighValueSender, RejectReason, type Token } from "../types";
import { Queue } from "./queue";

type TraceTask = {
  address: string;
  promise: Promise<void>;
};

export class AddressTracer {
  private readonly alchemy: Alchemy;
  private readonly processedAddresses = new Set<string>();
  private readonly circulation: Circulation;
  private whiteList = new Set<string>();
  private currentBlockNumber = 0;
  tokenPriceList: Token[] = [];

  constructor(
    private readonly maxDepth: number = 4,
    private readonly queue = new Queue<string>(),
    private readonly depthLimits = DEPTH_LIMIT,
    private readonly maxConcurrentTasks = 3,
    private readonly intmaxContractAddress: `0x${string}`,
  ) {
    this.alchemy = new Alchemy();
    this.circulation = new Circulation(FIRESTORE_DOCUMENTS.CIRCULATION_ADDRESSES);
  }

  async initialize(): Promise<void> {
    await Promise.all([
      this.fetchAndCacheAddressLists(),
      this.fetchAndCacheTokenList(),
      this.getLatestBlock(),
    ]);
  }

  private async fetchAndCacheAddressLists(): Promise<void> {
    const whiteListAddresses = await fetchAddressLists();
    this.whiteList = new Set(whiteListAddresses);
  }

  private async fetchAndCacheTokenList(): Promise<void> {
    this.tokenPriceList = await fetchTokenList();
  }

  private async getLatestBlock() {
    const block = await this.alchemy.getLatestBlock();
    this.currentBlockNumber = block.number;
  }

  async processTraceQueuedAddresses() {
    logger.debug(
      `Tracing queued ${this.queue.size()} addresses maxConcurrentTasks: ${this.maxConcurrentTasks}`,
    );

    const existingCirculatedAddresses = await this.getExistingCirculatedAddresses();

    const nonCirculationAddresses = new Set<string>();
    const newCirculationAddresses = new Set<string>();
    const rejectReasons = new Map<string, RejectReason>();
    const runningTasks: TraceTask[] = [];

    const traceResults: AddressTraceResult[] = [];

    while (!this.queue.isEmpty() || runningTasks.length > 0) {
      while (runningTasks.length < this.maxConcurrentTasks && !this.queue.isEmpty()) {
        const address = this.queue.dequeue()!;
        if (!existingCirculatedAddresses.has(address)) {
          const task: TraceTask = {
            address,
            promise: this.processAddress(
              address,
              nonCirculationAddresses,
              newCirculationAddresses,
              rejectReasons,
              traceResults,
            ),
          };

          runningTasks.push(task);
        } else {
          rejectReasons.set(address, RejectReason.ALREADY_IN_CIRCULATION);
        }
      }

      if (runningTasks.length > 0) {
        const completedTaskIndex = await Promise.race(
          runningTasks.map((task, index) => task.promise.then(() => index)),
        );
        runningTasks.splice(completedTaskIndex, 1);
      }
    }

    logger.debug("Finished tracing queued addresses.");

    return {
      nonCirculationAddresses,
      newCirculationAddresses,
      rejectReasons,
      traceResults,
    };
  }

  private async getExistingCirculatedAddresses() {
    const circulations = await this.circulation.fetchInCirculations(this.queue.queues);
    return new Set(circulations.map(({ address }) => address));
  }

  private getAddressLimitForDepth(depth: number): number {
    return (
      this.depthLimits[depth] ??
      this.depthLimits[Math.max(...Object.keys(this.depthLimits).map(Number))]
    );
  }

  private async processAddress(
    address: string,
    nonCirculationAddresses: Set<string>,
    newCirculationAddresses: Set<string>,
    rejectedReasons: Map<string, string>,
    traceResults: AddressTraceResult[],
  ) {
    logger.debug(`Processing address: ${address}`);

    const result = await this.traceAddress(address);
    traceResults.push(result);
    this.collectCirculationAddresses(result, newCirculationAddresses, rejectedReasons);

    if (!result.isCirculation) {
      nonCirculationAddresses.add(address.toLowerCase());
    }

    const totalChildren = this.countTotalChildren(result);

    logger.debug(`Total children count for ${address}: ${totalChildren}`);
  }

  private collectCirculationAddresses(
    node: AddressTraceResult,
    newCirculationAddresses: Set<string>,
    rejectedReasons: Map<string, string>,
  ) {
    if (node.isCirculation) {
      const lowerCaseAddress = node.address.toLowerCase();
      newCirculationAddresses.add(lowerCaseAddress);

      if (node.rejectedReason) {
        rejectedReasons.set(lowerCaseAddress, node.rejectedReason);
      }
    }

    node.children.forEach((child) =>
      this.collectCirculationAddresses(child, newCirculationAddresses, rejectedReasons),
    );
  }

  private countTotalChildren(node: AddressTraceResult): number {
    let total = node.children.length;
    for (const child of node.children) {
      total += this.countTotalChildren(child);
    }
    return total;
  }

  private async traceAddress(
    address: string,
    depth: number = 0,
    highValueSender?: HighValueSender,
  ) {
    const result: AddressTraceResult = {
      address,
      fromAddressCount: 0,
      transactionCount: 0,
      isCirculation: false,
      children: [],
      rejectedReason: "",
      highValueSender,
    };

    if (depth >= this.maxDepth) {
      return result;
    }

    this.processedAddresses.add(address);
    debugLog(`Tracing address ${address} at depth ${depth}...`);

    try {
      const transferOptions = {
        fromBlock: config.V1_INT1_CONTRACT_DEPLOYED_BLOCK,
        toAddress: address,
      };
      const { transfers } = await this.alchemy.getAssetTransfers(transferOptions);
      const filteredTransfers = transfers
        .filter((transfer) => transfer.from !== zeroAddress)
        .map((transfer) => ({ ...transfer, from: transfer.from.toLowerCase() }));

      const fromAddresses = [
        ...new Set<string>(filteredTransfers.map((transfer) => transfer.from)),
      ];

      result.fromAddressCount = fromAddresses.length;
      result.transactionCount = transfers.length;

      const isAddressInINTMAXLiquidityContract = fromAddresses.some(
        (addr) => addr === this.intmaxContractAddress,
      );
      if (isAddressInINTMAXLiquidityContract) {
        result.isCirculation = true;
        result.rejectedReason = RejectReason.INTMAX_LIQUIDITY_CONTRACT;
        logger.debug(
          `Circulation detected: INTMAX Liquidity contract address ${this.intmaxContractAddress} found in from addresses for ${address}.`,
        );
        return result;
      }

      const { highValueSenders, sortedTransfers } = await this.getHighValueSenders(
        filteredTransfers,
        depth,
      );

      const fromAboveAddresses = sortedTransfers
        .filter((transfer) => transfer.isAboveThreshold)
        .map((transfer) => transfer.fromAddress);
      const isAnyAddressInCirculation = await this.circulation.anyAddressExists(fromAboveAddresses);
      if (isAnyAddressInCirculation) {
        result.isCirculation = true;
        result.rejectedReason = RejectReason.IN_CIRCULATION;
        return result;
      }

      const childPromises = highValueSenders.map(async (highValueSender) => {
        if (!this.processedAddresses.has(highValueSender.fromAddress)) {
          return this.traceAddress(highValueSender.fromAddress, depth + 1, highValueSender);
        }
        return null;
      });
      const childResults = await Promise.all(childPromises);

      for (const childResult of childResults) {
        if (childResult) {
          result.children.push(childResult);
          if (childResult.isCirculation) {
            result.isCirculation = true;
            result.rejectedReason = RejectReason.CHILD_IN_CIRCULATION;
            break;
          }
        }
      }

      return result;
    } catch (error) {
      logger.error(`Error tracing address ${address}: ${(error as Error).message}`);
      throw new Error((error as Error).message);
    }
  }

  private async excludeHubAddress(address: string) {
    const normalizedAddress = address.toLowerCase();
    const fromDaysAgo = this.getBlockNumberFromDaysAgo(HUB_FROM_DAYS_AGO);
    const fromTransferOptions = {
      fromBlock: this.currentBlockNumber - fromDaysAgo,
      fromAddress: normalizedAddress,
    };
    const toTransferOptions = {
      fromBlock: this.currentBlockNumber - fromDaysAgo,
      toAddress: normalizedAddress,
    };
    const [fromTransfers, toTransfers] = await Promise.all([
      this.alchemy.getAssetTransfers(fromTransferOptions),
      this.alchemy.getAssetTransfers(toTransferOptions),
    ]);
    const uniqueToAddresses = new Set<string>(
      fromTransfers.transfers.filter((transfer) => transfer.to).map((transfer) => transfer.to!),
    );

    const uniqueFromAddresses = new Set<string>(
      toTransfers.transfers.filter((transfer) => transfer.from).map((transfer) => transfer.from!),
    );

    const hasHighAddressVolume =
      uniqueToAddresses.size > HUB_UNIQUE_ADDRESSES &&
      uniqueFromAddresses.size > HUB_UNIQUE_ADDRESSES;
    const ethBalance = await this.alchemy.getBalance(normalizedAddress);

    return hasHighAddressVolume && ethBalance.toBigInt() > HUB_MIN_ETH_BALANCE;
  }

  private getBlockNumberFromDaysAgo(days: number) {
    return BASE_BLOCK_NUMBER_PER_DAY * days;
  }

  private async getHighValueSenders(transfers: AssetTransfersResult[], depth: number) {
    const nonWhitelistedUnprocessedTransfers = transfers.filter(
      (transfer) =>
        !this.whiteList.has(transfer.from) && !this.processedAddresses.has(transfer.from),
    );
    const addressLimit = this.getAddressLimitForDepth(depth);
    const sortedTransfers = this.sortTransfersByMarketValue(nonWhitelistedUnprocessedTransfers);

    const highValueSenders: HighValueSender[] = [];
    const uniqueAddresses = new Set<string>();

    for (const transfer of sortedTransfers) {
      const { fromAddress, totalUsdValueSent, isAboveThreshold } = transfer;
      if (!uniqueAddresses.has(fromAddress) && isAboveThreshold) {
        const isExcluded = await this.excludeHubAddress(fromAddress);
        if (isExcluded) {
          continue;
        }

        highValueSenders.push({
          fromAddress,
          totalUsdValueSent,
        });

        uniqueAddresses.add(fromAddress);

        if (uniqueAddresses.size === addressLimit) {
          break;
        }
      }
    }

    return { highValueSenders, sortedTransfers };
  }

  sortTransfersByMarketValue(transfers: AssetTransfersResult[]) {
    const ethPrice = this.tokenPriceList.find((token) => token.id === ETH_TOKEN_ID)?.price || 0;
    const ethThreshold = new BigNumber(SIGNIFICANT_ETH_THRESHOLD_VALUE);

    const transfersWithValue = transfers.map((transfer) => {
      let usdValue = new BigNumber(0);

      if (transfer.category === AssetTransfersCategory.EXTERNAL && transfer.asset === "ETH") {
        usdValue = new BigNumber(transfer.value || 0).multipliedBy(ethPrice);
      } else if (
        transfer.category === AssetTransfersCategory.ERC20 &&
        transfer.rawContract?.address
      ) {
        const tokenAddress = transfer.rawContract.address.toLowerCase();
        const tokenPrice =
          this.tokenPriceList.find((token) => token.contractAddress === tokenAddress)?.price || 0;
        this.tokenPriceList.find((token) => {
          return config.NETWORK_TYPE === "ethereum"
            ? token.contractAddress === tokenAddress
            : token.baseContractAddress === tokenAddress;
        })?.price || 0;

        if (tokenPrice && transfer.rawContract.value && transfer.rawContract.decimal) {
          const decimals = parseInt(transfer.rawContract.decimal, 16);
          const valueInWei = BigInt(transfer.rawContract.value);
          const adjustedValue = formatUnits(valueInWei, decimals);
          usdValue = new BigNumber(adjustedValue).multipliedBy(tokenPrice);
        }
      }

      return { ...transfer, usdValue };
    });

    const sumByFromAddress = transfersWithValue.reduce(
      (acc, transfer) => {
        const fromAddress = transfer.from.toLowerCase();
        if (!acc[fromAddress]) {
          acc[fromAddress] = new BigNumber(0);
        }
        acc[fromAddress] = acc[fromAddress].plus(transfer.usdValue);
        return acc;
      },
      {} as Record<string, BigNumber>,
    );

    const transfersWithSum = Object.entries(sumByFromAddress).map(
      ([fromAddress, totalUsdValueSent]) => {
        const totalValueInEth = totalUsdValueSent.dividedBy(ethPrice);
        return {
          fromAddress,
          totalUsdValueSent,
          isAboveThreshold: totalValueInEth.isGreaterThan(ethThreshold),
        };
      },
    );

    const sortedTransfersWithSum = transfersWithSum.sort((a, b) =>
      b.totalUsdValueSent.minus(a.totalUsdValueSent).toNumber(),
    );

    return sortedTransfersWithSum;
  }

  getEthPrice() {
    return this.tokenPriceList.find((token) => token.id === ETH_TOKEN_ID)?.price || 0;
  }
}
