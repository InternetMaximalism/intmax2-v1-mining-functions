import type { DocumentReference, Query } from "@google-cloud/firestore";
import {
  FIRESTORE_COLLECTIONS,
  FIRESTORE_IN_MAX_BATCH_SIZE,
  FIRESTORE_MAX_BATCH_SIZE,
} from "../constants";
import { AppError, ErrorCode, chunkArray, logger } from "../lib";
import type { CirculationData, CirculationFilters, FirestoreDocumentKey } from "../types";
import { db } from "./firestore";

export class Circulation {
  private readonly db = db;
  private readonly circulationDocRef: DocumentReference;

  constructor(doc: FirestoreDocumentKey) {
    this.circulationDocRef = db.collection(FIRESTORE_COLLECTIONS.CIRCULATION).doc(doc);
  }

  async upsertCirculationsBatch(circulations: CirculationData[]) {
    const batches = [];
    const now = new Date();

    try {
      for (let i = 0; i < circulations.length; i += FIRESTORE_MAX_BATCH_SIZE) {
        const batch = this.db.batch();
        const batchCirculations = circulations.slice(i, i + FIRESTORE_MAX_BATCH_SIZE);

        for (const circulation of batchCirculations) {
          const ref = this.circulationDocRef
            .collection(FIRESTORE_COLLECTIONS.CIRCULATION_ADDRESSES)
            .doc(circulation.address);

          batch.set(
            ref,
            {
              ...circulation,
              createdAt: now,
            },
            { merge: true },
          );
        }

        batches.push(batch.commit());
      }

      await Promise.all(batches);
      return {
        count: circulations.length,
      };
    } catch (error) {
      logger.error(error);
      throw new AppError(
        500,
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to upsert circulations: ${(error as Error).message}`,
      );
    }
  }

  private async list(buildQuery?: (query: Query) => Query) {
    try {
      let query = this.circulationDocRef
        .collection(FIRESTORE_COLLECTIONS.CIRCULATION_ADDRESSES)
        .orderBy("__name__");

      if (buildQuery) {
        query = buildQuery(query);
      }

      const allCirculations = [];
      let lastDoc: FirebaseFirestore.DocumentSnapshot | null = null;

      do {
        let batchQuery = query.limit(FIRESTORE_MAX_BATCH_SIZE);
        if (lastDoc) {
          batchQuery = batchQuery.startAfter(lastDoc);
        }

        const snapshot = await batchQuery.get();
        const batchCirculations = snapshot.docs.map((doc) => {
          return { ...doc.data() } as CirculationData;
        });

        allCirculations.push(...batchCirculations);
        if (snapshot.size < FIRESTORE_MAX_BATCH_SIZE) {
          lastDoc = null;
        } else {
          lastDoc = snapshot.docs[snapshot.docs.length - 1];
        }
      } while (lastDoc);

      return allCirculations;
    } catch (error) {
      logger.error(error);
      throw new AppError(
        500,
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to list ${(error as Error).message}`,
      );
    }
  }

  async fetchCirculations(filters?: CirculationFilters) {
    return this.list((query) => {
      let modified = query;
      if (filters?.addresses) {
        modified = modified.where("address", "in", filters.addresses);
      }
      return modified;
    });
  }

  async fetchInCirculations(addresses: string[]) {
    if (addresses.length === 0) {
      return [];
    }

    try {
      const allCirculations: CirculationData[] = [];
      for (let i = 0; i < addresses.length; i += FIRESTORE_IN_MAX_BATCH_SIZE) {
        const batch = addresses.slice(i, i + FIRESTORE_IN_MAX_BATCH_SIZE);
        const batchCirculations = await this.fetchCirculations({ addresses: batch });
        allCirculations.push(...batchCirculations);
      }
      return allCirculations;
    } catch (error) {
      logger.error(error);
      throw new AppError(
        500,
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to fetch in circulations ${(error as Error).message}`,
      );
    }
  }

  async fetchAllCirculations() {
    return this.fetchCirculations();
  }

  async addressExists(address: string) {
    const query = this.circulationDocRef
      .collection(FIRESTORE_COLLECTIONS.CIRCULATION_ADDRESSES)
      .where("address", "==", address)
      .limit(1);

    const snapshot = await query.get();
    return !snapshot.empty;
  }

  async anyAddressExists(addresses: string[]) {
    if (addresses.length === 0) {
      return false;
    }

    const batches = chunkArray(addresses, FIRESTORE_IN_MAX_BATCH_SIZE);

    for (const batch of batches) {
      const query = this.circulationDocRef
        .collection(FIRESTORE_COLLECTIONS.CIRCULATION_ADDRESSES)
        .where("address", "in", batch)
        .limit(1);

      const snapshot = await query.get();
      if (!snapshot.empty) {
        return true;
      }
    }

    return false;
  }

  async deleteAddress(address: string) {
    try {
      const docRef = this.circulationDocRef
        .collection(FIRESTORE_COLLECTIONS.CIRCULATION_ADDRESSES)
        .doc(address);
      await docRef.delete();
    } catch (error) {
      logger.error(error);
      throw new AppError(
        500,
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to delete circulation address: ${address}`,
      );
    }
  }
}
