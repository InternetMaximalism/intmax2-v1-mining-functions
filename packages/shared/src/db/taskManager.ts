import type { CollectionReference } from "@google-cloud/firestore";
import { FIRESTORE_COLLECTIONS } from "../constants";
import { AppError, ErrorCode, logger } from "../lib";
import type { Task } from "../types";
import { db } from "./firestore";

export class TaskManager {
  private readonly db = db;
  private readonly collection: CollectionReference;

  constructor() {
    this.collection = this.db.collection(FIRESTORE_COLLECTIONS.TASK_MANEGERS);
  }

  async createOrUpdateTask({ date, ...rest }: Task, docId: string) {
    try {
      const docRef = this.collection.doc(docId).collection("tasks").doc(date);
      return docRef.set({ ...rest, createdAt: new Date() }, { merge: true });
    } catch (error) {
      logger.error(error);
      throw new AppError(
        500,
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to create or update task manager ${(error as Error).message}`,
      );
    }
  }

  async getAllocationTask(docId: string, date: string) {
    try {
      const docRef = this.collection.doc(docId).collection("tasks").doc(date);
      const doc = await docRef.get();
      if (!doc.exists) {
        return null;
      }

      return { date, ...doc.data()! } as Task;
    } catch (error) {
      logger.error(error);
      throw new AppError(
        500,
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to get task manager ${(error as Error).message}`,
      );
    }
  }

  async getLatestAllocationTask(docId: string) {
    try {
      const docRef = this.collection.doc(docId).collection("tasks");
      const snapshot = await docRef.orderBy("createdAt", "desc").limit(1).get();
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const date = doc.id;
      return { date, ...doc.data() } as Task;
    } catch (error) {
      logger.error(error);
      throw new AppError(
        500,
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to get latest task manager ${(error as Error).message}`,
      );
    }
  }
}
