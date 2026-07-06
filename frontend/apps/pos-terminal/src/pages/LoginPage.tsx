import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getStoredStores, type StoreDto } from '@pos/api-client';
import { Button, Card, Input, Select, ThemeToggle, initTheme } from '@pos/ui';
import { usePos } from '../auth';
import { ApiError } from '@pos/api-client';

initTheme();

export function LoginPage() {
  const { login } = usePos();
  const navigate = useNavigate();
  const [email, setEmail] = useState('cashier@demo.com');
  const [password, setPassword] = useState('Cashier123!');
  const [storeId, setStoreId] = useState('');
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoadStores = async () => {
    if (!email || !password) { setError('Enter email and password first'); return; }
    setError('');
    try {
      const result = await api.login({ email, password });
      setStores(result.stores);
      if (result.stores.length > 0) setStoreId(result.stores[0].id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load stores');
      setStores(getStoredStores<StoreDto>());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) { setError('Please select a store'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email, password, storeId);
      navigate('/shift');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-surface p-4">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <Card className="w-full max-w-md" title="POS Terminal">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} required />
          <Select
            label="Store"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            options={[
              { value: '', label: 'Select store' },
              ...stores.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
          <Button type="button" variant="secondary" className="w-full" onClick={handleLoadStores}>
            Load Stores
          </Button>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Sign In
          </Button>
        </form>
      </Card>
    </div>
  );
}
