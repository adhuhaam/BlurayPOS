import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type PublicOrderTrackDto } from '@pos/api-client';
import { formatMvr, paymentMethodLabel, serviceTypeLabel } from '@/lib/format';

export function TrackPage() {
  const { slug = '', token = '' } = useParams<{ slug: string; token: string }>();
  const [order, setOrder] = useState<PublicOrderTrackDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    async function load() {
      try {
        const data = await api.trackPublicOrder(token);
        if (!cancelled) {
          setOrder(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load order');
          setOrder(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    timer = setInterval(load, 30_000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <p className="text-neutral-500">Loading order…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <h1 className="text-xl font-semibold">Order not found</h1>
        <p className="mt-2 text-neutral-600">{error ?? 'Check your tracking link and try again.'}</p>
        <Link
          to={`/${slug}`}
          className="tap-target mt-6 inline-block rounded-xl bg-neutral-900 px-6 py-3 font-medium text-white"
        >
          Back to store
        </Link>
      </div>
    );
  }

  const statusText = order.statusLabel ?? order.status;
  const isRejected = order.status.toLowerCase().includes('reject');

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <header className="mb-6 text-center">
        <p className="text-sm text-neutral-500">Order #{order.orderNumber}</p>
        <h1 className="mt-1 text-2xl font-bold">{statusText}</h1>
        {isRejected && order.rejectedReason && (
          <p className="mt-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            {order.rejectedReason}
          </p>
        )}
      </header>

      <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-600">Total</span>
          <span className="font-semibold">{formatMvr(order.total)}</span>
        </div>
        {order.customerName && (
          <div className="flex justify-between">
            <span className="text-neutral-600">Name</span>
            <span>{order.customerName}</span>
          </div>
        )}
        {order.serviceType && (
          <div className="flex justify-between">
            <span className="text-neutral-600">Service</span>
            <span>{serviceTypeLabel(order.serviceType)}</span>
          </div>
        )}
        {order.paymentMethod && (
          <div className="flex justify-between">
            <span className="text-neutral-600">Payment</span>
            <span>{paymentMethodLabel(order.paymentMethod)}</span>
          </div>
        )}
        {order.paymentStatus && (
          <div className="flex justify-between">
            <span className="text-neutral-600">Payment status</span>
            <span>{order.paymentStatus}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-neutral-600">Placed</span>
          <span>{new Date(order.createdAt).toLocaleString()}</span>
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-semibold">Items</h2>
        <ul className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100">
          {order.lines.map((line) => (
            <li key={line.id} className="flex justify-between px-4 py-3 text-sm">
              <span>
                {line.quantity}× {line.productName}
              </span>
              <span>{formatMvr(line.lineTotal)}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-6 text-center text-xs text-neutral-500">Updates every 30 seconds</p>

      <Link
        to={`/${slug}`}
        className="tap-target mt-6 block rounded-xl border border-neutral-300 bg-white px-4 py-4 text-center font-medium"
      >
        Order again
      </Link>
    </div>
  );
}
