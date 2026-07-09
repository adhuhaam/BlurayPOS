import { useSearchParams, Link } from 'react-router-dom';

export function ThanksPage() {
  const [params] = useSearchParams();
  const code = params.get('code') ?? '';
  const message = params.get('msg') ?? 'Thank you for participating!';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-4xl">✓</div>
        <h1 className="text-3xl font-bold text-slate-900">Thank you!</h1>
        {code && (
          <p className="text-lg text-slate-600">
            Code: <span className="font-semibold text-green-600">{code}</span>
          </p>
        )}
        <p className="text-slate-600">{message}</p>
        <div className="bg-white rounded-2xl shadow-xl p-6 text-left text-sm text-slate-600 space-y-2">
          <p>1. Keep your phone handy — the store may contact you if you win.</p>
          <p>2. Show your code at checkout if this is a discount coupon.</p>
          <p>3. Scan more stickers for more chances to win.</p>
        </div>
        <Link to="/" className="text-blue-600 font-medium">← Back</Link>
      </div>
    </div>
  );
}
