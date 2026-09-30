import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { TransactionsCard } from "@/components/dashboard/TransactionsCard";
import { demoScheduledTransactions, demoTransactions } from "@/data/transactions";
import { useToast } from "@/hooks/use-toast";
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
// Demo transactions (same records as Rhemito). Brand-new customers — flagged via
// sessionStorage after registration — still see the empty state.

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ── Main component ─────────────────────────────────────────────
export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isNewCustomer = sessionStorage.getItem("isNewCustomer") === "true";
  const transactions = isNewCustomer ? [] : [...demoScheduledTransactions, ...demoTransactions];
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Total Sent */}
            <div className="rounded-2xl sm:rounded-xl p-4 sm:p-5 bg-[#fdf0ec] border border-[#f5d5cb]">
              <p className="text-sm text-gray-500 mb-2">Total sent</p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[22px] sm:text-2xl font-bold text-gray-800 max-sm:tracking-tight">
                  0.00 {totalSentCurrency}
                </span>
                <Select value={totalSentCurrency} onValueChange={setTotalSentCurrency}>
                  <SelectTrigger className="h-9 sm:h-8 w-[84px] sm:w-[80px] text-sm sm:text-xs bg-white/70 border-[#f5d5cb]">
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
            <div className="rounded-2xl sm:rounded-xl p-4 sm:p-5 bg-[#ecf0fd] border border-[#cdd5f5]">
              <p className="text-sm text-gray-500 mb-2">Wallet balance</p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[22px] sm:text-2xl font-bold text-gray-800 max-sm:tracking-tight">
                  0.00 {walletCurrency}
                </span>
                <Select value={walletCurrency} onValueChange={setWalletCurrency}>
                  <SelectTrigger className="h-9 sm:h-8 w-[84px] sm:w-[80px] text-sm sm:text-xs bg-white/70 border-[#cdd5f5]">
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
          <div className="rounded-2xl sm:rounded-xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-3 sm:mb-4">Quick action</h2>
            <Button
              onClick={() => setLocation("/send-money-flow")}
              data-testid="button-send-money"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 active:scale-[0.99] text-white rounded-xl sm:rounded-full px-7 h-12 sm:h-10 font-semibold text-base sm:text-sm shadow-[0_10px_24px_-12px_rgba(73,37,106,0.6)] sm:shadow-sm hover:shadow-md transition-all duration-200"
            >
              Send money
            </Button>
          </div>
        </motion.section>

        {/* ── Transactions ── */}
        <motion.section variants={itemVariants}>
          <TransactionsCard
            transactions={transactions}
            onSeeAll={() => setLocation("/test-checkout")}
            onStartTransfer={() => setLocation("/send-money-flow")}
            onResend={(tx) => {
              toast({
                title: "Starting a new transfer",
                description: `Send money again to ${tx.recipient}.`,
              });
              setLocation("/send-money-flow");
            }}
          />
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
