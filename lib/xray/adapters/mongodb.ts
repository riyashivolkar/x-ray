/**
 * MongoDB Storage Adapter for X-Ray
 */

import type { MongoClient, Db, Collection } from "mongodb";
import type { StorageAdapter, Execution, DataRecord } from "../index";

export class MongoDBAdapter implements StorageAdapter {
  private client: MongoClient | null = null;
  private db: Db;
  private collection: Collection<Execution>;

  constructor(db: Db, collectionName = "xray_executions") {
    this.db = db;
    this.collection = this.db.collection<Execution>(collectionName);
    this.ensureIndexes();
  }

  private async ensureIndexes(): Promise<void> {
    try {
      // Create indexes for common queries
      await this.collection.createIndex({ id: 1 }, { unique: true });
      await this.collection.createIndex({ pipelineName: 1 });
      await this.collection.createIndex({ status: 1 });
      await this.collection.createIndex({ startedAt: -1 });
    } catch (error) {
      console.error("Failed to create indexes:", error);
    }
  }

  async save(execution: Execution): Promise<void> {
    await this.collection.replaceOne({ id: execution.id }, execution, {
      upsert: true,
    });
  }

  async get(executionId: string): Promise<Execution | null> {
    return await this.collection.findOne({ id: executionId });
  }

  async query(filter: DataRecord): Promise<Execution[]> {
    return await this.collection.find(filter).toArray();
  }

  async delete(executionId: string): Promise<void> {
    await this.collection.deleteOne({ id: executionId });
  }

  async close(): Promise<void> {
    // No-op since we're using an existing DB connection
  }
}
