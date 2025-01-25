import {
  Circulation,
  Event,
  type EventData,
  FIRESTORE_DOCUMENTS,
  FIRESTORE_DOCUMENT_EVENTS,
  config,
  createNetworkClient,
} from "@intmax2-function/shared";
import {
  findUnregisteredWithdrawalAddresses,
  getWithdrawalUniqueAddresses,
  processWithdrawalAddresses,
} from "./observer.service";

export const performJob = async (): Promise<void> => {
  const ethereumClient = createNetworkClient(config.NETWORK_TYPE);
  const event = new Event(FIRESTORE_DOCUMENT_EVENTS.V1_WITHDRAWN);
  const circulation = new Circulation(FIRESTORE_DOCUMENTS.CIRCULATION_ADDRESSES);

  const [currentBlockNumber, lastProcessedEvent] = await Promise.all([
    ethereumClient.getBlockNumber(),
    event.getEvent<EventData>(),
  ]);

  const withdrawalAddresses = await getWithdrawalUniqueAddresses(
    ethereumClient,
    currentBlockNumber,
    lastProcessedEvent,
  );

  const unregisteredAddresses = await findUnregisteredWithdrawalAddresses(
    circulation,
    withdrawalAddresses,
  );

  await processWithdrawalAddresses({ unregisteredAddresses, circulation });

  await event.addOrUpdateEvent({
    lastBlockNumber: Number(currentBlockNumber),
  });
};
