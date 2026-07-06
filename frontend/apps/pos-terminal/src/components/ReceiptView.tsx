import type { OrderDto } from '@pos/api-client';

interface ReceiptViewProps {
  order: OrderDto;
  storeName: string;
  paymentQrPayload?: string | null;
  paymentInstructions?: string | null;
  onClose: () => void;
  onPrint: () => void;
}

export function ReceiptView({ order, storeName, paymentQrPayload, paymentInstructions, onClose, onPrint }: ReceiptViewProps) {
  const hasBankPayment = order.payments.some((p) => p.method === 'BankTransfer');
  const showQr = hasBankPayment && paymentQrPayload;
  const qrSrc = showQr
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&ecc=M&data=${encodeURIComponent(paymentQrPayload)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:bg-white print:p-0">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 text-black shadow-2xl print:shadow-none" id="receipt">
        <div className="text-center">
          <h2 className="text-lg font-bold">{storeName}</h2>
          <p className="text-sm text-gray-600">Order #{order.orderNumber}</p>
          <p className="text-xs text-gray-500">{new Date(order.completedAt ?? order.createdAt).toLocaleString()}</p>
        </div>
        <hr className="my-3 border-dashed" />
        <ul className="space-y-1 text-sm">
          {order.lines.map((line) => (
            <li key={line.id} className="flex justify-between">
              <span>{line.quantity}x {line.productName}</span>
              <span>${line.lineTotal.toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <hr className="my-3 border-dashed" />
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>${order.taxAmount.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-base"><span>Total</span><span>${order.total.toFixed(2)}</span></div>
        </div>
        <hr className="my-3 border-dashed" />
        <div className="space-y-1 text-sm">
          {order.payments.map((p) => (
            <div key={p.id} className="flex justify-between">
              <span>{p.method}</span><span>${p.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
        {hasBankPayment && (
          <>
            <hr className="my-3 border-dashed" />
            <div className="text-center text-sm">
              {paymentInstructions && <p className="mb-2 text-gray-600">{paymentInstructions}</p>}
              {qrSrc && (
                <div className="flex flex-col items-center gap-2">
                  <img src={qrSrc} alt="Payment QR" width={140} height={140} className="mx-auto" />
                  <p className="text-xs text-gray-500">Scan to pay</p>
                </div>
              )}
              {order.payments.find((p) => p.slipImagePath) && (
                <p className="mt-2 text-xs text-green-700">Transfer slip attached</p>
              )}
            </div>
          </>
        )}
        <p className="mt-4 text-center text-xs text-gray-500">Thank you for your purchase!</p>
        <div className="mt-4 flex gap-2 print:hidden">
          <button onClick={onClose} className="flex-1 rounded-lg border py-2 text-sm">Close</button>
          <button onClick={onPrint} className="flex-1 rounded-lg bg-blue-600 py-2 text-sm text-white">Print</button>
        </div>
      </div>
    </div>
  );
}
