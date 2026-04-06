import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Check, ChevronRight, User, Building2,
    CreditCard, Wallet, Landmark, Smartphone, Banknote, Shield,
    ChevronDown, ArrowRightLeft, BarChart3, Search, UserPlus, X,
    Copy, Loader2, Clock, Mail, AlertTriangle, CheckCircle2, AlertCircle
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Mock Data
const EXCHANGE_RATE = 2025.50; // 1 GBP = 2025.50 NGN
const FEE_PERCENTAGE = 0.01; // 1%

// All saved recipients for existing customers (in production this comes from the API)
const allRecipients = [
    { id: 1, name: "Akshita Gupta", bank: "UK Bank", account: "12345678", initials: "AG", color: "bg-primary/10 text-primary" },
    { id: 2, name: "Sarah Chen", bank: "Access Bank", account: "87654321", initials: "SC", color: "bg-purple-100 text-purple-600" },
    { id: 3, name: "David Okonkwo", bank: "GTBank", account: "11223344", initials: "DO", color: "bg-green-100 text-green-600" },
];

const steps = [
    { id: 1, title: "Amount" },
    { id: 2, title: "Recipient" },
    { id: 3, title: "Details" }, // Was "Bank" in screenshot, generalizing to Details
    { id: 4, title: "Summary" }, // Was "Summary"
    { id: 5, title: "Payment" }, // Was "Payment Method"
];

