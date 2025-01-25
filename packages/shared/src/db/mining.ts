import type { CollectionReference, Query } from "@google-cloud/firestore";
import { FIRESTORE_COLLECTIONS, FIRESTORE_MAX_BATCH_SIZE } from "../constants";
import { AppError, ErrorCode, logger } from "../lib";
import type { MiningData, MiningFilters, MiningInput, MiningUpdateInput } from "../types";
import { db } from "./firestore";

export class Mining {
  private readonly db = db;
  private readonly collection: CollectionReference;
  protected readonly defaultOrderField = "depositId";
  protected readonly defaultOrderDirection = "desc";

  constructor() {
    this.collection = db.collection(FIRESTORE_COLLECTIONS.MINING);
  }

  async addMiningsBatch(inputs: MiningInput[]) {
    const batches = [];
    const now = new Date();

    try {
      for (let i = 0; i < inputs.length; i += FIRESTORE_MAX_BATCH_SIZE) {
        const batch = this.db.batch();
        const batchInputs = inputs.slice(i, i + FIRESTORE_MAX_BATCH_SIZE);

        for (const input of batchInputs) {
          const ref = this.collection.doc(input.depositId.toString());

          batch.set(
            ref,
            {
              ...input,
              createdAt: now,
            },
            { merge: false },
          );
        }

        batches.push(batch.commit());
      }

      await Promise.all(batches);

      return {
        count: inputs.length,
      };
    } catch (error) {
      logger.error(error);
      throw new AppError(
        500,
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to add minings: ${(error as Error).message}`,
      );
    }
  }

  async updateMiningsBatch(updateInputs: MiningUpdateInput[]) {
    const batches = [];

    try {
      for (let i = 0; i < updateInputs.length; i += FIRESTORE_MAX_BATCH_SIZE) {
        const batch = this.db.batch();
        const batchUpdateInputs = updateInputs.slice(i, i + FIRESTORE_MAX_BATCH_SIZE);

        for (const updateInput of batchUpdateInputs) {
          const {
            depositId,
            shortTermAllocation,
            longTermAllocation,
            isEligible,
            rejectReason,
            rewardCase,
          } = updateInput;
          const ref = this.collection.doc(depositId.toString());

          batch.set(
            ref,
            {
              shortTermAllocation,
              longTermAllocation,
              isEligible,
              rejectReason,
              rewardCase,
              updateAt: new Date(),
            },
            { merge: true },
          );
        }

        batches.push(batch.commit());
      }

      await Promise.all(batches);

      return {
        count: updateInputs.length,
      };
    } catch (error) {
      logger.error(error);
      throw new AppError(
        500,
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to update minings: ${(error as Error).message}`,
      );
    }
  }

  private async list(buildQuery?: (query: Query) => Query) {
    try {
      let query = this.collection.orderBy(
        this.defaultOrderField as string,
        this.defaultOrderDirection,
      );

      if (buildQuery) {
        query = buildQuery(query);
      }

      const allMinings = [];
      let lastDoc: FirebaseFirestore.DocumentSnapshot | null = null;

      do {
        let batchQuery = query.limit(FIRESTORE_MAX_BATCH_SIZE);
        if (lastDoc) {
          batchQuery = batchQuery.startAfter(lastDoc);
        }

        const snapshot = await batchQuery.get();
        const batchMinings = snapshot.docs.map((doc) => {
          const depositId = doc.id;
          return { depositId, ...doc.data() } as MiningData;
        });

        allMinings.push(...batchMinings);
        if (snapshot.size < FIRESTORE_MAX_BATCH_SIZE) {
          lastDoc = null;
        } else {
          lastDoc = snapshot.docs[snapshot.docs.length - 1];
        }
      } while (lastDoc);

      return allMinings;
    } catch (error) {
      logger.error(error);
      throw new AppError(
        500,
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to list ${(error as Error).message}`,
      );
    }
  }

  async fetchMinings(filters?: MiningFilters) {
    return this.list((query) => {
      let modified = query;
      if (filters?.startBlockNumber) {
        modified = modified.where("blockNumber", ">=", filters.startBlockNumber);
      }
      if (filters?.endBlockNumber) {
        modified = modified.where("blockNumber", "<=", filters.endBlockNumber);
      }
      if (filters?.address) {
        modified = modified.where("address", "==", filters.address);
      }
      if (filters?.isEligible !== undefined) {
        modified = modified.where("isEligible", "==", filters.isEligible);
      }
      return modified;
    });
  }

  async fetchAllMinings() {
    return this.list();
  }

  async fetchAllEligibleMinings() {
    return this.fetchMinings({ isEligible: true });
  }

  async getLatestMining() {
    try {
      const snapshot = await this.collection.orderBy("blockNumber", "desc").limit(1).get();
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const depositId = doc.id;
      return { depositId, ...doc.data() } as MiningData;
    } catch (error) {
      logger.error(error);
      throw new AppError(500, ErrorCode.INTERNAL_SERVER_ERROR, "Failed to get latest mining");
    }
  }
}
