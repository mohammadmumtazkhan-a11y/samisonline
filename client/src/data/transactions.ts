/**
 * Demo send-money transactions — same records Rhemito seeds for its dashboard
 * (server/storage.ts `seedDemoSendMoneyTransactions` + the scheduled row).
 * Swap for the MITO transactions API when available.
 */

export type TransactionStatus = "awaiting_payment" | "pending" | "completed" | "failed" | "cancelled" | "scheduled";

export interface DemoTransaction {
  /** Reference number shown as "Ref No." */
  id: string;
  recipient: string;
  service: "Bank Deposit" | "Mobile Money" | "Cash Pickup" | "Bank Transfer";
  /** ISO date — formatted for display */
  date: string;
  sendCurrency: string;
  sendAmount: number;
  receiveCurrency: string;
  receiveAmount: number;
  status: TransactionStatus;
}

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

export const demoTransactions: DemoTransaction[] = [
  { id: "22502787", recipient: "Aisha Bello", service: "Bank Deposit", date: daysAgo(1), sendCurrency: "GBP", sendAmount: 120, receiveCurrency: "NGN", receiveAmount: 243060, status: "awaiting_payment" },
  { id: "22502784", recipient: "Bob Woolmer", service: "Bank Deposit", date: daysAgo(2), sendCurrency: "GBP", sendAmount: 60, receiveCurrency: "NGN", receiveAmount: 121530, status: "pending" },
  { id: "22502785", recipient: "Sarah Chen", service: "Mobile Money", date: daysAgo(3), sendCurrency: "GBP", sendAmount: 150, receiveCurrency: "NGN", receiveAmount: 303825, status: "completed" },
  { id: "22502786", recipient: "James Okonkwo", service: "Bank Deposit", date: daysAgo(4), sendCurrency: "GBP", sendAmount: 200, receiveCurrency: "NGN", receiveAmount: 405100, status: "completed" },
];

export const demoScheduledTransactions: DemoTransaction[] = [
  { id: "SCH001", recipient: "Monthly Rent", service: "Bank Transfer", date: "2026-11-01T09:00:00.000Z", sendCurrency: "GBP", sendAmount: 800, receiveCurrency: "NGN", receiveAmount: 1620400, status: "scheduled" },
];

/** Terminal statuses offer Resend; only awaiting-payment can be cancelled (Rhemito rules). */
export const TERMINAL_STATUSES: TransactionStatus[] = ["completed", "failed", "cancelled"];

export const formatTxDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export const formatTxAmount = (currency: string, amount: number) =>
  `${currency} ${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
