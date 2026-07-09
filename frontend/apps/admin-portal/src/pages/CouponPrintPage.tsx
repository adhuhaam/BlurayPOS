import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, type CouponBatchPrintDto } from '@pos/api-client';
import { moduleUrls } from '@/config';
import { Button } from '@/components/ui/button';

function scanUrl(internalCode: string) {
  return `${moduleUrls.coupons}/s/${internalCode}`;
}

export function CouponPrintPage() {
  const { id, batchId } = useParams<{ id: string; batchId: string }>();
  const [data, setData] = useState<CouponBatchPrintDto | null>(null);

  useEffect(() => {
    if (id && batchId) api.getCouponBatchPrint(id, batchId).then(setData);
  }, [id, batchId]);

  if (!data) return <p className="p-8 text-muted-foreground">Loading print sheet…</p>;

  return (
    <div className="min-h-screen bg-white p-6 print:p-0">
      <div className="flex justify-between items-start mb-6 print:hidden max-w-4xl mx-auto">
        <div>
          <h1 className="text-xl font-bold">{data.campaignName}</h1>
          <p className="text-muted-foreground">{data.organizationName} — {data.rewardTitle}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {data.items.length} stickers
            {data.locationHint ? ` · ${data.locationHint}` : ''}
          </p>
        </div>
        <Button onClick={() => window.print()}>Print stickers</Button>
      </div>

      <div className="print-header hidden print:block text-center mb-4">
        <h1 className="text-lg font-bold">{data.campaignName}</h1>
        <p className="text-sm">{data.organizationName} — {data.rewardTitle}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-3 print:gap-3 max-w-5xl mx-auto">
        {data.items.map((item) => (
          <div
            key={item.id}
            className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center break-inside-avoid page-break-inside-avoid flex flex-col items-center"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 print:text-[10px]">
              {data.organizationName}
            </p>
            <img
              src={item.qrImageUrl}
              alt={`QR ${item.displayCode}`}
              className="mx-auto w-28 h-28 print:w-24 print:h-24"
            />
            <p className="font-bold mt-3 text-base tracking-wide">{item.displayCode}</p>
            <p className="text-xs text-slate-600 mt-1 leading-tight px-1">{data.rewardTitle}</p>
            <p className="text-[9px] text-slate-400 mt-2 break-all print:text-[8px]">
              {scanUrl(item.internalCode).replace(/^https?:\/\//, '')}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-header { display: block !important; }
        }
      `}</style>
    </div>
  );
}
