import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { MaldivesFlag } from '@/components/MaldivesFlag';
import { links } from '../config';

const navLinks = [
  { label: 'Terminal', href: '#terminal' },
  { label: 'Customers', href: '#customers' },
  { label: 'Features', href: '#features' },
  { label: 'Get Started', href: '#get-started' },
  { label: 'Plans', href: '#plans' },
];

export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4 lg:px-8">
        <Logo size="sm" variant="light" className="min-w-0 sm:hidden" />
        <Logo variant="light" className="hidden min-w-0 sm:flex" />
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              variant="ghost"
              size="sm"
              className="text-blue-100 hover:bg-white/10 hover:text-white"
              render={<a href={link.href} />}
            >
              {link.label}
            </Button>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden text-white hover:bg-white/10 md:inline-flex"
            render={<a href="#get-started" />}
          >
            Get Started
          </Button>
          <Button
            size="sm"
            className="bg-white px-2.5 text-[#0b1f6d] hover:bg-blue-50 sm:px-3"
            render={<a href={links.officeRegister} />}
          >
            <span className="sm:hidden">Join</span>
            <span className="hidden sm:inline">Register</span>
          </Button>
          <div className="flex items-center rounded-md border border-white/15 bg-white/10 p-1 backdrop-blur-sm sm:gap-2 sm:px-2 sm:py-1">
            <MaldivesFlag />
            <span className="hidden text-xs font-medium text-blue-100 md:inline">Maldives</span>
          </div>
        </div>
      </div>
    </header>
  );
}
