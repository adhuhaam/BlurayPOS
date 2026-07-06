import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type ZReportDto } from '@pos/api-client';
import { Button, Card, Input, Modal, PageHeader } from '@pos/ui';
import { usePos } from '../auth';
import { StatusBar } from '../components/StatusBar';

export function ShiftPage() {
  const { store, shift, refreshShift, logout, storeId } = usePos();
  const navigate = useNavigate();
  const [openingFloat, setOpeningFloat] = useState('100');
  const [closingCash, setClosingCash] = useState('');
  const [loading, setLoading] = useState(false);
  const [zReport, setZReport] = useState<ZReportDto | null>(null);

  const handleOpen = async () => {
    if (!storeId) return;
    setLoading(true);
    await api.openShift(storeId, { openingFloat: Number(openingFloat) });
    await refreshShift();
    setLoading(false);
    navigate('/');
  };

  const handleClose = async () => {
    if (!shift) return;
    setLoading(true);
    await api.closeShift(shift.id, { closingCash: Number(closingCash) });
    const report = await api.getZReport(shift.id);
    setZReport(report);
    await refreshShift();
    setLoading(false);
  };

  const isOpen = shift?.status === 'Open';

  return (
    <div className="flex h-screen flex-col bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <PageHeader title={store?.name ?? 'Shift'} subtitle="Manage your register shift" />
        <div className="flex items-center gap-3">
          <StatusBar />
          <Button variant="ghost" onClick={logout}>Logout</Button>
        </div>
      </div>

      {zReport ? (
        <Card className="mx-auto w-full max-w-lg" title="Z-Report">
          <div className="space-y-2 text-sm">
            <p><strong>Store:</strong> {zReport.storeName}</p>
            <p><strong>Opened:</strong> {new Date(zReport.openedAt).toLocaleString()}</p>
            <p><strong>Closed:</strong> {zReport.closedAt ? new Date(zReport.closedAt).toLocaleString() : '—'}</p>
            <p><strong>Orders:</strong> {zReport.orderCount}</p>
            <p><strong>Total Sales:</strong> ${zReport.totalSales.toFixed(2)}</p>
            <p><strong>Cash:</strong> ${zReport.totalCash.toFixed(2)}</p>
            <p><strong>Card:</strong> ${zReport.totalCard.toFixed(2)}</p>
            <p><strong>Opening Float:</strong> ${zReport.openingFloat.toFixed(2)}</p>
            <p><strong>Expected Cash:</strong> ${zReport.expectedCash.toFixed(2)}</p>
            <p><strong>Closing Cash:</strong> ${zReport.closingCash.toFixed(2)}</p>
            <p className={zReport.variance !== 0 ? 'text-amber-600 font-semibold' : 'text-green-600'}>
              <strong>Variance:</strong> ${zReport.variance.toFixed(2)}
            </p>
          </div>
          <Button className="mt-4 w-full" onClick={() => { setZReport(null); navigate('/'); }}>
            Done
          </Button>
        </Card>
      ) : (
        <Card className="mx-auto w-full max-w-lg" title={isOpen ? 'Close Shift' : 'Open Shift'}>
          {isOpen ? (
            <div className="space-y-4">
              <p className="text-text-muted">
                Shift opened at {new Date(shift.openedAt).toLocaleString()}
              </p>
              <p className="text-lg font-semibold text-text">
                Total Sales: ${shift.totalSales.toFixed(2)}
              </p>
              <Input label="Closing Cash" type="number" step="0.01" value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)} />
              <div className="flex gap-3">
                <Button className="flex-1" size="lg" onClick={() => navigate('/')} variant="secondary">
                  Continue Selling
                </Button>
                <Button className="flex-1" size="lg" onClick={handleClose} loading={loading} variant="danger">
                  Close Shift
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Input label="Opening Float" type="number" step="0.01" value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)} />
              <Button className="w-full" size="lg" onClick={handleOpen} loading={loading}>
                Open Shift
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
