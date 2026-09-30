import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Mock data ──────────────────────────────────────────────────
// New customer — no transactions yet
const recentTransactions: {
  id: string;
  recipient: string;
  service: string;
  date: string;
  amount: string;
  status: string;
}[] = [];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ── Status badge ───────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Completed
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Pending
      </span>
    );
  }
  return <span className="text-xs text-gray-500">{status}</span>;
}

// ── Main component ─────────────────────────────────────────────
export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [totalSentCurrency, setTotalSentCurrency] = useState("NGN");
  const [walletCurrency, setWalletCurrency] = useState("NGN");

  return (
    <DashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl"
      >
        {/* ── Top bar: Welcome + powered-by links ── */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6"
        >
          <h1 className="text-xl md:text-2xl font-semibold font-display text-gray-900">
            Welcome Olayinka
          </h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="text-gray-400">Powered by</span>
            <a
              href="https://mito.money"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              mito.money
            </a>
            <span className="text-gray-300">|</span>
            <a href="/privacy-policy" className="hover:text-primary hover:underline transition-colors">
              Privacy Policy
            </a>
            <span className="text-gray-300">|</span>
            <a href="/terms" className="hover:text-primary hover:underline transition-colors">
              Terms
            </a>
          </div>
        </motion.div>

        {/* ── Account Summary ── */}
        <motion.section variants={itemVariants} className="mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-3">Account summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Sent */}
            <div className="rounded-xl p-5 bg-[#fdf0ec] border border-[#f5d5cb]">
              <p className="text-sm text-gray-500 mb-2">Total sent</p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-2xl font-bold text-gray-800">
                  0.00 {totalSentCurrency}
                </span>
                <Select value={totalSentCurrency} onValueChange={setTotalSentCurrency}>
                  <SelectTrigger className="h-8 w-[80px] text-xs bg-white/70 border-[#f5d5cb]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">NGN</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Wallet Balance */}
            <div className="rounded-xl p-5 bg-[#ecf0fd] border border-[#cdd5f5]">
              <p className="text-sm text-gray-500 mb-2">Wallet balance</p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-2xl font-bold text-gray-800">
                  0.00 {walletCurrency}
                </span>
                <Select value={walletCurrency} onValueChange={setWalletCurrency}>
                  <SelectTrigger className="h-8 w-[80px] text-xs bg-white/70 border-[#cdd5f5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">NGN</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Quick Action ── */}
        <motion.section variants={itemVariants} className="mb-6">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Quick action</h2>
            <Button
              onClick={() => setLocation("/send-money-flow")}
              data-testid="button-send-money"
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-7 h-10 font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-200"
            >
              Send money
            </Button>
          </div>
        </motion.section>

        {/* ── Transactions ── */}
        <motion.section variants={itemVariants}>
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">Transactions</h2>
              <button
                onClick={() => setLocation("/test-checkout")}
                className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
              >
                See all
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No Transactions found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/60 border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pl-5 pr-3">
                        Ref No.
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-3">
                        Recipient
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-3 hidden md:table-cell">
                        Service
                      </th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-3 hidden sm:table-cell">
                        Date
                      </th>
                      <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-3">
                        Amount
                      </th>
                      <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 pr-5">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        data-testid={`row-transaction-${tx.id}`}
                        className="border-b border-gray-50 last:border-b-0 hover:bg-primary/[0.03] transition-colors"
                      >
                        <td className="py-3.5 pl-5 pr-3 font-semibold text-primary">{tx.id}</td>
                        <td className="py-3.5 pr-3 font-medium text-gray-800">{tx.recipient}</td>
                        <td className="py-3.5 pr-3 text-gray-500 hidden md:table-cell">{tx.service}</td>
                        <td className="py-3.5 pr-3 text-gray-500 hidden sm:table-cell">{tx.date}</td>
                        <td className="py-3.5 pr-3 text-right font-bold text-gray-800">{tx.amount}</td>
                        <td className="py-3.5 pr-5 text-center">
                          <StatusBadge status={tx.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.section>

        {/* ── Footer ── */}
        <motion.footer
          variants={itemVariants}
          className="mt-10 text-[11px] text-muted-foreground leading-relaxed"
        >
          Mito.money is a trademark owned by Funtech Global Communications Ltd. Devonshire House,
          Manor way, Borehamwood, Herts. WD6 1QQ, United Kingdom. A registered Payment institution
          in the UK with registration details FRN: 815146 MLR NO: 12803115
        </motion.footer>
      </motion.div>
    </DashboardLayout>
  );
}
