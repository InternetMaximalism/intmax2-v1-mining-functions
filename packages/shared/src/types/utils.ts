import { FIRESTORE_DOCUMENTS, FIRESTORE_DOCUMENT_EVENTS } from "../constants";

export interface AsyncLocalStorageStore {
  requestId: string;
}

export interface JWTPayload {
  clientServiceName: string;
  iat: number;
  exp?: number;
}

export type Address = string;
export type FirebaseTimestamp = FirebaseFirestore.Timestamp;

export const FIRESTORE_DOCUMENT_TYPES = {
  ...FIRESTORE_DOCUMENTS,
  ...FIRESTORE_DOCUMENT_EVENTS,
};

export type FirestoreDocumentKey =
  (typeof FIRESTORE_DOCUMENT_TYPES)[keyof typeof FIRESTORE_DOCUMENT_TYPES];
