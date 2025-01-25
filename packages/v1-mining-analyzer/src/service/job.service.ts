import {
  Event,
  type EventData,
  FIRESTORE_DOCUMENT_EVENTS,
  createNetworkClient,
  logger,
} from "@intmax2-function/shared";
import { NETWORK_TYPE } from "../constants";
import { processAMLBatches } from "./aml.service";
import { processBatches } from "./batch.service";
import { getV1DepositedEvent, getV1DepositsAnalyzedAndProcessedEvent } from "./event.service";
import { submitAnalyzeAndProcessDeposits, summarizeDepositAnalysis } from "./submit.service";

export const performJob = async () => {
  const ethereumClient = createNetworkClient(NETWORK_TYPE);
  const event = new Event(FIRESTORE_DOCUMENT_EVENTS.V1_DEPOSIT);

  const [currentBlockNumber, lastProcessedEvent] = await Promise.all([
    await ethereumClient.getBlockNumber(),
    await event.getEvent<EventData>(),
  ]);

  await processAnalyzer(ethereumClient, currentBlockNumber, lastProcessedEvent);
  await updateEventState(event, currentBlockNumber);
};

const processAnalyzer = async (
  ethereumClient: ReturnType<typeof createNetworkClient>,
  currentBlockNumber: bigint,
  lastProcessedEvent: EventData | null,
) => {
  const processedDepositLogs = await getV1DepositedEvent(
    ethereumClient,
    currentBlockNumber,
    lastProcessedEvent,
  );

  if (processedDepositLogs.length === 0) {
    logger.info("No new deposits found.");
    return processedDepositLogs;
  }

  logger.info(`New deposit events: ${processedDepositLogs.length}`);

  const rejectDepositIds = await getV1DepositsAnalyzedAndProcessedEvent(
    ethereumClient,
    currentBlockNumber,
    lastProcessedEvent,
  );

  const batchResults = await processBatches(processedDepositLogs);
  const amlBatchResults = await processAMLBatches(batchResults);
  const depositSummary = await summarizeDepositAnalysis(amlBatchResults, rejectDepositIds);
  await submitAnalyzeAndProcessDeposits(ethereumClient, depositSummary);

  return processedDepositLogs;
};

const updateEventState = async (event: Event, currentBlockNumber: bigint) => {
  const eventData = {
    lastBlockNumber: Number(currentBlockNumber),
  };
  await event.addOrUpdateEvent(eventData);
};
