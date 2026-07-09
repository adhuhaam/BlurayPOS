# BlurayPOS SaaS Architecture & Multi-Tenant Requirements

> **Canonical product specification.** All features, APIs, and UI must align with this document.
> Repository: [github.com/adhuhaam/BlurayPOS](https://github.com/adhuhaam/BlurayPOS)

Code ↔ product naming: see [TERMINOLOGY.md](./TERMINOLOGY.md).

---

## Project Overview

BlurayPOS is a cloud-based SaaS Point of Sale system.

The application must support multiple independent businesses (Stores). Every store operates as its own isolated tenant with its own users, products, customers, orders, settings, and reports.

No store should ever be able to access another store's data.

---

## System Architecture

There are two levels of administration.

### 1. Super Admin (Platform Owner)

The Super Admin manages the entire BlurayPOS platform.

Responsibilities include:

* Manage all stores
* Create new stores
* Suspend or activate stores
* Delete stores
* Assign subscription plans
* Change subscription plans
* Monitor storage and usage
* View platform analytics
* Manage subscription payments
* View all registered businesses
* Reset manager passwords
* Manage global application settings
* Manage available subscription plans
* View audit logs
* Send announcements to stores
* Manage platform feature flags (enable/disable modules globally or per plan)
* Monitor device ecosystem and hardware health
* Manage API access and integrations

The Super Admin is NOT part of any individual store.

The Super Admin belongs to the platform.

### 2. Store (Tenant)

Every business that signs up becomes a Store (Tenant).

Each store has completely isolated data.

Example:

**Store A** — Products, Customers, Orders, Employees

**Store B** — Products, Customers, Orders, Employees

Store A must never see Store B's data.

Every database query must always be filtered by Store ID.

---

## Branch Management

A store may operate one or more branches.

Each branch must maintain:

* Branch Name
* Address
* Contact Information
* GST Registration (if applicable)
* Default Warehouse
* Receipt Header/Footer
* Kitchen Routing Rules
* Opening Hours
* Timezone

Every operational record must include:

* Store ID
* Branch ID

Supported modules:

* Sales
* Inventory
* Employees
* Kitchen
* Reports
* Expenses
* Purchases

Managers may be granted access to specific branches only.

---

## Store Creation

A store can be created in two ways.

### Option 1 — Super Admin creates a store

During creation:

* Business Name
* Business Email
* Phone
* Address
* Timezone
* Currency
* Tax Settings
* Subscription Plan
* Manager Name
* Manager Email
* Manager Password

After saving:

* Store is created
* Manager account is created automatically
* Selected subscription plan is assigned
* Trial or billing begins immediately

### Option 2 — Customer self-registration

A customer visits BlurayPOS and clicks **Create Store**.

They enter:

* Business Name
* Owner Name
* Email
* Password
* Phone

The system automatically:

* Creates Store
* Creates Manager account
* Assigns Free Plan
* Logs manager into dashboard

No Super Admin interaction is required.

---

## Default Store Roles

Every store has its own users. Users belong only to one store.

### Manager

Highest privilege inside a store.

Can:

* Manage employees
* Manage products
* Manage inventory
* Manage customers
* Manage suppliers
* Manage purchases
* Manage POS
* View reports
* Approve expenses
* Manage settings
* Manage taxes
* Manage printers
* Create users
* Disable users
* Configure branches and access permissions
* Configure loyalty, promotions, and pricing rules

Cannot access Super Admin features.

### Cashier

Can:

* Open POS
* Create sales
* Accept payments
* Print receipts
* Apply discounts (if permitted)
* Hold orders
* Recall orders
* View own sales

Cannot:

* Change settings
* View financial reports
* Delete inventory

### Kitchen

Kitchen Display role.

Can:

* View incoming kitchen orders
* Update order status
* Mark items prepared
* Notify cashier

Cannot access financial information.

### Delivery

Can:

* View delivery orders
* Accept deliveries
* Update delivery status
* Mark delivered
* View assigned deliveries

### Accountant

Can:

* Expenses
* Income
* Financial reports
* Taxes
* Payments
* Profit & Loss
* Export accounting reports

Cannot change operational settings.

---

## Restaurant Table Management

The system must support dine-in operations.

Features:

* Floor Plans
* Multiple Dining Areas
* Drag-and-drop Tables
* Table Capacity
* Table Status (Available, Occupied, Reserved, Cleaning)
* Merge Tables
* Split Tables
* Transfer Table
* Transfer Order
* Table Reservation
* Wait List

Kitchen and cashier updates must synchronize in real time.

---

## QR Ordering

Each table can have a unique QR Code.

Customers can:

* Scan QR
* View Menu
* Browse Categories
* Customize Items
* Add Notes
* Place Orders

Orders appear directly in:

* Kitchen Display
* Waiter Dashboard
* POS

Optional: customer pays online before kitchen preparation.

---

## Customer Display Screen

Support dual-screen POS.

Customer-facing display shows:

* Current Items
* Discounts
* GST
* Grand Total
* QR Payment
* Promotions
* Loyalty Points
* Thank You Screen

---

## Customer Loyalty Module

Support:

* Loyalty Points
* Membership Levels
* Birthday Rewards
* Coupons
* Gift Cards
* Cashback
* Promotions

Managers configure:

* Point Rules
* Redemption Rules
* Expiration Rules

---

## Gift Card Module

Support:

* Gift Card Creation
* Gift Card Balance
* Gift Card Top-up
* Gift Card Redemption
* Gift Card History
* Expiration

---

## Promotions & Discounts Engine

Support:

* Percentage Discount
* Fixed Discount
* Buy X Get Y
* Happy Hour
* Combo Discounts
* Category Discounts
* Item Discounts
* Customer Discounts
* Loyalty Discounts
* Coupon Codes
* Time-based Promotions
* Branch-specific Promotions

Priority rules must prevent discount conflicts.

---

## Kitchen Display System (Advanced)

Kitchen features:

* Multiple Kitchen Stations
* Kitchen Routing
* Preparation Timers
* Order Priority
* Color Status
* Ready Notification
* Recall Order
* Kitchen Analytics

Statuses:

* Pending
* Preparing
* Ready
* Served
* Cancelled

---

## Recipe & Ingredient Management

Inventory must support recipes.

Each menu item contains:

* Ingredients
* Quantity
* Unit
* Cost
* Waste %

Inventory decreases automatically when sold.

Support:

* Recipe Versioning
* Yield Calculation
* Food Cost %

---

## Inventory Enhancements

Support:

* Multiple Warehouses
* Stock Transfers
* Batch Numbers
* Expiry Dates
* Serial Numbers
* Stock Adjustments
* Physical Stock Count
* Automatic Reorder
* Supplier Lead Time

---

## Purchase Management

Support:

* Purchase Requests
* Purchase Orders
* Goods Received Notes
* Supplier Invoices
* Purchase Returns
* Partial Deliveries

Inventory updates automatically.

---

## Supplier Portal

Maintain supplier information:

* Contact Details
* Payment Terms
* Outstanding Balance
* Purchase History
* Product Catalog

---

## Online Ordering

Support:

* Pickup
* Delivery
* Dine-in
* Scheduled Orders

Customers can:

* Browse Menu
* Order
* Pay
* Track Status

---

## Delivery Management

Support:

* Rider Assignment
* Live Order Status
* Delivery Zones
* Delivery Charges
* Delivery Time Estimates
* Driver Performance
* Proof of Delivery

---

## CRM (Customer Relationship Management)

Store:

* Customer Profiles
* Visit History
* Favorite Orders
* Purchase History
* Spending Analytics
* Feedback
* Marketing Preferences

---

## Marketing Module

Support:

* SMS Campaigns
* Email Campaigns
* Push Notifications
* Birthday Messages
* Promotional Campaigns

Campaign performance analytics included.

---

## Reservation System

Customers can reserve:

* Table
* Time
* Number of Guests

Support:

* Reservation Calendar
* Confirmation
* Reminder
* Cancellation
* Wait List

---

## Employee Management

Shipped as the **HR module** (plan flag `HasHr`, in-portal routes `/hr/*`):

* Staff Profiles (NID/passport, nationality, address, compensation)
* Payroll runs, payslips, increments & deductions
* Attendance (clock in/out, manual entry)
* Leave types, balances, request/approve workflow
* Shift Scheduling (weekly `WorkSchedule` — not POS cash-drawer `Shift`)
* Performance reviews
* Auto-sync from POS user create/update (`Employee` linked via optional `UserId`)

Legacy spec items still open: employee self-service portal, POS terminal clock-in UI, statutory Maldives tax automation.

---

## Cash Management

Support:

* Cash Drawer
* Opening Float
* Closing Balance
* Cash Drops
* Safe Deposits
* Cash Reconciliation
* Shift Reports

---

## Device Management

Each store may register:

* POS Terminals
* Kitchen Displays
* Receipt Printers
* Barcode Scanners
* Customer Displays

Support:

* Device Activation
* Remote Disable
* Device Health
* Kiosk Lock
* Remote provisioning and updates
* Device heartbeat monitoring
* Lost/stolen device disable

---

## Notification Center

Support notifications for:

* Low Stock
* Order Ready
* Subscription Expiry
* GST Due
* Failed Payments
* Kitchen Delays
* Customer Feedback

---

## Reports Module

### Sales Reports

* Daily, Weekly, Monthly, Yearly
* Hourly Sales

### Inventory Reports

* Stock Value
* Low Stock
* Stock Movement
* Dead Stock

### Financial Reports

* Profit & Loss
* Expenses
* GST
* Cash Flow

### Restaurant Reports

* Popular Items
* Slow Moving Items
* Kitchen Performance
* Table Turnover
* Wait Time

### Customer Reports

* Top Customers
* Loyalty
* Customer Retention

### Employee Reports

* Cashier Sales
* Shift Reports
* Productivity

---

## Dashboard Analytics

Interactive dashboard showing:

* Revenue
* Orders
* Average Order Value
* Customers
* Inventory Value
* Best Sellers
* Top Categories
* Profit
* GST Payable
* Live Kitchen Status

---

## Public REST API

Pro Plan should include:

* OAuth Authentication
* Webhooks
* Product API
* Order API
* Customer API
* Inventory API
* Accounting API

---

## Third-Party Integrations

Support future integrations with:

* Payment Gateways
* Accounting Software
* Delivery Platforms
* SMS Providers
* Email Providers
* WhatsApp
* Barcode Scanners
* Label Printers

---

## Offline Mode

The POS must continue functioning without internet.

Requirements:

* Local Database Cache
* Offline Sales
* Offline Kitchen
* Offline Inventory
* Automatic Background Sync
* Conflict Resolution
* Sync Status Indicators

---

## Audit System

Record every significant action.

Track:

* Login / Logout
* Price Changes
* Discounts
* Refunds
* Inventory Adjustments
* User Changes
* Settings Changes
* Deleted Records

Audit logs cannot be modified.

---

## Platform Feature Flags

The Super Admin can enable or disable modules globally or per subscription plan.

Examples:

* Reservations
* Delivery
* Loyalty
* Accounting
* API
* Kitchen Display
* QR Ordering

### Office — plan modules in sidebar (shipped July 2026)

Managers see **Modules** in the Office sidebar for every module included in their **subscription plan**. Each item navigates to an **in-portal route** (e.g. `/coupons`, `/online-menu`, `/hr`). Customer-facing public sites (menu, order, coupon scan) stay on separate subdomains.

| Product module | Plan flag | Public URL | Office configure |
|----------------|-----------|------------|------------------|
| Coupons & Lucky Draw | `HasCoupons` (Pro) | `coupons.bluraymaldives.site` | `/coupons` |
| Online Menu | `HasOnlineMenu` (Pro) | `menu.bluraymaldives.site/{slug}` | `/online-menu` |
| Online Ordering | `HasOnlineOrdering` (Pro) | `order.bluraymaldives.site/{slug}` | Store settings |
| Human Resources | `HasHr` (Pro) | — | `/hr/*` |

Business type (Restaurant / Retail / Hybrid) further gates menu-related modules via `TenantFeatureResolver`. Full spec: [OFFICE_MODULES.md](./OFFICE_MODULES.md).

---

## AI Features (BlurayPOS Advantage)

AI Sales Assistant:

* Daily sales summaries
* Revenue forecasting
* Product recommendations
* Slow-moving inventory detection
* Demand prediction
* Staff performance insights
* Natural-language reporting
* Intelligent reorder suggestions
* Menu engineering recommendations

---

## Hardware Ecosystem (BlurayPOS Exclusive)

* Android Kiosk Mode management
* Remote device provisioning
* Remote app updates
* Remote diagnostics
* Device heartbeat monitoring
* Remote logout
* Device registration with activation codes
* Printer health monitoring
* Battery and connectivity status
* Lost/stolen device disable
* Automatic synchronization with the cloud

---

## POS Payment Methods

Each store must support the following payment methods in the POS system:

* Cash
* Bank Transfer
* Credit

### Credit Payment Rules

* Credit payments are only allowed for registered customers.
* Only store managers can enable or approve credit access for specific customers.
* Cashiers can only use credit payment if the customer has been pre-approved by the manager.
* The system must track outstanding credit balances per customer.
* Credit transactions must be recorded and visible in customer account history.

---

## POS Terminal UI Requirements (Touchscreen Friendly)

The POS interface must be optimized for touchscreen devices such as tablets and touch monitors commonly used in retail and restaurant environments.

### Core Design Principles

* Large, easy-to-tap buttons with sufficient spacing to prevent misclicks
* Minimal typing required; prioritize tap-based interactions
* High contrast colors for visibility in bright environments
* Fast response time with instant feedback on touch
* Clean layout with minimal clutter to reduce cashier errors

### Layout Structure

The POS screen should be divided into clear sections:

* **Product Grid** — Large tiles showing product name, image, and price
* **Category Panel** — Easily accessible categories for quick filtering
* **Cart Panel** — Displays selected items, quantities, and totals
* **Action Panel** — Buttons for payment, discounts, hold, and recall

### Touch Interaction Features

* Tap to add product to cart
* Tap to increase/decrease quantity
* Swipe or tap to remove items
* Long press for advanced options (e.g. edit price, notes)
* On-screen numeric keypad for entering amounts

### Speed & Efficiency

* One-tap checkout for common payment methods
* Quick access buttons for frequently sold items
* Ability to scan barcodes or search products instantly
* Offline-friendly behavior with local caching where possible

### Accessibility

* Support for different screen sizes (tablet, desktop touch screens)
* Adjustable font sizes for readability
* Color indicators for order status and payment state

### Error Prevention

* Confirmation prompts for voiding or deleting items
* Visual feedback when actions are performed
* Clear display of totals, taxes, and change due

### Multi-Terminal Support

* UI must remain consistent across multiple terminals
* Real-time synchronization of orders between terminals
* Support for kitchen display and order routing

---

## Subscription Plans

The platform must support subscription plans.

Every store must always belong to exactly one plan.

Plans determine available features.

### Free Plan

Designed for small businesses.

Example limitations:

* 1 Store
* 1 Branch
* 3 Users
* Limited Products
* Limited Monthly Orders
* Basic Reports

### Basic Plan

Higher limits.

Example:

* 10 Users
* More Products
* Inventory
* Reports
* Kitchen Module
* Customer Database

### Pro Plan

Unlimited usage.

Includes:

* Unlimited Users
* Unlimited Products
* Advanced Reports
* Multi-terminal
* Delivery Module
* Accounting
* Purchase Management
* Inventory Management
* API Access
* Priority Support

---

## Subscription Enforcement

Every protected feature must check the active subscription.

Examples:

**If Free Plan** — hide accounting, advanced reports, multiple cashiers, API.

**If user upgrades** — features become immediately available.

**If subscription expires** — store becomes read-only until renewed.

**Implemented (July 2026):**
- Hourly `SubscriptionExpiryHostedService` sets paid plans to `PastDue` + `Organization.IsReadOnly`
- Free plans auto-renew yearly (no read-only)
- `SubscriptionEnforcementMiddleware` blocks mutations (POST/PUT/PATCH/DELETE) when read-only; billing + proof upload allowed
- Renewal periods stack from existing `CurrentPeriodEnd` when paid early
- Tenant submits payment on **Billing** → Super Admin verifies on **Platform Reports**

---

## Subscription Billing & Payment Methods

Subscription payments are managed at the platform level by the Super Admin.

### Billing Cycle

* Subscription plans are billed **yearly**.
* Each store must renew its subscription annually to maintain full access.

### Payment Methods for Subscription

* Bank Transfer
* Cash

### Payment Management

* All subscription payments are verified and managed by the Super Admin.
* Stores may submit proof of payment for bank transfers.
* The Super Admin confirms and activates or renews the subscription after verification.
* Payment records must be stored for auditing and reporting purposes.

---

## Authentication

```
Platform Login
    ↓
Determine user role
    ↓
If Super Admin → Super Admin Dashboard
Otherwise
    ↓
Determine Store → Load Store Context → Store Dashboard
```

Every authenticated user must have:

* User ID
* Store ID (except Super Admin)
* Role
* Permissions
* Active Subscription

---

## Permissions

Use a Role-Based Access Control (RBAC) system.

Permissions should be database-driven rather than hardcoded.

```
Users → Roles → Permissions
```

Examples: `Product.Create`, `Product.Edit`, `Product.Delete`, `Sale.Create`, `Sale.Void`, `Expense.Create`, `Report.View`, `User.Create`, `Inventory.Adjust`

This allows future customization without changing application code.

---

## Multi-Tenant Security

Every business record must contain **Store ID** and **Branch ID**.

Examples: Products, Customers, Sales, Expenses, Orders, Inventory, Reports.

Queries must never return records belonging to another store. Store isolation is mandatory throughout the application.

---

## Accounting Module (Maldives GST Compliance)

The accounting module must comply with Maldives Inland Revenue Authority (MIRA) GST requirements.

See [GST_MALDIVES.md](./GST_MALDIVES.md) for implementation details.

### Overview of GST in Maldives

GST is a consumption tax applied to goods and services in the Maldives. Businesses registered with MIRA must:

* Charge GST on taxable sales
* Collect GST from customers
* Pay GST to MIRA
* Submit periodic GST returns

There are two main GST categories:

* **TGST** (Tourism GST) — typically 16%
* **GGST** (General GST) — typically 8%

The system must allow configuration of GST rates per store depending on business type.

### GST Registration Details

Each store must be able to store:

* GST Registration Number (TIN)
* Business Name (as registered with MIRA)
* Business Address
* GST Type (TGST or GGST)
* Applicable GST Rate

These details must appear on invoices and reports.

### GST Calculation in POS

Every sale must include GST calculation.

Example:

* Item Price: 100 MVR
* GST (8%): 8 MVR
* Total: 108 MVR

The system must:

* Automatically calculate GST per item or per invoice
* Support inclusive and exclusive tax pricing
* Store GST amount separately in the database

Each sale record must include:

* Net Amount (before GST)
* GST Amount
* Gross Amount (after GST)

### GST on Purchases (Input Tax)

Businesses can claim GST paid on purchases.

The system must track:

* Supplier invoices
* GST paid on purchases (Input GST)

Each purchase record must include:

* Purchase Amount
* GST Paid
* Supplier GST Number

### GST Reports

The system must generate detailed GST reports required for submission to MIRA.

1. **Output GST Report (Sales)** — GST collected from customers
2. **Input GST Report (Purchases)** — GST paid to suppliers
3. **GST Summary Report** — `GST Payable = Output GST - Input GST`

### GST Return Preparation (MIRA Submission)

The system must help users prepare GST returns in a format compatible with MIRA.

Features required:

* Monthly or quarterly GST period selection
* Auto-calculation of totals
* Summary of total sales, purchases, output GST, input GST, net GST payable
* Export to Excel or CSV
* Printable GST return summary
* Future support for API integration with MIRA (if available)

### Invoice Requirements (MIRA Compliance)

Invoices must include:

* Business Name
* GST Registration Number
* Invoice Number
* Date
* Customer Details
* Item Details
* Taxable Amount
* GST Amount
* Total Amount

This ensures compliance with MIRA audit requirements.

---

## Recommended Development Order

1. Authentication
2. Super Admin Dashboard
3. Subscription Plans
4. Store Management & Branch Management
5. Store Registration
6. Role & Permission System
7. User Management
8. POS Module
9. Product Module & Recipes
10. Inventory (warehouses, transfers, batch/expiry)
11. Customers & CRM
12. Orders & Payments
13. Kitchen Display
14. Restaurant Tables & QR Ordering
15. Delivery & Online Ordering
16. Purchase Management & Supplier Portal
17. Loyalty, Gift Cards & Promotions
18. Accounting / GST (Maldives)
19. Reports & Dashboard Analytics
20. Subscription Enforcement & Billing
21. Notifications & Audit System
22. Device Management & Hardware Ecosystem
23. Public REST API & Integrations
24. Offline Mode
25. AI Features
26. Platform Analytics & Feature Flags
27. **Production Infrastructure** — DigitalOcean, Nginx, HTTPS, Redis, CI/CD

Tracked status: [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) (Phase 9).

---

## Production Infrastructure

Production hosting is on **DigitalOcean Ubuntu** with **Nginx**, **PostgreSQL**, **Redis**, and **mandatory HTTPS** (Let's Encrypt).

| Item | Value |
|------|-------|
| Primary domain | `bluraymaldives.site` |
| Office app | `https://office.bluraymaldives.site` |
| API | `https://api.bluraymaldives.site` |
| DNS | DigitalOcean (Namecheap registrar → DO nameservers) |
| Deploy | `git pull` → `dotnet publish` → React build → systemd restart |
| Offline POS | Required — Android Room + web outbox; ops must not stop on outage |

Full checklist, ports, firewall, backups, monitoring, and Android kiosk requirements: **[deployment.md](./deployment.md)**.

---

## Development Principles

* Follow clean architecture.
* Keep the application modular.
* Make every module independent.
* Use database-driven permissions.
* Design for scalability to support thousands of stores.
* Enforce tenant isolation in every query (Store ID + Branch ID).
* Use policies/middleware for authorization and subscription enforcement.
* Keep the UI modern, responsive, mobile-friendly, and optimized for touchscreen interaction.
* Write maintainable, well-documented code.
* Ensure the platform can easily support additional subscription plans, modules, and user roles in the future without major architectural changes.
