# Maldives GST (MIRA) — Accounting Module Spec

Future module for BlurayPOS tenants. Implementation tracked in Phase 3.

## GST types

| Type | Rate | Use case |
|------|------|----------|
| GGST | 8% | General goods & services |
| TGST | 16% | Tourism sector |

Per-tenant configuration on `Organization`: TIN, GST type, rate, registered business name/address.

## Sales (Output GST)

Each order stores: net amount, GST amount, gross amount. Invoices include MIRA-required fields.

## Purchases (Input GST)

Supplier invoices track GST paid for input tax credit.

## Reports

1. **Output GST** — sales invoices
2. **Input GST** — purchase invoices  
3. **GST Summary** — `GST Payable = Output - Input`

Export: CSV/Excel for MIRA filing.

## Integration

- Sales → GST liability
- Purchases → Input GST asset
- Auto-posting to chart of accounts (future)
