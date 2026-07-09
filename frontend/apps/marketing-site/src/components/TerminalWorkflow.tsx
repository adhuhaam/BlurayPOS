import { FileText, Printer, ScanLine, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/Reveal';

const steps = [
  {
    icon: ScanLine,
    step: '01',
    title: 'Add items to the order',
    desc: 'Use the touchscreen or barcode scanner to build orders in seconds.',
  },
  {
    icon: ShoppingCart,
    step: '02',
    title: 'Review the bill',
    desc: 'Apply modifiers, discounts, and service charges — see the total before printing.',
  },
  {
    icon: FileText,
    step: '03',
    title: 'Confirm & finalise',
    desc: 'Close the order on the device. The terminal records the sale — no payment hardware built in.',
  },
  {
    icon: Printer,
    step: '04',
    title: 'Print bill & receipt',
    desc: '58mm bill or receipt prints instantly. Sale syncs live to Office.',
  },
];

export function TerminalWorkflow() {
  return (
    <section className="border-b border-border bg-background py-14 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Reveal>
              <Badge variant="secondary" className="mb-3">See it in action</Badge>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                From order to printed bill{' '}
                <span className="text-primary">in under a minute.</span>
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                The handheld terminal is built for speed and simplicity — tap items, review the bill,
                and print a professional receipt. Lightweight and easy for any staff member to use.
              </p>
            </Reveal>

            <ol className="mt-8 space-y-4">
              {steps.map((item, i) => (
                <Reveal key={item.step} delay={i * 80}>
                  <li className="group flex gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-x-1 hover:border-primary/25 hover:shadow-md">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <item.icon size={20} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">{item.step}</p>
                      <h3 className="mt-0.5 font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>

          <Reveal direction="left" delay={120}>
            <div className="relative mx-auto max-w-md">
              <div className="pointer-events-none absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/15 via-transparent to-primary/5 blur-2xl" />

              <div className="relative rounded-2xl border border-border bg-muted/40 p-6 shadow-xl backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Order summary</p>
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Ready to print</Badge>
                </div>

                <div className="mt-4 space-y-2 rounded-xl border border-border bg-background p-4">
                  {[
                    { name: 'Grilled Fish Rice', qty: 2, price: 'MVR 180' },
                    { name: 'Fresh Lime Juice', qty: 1, price: 'MVR 35' },
                    { name: 'Service charge', qty: '', price: 'MVR 21.50' },
                  ].map((line) => (
                    <div key={line.name} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {line.qty ? `${line.qty}× ` : ''}{line.name}
                      </span>
                      <span className="font-medium">{line.price}</span>
                    </div>
                  ))}
                  <div className="border-t border-dashed border-border pt-2">
                    <div className="flex items-center justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary">MVR 236.50</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Button className="w-full" size="sm">
                    <Printer data-icon="inline-start" />
                    Print bill & receipt
                  </Button>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    58mm thermal printer built into the device
                  </p>
                </div>

                <div className="relative mt-6 flex justify-center">
                  <div className="receipt-print w-44 rounded-t-lg border border-border bg-white px-4 py-3 font-mono text-[9px] leading-relaxed text-neutral-700 shadow-lg">
                    <p className="text-center font-bold text-neutral-900">BLURAYPOS</p>
                    <p className="text-center text-neutral-500">Reef Café · Male</p>
                    <div className="my-2 border-t border-dashed border-neutral-300" />
                    <p>2× Grilled Fish Rice 180.00</p>
                    <p>1× Fresh Lime Juice 35.00</p>
                    <p>Service charge 21.50</p>
                    <div className="my-2 border-t border-dashed border-neutral-300" />
                    <p className="font-bold">TOTAL MVR 236.50</p>
                    <p className="mt-2 text-center text-neutral-500">Thank you!</p>
                  </div>
                </div>

                <div className="mt-6 flex items-end justify-center gap-1.5">
                  {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                    <div
                      key={i}
                      className="chart-bar w-5 rounded-t bg-primary/80"
                      style={{ height: `${h}px`, animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">Sales synced to Office dashboard</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
