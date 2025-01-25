import {
  type DepositAnalyzedAndRelayedEventData,
  Event,
  FIRESTORE_DOCUMENT_EVENTS,
  config,
  createNetworkClient,
  logger,
} from "@intmax2-function/shared";
import { getEligibleMiningEntriesSinceLastEvent, processEligibleMining } from "./mining.service";

export const performJob = async (): Promise<void> => {
  const ethereumClient = createNetworkClient(config.NETWORK_TYPE);
  const event = new Event(FIRESTORE_DOCUMENT_EVENTS.V1_DEPOSITS_ANALYZED_AND_PROCESSED);

  const [currentBlockNumber, lastProcessedEvent] = await Promise.all([
    ethereumClient.getBlockNumber(),
    event.getEvent<DepositAnalyzedAndRelayedEventData>(),
  ]);

  const depositIds = await processNewMinings(
    ethereumClient,
    currentBlockNumber,
    lastProcessedEvent,
  );

  await updateEventState(event, depositIds, currentBlockNumber);
};

const processNewMinings = async (
  ethereumClient: ReturnType<typeof createNetworkClient>,
  currentBlockNumber: bigint,
  lastProcessedEvent: DepositAnalyzedAndRelayedEventData | null,
) => {
  const { depositIds, eligibleMiningEntries } = await getEligibleMiningEntriesSinceLastEvent(
    ethereumClient,
    currentBlockNumber,
    lastProcessedEvent,
  );

  if (depositIds.length === 0) {
    logger.info("No new deposits found.");
    return depositIds;
  }

  await processEligibleMining(eligibleMiningEntries);

  return depositIds;
};

const updateEventState = async (event: Event, depositIds: number[], currentBlockNumber: bigint) => {
  const eventData = {
    lastBlockNumber: Number(currentBlockNumber),
    ...(depositIds.length > 0 && {
      lastUpToDepositId: Math.max(...depositIds.map(Number)),
    }),
  };

  await event.addOrUpdateEvent(eventData);
};
