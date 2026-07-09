import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '@pos/api-client';
import {
  cartSubtotal,
  cartTax,
  cartTotal,
  clearCart,
  getCart,
  toOrderLines,
  type CartLine,
} from '@/lib/cart';
import { formatMvr, paymentMethodLabel, serviceTypeLabel } from '@/lib/format';
import { useStore } from '@/context/StoreContext';
import { notifyCartUpdated } from '@/components/StickyCartBar';

type ServiceType = 'Delivery' | 'Pickup' | 'DineIn';
type PaymentMethod = 'CashOnDelivery' | 'BankTransfer';

const STEPS = ['Your details', 'Payment', 'Confirm'] as const;

export function CheckoutPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { store, selectedStoreId, loading } = useStore();
  const [step, setStep] = useState(0);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('Pickup');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CashOnDelivery');
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPath, setSlipPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const cart = getCart(slug);
    if (cart.length === 0 && !loading) {
      navigate(`/${slug}/cart`, { replace: true });
      return;
    }
    setLines(cart);
  }, [slug, loading, navigate]);

  useEffect(() => {
    if (!store) return;
    if (store.allowPickup) setServiceType('Pickup');
    else if (store.allowDelivery) setServiceType('Delivery');
    else if (store.allowDineIn) setServiceType('DineIn');

    if (store.allowCashOnDelivery) setPaymentMethod('CashOnDelivery');
    else if (store.allowBankTransfer) setPaymentMethod('BankTransfer');
  }, [store]);

  const serviceOptions = useMemo(() => {
    if (!store) return [] as ServiceType[];
    const opts: ServiceType[] = [];
    if (store.allowPickup) opts.push('Pickup');
    if (store.allowDelivery) opts.push('Delivery');
    if (store.allowDineIn) opts.push('DineIn');
    return opts;
  }, [store]);

  const paymentOptions = useMemo(() => {
    if (!store) return [] as PaymentMethod[];
    const opts: PaymentMethod[] = [];
    if (store.allowCashOnDelivery) opts.push('CashOnDelivery');
    if (store.allowBankTransfer) opts.push('BankTransfer');
    return opts;
  }, [store]);

  const subtotal = cartSubtotal(lines);
  const tax = cartTax(lines);
  const deliveryFee = serviceType === 'Delivery' ? (store?.deliveryFeeFlat ?? 0) : 0;
  const total = cartTotal(lines) + deliveryFee;

  const detailsValid =
    customerName.trim().length >= 2 &&
    customerPhone.trim().length >= 5 &&
    (serviceType !== 'Delivery' || deliveryAddress.trim().length >= 5);

  const paymentValid =
    paymentMethod !== 'BankTransfer' || slipPath !== null || slipFile !== null;

  const handleUploadSlip = async () => {
    if (!slipFile) return;
    setUploading(true);
    setSubmitError(null);
    try {
      const res = await api.uploadPublicFile(slipFile);
      setSlipPath(res.path);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!store || !selectedStoreId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      let finalSlipPath = slipPath;
      if (paymentMethod === 'BankTransfer' && slipFile && !finalSlipPath) {
        const res = await api.uploadPublicFile(slipFile);
        finalSlipPath = res.path;
      }

      const result = await api.placePublicOrder(slug, {
        storeId: selectedStoreId,
        lines: toOrderLines(lines),
        serviceType,
        paymentMethod,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: serviceType === 'Delivery' ? deliveryAddress.trim() : undefined,
        deliveryNotes: deliveryNotes.trim() || undefined,
        notes: notes.trim() || undefined,
        slipImagePath: finalSlipPath ?? undefined,
      });

      clearCart(slug);
      notifyCartUpdated();
      navigate(`/${slug}/track/${result.trackingToken}`, { replace: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <p className="text-neutral-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-4 pb-8">
      <header className="mb-6 flex items-center gap-3">
        <Link to={`/${slug}/cart`} className="tap-target flex items-center text-neutral-600">
          ← Cart
        </Link>
        <h1 className="text-xl font-bold">Checkout</h1>
      </header>

      <ol className="mb-6 flex gap-2">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex-1 rounded-lg px-2 py-2 text-center text-xs font-medium sm:text-sm ${
              i === step
                ? 'bg-neutral-900 text-white'
                : i < step
                  ? 'bg-neutral-200 text-neutral-700'
                  : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Your name
            </label>
            <input
              id="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="tap-target w-full rounded-lg border border-neutral-300 px-3 py-3"
              placeholder="Full name"
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="tap-target w-full rounded-lg border border-neutral-300 px-3 py-3"
              placeholder="7-digit or mobile"
              autoComplete="tel"
            />
          </div>

          {serviceOptions.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium">How would you like your order?</legend>
              <div className="grid gap-2">
                {serviceOptions.map((opt) => (
                  <label
                    key={opt}
                    className={`tap-target flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${
                      serviceType === opt ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="serviceType"
                      checked={serviceType === opt}
                      onChange={() => setServiceType(opt)}
                      className="h-5 w-5"
                    />
                    <span className="font-medium">{serviceTypeLabel(opt)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {serviceType === 'Delivery' && (
            <>
              <div>
                <label htmlFor="address" className="mb-1 block text-sm font-medium">
                  Delivery address
                </label>
                <textarea
                  id="address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-3"
                  placeholder="House name, street, island"
                />
              </div>
              <div>
                <label htmlFor="deliveryNotes" className="mb-1 block text-sm font-medium">
                  Delivery notes (optional)
                </label>
                <input
                  id="deliveryNotes"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="tap-target w-full rounded-lg border border-neutral-300 px-3 py-3"
                  placeholder="Landmark, gate code, etc."
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="notes" className="mb-1 block text-sm font-medium">
              Order notes (optional)
            </label>
            <input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="tap-target w-full rounded-lg border border-neutral-300 px-3 py-3"
              placeholder="Special requests"
            />
          </div>

          <button
            type="button"
            disabled={!detailsValid}
            onClick={() => setStep(1)}
            className="tap-target w-full rounded-xl bg-neutral-900 px-5 py-4 text-lg font-semibold text-white disabled:opacity-40"
          >
            Continue to payment
          </button>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4">
          {paymentOptions.length === 0 ? (
            <p className="text-neutral-600">No payment methods available for this store.</p>
          ) : (
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Choose payment method</legend>
              <div className="grid gap-2">
                {paymentOptions.map((opt) => (
                  <label
                    key={opt}
                    className={`tap-target flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${
                      paymentMethod === opt ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === opt}
                      onChange={() => setPaymentMethod(opt)}
                      className="h-5 w-5"
                    />
                    <span className="font-medium">{paymentMethodLabel(opt)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {paymentMethod === 'BankTransfer' && store && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
              {store.paymentInstructions && (
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{store.paymentInstructions}</p>
              )}
              {store.paymentQrPayload && (
                <p className="text-xs break-all text-neutral-500">{store.paymentQrPayload}</p>
              )}
              <div>
                <label htmlFor="slip" className="mb-1 block text-sm font-medium">
                  Upload payment slip
                </label>
                <input
                  id="slip"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setSlipFile(e.target.files?.[0] ?? null);
                    setSlipPath(null);
                  }}
                  className="w-full text-sm"
                />
              </div>
              {slipFile && !slipPath && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => void handleUploadSlip()}
                  className="tap-target rounded-lg border border-neutral-300 px-4 py-2.5 font-medium"
                >
                  {uploading ? 'Uploading…' : 'Upload slip'}
                </button>
              )}
              {slipPath && <p className="text-sm text-green-700">Slip uploaded ✓</p>}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="tap-target flex-1 rounded-xl border border-neutral-300 px-4 py-4 font-medium"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!paymentValid || paymentOptions.length === 0}
              onClick={() => setStep(2)}
              className="tap-target flex-1 rounded-xl bg-neutral-900 px-4 py-4 font-semibold text-white disabled:opacity-40"
            >
              Review order
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2">
            <p className="font-medium">{customerName}</p>
            <p className="text-sm text-neutral-600">{customerPhone}</p>
            <p className="text-sm">
              {serviceTypeLabel(serviceType)}
              {serviceType === 'Delivery' && deliveryAddress && ` · ${deliveryAddress}`}
            </p>
            <p className="text-sm">{paymentMethodLabel(paymentMethod)}</p>
          </div>

          <ul className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100">
            {lines.map((line) => (
              <li key={line.productId} className="flex justify-between px-4 py-3 text-sm">
                <span>
                  {line.quantity}× {line.name}
                </span>
                <span>{formatMvr(line.price * line.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">Subtotal</span>
              <span>{formatMvr(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Tax</span>
              <span>{formatMvr(tax)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-600">Delivery fee</span>
                <span>{formatMvr(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-neutral-100 pt-2 text-lg font-semibold">
              <span>Total</span>
              <span>{formatMvr(total)}</span>
            </div>
          </div>

          {submitError && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{submitError}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={submitting}
              className="tap-target flex-1 rounded-xl border border-neutral-300 px-4 py-4 font-medium"
            >
              Back
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handlePlaceOrder()}
              className="tap-target flex-1 rounded-xl bg-neutral-900 px-4 py-4 text-lg font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Placing order…' : 'Place order'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
