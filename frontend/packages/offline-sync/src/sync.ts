import { api } from '@pos/api-client';
import type { SyncMutation } from '@pos/api-client';
import {
  db,
  cacheProducts,
  getPendingOutbox,
  getLastSequence,
  setLastSequence,
} from './db.js';

export async function syncPush(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingOutbox();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  const mutations: SyncMutation[] = pending.map((entry) => ({
    idempotencyKey: entry.idempotencyKey,
    entityType: entry.entityType,
    action: entry.action,
    payload: entry.payload,
  }));

  const response = await api.syncPush({ mutations });
  let synced = 0;
  let failed = 0;

  for (const result of response.results) {
    const entry = pending.find((e) => e.idempotencyKey === result.idempotencyKey);
    if (!entry?.id) continue;

    if (result.success) {
      await db.outbox.update(entry.id, { status: 'synced' });
      synced++;
    } else {
      await db.outbox.update(entry.id, { status: 'failed', error: result.error ?? 'Unknown error' });
      failed++;
    }
  }

  return { synced, failed };
}

export async function syncPull(storeId: string): Promise<number> {
  const sinceSequence = await getLastSequence(storeId);
  const response = await api.syncPull(storeId, sinceSequence);

  for (const event of response.events) {
    if (event.entityType === 'Product' && event.action !== 'Delete') {
      try {
        const product = JSON.parse(event.payload);
        await cacheProducts([product]);
      } catch {
        // skip malformed payloads
      }
    }
  }

  await setLastSequence(storeId, response.lastSequence);

  const products = await api.getProducts({ storeId, pageSize: 500 });
  await cacheProducts(products.items);

  return response.events.length;
}

export async function syncAll(storeId: string): Promise<void> {
  await syncPush();
  await syncPull(storeId);
}
