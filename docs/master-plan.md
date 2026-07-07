# BlurayPOS SaaS Architecture & Multi-Tenant Requirements

## Project Overview

BlurayPOS is a cloud-based SaaS Point of Sale system.

The application must support multiple independent businesses (Stores). Every store operates as its own isolated tenant with its own users, products, customers, orders, settings, and reports.

No store should ever be able to access another store’s data.

---

# System Architecture

There are two levels of administration.

## 1. Super Admin (Platform Owner)

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

---

## 2. Store (Tenant)

Every business that signs up becomes a Store (Tenant).

Each store has completely isolated data.

Example:

Store A

* Products
* Customers
* Orders
* Employees

Store B

* Products
* Customers
* Orders
* Employees

Store A must never see Store B’s data.

Every database query must always be filtered by Store ID.

---

# Store Creation

A store can be created in two ways.

## Option 1

The Super Admin creates a new store.

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

---

## Option 2

Customer Self Registration

A customer visits BlurayPOS.

They click:

Create Store

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

# Default Store Roles

Every store has its own users.

Users belong only to one store.

Required roles:

## Manager

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

---

## Cashier

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

---

## Kitchen

Kitchen Display role.

Can:

* View incoming kitchen orders
* Update order status
* Mark items prepared
* Notify cashier

Cannot access financial information.

---

## Delivery

Can:

* View delivery orders
* Accept deliveries
* Update delivery status
* Mark delivered
* View assigned deliveries

---

## Accountant

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

# POS Payment Methods

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

# POS Terminal UI Requirements (Touchscreen Friendly)

The POS interface must be optimized for touchscreen devices such as tablets and touch monitors commonly used in retail and restaurant environments.

### Core Design Principles

* Large, easy-to-tap buttons with sufficient spacing to prevent misclicks
* Minimal typing required; prioritize tap-based interactions
* High contrast colors for visibility in bright environments
* Fast response time with instant feedback on touch
* Clean layout with minimal clutter to reduce cashier errors

### Layout Structure

The POS screen should be divided into clear sections:

* Product Grid: Large tiles showing product name, image, and price
* Category Panel: Easily accessible categories for quick filtering
* Cart Panel: Displays selected items, quantities, and totals
* Action Panel: Buttons for payment, discounts, hold, and recall

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

# Subscription Plans

The platform must support subscription plans.

Every store must always belong to exactly one plan.

Plans determine available features.

Required plans:

## Free Plan

Designed for small businesses.

Example limitations:

* 1 Store
* 1 Branch
* 3 Users
* Limited Products
* Limited Monthly Orders
* Basic Reports

---

## Basic Plan

Higher limits.

Example:

* 10 Users
* More Products
* Inventory
* Reports
* Kitchen Module
* Customer Database

---

## Pro Plan

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

# Subscription Enforcement

Every protected feature must check the active subscription.

Examples:

If Free Plan:

Hide:

* Accounting
* Advanced Reports
* Multiple Cashiers
* API

If user upgrades:

Features become immediately available.

If subscription expires:

Store becomes Read Only until renewed.

---

# Subscription Billing & Payment Methods

Subscription payments are managed at the platform level by the Super Admin.

### Billing Cycle

* Subscription plans are billed yearly.
* Each store must renew its subscription annually to maintain full access.

### Payment Methods for Subscription

The following payment methods are supported for subscription payments:

* Bank Transfer
* Cash

### Payment Management

* All subscription payments are verified and managed by the Super Admin.
* Stores may submit proof of payment for bank transfers.
* The Super Admin confirms and activates or renews the subscription after verification.
* Payment records must be stored for auditing and reporting purposes.

---

# Authentication

Authentication flow:

Platform Login

↓

Determine user role

↓

If Super Admin

↓

Open Super Admin Dashboard

Otherwise

↓

Determine Store

↓

Load Store Context

↓

Open Store Dashboard

Every authenticated user must have:

* User ID
* Store ID (except Super Admin)
* Role
* Permissions
* Active Subscription

---

# Permissions

Use a Role-Based Access Control (RBAC) system.

