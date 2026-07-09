import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StoreIcon, UtensilsCrossedIcon, ShoppingBagIcon } from 'lucide-react';
import { useAuth } from '@/auth';
import { ApiError, REGISTRATION_BUSINESS_TYPE_OPTIONS, type BusinessType } from '@pos/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/theme-toggle';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    businessName: '',
    ownerFirstName: '',
    ownerLastName: '',
    email: '',
    password: '',
    phone: '',
    businessType: '' as BusinessType | '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.businessType) {
      setError('Please choose whether you run a restaurant or a retail shop');
      return;
    }
    setLoading(true);
    try {
      await register({
        businessName: form.businessName,
        ownerFirstName: form.ownerFirstName,
        ownerLastName: form.ownerLastName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        currency: 'MVR',
        timezone: 'Indian/Maldives',
        businessType: form.businessType as BusinessType,
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <StoreIcon />
          </div>
          <CardTitle className="text-2xl">Create your store</CardTitle>
          <CardDescription>Start with the Free plan — no credit card required</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input id="businessName" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label>What kind of store is this?</Label>
              <p className="text-xs text-muted-foreground">
                We tailor your Office and POS — retail shops won&apos;t see recipes or ingredients.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {REGISTRATION_BUSINESS_TYPE_OPTIONS.map((option) => {
                  const Icon = option.value === 'Restaurant' ? UtensilsCrossedIcon : ShoppingBagIcon;
                  const selected = form.businessType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setForm({ ...form, businessType: option.value })}
                      className={`flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors ${
                        selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <Icon className={`size-5 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground leading-snug">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ownerFirstName">Owner first name</Label>
                <Input id="ownerFirstName" value={form.ownerFirstName} onChange={(e) => setForm({ ...form, ownerFirstName: e.target.value })} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ownerLastName">Owner last name</Label>
                <Input id="ownerLastName" value={form.ownerLastName} onChange={(e) => setForm({ ...form, ownerLastName: e.target.value })} required />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating store...' : 'Create Store'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary underline-offset-4 hover:underline">Sign in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
