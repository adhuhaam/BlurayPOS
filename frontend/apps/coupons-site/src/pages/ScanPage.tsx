import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError, type PublicCouponScanDto } from '@pos/api-client';

export function ScanPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<PublicCouponScanDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  useEffect(() => {
    if (!code) return;
    api.getPublicCouponScan(code)
      .then(setScan)
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'Invalid or expired QR code'))
      .finally(() => setLoading(false));
  }, [code]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !consent) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.submitPublicCouponEntry(code, { name, phone, consent, honeypot });
      navigate(`/thanks?code=${encodeURIComponent(res.displayCode)}&msg=${encodeURIComponent(res.message)}`);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Could not submit entry');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">Loading…</div>;
  }

  if (error && !scan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!scan) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <p className="text-sm text-slate-500 uppercase tracking-wide">{scan.organizationName}</p>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">{scan.campaignName}</h1>
          <p className="text-lg text-slate-600 mt-2">{scan.rewardTitle}</p>
          <p className="mt-4 text-sm text-slate-500">
            Lucky ID: <span className="font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-lg">{scan.displayCode}</span>
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 border border-slate-200/50">
          {scan.alreadyEntered ? (
            <p className="text-center text-green-700">
              You already entered as <strong>{scan.existingEntryName}</strong>. Good luck!
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Full name *</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Phone *</label>
                <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-xl" placeholder="+960 123-4567" />
              </div>
              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" required />
                I agree to the terms and allow the store to contact me about this offer.
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'Submitting…' : 'Enter'}
              </button>
            </form>
          )}
        </div>

        {scan.contactUrl && (
          <div className="text-center">
            <a href={scan.contactUrl} target="_blank" rel="noreferrer" className="inline-flex px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold">
              Join community
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
