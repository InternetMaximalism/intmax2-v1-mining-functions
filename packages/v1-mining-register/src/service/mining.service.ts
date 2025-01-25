import { Timestamp } from "@google-cloud/firestore";
import {
  Alchemy,
  Circulation,
  type DepositAnalyzedAndRelayedEventData,
  type DepositLogDataWithBlockNumber,
  FIRESTORE_DOCUMENTS,
  type GetDepositData,
  Mining,
  type MiningEntries,
  type V1DepositData,
  config,
  eligibleMiningProcessor,
  getMiningTerm,
  logger,
  v1Int1Abi,
} from "@intmax2-function/shared";
import { type Abi, type PublicClient, zeroAddress } from "viem";
import { BATCH_SIZE, V1_INT1_CONTRACT_ADDRESS } from "../constants";
import { getIsMiningToken } from "../lib/utils";
import { getDepositIds, getDepositLogs } from "./deposit.service";

export const getEligibleMiningEntriesSinceLastEvent = async (
  ethereumClient: PublicClient,
  currentBlockNumber: bigint,
  lastProcessedEvent: DepositAnalyzedAndRelayedEventData | null,
) => {
  const depositIds = await getDepositIds(ethereumClient, currentBlockNumber, lastProcessedEvent);
  if (depositIds.length === 0) {
    return {
      depositIds,
      eligibleMiningEntries: [],
    };
  }

  const depositLogs = await getDepositLogs(ethereumClient, currentBlockNumber, depositIds);
  const eligibleMiningEntries = await getEligibleMiningEntries(
    ethereumClient,
    depositLogs,
    currentBlockNumber,
  );

  return {
    depositIds,
    eligibleMiningEntries,
  };
};

const getEligibleMiningEntries = async (
  ethereumClient: PublicClient,
  depositLogs: DepositLogDataWithBlockNumber[],
  currentBlockNumber: bigint,
) => {
  const alchemy = new Alchemy();

  const batches: DepositLogDataWithBlockNumber[][] = [];
  for (let i = 0; i < depositLogs.length; i += BATCH_SIZE) {
    batches.push(depositLogs.slice(i, i + BATCH_SIZE));
  }

  const eligibleMiningEntries: V1DepositData[] = [];
  for (const batch of batches) {
    const batchDepositData = await processDepositBatch(
      ethereumClient,
      batch,
      alchemy,
      currentBlockNumber,
    );
    eligibleMiningEntries.push(...batchDepositData);
  }

  return eligibleMiningEntries;
};

const processDepositBatch = async (
  ethereumClient: PublicClient,
  batch: DepositLogDataWithBlockNumber[],
  alchemy: Alchemy,
  currentBlockNumber: bigint,
) => {
  const depositIds = batch.map(({ depositId }) => depositId);
  const results = (await ethereumClient.readContract({
    address: V1_INT1_CONTRACT_ADDRESS,
    abi: v1Int1Abi as Abi,
    functionName: "getDepositDataBatch",
    args: [depositIds],
    blockNumber: currentBlockNumber,
  })) as GetDepositData[];

  if (results.length !== batch.length) {
    throw new Error("Mismatch between expected and actual deposit data");
  }

  const processPromises = results.map((depositData, index) =>
    processDepositEntry(depositData, batch[index], alchemy),
  );

  const processedData = await Promise.all(processPromises);
  return processedData.filter((item): item is V1DepositData => item !== null);
};

const processDepositEntry = async (
  depositData: GetDepositData,
  batch: DepositLogDataWithBlockNumber,
  alchemy: Alchemy,
) => {
  const { depositHash, sender, isRejected } = depositData;
  if (sender === zeroAddress || isRejected) {
    return null;
  }

  const depositLog = batch;
  const { isMiningToken, points } = getIsMiningToken(depositLog);
  if (!isMiningToken) {
    return null;
  }

  const { timestamp } = await alchemy.getBlock(depositLog.blockNumber);
  const depositedAt = new Date(Number(timestamp) * 1000);

  return {
    depositId: depositLog.depositId.toString(),
    depositHash,
    depositedAt: Timestamp.fromDate(depositedAt),
    blockNumber: Number(depositLog.blockNumber),
    address: depositLog.sender.toLowerCase(),
    amount: depositLog.amount.toString(),
    term: getMiningTerm(depositedAt),
    points,
  };
};

export const processEligibleMining = async (eligibleMiningEntries: V1DepositData[]) => {
  if (eligibleMiningEntries.length === 0) {
    logger.info("No eligible mining entries found.");
    return;
  }

  logger.info(`New mining entries: ${eligibleMiningEntries.length}`);

  const miningEntries = await eligibleMiningProcessor(eligibleMiningEntries, {
    tracerDepth: config.TRACER_DEPOSIT_DEPTH,
  });

  await saveMiningEntries(miningEntries);
  await updateCirculationAddresses(miningEntries.newCirculationAddresses);
};

const saveMiningEntries = async (miningEntries: MiningEntries) => {
  const mining = new Mining();
  const { nonCirculationMiningEntries, circulationMiningEntries } = miningEntries;

  logger.info(
    `
      Added mining entries - Non-circulation minings: ${nonCirculationMiningEntries.length},
      Circulation minings: ${circulationMiningEntries.length},
    `,
  );

  await mining.addMiningsBatch([...nonCirculationMiningEntries, ...circulationMiningEntries]);
};

const updateCirculationAddresses = async (newAddresses: string[]) => {
  if (newAddresses.length === 0) {
    logger.info("Circulation update: No new addresses confirmed as circulating in this batch");
    return;
  }

  logger.info(
    `Circulation update: ${newAddresses.length} new address(es) confirmed as circulating`,
  );

  const circulation = new Circulation(FIRESTORE_DOCUMENTS.CIRCULATION_ADDRESSES);
  await circulation.upsertCirculationsBatch(
    newAddresses.map((address) => ({
      address,
      circulationConfirmed: true,
    })),
  );
};
