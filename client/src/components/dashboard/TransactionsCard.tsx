import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Search, X, Send } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  TERMINAL_STATUSES,
  formatTxAmount,
  formatTxDate,
  type DemoTransaction,
  type TransactionStatus,
} from "@/data/transactions";

interface TransactionsCardProps {
  transactions: DemoTransaction[];
  onSeeAll: () => void;
  /** Resend = start a new transfer (Send Money flow). */
  onResend: (tx: DemoTransaction) => void;
  onStartTransfer: () => void;
}

// ── Status badge (Rhemito statuses, Samis theme) ────────────────
const STATUS_STYLES: Record<TransactionStatus, { label: string; pill: string; dot: string }> = {
  awaiting_payment: { label: "Awaiting Payment", pill: "bg-amber-50 text-amber-700 border-amber-200 font-semibold", dot: "bg-amber-500" },
  pending: { label: "Pending", pill: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  completed: { label: "Completed", pill: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  failed: { label: "Failed", pill: "bg-destructive/10 text-destructive border-destructive/20", dot: "bg-destructive" },
  cancelled: { label: "Cancelled", pill: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" },
  scheduled: { label: "Scheduled", pill: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary animate-pulse" },
};

export function TransactionStatusBadge({ status, compact = false }: { status: TransactionStatus; compact?: boolean }) {
  const s = STATUS_STYLES[status];
  return (
    <motion.span
      key={status}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border whitespace-nowrap",
        compact ? "px-2 py-0.5 text-[11px] font-medium" : "px-2.5 py-1 text-xs font-medium",
        s.pill
      )}
      data-testid={`status-${status}`}
    >
      {status === "awaiting_payment" ? (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 motion-reduce:animate-none" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
      ) : (
        <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
      )}
      {s.label}
    </motion.span>
  );
}

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const canCancel = (tx: DemoTransaction) => tx.status === "awaiting_payment" || tx.status === "scheduled";
const canResend = (tx: DemoTransaction) => TERMINAL_STATUSES.includes(tx.status);

/**
 * Dashboard Transactions — Rhemito layout (Ref No., Recipient, Service, Date,
 * Amount, Status, Actions) with search; table on desktop, cards on mobile.
 */
export function TransactionsCard({ transactions, onSeeAll, onResend, onStartTransfer }: TransactionsCardProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  // Local status overrides (e.g. after Cancel) — demo data, no server yet.
  const [statusOverrides, setStatusOverrides] = useState<Record<string, TransactionStatus>>({});
  const [cancelTarget, setCancelTarget] = useState<DemoTransaction | null>(null);

  const rows = useMemo(() => {
    const withStatus = transactions.map((tx) => ({ ...tx, status: statusOverrides[tx.id] ?? tx.status }));
    const sorted = [...withStatus].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (tx) =>
        tx.id.toLowerCase().includes(q) ||
        tx.recipient.toLowerCase().includes(q) ||
        tx.service.toLowerCase().includes(q) ||
        STATUS_STYLES[tx.status].label.toLowerCase().includes(q)
    );
  }, [transactions, statusOverrides, search]);

  const confirmCancel = () => {
    if (!cancelTarget) return;
    setStatusOverrides((prev) => ({ ...prev, [cancelTarget.id]: "cancelled" }));
    toast({
      title: "Transaction cancelled",
      description: `Ref ${cancelTarget.id} has been cancelled successfully. A confirmation has been sent to your registered email address.`,
    });
    setCancelTarget(null);
  };

  const hasAny = transactions.length > 0;

  const actions = (tx: DemoTransaction, full = false) => {
    if (!canCancel(tx) && !canResend(tx)) return <span className="text-gray-300 text-sm">—</span>;
    return (
      <div className={cn("flex items-center gap-2", full ? "w-full" : "justify-center")}>
        {canResend(tx) && (
          <Button
            size="sm"
            onClick={() => onResend(tx)}
            className={cn("h-9 sm:h-8 px-4 text-xs font-medium rounded-lg bg-primary hover:bg-primary/90 active:scale-95", full && "flex-1")}
            data-testid={`button-resend-${tx.id}`}
          >
            Resend
          </Button>
        )}
        {canCancel(tx) && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCancelTarget(tx)}
            className={cn(
              "h-9 sm:h-8 px-4 text-xs font-medium rounded-lg text-destructive border-destructive/30 bg-white hover:bg-destructive/5 hover:text-destructive active:scale-95",
              full && "flex-1"
            )}
            aria-label={`Cancel transaction ${tx.id}`}
            data-testid={`button-cancel-${tx.id}`}
          >
            Cancel
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl sm:rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden" data-testid="section-transactions">
      {/* Header */}
      <div className="px-4 sm:px-5 pt-4 pb-3 sm:py-4 border-b border-gray-100 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-gray-800">Transactions</h2>
            {hasAny && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary" data-testid="text-transactions-count">
                {rows.length} total
              </span>
            )}
          </div>
          <button
            onClick={onSeeAll}
            className="sm:hidden text-sm text-primary font-medium hover:underline flex items-center gap-1 h-9"
          >
            See all
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          {hasAny && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ref, name or service…"
                aria-label="Search transactions"
                className="pl-9 pr-8 h-11 sm:h-9 rounded-xl sm:text-xs bg-white"
                data-testid="input-search-transactions"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          <button
            onClick={onSeeAll}
            className="hidden sm:flex text-sm text-primary font-medium hover:underline items-center gap-1 whitespace-nowrap"
          >
            See all
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!hasAny ? (
        /* New customer — nothing sent yet */
        <div className="py-14 px-6 text-center flex flex-col items-center gap-3" data-testid="empty-transactions">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Send className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-gray-700">No Transactions found</p>
          <p className="text-xs text-muted-foreground max-w-xs">Your transfers will appear here once you send money.</p>
          <Button onClick={onStartTransfer} className="mt-1 h-11 sm:h-9 rounded-xl bg-primary hover:bg-primary/90">
            Send money
          </Button>
        </div>
      ) : rows.length === 0 ? (
        /* Search returned nothing */
        <div className="py-12 text-center flex flex-col items-center gap-2" data-testid="empty-search-transactions">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium text-gray-600">No transactions match your search.</span>
          <Button variant="outline" size="sm" className="h-9 sm:h-8 text-xs rounded-lg" onClick={() => setSearch("")}>
            Reset search
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop / tablet: table */}
          <div className="hidden md:block overflow-x-auto" data-testid="table-transactions">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100">
                  {["Ref No.", "Recipient", "Service", "Date", "Amount", "Status", "Actions"].map((h, i) => (
                    <th
                      key={h}
                      className={cn(
                        "text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-3",
                        i === 0 ? "text-left pl-5 pr-3" : i === 4 ? "text-right pr-3" : i >= 5 ? "text-center pr-3 last:pr-5" : "text-left pr-3",
                        h === "Service" && "hidden lg:table-cell"
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {rows.map((tx) => (
                    <tr
                      key={tx.id}
                      data-testid={`row-transaction-${tx.id}`}
                      className={cn(
                        "border-b border-gray-50 last:border-b-0 hover:bg-primary/[0.03] transition-colors",
                        tx.status === "awaiting_payment" && "border-l-2 border-l-amber-400 bg-amber-50/20"
                      )}
                    >
                      <td className="py-4 pl-5 pr-3 font-mono text-[13px] font-semibold text-primary tracking-tight">{tx.id}</td>
                      <td className="py-4 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
                            {initialsOf(tx.recipient)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{tx.recipient}</div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              Send Money
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-3 hidden lg:table-cell">
                        <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md font-medium">{tx.service}</span>
                      </td>
                      <td className="py-4 pr-3 text-xs text-gray-500 font-medium whitespace-nowrap">{formatTxDate(tx.date)}</td>
                      <td className="py-4 pr-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <ArrowUpRight className="w-3.5 h-3.5 text-primary" aria-hidden />
                          <span className="font-semibold text-gray-900">{formatTxAmount(tx.sendCurrency, tx.sendAmount)}</span>
                        </div>
                        <div className="text-[11px] text-teal font-medium">{formatTxAmount(tx.receiveCurrency, tx.receiveAmount)}</div>
                      </td>
                      <td className="py-4 pr-3 text-center">
                        <TransactionStatusBadge status={tx.status} />
                      </td>
                      <td className="py-4 pr-5 text-center">{actions(tx)}</td>
                    </tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="md:hidden p-3 space-y-2.5" data-testid="list-transactions-mobile">
            {rows.map((tx) => (
              <div
                key={tx.id}
                data-testid={`card-transaction-${tx.id}`}
                className={cn(
                  "p-4 rounded-2xl bg-white border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-3",
                  tx.status === "awaiting_payment" && "border-l-4 border-l-amber-400 bg-amber-50/20"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {initialsOf(tx.recipient)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-gray-900 text-sm truncate">{tx.recipient}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500 flex-wrap">
                        <span className="font-mono font-semibold text-primary">{tx.id}</span>
                        <span className="text-gray-300">•</span>
                        <span>{formatTxDate(tx.date)}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-gray-500">{tx.service}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <span className="font-bold text-[15px] text-gray-900 tracking-tight whitespace-nowrap">
                      {formatTxAmount(tx.sendCurrency, tx.sendAmount)}
                    </span>
                    <span className="text-[11px] font-medium text-teal whitespace-nowrap">
                      {formatTxAmount(tx.receiveCurrency, tx.receiveAmount)}
                    </span>
                    <TransactionStatusBadge status={tx.status} compact />
                  </div>
                </div>
                {(canCancel(tx) || canResend(tx)) && <div className="pt-1">{actions(tx, true)}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Cancel confirmation — closeable, non-destructive default */}
      <AlertDialog open={Boolean(cancelTarget)} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent className="rounded-2xl max-w-[calc(100%-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this transaction?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>This can't be undone. The recipient will not receive this transfer.</p>
                {cancelTarget && (
                  <div className="rounded-xl bg-muted/60 border border-gray-100 p-3 space-y-1.5 text-foreground">
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Ref No.</span><span className="font-mono font-semibold">{cancelTarget.id}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Recipient</span><span className="font-medium">{cancelTarget.recipient}</span></div>
                    <div className="flex justify-between gap-3"><span className="text-muted-foreground">Amount</span><span className="font-semibold">{formatTxAmount(cancelTarget.sendCurrency, cancelTarget.sendAmount)}</span></div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="h-11 sm:h-9 rounded-xl" data-testid="button-keep-transaction">Keep transaction</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="h-11 sm:h-9 rounded-xl bg-destructive hover:bg-destructive/90 text-white"
              data-testid="button-confirm-cancel"
            >
              Yes, cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
