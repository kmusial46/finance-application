# Aureon

A comprehensive financial management system built with Next.js, allowing users to manage and analyse personal financial data as well as automated calculations and visual dashboards to provide financial insights.

## How to Run

1. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

2. **Set up Environment Variables**:
   Create a `.env.local` file in the root directory and add the necessary configuration keys for Appwrite, Plaid, Finnhub, Sentry, and any other third-party services you are using.

3. **Run the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

4. **Open the application**:
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Folder Structure

High-level overview of the repository layout:

```
.
├─ app/                      # Next.js App Router routes/layouts
│  ├─ (auth)/
│  │  ├─ sign-in/
│  │  └─ sign-up/
│  ├─ (root)/
│  │  ├─ bills/
│  │  ├─ bills-and-debts/
│  │  │  └─ [id]/
│  │  ├─ debts/
│  │  ├─ investments/
│  │  ├─ my-banks/
│  │  ├─ savings/
│  │  ├─ settings/
│  │  ├─ stock-market/
│  │  ├─ stocks/
│  │  │  └─ [symbol]/
│  │  └─ transaction-history/
│  ├─ api/                   # Route handlers (API endpoints)
│  │  ├─ account/
│  │  │  ├─ reauth-token/
│  │  │  └─ remove/
│  │  └─ sentry-example-api/
│  └─ sentry-example-page/
├─ components/               # Reusable UI and feature components
│  ├─ bills/
│  ├─ debts/
│  ├─ goals/
│  ├─ investments/
│  ├─ sidebars/
│  ├─ tradingview-components/
│  ├─ transactions/
│  └─ ui/                     # shadcn/ui + shared UI primitives
├─ lib/                      # Shared utilities + service clients
│  └─ actions/                # Server Actions (Appwrite/Plaid/Finnhub, etc.)
├─ hooks/                    # Custom React hooks
├─ constants/                # Shared constants
├─ types/                    # Shared TypeScript types
└─ public/                   # Static assets served from /
   └─ icons/
```

## Summary of Frameworks and Libraries

This project uses a modern web development stack:

### Core Framework & Languages
*   **Next.js (App Router)** (`next`): Core React framework.
*   **React** (`react`, `react-dom`): UI library.
*   **TypeScript** (`typescript`): Strongly typed programming language.

### UI & Styling
*   **Tailwind CSS** (`tailwindcss`): Utility-first CSS framework.
*   **shadcn/ui**: Reusable components built on Radix UI and Tailwind.
*   **Radix UI**: Headless, accessible UI primitives (Dialogs, Tabs, Selects, etc.).
*   **Lucide React** (`lucide-react`): Icon library.
*   **Sonner** (`sonner`): Toast notification system.

### Forms & Data Validation
*   **React Hook Form** (`react-hook-form`): Form state management.
*   **Zod** (`zod`): Schema validation.

### Services & Integrations
*   **Appwrite** (`node-appwrite`): Backend-as-a-Service (BaaS) for user auth, databases, and secure storage.
*   **Plaid SDK** (`plaid`): Bank account linking and financial data integration.
*   **Finnhub API**: Live stock market data and financial news.
*   **TradingView Widgets**: Embedded interactive financial charts.
*   **Sentry** (`@sentry/nextjs`): Application monitoring and crash reporting.

### Visualisation & Utilities
*   **Chart.js / React ChartJS 2** (`chart.js`, `react-chartjs-2`): Visualising portfolio and goal metrics.

### Security
*   **Crypto** (Node.js built-in): Used for AES-256-GCM encryption/decryption of sensitive data like access tokens.

## Codebase Architecture & Functionality

This project is structured with a clear separation between presentation layers and business logic. Below is a breakdown of the functions and components currently implemented.

### Project Composition Summary

| Category | Count | Role in Application |
| :--- | :--- | :--- |
| **Action Functions** | 85 | Server Actions, CRUD operations, API logic, and event handlers. |
| **UI Components** | 83 | Presentational elements (Buttons, Inputs, Radix/Shadcn primitives). |
| **Pages & Layouts** | 21 | Structural components defining routing and page wrappers. |
| **Utilities & Hooks** | 22 | Logic for data formatting, encryption, and React lifecycle helpers. |
| **Total Unique Entities** | 211 | Total exports across the project. |

### Logic Layer: Action Function Deep-Dive

The 85 Action Functions represent the core business logic of the application, categorised by their domain:

| Domain | Action Count | Core Functionality |
| :--- | :--- | :--- |
| **Auth & Users** | 10 | Sign in/out, account deletion, and Appwrite session management. |
| **Banking (Plaid)** | 14 | Plaid Link token exchange, bank syncing, and account retrieval. |
| **Bills & Debts** | 22 | CRUD operations, payment tracking, and debt payoff calculations. |
| **Investments** | 13 | Portfolio management and real-time Finnhub market data fetching. |
| **Goals** | 10 | Savings goal creation, tracking, and transaction history logic. |
| **Transactions** | 7 | Category mapping and bank-specific transaction fetching. |
| **System & Security** | 9 | Encryption/Decryption, API route handlers, and URL query logic. |
