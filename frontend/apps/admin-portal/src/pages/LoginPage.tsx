import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, StoreIcon } from 'lucide-react';
import { useAuth } from '@/auth';
import { ApiError } from '@pos/api-client';
import { appConfig, links } from '@/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/theme-toggle';

const isDev = import.meta.env.DEV;

const DEMO_USERS = [
  { label: 'Super Admin', role: 'Platform', email: 'admin@demo.com', password: 'Admin123!' },
  { label: 'Manager', role: 'Store admin', email: 'manager@demo.com', password: 'Manager123!' },
  { label: 'Cashier', role: 'Orders only', email: 'cashier@demo.com', password: 'Cashier123!' },
  { label: 'Waiter', role: 'Orders only', email: 'waiter@demo.com', password: 'Waiter123!' },
] as const;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fillDemo = (demo: (typeof DEMO_USERS)[number]) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/40 p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="grid w-full max-w-4xl gap-8 lg:grid-cols-[1fr_400px] lg:items-center">
        <div className="hidden lg:block">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">BlurayPOS</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{appConfig.name}</h1>
          <p className="mt-3 max-w-md text-muted-foreground leading-relaxed">{appConfig.tagline}</p>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li>• Dashboard with live sales & top products</li>
            <li>• Manage menu, inventory, branches & staff</li>
            <li>• Orders, billing & store settings in one place</li>
          </ul>
          <Button variant="link" className="mt-6 h-auto p-0" asChild>
            <a href={links.marketing} target="_blank" rel="noreferrer">
              Learn about BlurayPOS
              <ArrowRight data-icon="inline-end" />
            </a>
          </Button>
        </div>

        <Card className="w-full shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <StoreIcon />
            </div>
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>Manager or store admin account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@restaurant.mv"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {isDev && (
                <div className="rounded-lg border border-dashed border-primary/30 bg-muted/40 p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Dev — one-click fill</p>
                  <div className="grid grid-cols-2 gap-2">
                    {DEMO_USERS.map((demo) => (
                      <Button
                        key={demo.email}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto flex-col items-start gap-0.5 px-3 py-2 text-left"
                        onClick={() => fillDemo(demo)}
                      >
                        <span className="text-xs font-semibold">{demo.label}</span>
                        <span className="text-[10px] font-normal text-muted-foreground">{demo.role}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                New business?{' '}
                <Link to="/register" className="text-primary underline-offset-4 hover:underline">
                  Create a free store
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