Permissions should be database-driven rather than hardcoded.

Example:

Users

↓

Roles

↓

Permissions

Examples:

Product.Create

Product.Edit

Product.Delete

Sale.Create

Sale.Void

Expense.Create

Report.View

User.Create

Inventory.Adjust

This allows future customization without changing application code.

---

# Multi-Tenant Security

Every business record must contain:

StoreID

Examples:

Products

StoreID

Customers

StoreID

Sales

StoreID

Expenses

StoreID

Orders

StoreID

Inventory

StoreID

Reports

StoreID

Queries must never return records belonging to another store.

Store isolation is mandatory throughout the application.

---

# Accounting Module (Maldives GST Compliance)

The accounting module must be designed to comply with the Maldives Inland Revenue Authority (MIRA) Goods and Services Tax (GST) requirements.

## Overview of GST in Maldives

GST is a consumption tax applied to goods and services in the Maldives. Businesses registered with MIRA must:

* Charge GST on taxable sales
* Collect GST from customers
* Pay GST to MIRA
* Submit periodic GST returns

There are two main GST categories:

* TGST (Tourism GST) – typically 16%
* GGST (General GST) – typically 8%

The system must allow configuration of GST rates per store depending on business type.

---

## GST Registration Details

Each store must be able to store:

* GST Registration Number (TIN)
* Business Name (as registered with MIRA)
* Business Address
* GST Type (TGST or GGST)
* Applicable GST Rate

These details must appear on invoices and reports.

---

## GST Calculation in POS

Every sale must include GST calculation.

Example:

Item Price: 100 MVR
GST (8%): 8 MVR
Total: 108 MVR

The system must:

* Automatically calculate GST per item or per invoice
* Support inclusive and exclusive tax pricing
* Store GST amount separately in the database

Each sale record must include:

* Net Amount (before GST)
* GST Amount
* Gross Amount (after GST)

---

## GST on Purchases (Input Tax)

Businesses can claim GST paid on purchases.

The system must track:

* Supplier invoices
* GST paid on purchases (Input GST)

Each purchase record must include:

* Purchase Amount
* GST Paid
* Supplier GST Number

---

## GST Reports

The system must generate detailed GST reports required for submission to MIRA.

### 1. Output GST Report (Sales)

Shows GST collected from customers.

Includes:

* Invoice Number
* Date
* Customer Name
* Taxable Amount
* GST Amount
* Total Amount

### 2. Input GST Report (Purchases)

Shows GST paid to suppliers.

Includes:

* Supplier Name
* Invoice Number
* Date
* Purchase Amount
* GST Paid

### 3. GST Summary Report as of payment.

This is the most important report for filing.

Formula:

GST Payable = Output GST - Input GST

Example:

Output GST: 10,000 MVR
Input GST: 6,000 MVR
GST Payable: 4,000 MVR

If Input GST is higher, it becomes a credit.

---

## GST Return Preparation (MIRA Submission)

The system must help users prepare GST returns in a format compatible with MIRA.

Features required:

* Monthly or quarterly GST period selection
* Auto-calculation of totals
* Summary of:

  * Total Sales
  * Total Purchases
  * Output GST
  * Input GST
  * Net GST Payable

The system should allow:

* Export to Excel or CSV
* Printable GST return summary
* Future support for API integration with MIRA (if available)

---

## Invoice Requirements (MIRA Compliance)

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

## Audit & Record Keeping

The system must:

* Store all GST-related transactions securely
* Prevent deletion of submitted records
* Maintain audit logs for changes
* Allow filtering by date, invoice, or tax period

---

## Accounting Integration

GST must be integrated with accounting:

* Sales → Output GST liability
* Purchases → Input GST asset
* GST Payable → Liability account

The system should automatically post entries to:

* Revenue Accounts
* Expense Accounts
* GST Payable Account

---

## User Experience

The accounting module must be simple and understandable:

* Clear dashboards showing GST payable
* Visual summaries (charts)
* Alerts for upcoming GST submission deadlines
* Easy navigation for non-accountants

---

# Recommended Development Order

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

---

# Development Principles

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
