import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { getAccessToken, getApiBaseUrl } from '@pos/api-client';

export function usePosHub(
  storeId: string | null,
  onInventoryUpdated?: (productId: string, quantityOnHand: number) => void,
  onOnlineOrder?: (payload: { orderId: string; orderNumber: string; total: number; customerName: string }) => void,
) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!storeId) return;

    const token = getAccessToken();
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${getApiBaseUrl()}/hubs/pos?access_token=${encodeURIComponent(token)}`)
      .withAutomaticReconnect()
      .build();

    connection.on('InventoryUpdated', (data: { productId: string; quantityOnHand: number }) => {
      onInventoryUpdated?.(data.productId, data.quantityOnHand);
    });

    connection.on('OnlineOrderSubmitted', (data: { orderId: string; orderNumber: string; total: number; customerName: string }) => {
      onOnlineOrder?.(data);
    });

    connection.start()
      .then(() => connection.invoke('JoinStore', storeId))
      .catch(() => {});

    connectionRef.current = connection;

    return () => {
      connection.invoke('LeaveStore', storeId).catch(() => {});
      connection.stop();
    };
  }, [storeId, onInventoryUpdated, onOnlineOrder]);
}
