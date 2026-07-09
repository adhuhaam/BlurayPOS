import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';
import { links } from '../config';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <Reveal>
          <div className="flex flex-col items-center gap-5 sm:gap-6 md:flex-row md:justify-between">
            <Logo size="sm" />
            <nav className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-center">
              <Button variant="ghost" size="sm" className="w-full sm:w-auto" render={<a href="#terminal" />}>Terminal</Button>
              <Button variant="ghost" size="sm" className="w-full sm:w-auto" render={<a href="#features" />}>Features</Button>
              <Button variant="ghost" size="sm" className="w-full sm:w-auto" render={<a href="#customers" />}>Customers</Button>
              <Button variant="ghost" size="sm" className="w-full sm:w-auto" render={<a href="#get-started" />}>Get Started</Button>
              <Button variant="ghost" size="sm" className="w-full sm:w-auto" render={<a href="#plans" />}>Plans</Button>
              <Button variant="ghost" size="sm" className="w-full sm:w-auto" render={<a href={links.office} />}>Office</Button>
              <Button variant="ghost" size="sm" className="w-full sm:w-auto" render={<a href={links.pos} />}>POS</Button>
              <Button variant="ghost" size="sm" className="w-full sm:w-auto" render={<a href={links.officeRegister} />}>Register</Button>
              <Button variant="ghost" size="sm" className="w-full sm:w-auto" render={<a href={links.officeLogin} />}>Sign In</Button>
            </nav>
          </div>
        </Reveal>
        <p className="mt-6 text-center text-xs text-muted-foreground sm:mt-8">
          © {new Date().getFullYear()} BlurayPOS · bluraymaldives.site · Maldives
        </p>
      </div>
    </footer>
  );
}