export default function SendMoney() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);

    // Recipients — empty for new customers (flagged via sessionStorage after registration),
    // full list for existing customers. In production this comes from the API.
    const isNewCustomer = sessionStorage.getItem("isNewCustomer") === "true";
    const [recentRecipients, setRecentRecipients] = useState(isNewCustomer ? [] : allRecipients);

    // Form State
    const [amount, setAmount] = useState<string>("500");
    const [receiveAmount, setReceiveAmount] = useState<string>("");
    const [deliveryMethod, setDeliveryMethod] = useState("bank_deposit");
    const [promoCode, setPromoCode] = useState("");
    const [promoApplied, setPromoApplied] = useState(false);
    const [promoMessage, setPromoMessage] = useState("");
    const [promoDiscount, setPromoDiscount] = useState(0);
    const [promoLoading, setPromoLoading] = useState(false);

    const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
    const [recipientDetails, setRecipientDetails] = useState({
        firstName: "",
        lastName: "",
        relationship: "family",
        nickName: "",
        reason: "family_support",
        bankName: "",
        accountNumber: "",
        narration: ""
    });

    const [paymentMethod, setPaymentMethod] = useState("");
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Transaction submission state
    const [transactionSubmitted, setTransactionSubmitted] = useState(false);
    const [submittingTransaction, setSubmittingTransaction] = useState(false);
    const [transactionRef] = useState("24426299");

    // Bank transfer inline page
    const [showBankTransferPage, setShowBankTransferPage] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Payment countdown (30 minutes for bank transfer)
    const [paymentTimeLeft, setPaymentTimeLeft] = useState(1800); // 30 min
    const [paymentTimerActive, setPaymentTimerActive] = useState(false);
    const [transferComplete, setTransferComplete] = useState(false);

    // Session timer (rate lock countdown)
    const [sessionTimeLeft, setSessionTimeLeft] = useState(523); // ~8:43
    const [showExtendPopup, setShowExtendPopup] = useState(false);
    const [extendDismissed, setExtendDismissed] = useState(false);

    // Manual Bank Transfer Confirmation
    const [showManualTransferConfirm, setShowManualTransferConfirm] = useState(false);
    const [isSubmittingTransaction, setIsSubmittingTransaction] = useState(false);
    const [showExpiryPopup, setShowExpiryPopup] = useState(false);
    const [expiryCountdown, setExpiryCountdown] = useState(5);
    const expiryRedirectFired = useRef(false);

    // Bonus State - Hardcoded for Prototype
    const [bonusBalance] = useState(5);
    const [useBonus, setUseBonus] = useState(false);
    const [bonusType, setBonusType] = useState<'pay_less' | 'send_more'>('pay_less');

    // Calculations
    const fee = parseFloat(amount || "0") * FEE_PERCENTAGE;

    // Promo Logic for SAVE20 (Amount Discount) vs Others (Fee Discount)
    const isAmountDiscount = promoCode === "SAVE20";

    // Effective fee is reduced only if it's a Standard Promo (not SAVE20). 
    // If SAVE20, fee remains full, but Total Pay is reduced by discount.
    const effectiveFee = isAmountDiscount ? fee : Math.max(0, fee - (promoApplied ? promoDiscount : 0));

    // Bonus Calculations
    const bonusAmount = useBonus ? Math.min(bonusBalance, parseFloat(amount || "0")) : 0;

    // Total Pay:
    // If Amount Discount (SAVE20), subtract promoDiscount from (Amount + Fee).
    // If Bonus "Pay Less" is active, subtract bonusAmount.
    const totalPay = isAmountDiscount
        ? (parseFloat(amount || "0") + fee) - (promoApplied ? promoDiscount : 0) - (useBonus && bonusType === 'pay_less' ? bonusAmount : 0)
        : (parseFloat(amount || "0") + effectiveFee) - (useBonus && bonusType === 'pay_less' ? bonusAmount : 0);

    // Adjusted Receive Amount for Bonus "Send More"
    const bonusReceiveParams = useBonus && bonusType === 'send_more' ? (bonusAmount * EXCHANGE_RATE) : 0;
    const finalReceiveAmount = (parseFloat(receiveAmount || "0") + bonusReceiveParams).toFixed(2);



    // Scroll to top whenever the step or sub-view changes so the user always sees the top of the new screen
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
    }, [currentStep, showBankTransferPage]);

    useEffect(() => {
        // Auto-calculate receive amount
        const val = parseFloat(amount || "0");
        setReceiveAmount((val * EXCHANGE_RATE).toFixed(2));
    }, [amount]);

    const handleApplyPromo = async () => {
        const code = promoCode.trim().toUpperCase();
        if (!code) {
            setPromoMessage("Please enter a promo code.");
            setPromoApplied(false);
            return;
        }

        setPromoLoading(true);

        // MOCK SAVE20 Logic


        try {
            const response = await fetch("/api/promocodes/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    amount: parseFloat(amount),
                    currency: "GBP",
                    userId: "user_123",
                    sourceCurrency: "GBP",
                    destCurrency: "NGN",
                    paymentMethod: paymentMethod || "bank_deposit",
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setPromoApplied(true);
                setPromoDiscount(data.appliedDiscount || 0);
                setPromoMessage(data.displayText || "Promo code applied!");
            } else {
                setPromoApplied(false);
                setPromoDiscount(0);
                setPromoMessage(data.error || "Invalid promo code");
            }
        } catch (error) {
            setPromoApplied(false);
            setPromoDiscount(0);
            setPromoMessage("Failed to validate promo code");
        } finally {
            setPromoLoading(false);
        }
    };



    const handleNext = () => {
        if (currentStep < 5) {
            // Once a new customer moves past the recipient step, clear the new-customer flag
            // so their next session shows saved recipients correctly.
            if (currentStep === 2) sessionStorage.removeItem("isNewCustomer");
            setCurrentStep((prev) => prev + 1);
        } else {
            setLocation("/dashboard"); // Finish → back to dashboard
        }
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep((prev) => prev - 1);
        else setLocation("/dashboard"); // Back from step 1 → back to dashboard
    };

    // Format seconds to MM:SS
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return { minutes: m, seconds: s };
    };

    // Session countdown timer
    useEffect(() => {
        if (sessionTimeLeft <= 0) return;
        const interval = setInterval(() => {
            setSessionTimeLeft((prev) => {
                const next = prev - 1;
                if (next === 30 && !extendDismissed) {
                    setShowExtendPopup(true);
                }
                if (next <= 0) {
                    clearInterval(interval);
                    setLocation("/dashboard");
                }
                return next;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [sessionTimeLeft <= 0, extendDismissed]);

    // Copy to clipboard helper
    const handleCopy = (value: string, fieldName: string) => {
        navigator.clipboard.writeText(value);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Copy all bank details
    const handleCopyAll = () => {
        const allDetails = `Transaction Reference No: ${transactionRef}\nAccount Name: Topupnigeria.com Nigeria Ltd\nBank Name: United Bank of Africa PLC (UBA)\nBank Account Number: 1018984719\nSort Code: 20-45-45`;
        navigator.clipboard.writeText(allDetails);
        setCopiedField('all');
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Handle transaction submission on Step 4 Continue
    const handleSubmitTransaction = async () => {
        setSubmittingTransaction(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setTransactionSubmitted(true);
        setSubmittingTransaction(false);
        setCurrentStep(5);
    };

    // Payment countdown timer (30 min for bank transfer page)
    useEffect(() => {
        if (!paymentTimerActive || paymentTimeLeft <= 0) return;
        const interval = setInterval(() => {
            setPaymentTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setPaymentTimerActive(false);
                    setShowExpiryPopup(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [paymentTimerActive, paymentTimeLeft <= 0]);

    // Auto-redirect countdown when expiry popup is shown
    useEffect(() => {
        if (!showExpiryPopup) return;
        expiryRedirectFired.current = false; // reset guard for this new expiry event
        setExpiryCountdown(5);
        const interval = setInterval(() => {
            setExpiryCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleExpiryRedirect();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [showExpiryPopup]);

    const handleExpiryRedirect = useCallback(() => {
        // Guard: only fire once even if called from both the timer and the button
        if (expiryRedirectFired.current) return;
        expiryRedirectFired.current = true;

        setShowExpiryPopup(false);
        setShowBankTransferPage(false);
        setPaymentTimerActive(false);
        setPaymentTimeLeft(1800);
        setExpiryCountdown(5);
        setPaymentMethod("");
        setLocation("/dashboard");
        // Show toast after redirect so it's visible on the dashboard
        setTimeout(() => {
            toast({
                title: "Transaction Aborted",
                description: "Your transaction has been aborted due to payment timeout. An email notification has been sent to your registered email address.",
                variant: "destructive",
            });
        }, 500);
    }, [setLocation, toast]);

    const formatPaymentTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const timerDisplay = formatTime(sessionTimeLeft);

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto pb-10">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Send Money</h1>
                    <div className="text-sm text-muted-foreground">step {currentStep} of 5</div>
                </div>

                {/* Stepper */}
                <div className="flex items-center justify-between mb-8 px-4 md:px-12 relative">
                    <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200 -z-10" />
                    {steps.map((step) => (
                        <div key={step.id} className="flex flex-col items-center bg-background px-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-2 transition-colors ${currentStep >= step.id ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                                }`}>
                                {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                            </div>
                            <span className={`text-xs ${currentStep >= step.id ? "text-primary font-medium" : "text-gray-400"}`}>
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>

                <div className={currentStep === 1 || currentStep === 2 || currentStep === 3 || currentStep === 4 || currentStep === 5 ? "block w-full" : "grid grid-cols-1 lg:grid-cols-3 gap-8"}>
                    {/* Main Content Area */}
                    <div className={currentStep === 1 || currentStep === 2 || currentStep === 3 || currentStep === 4 || currentStep === 5 ? "w-full space-y-6" : "lg:col-span-2 space-y-6"}>

                        {/* Step 1: Amount */}
                        {currentStep === 1 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-1 lg:grid-cols-5 gap-8 w-full"
                            >
                                <div className="lg:col-span-3 space-y-8">
                                    <div className="space-y-2">
                                        <Label className="text-gray-500">You Send</Label>
                                        <div className="flex bg-white border rounded-lg overflow-hidden h-14 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                                            <div className="flex items-center gap-2 px-4 bg-gray-50 border-r min-w-[120px]">
                                                <img src="https://flagcdn.com/w40/gb.png" alt="GBP" className="w-8 h-6 object-cover rounded shadow-sm" />
                                                <span className="font-semibold text-lg">GBP</span>
                                                <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                                            </div>
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={e => setAmount(e.target.value)}
                                                className="flex-1 px-4 text-lg font-medium outline-none"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-500">They Receive</Label>
                                        <div className="flex bg-white border rounded-lg overflow-hidden h-14 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                                            <div className="flex items-center gap-2 px-4 bg-gray-50 border-r min-w-[120px]">
                                                <img src="https://flagcdn.com/w40/ng.png" alt="NGN" className="w-8 h-6 object-cover rounded shadow-sm" />
                                                <span className="font-semibold text-lg">NGN</span>
                                                <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                                            </div>
                                            <input
                                                readOnly
                                                value={receiveAmount}
                                                className="flex-1 px-4 text-lg font-medium outline-none bg-gray-50 text-gray-500"
                                            />
                                        </div>
                                    </div>


                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">How will they receive the money?</h3>
                                        <div className="flex flex-wrap gap-4">
                                            {[
                                                { id: "bank_deposit", label: "Bank Deposit", icon: Landmark },
                                                { id: "mobile_money", label: "Mobile Money", icon: Smartphone },
                                                { id: "cash_pickup", label: "Cash Pickup", icon: Banknote }
                                            ].map((method) => (
                                                <div
                                                    key={method.id}
                                                    onClick={() => setDeliveryMethod(method.id)}
                                                    className={`
                                                        flex items-center gap-2 px-6 py-3 rounded-full cursor-pointer transition-all font-medium
                                                        ${deliveryMethod === method.id
                                                            ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                                                            : "text-gray-500 hover:bg-gray-50 border border-transparent"}
                                                    `}
                                                >
                                                    <method.icon className={`w-5 h-5 ${deliveryMethod === method.id ? "text-primary" : "text-gray-400"}`} />
                                                    {method.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <Wallet className="w-4 h-4" />
                                                </div>
                                                <span>Amount Sent</span>
                                            </div>
                                            <span className="font-medium">{(parseFloat(amount) - effectiveFee).toFixed(2)} GBP</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <BarChart3 className="w-4 h-4" />
                                                </div>
                                                <span>Fee</span>
                                            </div>
                                            <span className="font-medium">{fee.toFixed(2)} GBP</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 bg-primary/5 px-4 rounded-lg -mx-4">
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <ArrowRightLeft className="w-4 h-4" />
                                                </div>
                                                <span>Exchange Rate</span>
                                            </div>
                                            <span className="font-medium text-gray-900">1 GBP = {EXCHANGE_RATE.toFixed(2)} USD</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={handleBack}
                                            className="flex-1 h-14 text-lg rounded-xl"
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleNext}
                                            className="flex-1 h-14 text-lg bg-primary hover:bg-primary/90 rounded-xl"
                                        >
                                            Continue
                                        </Button>
                                    </div>
                                </div>

                                {/* Right Column: Sticky Summary */}
                                <div className="lg:col-span-2 hidden lg:block">
                                    <div className="sticky top-6">
                                        <Card className="border border-border shadow-sm">
                                            <CardHeader className="pb-4 border-b">
                                                <CardTitle className="text-base font-bold text-gray-900">Amount</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4 text-sm pt-6">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">You Send</span>
                                                    <span className="font-medium text-gray-900">{parseFloat(amount).toFixed(2)} GBP</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Amount Sent</span>
                                                    <span className="font-medium text-gray-900">{(parseFloat(amount) - effectiveFee).toFixed(2)} GBP</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Fee</span>
                                                    <span className="font-medium text-gray-900">{fee.toFixed(2)} GBP</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Exchange Rate</span>
                                                    <span className="font-medium text-gray-900">1 GBP = {EXCHANGE_RATE.toFixed(2)} USD</span>
                                                </div>

                                                <div className="pt-4 mt-4 border-t flex justify-between items-center">
                                                    <span className="text-gray-600 font-medium">They Receive</span>
                                                    <span className="font-bold text-lg text-teal">{receiveAmount} USD</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Recipient */}
                        {/* Step 2: Recipient */}
                        {currentStep === 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="grid grid-cols-1 lg:grid-cols-5 gap-8 w-full"
                            >
                                {/* Left Column: Recipient Selection */}
                                <div className="lg:col-span-3 space-y-8">
                                    <div className="space-y-6">
                                        <Button
                                            variant="outline"
                                            onClick={handleBack}
                                            className="gap-2 text-gray-600 hover:text-gray-900"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Back
                                        </Button>
                                        <h2 className="text-xl font-bold text-gray-900">Who are you sending to?</h2>

                                        {recentRecipients.length === 0 ? (
                                            /* ── NEW CUSTOMER: Empty State ── */
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex flex-col items-center text-center py-12 px-6 space-y-6"
                                            >
                                                {/* Icon */}
                                                <div className="relative">
                                                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center">
                                                        <User className="w-10 h-10 text-primary/40" />
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md">
                                                        <UserPlus className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>

                                                {/* Text */}
                                                <div className="space-y-2 max-w-xs">
                                                    <h3 className="text-lg font-bold text-foreground">No recipients yet</h3>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        You haven't added any recipients yet. Add your first recipient below — their details will be saved for future transfers.
                                                    </p>
                                                </div>

                                                {/* Primary CTA */}
                                                <Button
                                                    onClick={() => { setSelectedRecipient(null); handleNext(); }}
                                                    className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold gap-2 shadow-sm"
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                    Add New Recipient
                                                </Button>

                                                {/* Helper note */}
                                                <p className="text-xs text-muted-foreground">
                                                    You'll need their full name, bank details, and account number.
                                                </p>
                                            </motion.div>
                                        ) : (
                                            /* ── EXISTING CUSTOMER: Saved Recipients ── */
                                            <>
                                                {/* Recent Recipients - Circles */}
                                                <div className="space-y-4">
                                                    <Label className="text-gray-500 font-medium">Recent Recipients</Label>
                                                    <div className="flex gap-6 overflow-x-auto pb-4">
                                                        {recentRecipients.slice(0, 5).map(r => (
                                                            <div key={r.id} className="flex flex-col items-center gap-2 cursor-pointer group min-w-[80px]" onClick={() => { sessionStorage.removeItem("isNewCustomer"); setSelectedRecipient(r); handleNext(); }}>
                                                                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg ${r.color} group-hover:ring-2 ring-primary ring-offset-2 transition-all`}>
                                                                    {r.initials}
                                                                </div>
                                                                <span className="text-xs font-medium text-gray-600 text-center truncate w-full">{r.name.split(' ')[0]}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Search and New Recipient */}
                                                <div className="flex gap-4">
                                                    <div className="relative flex-1">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search recipient"
                                                            className="w-full h-10 pl-10 pr-4 rounded-lg border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                        />
                                                    </div>
                                                    <Button variant="outline" className="gap-2 h-10 whitespace-nowrap bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm" onClick={() => { setSelectedRecipient(null); handleNext(); }}>
                                                        <UserPlus className="w-4 h-4" />
                                                        New Recipient
                                                    </Button>
                                                </div>

                                                {/* All Recipients List */}
                                                <div className="space-y-1">
                                                    {recentRecipients.map(r => (
                                                        <div
                                                            key={r.id}
                                                            onClick={() => { sessionStorage.removeItem("isNewCustomer"); setSelectedRecipient(r); handleNext(); }}
                                                            className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${r.color} relative`}>
                                                                    {r.initials}
                                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-gray-900">{r.name}</div>
                                                                    <div className="text-sm text-gray-500">{r.bank}</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right text-sm">
                                                                <div className="text-primary font-medium">Bank Deposit</div>
                                                                <div className="text-gray-400">{r.account}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl">
                                                    Show More
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column: Sticky Summary */}
                                <div className="lg:col-span-2 hidden lg:block">
                                    <div className="sticky top-6">
                                        <Card className="border border-border shadow-sm">
                                            <CardHeader className="pb-4 border-b">
                                                <div className="flex justify-between items-center">
                                                    <CardTitle className="text-base font-bold text-gray-900">Amount</CardTitle>
                                                    {/* Session Timer */}
                                                    <div className={`flex gap-1 font-mono text-sm px-2 py-1 rounded ${sessionTimeLeft <= 60 ? 'text-red-600 bg-red-50 animate-pulse' : 'text-primary bg-primary/10'}`}>
                                                        <span>{timerDisplay.minutes}</span>:<span>{timerDisplay.seconds}</span>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4 text-sm pt-6">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">You Send</span>
                                                    <span className="font-medium text-gray-900">{parseFloat(amount).toFixed(2)} GBP</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Amount Sent</span>
                                                    <span className="font-medium text-gray-900">{(parseFloat(amount) - effectiveFee).toFixed(2)} GBP</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">They Receive</span>
                                                    <span className="font-medium text-gray-900">{receiveAmount} USD</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Transaction Fee</span>
                                                    <span className="font-medium text-gray-900">{fee.toFixed(2)} GBP</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Exchange Rate</span>
                                                    <span className="font-medium text-gray-900">1 GBP = {EXCHANGE_RATE.toFixed(2)} USD</span>
                                                </div>
                                                <div className="flex justify-between pt-2">
                                                    <span className="text-gray-600">Collection Method</span>
                                                    <span className="font-medium text-gray-900 capitalize">{deliveryMethod.replace('_', ' ')}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Details */}
                        {currentStep === 3 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="grid grid-cols-1 lg:grid-cols-5 gap-8 w-full"
                            >
                                {/* Left Column: Form Details */}
                                <div className="lg:col-span-3 space-y-8">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Recipient Details</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>First Name</Label>
                                                    <Input
                                                        defaultValue={selectedRecipient?.name?.split(' ')[0] || ""}
                                                        onChange={e => setRecipientDetails({ ...recipientDetails, firstName: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Last Name</Label>
                                                    <Input
                                                        defaultValue={selectedRecipient?.name?.split(' ')[1] || ""}
                                                        onChange={e => setRecipientDetails({ ...recipientDetails, lastName: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Relationship</Label>
                                                    <Select defaultValue="family">
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="family">Family</SelectItem>
                                                            <SelectItem value="friend">Friend</SelectItem>
                                                            <SelectItem value="business">Business Service</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Nickname (Optional)</Label>
                                                    <Input placeholder="e.g. My Brother" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Reason for transfer</Label>
                                                <Select defaultValue="family_support">
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="family_support">Family Support</SelectItem>
                                                        <SelectItem value="education">Education</SelectItem>
                                                        <SelectItem value="bills">Bills</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Narration <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                                                <Textarea
                                                    placeholder="e.g. Monthly allowance for February"
                                                    value={recipientDetails.narration}
                                                    onChange={e => setRecipientDetails({ ...recipientDetails, narration: e.target.value })}
                                                    className="resize-none"
                                                    rows={3}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="pt-4 flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={handleBack}
                                            className="flex-1 h-14 text-lg rounded-xl"
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleNext}
                                            className="flex-1 h-14 text-lg bg-primary hover:bg-primary/90 rounded-xl"
                                        >
                                            Continue
                                        </Button>
                                    </div>
                                </div>

                                {/* Right Column: Sticky Summary */}
                                <div className="lg:col-span-2 hidden lg:block">
                                    <div className="sticky top-6">
                                        <Card className="border border-border shadow-sm">
                                            <CardHeader className="pb-4 border-b">
                                                <div className="flex justify-between items-center">
                                                    <CardTitle className="text-base font-bold text-gray-900">Amount</CardTitle>
                                                    {/* Session Timer */}
                                                    <div className={`flex gap-1 font-mono text-sm px-2 py-1 rounded ${sessionTimeLeft <= 60 ? 'text-red-600 bg-red-50 animate-pulse' : 'text-primary bg-primary/10'}`}>
                                                        <span>{timerDisplay.minutes}</span>:<span>{timerDisplay.seconds}</span>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4 text-sm pt-6">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">You Send</span>
                                                    <span className="font-medium text-gray-900">{parseFloat(amount).toFixed(2)} GBP</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Fees</span>
                                                    <span className="font-medium text-gray-900">{fee.toFixed(2)} GBP</span>
                                                </div>
                                                <div className="border-t pt-2 mt-2 flex justify-between items-center">
                                                    <span className="text-gray-900 font-bold text-base">Total to Pay</span>
                                                    <span className="font-bold text-lg text-gray-900">{(parseFloat(amount) + effectiveFee).toFixed(2)} GBP</span>
                                                </div>

                                                <div className="pt-4 mt-2 bg-teal/10 -mx-6 px-6 py-4 mb-[-24px]">
                                                    <div className="text-sm text-gray-600 mb-1">They Receive</div>
                                                    <div className="text-xl font-bold text-teal">{receiveAmount} NGN</div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: Summary */}
                        {currentStep === 4 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 w-full pb-10">
                                    <div className="lg:col-span-3 space-y-6">

                                        {/* Info Banner */}
                                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                                            <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                                            <p className="text-sm text-primary/90 leading-relaxed">
                                                Please review your transaction details below. Everything looks good? Hit <strong>Confirm & Continue</strong> to proceed to payment. Need changes? Use the <strong>Back</strong> button.
                                            </p>
                                        </div>

                                        {/* Amount Section */}
                                        <Card className="shadow-sm border-border">
                                            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                                                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Wallet className="w-3.5 h-3.5 text-primary" />
                                                    </div>
                                                    Transfer Amount
                                                </CardTitle>
                                                <button onClick={() => setCurrentStep(1)} className="text-xs text-primary hover:underline font-medium">Edit</button>
                                            </CardHeader>
                                            <CardContent className="pt-4 space-y-3 text-sm">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">You Send</span>
                                                    <span className="font-semibold text-foreground">{parseFloat(amount).toFixed(2)} GBP</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Transaction Fee</span>
                                                    <span className="font-semibold text-foreground">{effectiveFee.toFixed(2)} GBP</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Exchange Rate</span>
                                                    <span className="font-semibold text-foreground">1 GBP = {EXCHANGE_RATE.toLocaleString()} NGN</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Delivery Method</span>
                                                    <span className="font-semibold text-foreground capitalize">{deliveryMethod.replace('_', ' ')}</span>
                                                </div>
                                                <div className="border-t pt-3 mt-1 flex justify-between items-center">
                                                    <span className="font-bold text-foreground">They Receive</span>
                                                    <span className="font-bold text-lg text-teal">{parseFloat(finalReceiveAmount).toLocaleString('en-GB', { minimumFractionDigits: 2 })} NGN</span>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Recipient Section */}
                                        <Card className="shadow-sm border-border">
                                            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                                                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <User className="w-3.5 h-3.5 text-primary" />
                                                    </div>
                                                    Recipient Details
                                                </CardTitle>
                                                <button onClick={() => setCurrentStep(3)} className="text-xs text-primary hover:underline font-medium">Edit</button>
                                            </CardHeader>
                                            <CardContent className="pt-4 space-y-3 text-sm">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Full Name</span>
                                                    <span className="font-semibold text-foreground">
                                                        {selectedRecipient ? selectedRecipient.name : `${recipientDetails.firstName || "—"} ${recipientDetails.lastName || ""}`.trim()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Relationship</span>
                                                    <span className="font-semibold text-foreground capitalize">{recipientDetails.relationship.replace('_', ' ')}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Reason for Transfer</span>
                                                    <span className="font-semibold text-foreground capitalize">{recipientDetails.reason.replace('_', ' ')}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Bank Account</span>
                                                    <span className="font-semibold text-foreground font-mono">
                                                        {selectedRecipient ? selectedRecipient.account : "12345678"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Sort Code</span>
                                                    <span className="font-semibold text-foreground font-mono">60-60-04</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Bank</span>
                                                    <span className="font-semibold text-foreground">
                                                        {selectedRecipient ? selectedRecipient.bank : (recipientDetails.bankName || "—")}
                                                    </span>
                                                </div>
                                                {recipientDetails.narration && (
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-muted-foreground">Narration</span>
                                                        <span className="font-semibold text-foreground text-right max-w-[60%]">{recipientDetails.narration}</span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Total to Pay */}
                                        <div className="rounded-xl bg-primary/5 border border-primary/15 p-5 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-0.5">Total to Pay</p>
                                                <p className="text-2xl font-bold text-foreground">{totalPay.toFixed(2)} GBP</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground mb-0.5">They Receive</p>
                                                <p className="text-xl font-bold text-teal">{parseFloat(finalReceiveAmount).toLocaleString('en-GB', { minimumFractionDigits: 2 })} NGN</p>
                                            </div>
                                        </div>

                                        {/* Terms Disclaimer */}
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm leading-relaxed">
                                            By clicking <strong>Confirm & Continue</strong> you are submitting this transaction and agree to Samis Online's{" "}
                                            <a href="#" className="underline hover:text-amber-900">Terms of Use</a> and{" "}
                                            <a href="#" className="underline hover:text-amber-900">Privacy Policy</a>.
                                            You will then select your preferred payment method.
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 pt-2">
                                            <Button
                                                variant="outline"
                                                onClick={handleBack}
                                                className="flex-1 h-14 text-base rounded-xl border-border hover:bg-muted"
                                                disabled={submittingTransaction}
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                onClick={handleSubmitTransaction}
                                                disabled={submittingTransaction}
                                                className="flex-1 h-14 text-base rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
                                            >
                                                {submittingTransaction ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Processing…
                                                    </span>
                                                ) : (
                                                    "Confirm & Continue"
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Right Column: Sticky Summary Card */}
                                    <div className="lg:col-span-2 hidden lg:block">
                                        <div className="sticky top-6">
                                            <Card className="border-border shadow-sm overflow-hidden">
                                                <CardHeader className="pb-4 border-b">
                                                    <div className="flex justify-between items-center">
                                                        <CardTitle className="text-base font-bold text-foreground">Amount</CardTitle>
                                                        <div className={`flex gap-1 font-mono text-sm px-2 py-1 rounded-md ${sessionTimeLeft <= 60 ? 'text-destructive bg-destructive/10 animate-pulse' : 'text-primary bg-primary/10'}`}>
                                                            <span>{timerDisplay.minutes}</span>:<span>{timerDisplay.seconds}</span>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-3 text-sm pt-5">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">You Send</span>
                                                        <span className="font-semibold text-foreground">{parseFloat(amount).toFixed(2)} GBP</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Fees</span>
                                                        <span className="font-semibold text-foreground">{fee.toFixed(2)} GBP</span>
                                                    </div>
                                                    <div className="border-t pt-3 flex justify-between items-center">
                                                        <span className="font-bold text-foreground">Total to Pay</span>
                                                        <span className="font-bold text-base text-foreground">{totalPay.toFixed(2)} GBP</span>
                                                    </div>
                                                </CardContent>
                                                <div className="bg-teal/10 px-6 py-4">
                                                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">They Receive</div>
                                                    <div className="text-xl font-bold text-teal">{parseFloat(finalReceiveAmount).toLocaleString('en-GB', { minimumFractionDigits: 2 })} NGN</div>
                                                </div>
                                            </Card>

                                            {/* Security badge */}
                                            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                                <Shield className="w-3.5 h-3.5" />
                                                <span>256-bit SSL encrypted &amp; FCA regulated</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 5: Payment Method */}
                        {currentStep === 5 && !showBankTransferPage && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="grid grid-cols-1 lg:grid-cols-5 gap-8 pb-24"
                            >
                                {/* Left Column: Input Sections */}
                                <div className="lg:col-span-3 space-y-6">

                                    {/* Bonus Redemption Section */}
                                    <Card className="border-green-100 bg-green-50/30">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                    <Wallet className="w-4 h-4" />
                                                </div>
                                                <CardTitle className="text-base text-green-800">Referral Bonus Available</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    id="use-bonus"
                                                    checked={useBonus}
                                                    onCheckedChange={(checked) => setUseBonus(checked as boolean)}
                                                    className="mt-1 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                                />
                                                <div className="space-y-1">
                                                    <Label htmlFor="use-bonus" className="text-base font-medium cursor-pointer">
                                                        Redeem your <span className="font-bold text-green-700">£{bonusBalance.toFixed(2)}</span> bonus
                                                    </Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        You have earned this from referring friends!
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="pl-7 space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <p className="text-sm font-medium text-gray-700">How would you like to use it?</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div
                                                        onClick={() => { setUseBonus(true); setBonusType('pay_less'); }}
                                                        className={`
                                                            cursor-pointer border rounded-lg p-3 flex items-center gap-3 transition-all
                                                            ${useBonus && bonusType === 'pay_less' ? 'bg-green-100 border-green-300 ring-1 ring-green-300' : 'bg-white hover:bg-gray-50 border-gray-200'}
                                                        `}
                                                    >
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${useBonus && bonusType === 'pay_less' ? 'border-green-600' : 'border-gray-400'}`}>
                                                            {useBonus && bonusType === 'pay_less' && <div className="w-2 h-2 rounded-full bg-green-600" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-sm">Pay Less</div>
                                                            <div className="text-xs text-muted-foreground">Save £{Math.min(bonusBalance, parseFloat(amount)).toFixed(2)} now</div>
                                                        </div>
                                                    </div>

                                                    <div
                                                        onClick={() => { setUseBonus(true); setBonusType('send_more'); }}
                                                        className={`
                                                            cursor-pointer border rounded-lg p-3 flex items-center gap-3 transition-all
                                                            ${useBonus && bonusType === 'send_more' ? 'bg-green-100 border-green-300 ring-1 ring-green-300' : 'bg-white hover:bg-gray-50 border-gray-200'}
                                                        `}
                                                    >
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${useBonus && bonusType === 'send_more' ? 'border-green-600' : 'border-gray-400'}`}>
                                                            {useBonus && bonusType === 'send_more' && <div className="w-2 h-2 rounded-full bg-green-600" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-sm">Send More</div>
                                                            <div className="text-xs text-muted-foreground">Recipient gets +£{Math.min(bonusBalance, parseFloat(amount)).toFixed(2)}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Promo Code Section */}
                                    <Card>
                                        <CardHeader className="pb-4">
                                            <CardTitle className="text-base">Promo Code</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <Label className="text-sm">Have a promo code?</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Enter code (e.g. WELCOME, SAVE20)"
                                                    value={promoCode}
                                                    onChange={(e) => {
                                                        setPromoCode(e.target.value.toUpperCase());
                                                        setPromoApplied(false);
                                                        setPromoMessage("");
                                                    }}
                                                    className="uppercase font-mono"
                                                    disabled={promoLoading}
                                                />
                                                <Button
                                                    variant="outline"
                                                    onClick={handleApplyPromo}
                                                    disabled={promoLoading || !promoCode}
                                                >
                                                    {promoLoading ? "Checking..." : "Apply"}
                                                </Button>
                                            </div>
                                            {promoMessage && (
                                                <p className={`text-xs mt-1 font-medium ${promoApplied ? "text-green-600" : "text-red-500"}`}>
                                                    {promoApplied ? "✓ " : "✗ "}{promoMessage}
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Payment Method Selection */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">How would you like to pay?</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {[
                                                { id: "instant_bank", title: "Instant Pay By Bank", desc: `You pay GBP ${totalPay.toFixed(2)}`, icon: Landmark },
                                                { id: "card", title: "Credit/Debit Card", desc: `You pay GBP ${totalPay.toFixed(2)}`, icon: CreditCard },
                                                { id: "manual_transfer", title: "Manual Bank Transfer", desc: "Send to our local account (Pay within 30 minutes)", icon: Building2 },
                                                { id: "wallet", title: "Wallet Balance", desc: `Available: GBP 300.20`, icon: Wallet },
                                            ].map((method) => (
                                                <div
                                                    key={method.id}
                                                    onClick={async () => {
                                                        setPaymentMethod(method.id);
                                                        if (useBonus) {
                                                            try {
                                                                await fetch("/api/bonus/redeem", {
                                                                    method: "POST",
                                                                    headers: { "Content-Type": "application/json" },
                                                                    body: JSON.stringify({
                                                                        amount: Math.min(bonusBalance, parseFloat(amount)),
                                                                        userId: "user_123"
                                                                    }),
                                                                });
                                                            } catch (e) {
                                                                console.error("Failed to redeem bonus", e);
                                                            }
                                                        }
                                                        if (method.id === 'manual_transfer') {
                                                            setShowManualTransferConfirm(true);
                                                        } else {
                                                            setShowConfirmation(true);
                                                        }
                                                    }}
                                                    className={`p-4 border rounded-xl cursor-pointer flex items-center gap-4 transition-all ${paymentMethod === method.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-gray-300"
                                                        }`}
                                                >
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white border ${paymentMethod === method.id ? "text-primary border-primary" : "text-gray-500 border-gray-200"
                                                        }`}>
                                                        <method.icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{method.title}</div>
                                                        <div className="text-xs text-muted-foreground">{method.desc}</div>
                                                    </div>
                                                    {paymentMethod === method.id && <div className="ml-auto text-primary"><Check className="w-5 h-5" /></div>}
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>


                                    <div className="mt-6 flex items-start gap-2 p-4 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
                                        <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                                        <p>By selecting a payment option, you agree to our Terms of Use and Privacy Policy. Funds are usually delivered within minutes.</p>
                                    </div>
                                </div>

                                {/* Right Column: Amount Summary (Sticky) */}
                                <div className="lg:col-span-2">
                                    <div className="sticky top-6 space-y-6">
                                        <Card className="border-2 border-gray-200 shadow-sm">
                                            <CardHeader className="pb-4 bg-gray-50/50 border-b">
                                                <CardTitle className="text-base">Amount Summary</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3 text-sm pt-4">
                                                {/* Promo Discount Row (Top if applied) - SAVE20 Style */}
                                                {promoApplied && promoDiscount > 0 && (
                                                    <div className="flex justify-between font-medium text-gray-900">
                                                        <span>Discount: ({promoCode})</span>
                                                        <span>{promoDiscount.toFixed(2)} GBP</span>
                                                    </div>
                                                )}

                                                {/* Bonus Applied Row - Pay Less */}
                                                {useBonus && bonusType === "pay_less" && (
                                                    <div className="flex justify-between font-medium text-green-700 bg-green-50 px-2 py-1 -mx-2 rounded">
                                                        <span>Referral Bonus</span>
                                                        <span>- {Math.min(bonusBalance, parseFloat(amount)).toFixed(2)} GBP</span>
                                                    </div>
                                                )}

                                                {/* Bonus Applied Row - Send More */}
                                                {useBonus && bonusType === "send_more" && (
                                                    <div className="flex justify-between font-medium text-green-700 bg-green-50 px-2 py-1 -mx-2 rounded">
                                                        <span>Referral Bonus (Recipient)</span>
                                                        <span>+ {Math.min(bonusBalance, parseFloat(amount)).toFixed(2)} GBP</span>
                                                    </div>
                                                )}

                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">You Send</span>
                                                    <span className="font-medium">{totalPay.toFixed(2)} GBP</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Amount Sent</span>
                                                    <span className="font-medium">{(parseFloat(amount)).toFixed(2)} GBP</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">They Receive</span>
                                                    <span className="font-medium">
                                                        {finalReceiveAmount} NGN
                                                        {useBonus && bonusType === "send_more" && (
                                                            <span className="text-xs text-green-600 ml-2 font-bold">(+Bonus)</span>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Transaction Fee</span>
                                                    <span className="font-medium">{effectiveFee.toFixed(2)} GBP</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Exchange Rate</span>
                                                    <span className="font-medium">1 GBP = {EXCHANGE_RATE.toFixed(2)} NGN</span>
                                                </div>
                                                <div className="flex justify-between pt-2">
                                                    <span className="text-gray-600">Connection Method</span>
                                                    <span className="font-medium text-right capitalize">
                                                        {deliveryMethod.replace('_', ' ')}
                                                    </span>
                                                </div>

                                                <div className="pt-4 mt-2 border-t">
                                                    <div className="flex justify-between items-center pt-2">
                                                        <span className="text-gray-900 font-bold text-base">Total to Pay</span>
                                                        <span className="font-bold text-lg text-gray-900">{totalPay.toFixed(2)} GBP</span>
                                                    </div>
                                                    {(promoApplied || useBonus) && (
                                                        <p className="text-xs text-green-600 font-medium mt-1">
                                                            Includes {promoApplied && "Promo Code"}{promoApplied && useBonus && " & "}{useBonus && (bonusType === 'pay_less' ? "Bonus Discount" : "Bonus Credit")}
                                                        </p>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 5 — Bank Transfer Details (Inline Page) */}
                        {currentStep === 5 && showBankTransferPage && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="w-full max-w-3xl mx-auto space-y-6 pb-10"
                            >
                                {/* Back Button */}
                                <button
                                    onClick={() => { setShowBankTransferPage(false); setPaymentTimerActive(false); }}
                                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
                                >
                                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                                    <span className="text-sm font-medium">Back to Payment Methods</span>
                                </button>

                                {/* Status Tracker */}
                                <Card className="border-2 border-gray-100 shadow-sm overflow-hidden">
                                    <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary" />
                                    <CardContent className="pt-6 pb-5 px-6">
                                        <div className="flex items-center justify-between relative">
                                            {/* Progress line behind circles */}
                                            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
                                            <div className="absolute top-4 left-0 h-0.5 bg-green-500 z-0 transition-all duration-1000" style={{ width: transferComplete ? '100%' : '12%' }} />

                                            {[
                                                { label: "Transaction\nCreated", icon: Check, active: true, completed: true },
                                                { label: "Awaiting\nPayment", icon: Clock, active: !transferComplete, completed: transferComplete },
                                                { label: "Payment\nReceived", icon: Banknote, active: false, completed: transferComplete },
                                                { label: "Processing\nTransfer", icon: ArrowRightLeft, active: false, completed: transferComplete },
                                            ].map((step, idx) => (
                                                <div key={idx} className="flex flex-col items-center z-10 relative">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                                        step.completed ? 'bg-green-500 text-white ring-4 ring-green-100' :
                                                        step.active ? 'bg-primary text-white ring-4 ring-primary/20 animate-pulse' :
                                                        'bg-gray-100 text-gray-400 ring-2 ring-gray-50'
                                                    }`}>
                                                        {step.completed ? <Check className="w-4 h-4" /> : <step.icon className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <span className={`text-[10px] mt-2 text-center leading-tight font-medium whitespace-pre-line ${
                                                        step.completed ? 'text-green-700' : step.active ? 'text-primary' : 'text-gray-400'
                                                    }`}>{step.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Payment Countdown Timer — Clock */}
                                {(() => {
                                    const isUrgent = paymentTimeLeft <= 300;
                                    const progress = paymentTimeLeft / 1800;
                                    const minutes = Math.floor(paymentTimeLeft / 60).toString().padStart(2, '0');
                                    const seconds = (paymentTimeLeft % 60).toString().padStart(2, '0');

                                    // Clock hand angles
                                    const secondAngle = ((60 - (paymentTimeLeft % 60)) / 60) * 360;
                                    const minuteAngle = ((30 - Math.floor(paymentTimeLeft / 60)) / 30) * 360;

                                    // Progress arc
                                    const radius = 62;
                                    const circumference = 2 * Math.PI * radius;
                                    const strokeDashoffset = circumference * (1 - progress);

                                    const accentColor = isUrgent ? "#ef4444" : "#49256a";
                                    const accentLight = isUrgent ? "#fecaca" : "#d8b4fe";
                                    const accentBg = isUrgent ? "#fef2f2" : "#faf5ff";

                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <Card className={`border shadow-lg overflow-hidden ${
                                                isUrgent
                                                    ? 'border-red-200 bg-gradient-to-br from-red-50/80 via-white to-rose-50/60'
                                                    : 'border-primary/15 bg-gradient-to-br from-primary/[0.03] via-white to-purple-50/30'
                                            }`}>
                                                <CardContent className="py-8 px-6">
                                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                                        {/* Clock Face */}
                                                        <div className="relative shrink-0">
                                                            <motion.div
                                                                animate={isUrgent ? { scale: [1, 1.03, 1] } : {}}
                                                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                                                className="relative"
                                                            >
                                                                <svg width="150" height="150" viewBox="0 0 150 150" style={{ filter: "drop-shadow(0 4px 12px rgba(73,37,106,0.15))" }}>
                                                                    {/* Outer decorative ring */}
                                                                    <circle cx="75" cy="75" r="72" fill="none" stroke={accentLight} strokeWidth="1" opacity="0.5" />

                                                                    {/* Progress track (background) */}
                                                                    <circle cx="75" cy="75" r={radius} fill="none" stroke={isUrgent ? "#fee2e2" : "#f3e8ff"} strokeWidth="6" />

                                                                    {/* Progress arc (animated) */}
                                                                    <circle
                                                                        cx="75" cy="75" r={radius}
                                                                        fill="none"
                                                                        stroke={accentColor}
                                                                        strokeWidth="6"
                                                                        strokeLinecap="round"
                                                                        strokeDasharray={circumference}
                                                                        strokeDashoffset={strokeDashoffset}
                                                                        transform="rotate(-90 75 75)"
                                                                        style={{ transition: "stroke-dashoffset 1s linear" }}
                                                                    />

                                                                    {/* Clock face background */}
                                                                    <circle cx="75" cy="75" r="55" fill="white" />
                                                                    <circle cx="75" cy="75" r="55" fill={accentBg} opacity="0.4" />

                                                                    {/* Subtle inner ring */}
                                                                    <circle cx="75" cy="75" r="54" fill="none" stroke={isUrgent ? "#fecaca" : "#e9d5ff"} strokeWidth="0.5" />

                                                                    {/* Clock tick marks — 12 major */}
                                                                    {Array.from({ length: 12 }).map((_, i) => {
                                                                        const angle = (i * 30) * (Math.PI / 180);
                                                                        const isQuarter = i % 3 === 0;
                                                                        const innerR = isQuarter ? 44 : 47;
                                                                        const outerR = 51;
                                                                        return (
                                                                            <line
                                                                                key={`major-${i}`}
                                                                                x1={75 + innerR * Math.sin(angle)}
                                                                                y1={75 - innerR * Math.cos(angle)}
                                                                                x2={75 + outerR * Math.sin(angle)}
                                                                                y2={75 - outerR * Math.cos(angle)}
                                                                                stroke={isQuarter ? accentColor : (isUrgent ? "#fca5a5" : "#c4b5d4")}
                                                                                strokeWidth={isQuarter ? "2" : "1"}
                                                                                strokeLinecap="round"
                                                                            />
                                                                        );
                                                                    })}

                                                                    {/* 60 minor tick marks */}
                                                                    {Array.from({ length: 60 }).map((_, i) => {
                                                                        if (i % 5 === 0) return null;
                                                                        const angle = (i * 6) * (Math.PI / 180);
                                                                        return (
                                                                            <line
                                                                                key={`minor-${i}`}
                                                                                x1={75 + 49 * Math.sin(angle)}
                                                                                y1={75 - 49 * Math.cos(angle)}
                                                                                x2={75 + 51 * Math.sin(angle)}
                                                                                y2={75 - 51 * Math.cos(angle)}
                                                                                stroke={isUrgent ? "#fecaca" : "#ddd0e8"}
                                                                                strokeWidth="0.5"
                                                                                strokeLinecap="round"
                                                                            />
                                                                        );
                                                                    })}

                                                                    {/* Minute hand */}
                                                                    <line
                                                                        x1="75" y1="75"
                                                                        x2="75" y2="38"
                                                                        stroke={accentColor}
                                                                        strokeWidth="2.5"
                                                                        strokeLinecap="round"
                                                                        transform={`rotate(${minuteAngle} 75 75)`}
                                                                        style={{ transition: "transform 1s linear" }}
                                                                    />

                                                                    {/* Second hand */}
                                                                    <g transform={`rotate(${secondAngle} 75 75)`} style={{ transition: "transform 0.3s cubic-bezier(0.4, 2.08, 0.55, 0.44)" }}>
                                                                        <line x1="75" y1="85" x2="75" y2="30" stroke={isUrgent ? "#ef4444" : "#7c3aed"} strokeWidth="1" strokeLinecap="round" />
                                                                        {/* Counterweight */}
                                                                        <line x1="75" y1="75" x2="75" y2="85" stroke={isUrgent ? "#ef4444" : "#7c3aed"} strokeWidth="1.5" strokeLinecap="round" />
                                                                    </g>

                                                                    {/* Center cap */}
                                                                    <circle cx="75" cy="75" r="3.5" fill={accentColor} />
                                                                    <circle cx="75" cy="75" r="1.5" fill="white" />
                                                                </svg>

                                                                {/* Digital readout beneath clock face */}
                                                                <div className="absolute bottom-[38px] left-1/2 -translate-x-1/2">
                                                                    <div className={`flex items-center gap-[2px] px-2 py-0.5 rounded-md ${
                                                                        isUrgent ? 'bg-red-100/80' : 'bg-primary/10'
                                                                    }`}>
                                                                        <span className={`text-[11px] font-bold font-mono tracking-wider ${
                                                                            isUrgent ? 'text-red-600' : 'text-primary'
                                                                        }`}>
                                                                            {minutes}
                                                                        </span>
                                                                        <motion.span
                                                                            animate={{ opacity: [1, 0, 1] }}
                                                                            transition={{ duration: 1, repeat: Infinity, ease: "steps(2)" }}
                                                                            className={`text-[11px] font-bold font-mono ${
                                                                                isUrgent ? 'text-red-600' : 'text-primary'
                                                                            }`}
                                                                        >:</motion.span>
                                                                        <span className={`text-[11px] font-bold font-mono tracking-wider ${
                                                                            isUrgent ? 'text-red-600' : 'text-primary'
                                                                        }`}>
                                                                            {seconds}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        </div>

                                                        {/* Text content */}
                                                        <div className="flex-1 space-y-3 text-center sm:text-left">
                                                            <div className="flex items-center gap-2 justify-center sm:justify-start">
                                                                {isUrgent && (
                                                                    <motion.div
                                                                        animate={{ scale: [1, 1.2, 1] }}
                                                                        transition={{ duration: 0.6, repeat: Infinity }}
                                                                    >
                                                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                                                    </motion.div>
                                                                )}
                                                                <h4 className={`font-bold text-lg font-display ${isUrgent ? 'text-red-800' : 'text-gray-900'}`}>
                                                                    {isUrgent ? 'Time is running out!' : 'Complete your payment'}
                                                                </h4>
                                                            </div>
                                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                                Transfer the funds within <span className={`font-semibold ${isUrgent ? 'text-red-700' : 'text-primary'}`}>{Math.ceil(paymentTimeLeft / 60)} minutes</span>. Your transaction will be automatically cancelled if payment is not received in time.
                                                            </p>
                                                            {/* Elegant thin progress bar */}
                                                            <div className="w-full h-1 rounded-full bg-gray-100 overflow-hidden">
                                                                <motion.div
                                                                    className={`h-full rounded-full ${isUrgent ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-primary to-purple-500'}`}
                                                                    style={{ width: `${progress * 100}%`, transition: "width 1s linear" }}
                                                                />
                                                            </div>
                                                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
                                                                {isUrgent ? 'Hurry — time almost up' : 'Payment window remaining'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })()}

                                {/* Simulate Expiry - Demo Only */}
                                <div className="flex justify-center">
                                    <motion.div
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="relative border-2 border-dashed border-red-300 bg-red-50/60 text-red-600 font-semibold hover:bg-red-100 hover:border-red-400 hover:text-red-700 px-6 py-3 rounded-xl shadow-sm gap-2"
                                            onClick={() => setPaymentTimeLeft(3)}
                                        >
                                            <motion.span
                                                animate={{ rotate: [0, 15, -15, 0] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                                className="text-lg"
                                            >
                                                ⏱️
                                            </motion.span>
                                            Simulate Expiry (Demo)
                                        </Button>
                                    </motion.div>
                                </div>

                                {/* Bank Details Card */}
                                <Card className="border-2 border-gray-100 shadow-sm overflow-hidden">
                                    <div className="h-1 bg-gradient-to-r from-primary to-purple" />

                                    {/* Header with SamisOnline branding */}
                                    <CardHeader className="pb-4 border-b">
                                        <div className="flex items-center justify-center mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                                    <span className="text-white font-bold text-sm">R</span>
                                                </div>
                                                <span className="text-lg font-bold text-gray-900 font-display">SamisOnline</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg font-bold">Pay with Bank Transfer</CardTitle>
                                            <button
                                                onClick={handleCopyAll}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Copy all details"
                                            >
                                                {copiedField === 'all' ? (
                                                    <>
                                                        <Check className="w-4 h-4 text-green-600" />
                                                        <span className="text-green-600">Copied!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-4 h-4" />
                                                        <span>Copy All</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-5 space-y-5">
                                        <div className="space-y-1">
                                            <p className="text-gray-700 text-sm leading-relaxed">
                                                Kindly make a payment of <span className="font-bold text-gray-900">GBP {totalPay.toFixed(2)}</span> to the bank account details below
                                            </p>
                                        </div>

                                        {/* Bank Detail Rows */}
                                        <div className="space-y-0 divide-y divide-gray-100 border rounded-xl overflow-hidden">
                                            {[
                                                { label: "Transaction Reference No.", value: transactionRef, key: "ref" },
                                                { label: "Account Name", value: "Funtech Global Communications Ltd.", key: "name" },
                                                { label: "Bank Name", value: "The Currency Cloud Limited", key: "bank" },
                                                { label: "Bank Account Number", value: "1018984719", key: "account" },
                                                { label: "Sort Code", value: "20-45-45", key: "sort" },
                                            ].map((item) => (
                                                <div key={item.key} className="flex items-center justify-between py-3.5 px-4 hover:bg-gray-50/50 transition-colors">
                                                    <div className="space-y-0.5 flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500 font-medium">{item.label}</p>
                                                        <p className="text-sm font-semibold text-gray-900 truncate">{item.value}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCopy(item.value, item.key)}
                                                        className="ml-3 p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                                                        title={`Copy ${item.label}`}
                                                    >
                                                        {copiedField === item.key ? (
                                                            <Check className="w-4 h-4 text-green-600" />
                                                        ) : (
                                                            <Copy className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Email Confirmation — Prominent */}
                                        <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <Mail className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Bank details sent to your email</p>
                                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                                    We've sent the bank account details to your registered email address for your reference. You can also make the payment using those details.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Navigate Away / Done */}
                                <Card className="border-2 border-gray-100 shadow-sm">
                                    <CardContent className="pt-5 pb-5 px-6 space-y-4">
                                        {!transferComplete && (
                                            <Button
                                                onClick={() => setLocation("/dashboard")}
                                                variant="outline"
                                                className="w-full h-14 text-base rounded-xl font-semibold border-2 border-gray-300 hover:border-primary/40 hover:bg-primary/5 transition-all"
                                            >
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <span>I've noted the details — take me to Dashboard</span>
                                                    <span className="text-xs font-normal text-gray-500">I'll complete the payment within 30 minutes</span>
                                                </div>
                                            </Button>
                                        )}

                                        {transferComplete && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                <Button
                                                    onClick={() => setLocation("/dashboard")}
                                                    className="w-full h-14 text-base bg-primary hover:bg-primary/90 rounded-xl font-semibold"
                                                >
                                                    Done — Go to Dashboard
                                                </Button>
                                            </motion.div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}


                    </div>
                </div>
            </div>

            {/* Session Extend Popup */}
            <AnimatePresence>
                {showExtendPopup && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4"
                        >
                            <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
                                <AlertTriangle className="w-7 h-7 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Rate Expiring Soon</h3>
                            <p className="text-sm text-gray-600">
                                Your exchange rate will expire in <span className="font-bold text-red-600">{sessionTimeLeft}</span> seconds. Would you like to extend your session?
                            </p>
                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 rounded-xl"
                                    onClick={() => {
                                        setShowExtendPopup(false);
                                        setExtendDismissed(true);
                                    }}
                                >
                                    Dismiss
                                </Button>
                                <Button
                                    className="flex-1 bg-primary hover:bg-primary/90 rounded-xl"
                                    onClick={() => {
                                        setSessionTimeLeft((prev) => prev + 120);
                                        setShowExtendPopup(false);
                                        setExtendDismissed(false);
                                    }}
                                >
                                    Extend 2 min
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Promo Confirmation Popup */}
            <AnimatePresence>
                {showConfirmation && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-green-500" />
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex flex-col items-center text-center space-y-4 pt-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                                    <Check className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Success!</h3>
                                <p className="text-gray-600 text-base">
                                    {promoApplied && useBonus
                                        ? `Promo Code and Referral Bonus ${bonusType === 'pay_less' ? 'discount' : 'credit'} have been applied to your transaction.`
                                        : promoApplied
                                            ? "Promo Code has been applied to your transaction."
                                            : useBonus
                                                ? `Referral Bonus ${bonusType === 'pay_less' ? 'discount' : 'credit'} has been applied to your transaction.`
                                                : "Transaction submitted successfully."
                                    }
                                </p>
                                <Button
                                    onClick={() => setShowConfirmation(false)}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white mt-2"
                                >
                                    OK
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Manual Bank Transfer Confirmation Popup */}
            <AnimatePresence>
                {showManualTransferConfirm && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full relative"
                        >
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                                    <Building2 className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Confirm Payment Method</h3>
                                <p className="text-sm text-gray-600">
                                    You have selected <span className="font-semibold text-gray-900">Manual Bank Transfer. Send to our local account (Pay within 30 minutes)</span> option for payment. Do you want to proceed?
                                </p>
                                <div className="flex gap-3 w-full pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 rounded-xl"
                                        onClick={() => setShowManualTransferConfirm(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1 bg-primary hover:bg-primary/90 rounded-xl font-semibold text-sm"
                                        disabled={isSubmittingTransaction}
                                        onClick={async () => {
                                            setIsSubmittingTransaction(true);
                                            // Simulate transaction submission delay
                                            await new Promise(resolve => setTimeout(resolve, 2000));
                                            setIsSubmittingTransaction(false);
                                            setShowManualTransferConfirm(false);
                                            setShowBankTransferPage(true);
                                            setPaymentTimerActive(true);
                                        }}
                                    >
                                        {isSubmittingTransaction ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Submitting Transaction...
                                            </span>
                                        ) : (
                                            "Proceed"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Transaction Expiry Popup */}
            <AnimatePresence>
                {showExpiryPopup && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full relative"
                        >
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-7 h-7 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Transaction Expired</h3>
                                <p className="text-sm text-gray-600">
                                    The payment time has expired. This transaction will now be <span className="font-semibold text-red-600">aborted</span>. You will be redirected to the dashboard in <span className="font-semibold text-gray-900">{expiryCountdown}s</span>.
                                </p>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-red-500 rounded-full"
                                        initial={{ width: "100%" }}
                                        animate={{ width: "0%" }}
                                        transition={{ duration: 5, ease: "linear" }}
                                    />
                                </div>
                                <Button
                                    className="w-full bg-red-600 hover:bg-red-700 rounded-xl font-semibold"
                                    onClick={handleExpiryRedirect}
                                >
                                    Go to Dashboard
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </DashboardLayout >
    );
}
