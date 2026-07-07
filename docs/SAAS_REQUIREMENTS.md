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

Required plans (only these two):

### Free Plan

Designed for small businesses.

* 1 branch
* 3 users
* Up to 25 products
* Limited monthly orders
* Basic reports

### Pro Plan

Unlimited usage.

* Unlimited users
* Unlimited products
* Unlimited branches & terminals
* Advanced reports
* Delivery module
* Accounting
* Purchase management
* Inventory management
* API access
* Priority support

---

## Subscription Enforcement

Every protected feature must check the active subscription.

Examples:

**If Free Plan** — hide accounting, advanced reports, multiple cashiers, API.

**If user upgrades** — features become immediately available.

**If subscription expires** — store becomes read-only until renewed.

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

Examples: `Product.Create`, `Product.Edit`, `Sale.Create`, `Sale.Void`, `Expense.Create`, `Report.View`, `User.Create`, `Inventory.Adjust`

This allows future customization without changing application code.

---

## Multi-Tenant Security

Every business record must contain Store ID.

Examples: Products, Customers, Sales, Expenses, Orders, Inventory, Reports.

Queries must never return records belonging to another store. Store isolation is mandatory throughout the application.

---

## Accounting Module (Maldives GST Compliance)

The accounting module must comply with Maldives Inland Revenue Authority (MIRA) GST requirements.

See [GST_MALDIVES.md](./GST_MALDIVES.md) for full GST specification (TGST 16% / GGST 8%, output/input GST, MIRA returns, invoice requirements).

---

## Recommended Development Order

1. Authentication
2. Super Admin Dashboard
3. Subscription Plans
4. Store Management
5. Store Registration
6. Role & Permission System
7. User Management
8. POS Module
9. Product Module
10. Inventory
11. Customers
12. Orders
13. Kitchen Display
14. Delivery
15. Accounting
16. Reports
17. Subscription Enforcement
18. Billing & Payments
19. Notifications
20. Platform Analytics

Tracked status: [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md).

---

## Development Principles

* Follow clean architecture.
* Keep the application modular.
* Make every module independent.
* Use database-driven permissions.
* Design for scalability to support thousands of stores.
* Enforce tenant isolation in every query.
* Use policies/middleware for authorization.
* Keep the UI modern, responsive, mobile-friendly, and optimized for touchscreen interaction.
* Write maintainable, well-documented code.
* Ensure the platform can easily support additional subscription plans, modules, and user roles in the future without major architectural changes.
