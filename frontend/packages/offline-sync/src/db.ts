import Dexie, { type Table } from 'dexie';
import type { ProductDto } from '@pos/api-client';

export interface CachedProduct extends ProductDto {
  cachedAt: string;
}

export interface OutboxEntry {
  id?: number;
  idempotencyKey: string;
  entityType: string;
  action: string;
  payload: string;
  createdAt: string;
  status: 'pending' | 'synced' | 'failed';
  error?: string;
}

export interface SyncMeta {
  id: string;
  lastSequence: number;
  lastPullAt: string;
}

export class PosDatabase extends Dexie {
  products!: Table<CachedProduct, string>;
  outbox!: Table<OutboxEntry, number>;
  syncMeta!: Table<SyncMeta, string>;

  constructor() {
    super('pos-offline');
    this.version(1).stores({
      products: 'id, sku, barcode, categoryId, name',
      outbox: '++id, idempotencyKey, status, createdAt',
      syncMeta: 'id',
    });
  }
}

export const db = new PosDatabase();

export async function cacheProducts(products: ProductDto[]): Promise<void> {
  const now = new Date().toISOString();
  await db.products.bulkPut(
    products.map((p) => ({ ...p, cachedAt: now })),
  );
}

export async function getCachedProducts(search?: string): Promise<CachedProduct[]> {
  let collection = db.products.toCollection();
  if (search) {
    const term = search.toLowerCase();
    const all = await db.products.toArray();
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.barcode?.toLowerCase().includes(term) ?? false),
    );
  }
  return collection.toArray();
}

export async function getCachedProductByBarcode(barcode: string): Promise<CachedProduct | undefined> {
  return db.products.where('barcode').equals(barcode).first();
}

export async function addToOutbox(
  entityType: string,
  action: string,
  payload: unknown,
): Promise<string> {
  const idempotencyKey = crypto.randomUUID();
  await db.outbox.add({
    idempotencyKey,
    entityType,
    action,
    payload: JSON.stringify(payload),
    createdAt: new Date().toISOString(),
    status: 'pending',
  });
  return idempotencyKey;
}

export async function getPendingOutboxCount(): Promise<number> {
  return db.outbox.where('status').equals('pending').count();
}

export async function getPendingOutbox(): Promise<OutboxEntry[]> {
  return db.outbox.where('status').equals('pending').toArray();
}

export async function getLastSequence(storeId: string): Promise<number> {
  const meta = await db.syncMeta.get(storeId);
  return meta?.lastSequence ?? 0;
}

export async function setLastSequence(storeId: string, sequence: number): Promise<void> {
  await db.syncMeta.put({
    id: storeId,
    lastSequence: sequence,
    lastPullAt: new Date().toISOString(),
  });
}
