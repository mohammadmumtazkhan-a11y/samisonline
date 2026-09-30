import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
import { cn } from "@/lib/utils";
import { getQueryFn } from "@/lib/queryClient";
import { AddBeneficiaryModal } from "@/components/AddBeneficiaryModal";
import type { Beneficiary } from "@shared/schema";
import {
    NIGERIA_ACCOUNT_REGEX,
    beneficiariesForCorridor,
    beneficiaryColor,
    beneficiaryInitials,
    beneficiaryName,
    maskAccount,
    requiresNarration,
    searchBeneficiaries,
    serviceTypeForDeliveryMethod,
} from "@/lib/beneficiaries";

// Mock Data
const EXCHANGE_RATE = 2025.50; // 1 GBP = 2025.50 NGN
const FEE_PERCENTAGE = 0.01; // 1%

// Corridor for this flow (step 1 is GBP → NGN): recipients are locked to Nigeria.
const PAYOUT_CURRENCY = "NGN";
const PAYOUT_COUNTRY = "Nigeria";

/** Saved beneficiary + the display fields the recipient list renders. */
type RecipientRow = Beneficiary & { name: string; bank: string; account: string; initials: string; color: string };

const toRecipientRow = (b: Beneficiary): RecipientRow => ({
    ...b,
    name: beneficiaryName(b),
    bank: b.bankName,
    account: b.accountNumber,
    initials: beneficiaryInitials(b),
    color: beneficiaryColor(b.id),
});

type DetailErrors = Partial<Record<"firstName" | "lastName" | "otherReason" | "narration" | "bankName" | "accountNumber", string>>;

const steps = [
    { id: 1, title: "Amount" },
    { id: 2, title: "Recipient" },
    { id: 3, title: "Details" }, // Was "Bank" in screenshot, generalizing to Details
    { id: 4, title: "Summary" }, // Was "Summary"
    { id: 5, title: "Payment" }, // Was "Payment Method"
];

/**
 * Mobile: action buttons dock to the bottom of the screen (thumb-reach, respects the iPhone home bar).
 * Desktop (lg+): identical to the previous inline button row.
 */
const actionBarClass =
    "fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2.5 border-t border-gray-100 bg-white/95 backdrop-blur-md px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-10px_30px_-18px_rgba(73,37,106,0.45)] lg:static lg:z-auto lg:gap-0 lg:border-0 lg:bg-transparent lg:backdrop-blur-none lg:p-0 lg:pt-4 lg:shadow-none";
const actionBtnClass = "flex-1 h-12 lg:h-11 text-base rounded-xl";

/** One-line amount recap shown above the docked buttons on mobile only. */
function MobileActionSummary({ label, value, subLabel, subValue }: { label: string; value: string; subLabel?: string; subValue?: string }) {
    return (
        <div className="flex items-end justify-between gap-3 lg:hidden">
            <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
                <p className="text-base font-bold text-foreground truncate">{value}</p>
            </div>
            {subLabel && subValue && (
                <div className="min-w-0 text-right">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{subLabel}</p>
                    <p className="text-base font-bold text-teal truncate">{subValue}</p>
                </div>
            )}
        </div>
    );
}

export default function SendMoney() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);

    // Recipients — saved beneficiaries from the API (mock: /api/beneficiaries), limited to the
    // NGN corridor. New customers (flagged via sessionStorage after registration) don't see demo records.
    const isNewCustomer = sessionStorage.getItem("isNewCustomer") === "true";
    const beneficiariesQuery = useQuery<Beneficiary[]>({
        queryKey: ["/api/beneficiaries"],
        queryFn: getQueryFn({ on401: "throw" }) as () => Promise<Beneficiary[]>,
    });
    const [recipientSearch, setRecipientSearch] = useState("");
    const [showAddRecipient, setShowAddRecipient] = useState(false);
    const recentRecipients = useMemo(
        () =>
            beneficiariesForCorridor(beneficiariesQuery.data ?? [], PAYOUT_CURRENCY, { hideSeed: isNewCustomer }).map(toRecipientRow),
        [beneficiariesQuery.data, isNewCustomer]
    );
    const filteredRecipients = useMemo(() => searchBeneficiaries(recentRecipients, recipientSearch), [recentRecipients, recipientSearch]);

    // Form State
    const [amount, setAmount] = useState<string>("500");
    const [receiveAmount, setReceiveAmount] = useState<string>("");
    const [deliveryMethod, setDeliveryMethod] = useState("bank_deposit");
    const [promoCode, setPromoCode] = useState("");
    const [promoApplied, setPromoApplied] = useState(false);
    const [promoMessage, setPromoMessage] = useState("");
    const [promoDiscount, setPromoDiscount] = useState(0);
    const [promoLoading, setPromoLoading] = useState(false);

    const [selectedRecipient, setSelectedRecipient] = useState<RecipientRow | null>(null);
    const [recipientDetails, setRecipientDetails] = useState({
        firstName: "",
        lastName: "",
        relationship: "family",
        nickName: "",
        reason: "family_support",
        otherReason: "",
        // Banking fields (Rhemito "Banking Details" — NGN: bank name + 10-digit account)
        bankName: "",
        accountNumber: "",
        currency: PAYOUT_CURRENCY,
        country: PAYOUT_COUNTRY,
        narration: ""
    });
    const [detailErrors, setDetailErrors] = useState<DetailErrors>({});
    const isBusinessRecipient = selectedRecipient?.recipientType === "business";

    // Pick a saved beneficiary → pre-fill Details (same as Rhemito) and go to step 3.
    const selectRecipient = (r: RecipientRow) => {
        sessionStorage.removeItem("isNewCustomer");
        setSelectedRecipient(r);
        setRecipientDetails(prev => ({
            ...prev,
            firstName: r.recipientType === "business" ? r.businessName : r.firstName,
            lastName: r.recipientType === "business" ? "" : r.lastName,
            relationship: ["family", "friend", "business"].includes((r.relationship || "").toLowerCase()) ? r.relationship.toLowerCase() : prev.relationship,
            bankName: r.bankName,
            accountNumber: r.accountNumber,
            currency: r.currency,
            country: r.country,
            narration: r.narration || prev.narration,
        }));
        setDetailErrors({});
        setCurrentStep(3);
    };

    const updateDetail = (field: keyof typeof recipientDetails, value: string) => {
        setRecipientDetails(prev => ({ ...prev, [field]: value }));
        if (detailErrors[field as keyof DetailErrors]) setDetailErrors(prev => ({ ...prev, [field]: undefined }));
    };

    /** Rhemito Details rules: names, reason (+ "Other"), narration for NGN, bank name + 10-digit account. */
    const validateDetails = (): DetailErrors => {
        const d = recipientDetails;
        const errs: DetailErrors = {};
        if (!d.firstName.trim()) errs.firstName = isBusinessRecipient ? "Business name is required" : "First name is required";
        if (!isBusinessRecipient && !d.lastName.trim()) errs.lastName = "Last name is required";
        if (d.reason === "other" && !d.otherReason.trim()) errs.otherReason = "Please specify the reason";
        if (requiresNarration(d.country) && !d.narration.trim()) errs.narration = "Narration is required for Nigerian accounts";
        if (!d.bankName.trim()) errs.bankName = "Bank name is required";
        if (!d.accountNumber.trim()) errs.accountNumber = "Account number is required";
        else if (d.currency === "NGN" && !NIGERIA_ACCOUNT_REGEX.test(d.accountNumber.trim())) errs.accountNumber = "Nigerian account numbers are 10 digits";
        return errs;
    };

    const handleDetailsContinue = () => {
        const errs = validateDetails();
        setDetailErrors(errs);
        if (Object.keys(errs).length > 0) {
            toast({
                title: "Please complete the required fields",
                description: Object.values(errs)[0],
                variant: "destructive",
            });
            return;
        }
        handleNext();
    };

    const reasonLabel = recipientDetails.reason === "other"
        ? (recipientDetails.otherReason || "Other")
        : recipientDetails.reason.replace('_', ' ');
    const detailsFullName = `${recipientDetails.firstName} ${recipientDetails.lastName}`.trim() || "—";

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
            <div className="max-w-5xl mx-auto pb-44 lg:pb-10">
                {/* Header */}
                <div className="mb-5 sm:mb-6 lg:mb-4 flex items-center justify-between gap-3">
                    <h1 className="text-[22px] sm:text-2xl lg:text-[22px] font-bold max-sm:tracking-tight">Send Money</h1>
                    <div className="text-xs sm:text-sm max-sm:font-medium text-primary sm:text-muted-foreground bg-primary/10 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-full max-sm:first-letter:uppercase">step {currentStep} of 5</div>
                </div>

                {/* Stepper */}
                <div className="flex items-start sm:items-center justify-between mb-6 sm:mb-8 lg:mb-6 px-0 sm:px-4 md:px-12 relative">
                    <div className="absolute left-4 right-4 sm:left-0 sm:right-auto top-3.5 sm:top-1/2 sm:w-full h-0.5 bg-gray-200 -z-10" />
                    {steps.map((step) => (
                        <div key={step.id} className="flex flex-col items-center bg-background px-1 sm:px-2">
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-2 transition-colors ${currentStep >= step.id ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                                }`}>
                                {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                            </div>
                            <span className={`text-[11px] sm:text-xs ${currentStep >= step.id ? "text-primary font-medium" : "text-gray-400"}`}>
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
                                className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-6 w-full"
                            >
                                <div className="lg:col-span-3 space-y-6 sm:space-y-8 lg:space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-gray-500">You Send</Label>
                                        <div className="flex bg-white border rounded-lg overflow-hidden h-14 lg:h-12 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                                            <div className="flex items-center gap-2 px-3 sm:px-4 bg-gray-50 border-r min-w-[104px] sm:min-w-[120px] lg:min-w-[108px] shrink-0">
                                                <img src="https://flagcdn.com/w40/gb.png" alt="GBP" className="w-8 h-6 lg:w-6 lg:h-4 object-cover rounded shadow-sm" />
                                                <span className="font-semibold text-lg lg:text-base">GBP</span>
                                                <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                                            </div>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                aria-label="You send amount"
                                                value={amount}
                                                onChange={e => setAmount(e.target.value)}
                                                className="flex-1 min-w-0 w-0 px-4 text-xl sm:text-lg lg:text-base font-semibold sm:font-medium outline-none"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-500">They Receive</Label>
                                        <div className="flex bg-white border rounded-lg overflow-hidden h-14 lg:h-12 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                                            <div className="flex items-center gap-2 px-3 sm:px-4 bg-gray-50 border-r min-w-[104px] sm:min-w-[120px] lg:min-w-[108px] shrink-0">
                                                <img src="https://flagcdn.com/w40/ng.png" alt="NGN" className="w-8 h-6 lg:w-6 lg:h-4 object-cover rounded shadow-sm" />
                                                <span className="font-semibold text-lg lg:text-base">NGN</span>
                                                <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                                            </div>
                                            <input
                                                readOnly
                                                aria-label="They receive amount"
                                                value={receiveAmount}
                                                className="flex-1 min-w-0 w-0 px-4 text-xl sm:text-lg lg:text-base font-semibold sm:font-medium outline-none bg-gray-50 text-teal sm:text-gray-500"
                                            />
                                        </div>
                                    </div>


                                    <div className="space-y-4 lg:space-y-3">
                                        <h3 className="font-semibold text-base sm:text-lg lg:text-base">How will they receive the money?</h3>
                                        <div className="grid grid-cols-3 gap-2.5 sm:flex sm:flex-wrap sm:gap-4">
                                            {[
                                                { id: "bank_deposit", label: "Bank Deposit", icon: Landmark },
                                                { id: "mobile_money", label: "Mobile Money", icon: Smartphone },
                                                { id: "cash_pickup", label: "Cash Pickup", icon: Banknote }
                                            ].map((method) => (
                                                <div
                                                    key={method.id}
                                                    role="button"
                                                    aria-pressed={deliveryMethod === method.id}
                                                    onClick={() => setDeliveryMethod(method.id)}
                                                    className={`
                                                        flex flex-col sm:flex-row items-center justify-center text-center gap-1.5 sm:gap-2 px-2 py-3.5 sm:px-6 sm:py-3 lg:px-4 lg:py-2 rounded-2xl sm:rounded-full cursor-pointer transition-all font-medium text-[13px] max-sm:leading-tight sm:text-base lg:text-sm active:scale-[0.98]
                                                        ${deliveryMethod === method.id
                                                            ? "bg-primary/10 text-primary border border-primary/30 sm:border-primary/20 shadow-sm ring-1 ring-primary/20 sm:ring-0"
                                                            : "bg-white sm:bg-transparent text-gray-600 sm:text-gray-500 hover:bg-gray-50 border border-gray-200 sm:border-transparent"}
                                                    `}
                                                >
                                                    <method.icon className={`w-5 h-5 lg:w-4 lg:h-4 ${deliveryMethod === method.id ? "text-primary" : "text-gray-400"}`} />
                                                    {method.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-1 sm:space-y-4 lg:space-y-0.5 pt-1 pb-2 px-3 sm:px-0 sm:pb-0 sm:pt-4 lg:pt-1 lg:text-sm rounded-2xl sm:rounded-none border border-gray-100 sm:border-0 bg-white sm:bg-transparent">
                                        <div className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <div className="w-8 h-8 lg:w-7 lg:h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <Wallet className="w-4 h-4" />
                                                </div>
                                                <span>Amount Sent</span>
                                            </div>
                                            <span className="font-medium">{(parseFloat(amount) - effectiveFee).toFixed(2)} GBP</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <div className="w-8 h-8 lg:w-7 lg:h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <BarChart3 className="w-4 h-4" />
                                                </div>
                                                <span>Fee</span>
                                            </div>
                                            <span className="font-medium">{fee.toFixed(2)} GBP</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-2 bg-primary/5 px-3 sm:px-4 rounded-lg -mx-1 sm:-mx-4">
                                            <div className="flex items-center gap-3 text-gray-600 whitespace-nowrap">
                                                <div className="w-8 h-8 lg:w-7 lg:h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <ArrowRightLeft className="w-4 h-4" />
                                                </div>
                                                <span>Exchange Rate</span>
                                            </div>
                                            <span className="font-medium text-gray-900 text-right text-sm sm:text-base whitespace-nowrap">1 GBP = {EXCHANGE_RATE.toFixed(2)} NGN</span>
                                        </div>
                                    </div>

                                    <div className={actionBarClass}>
                                        <MobileActionSummary
                                            label="You send"
                                            value={`${(parseFloat(amount) || 0).toFixed(2)} GBP`}
                                            subLabel="They receive"
                                            subValue={`${parseFloat(receiveAmount || "0").toLocaleString('en-GB', { minimumFractionDigits: 2 })} NGN`}
                                        />
                                        <div className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={handleBack}
                                                className={actionBtnClass}
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                onClick={handleNext}
                                                className={`${actionBtnClass} bg-primary hover:bg-primary/90`}
                                            >
                                                Continue
                                            </Button>
                                        </div>
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
                                                    <span className="font-medium text-gray-900">1 GBP = {EXCHANGE_RATE.toFixed(2)} NGN</span>
                                                </div>

                                                <div className="pt-4 mt-4 border-t flex justify-between items-center">
                                                    <span className="text-gray-600 font-medium">They Receive</span>
                                                    <span className="font-bold text-lg text-teal">{receiveAmount} NGN</span>
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
                                className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-6 w-full"
                            >
                                {/* Left Column: Recipient Selection */}
                                <div className="lg:col-span-3 space-y-8 lg:space-y-5">
                                    <div className="space-y-5 sm:space-y-6">
                                        <Button
                                            variant="outline"
                                            onClick={handleBack}
                                            className="gap-2 h-10 sm:h-auto text-gray-600 hover:text-gray-900"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Back
                                        </Button>
                                        <h2 className="text-lg sm:text-xl lg:text-lg font-bold text-gray-900">Who are you sending to?</h2>

                                        {beneficiariesQuery.isLoading ? (
                                            /* ── Loading saved recipients ── */
                                            <div className="space-y-2" aria-busy="true" aria-label="Loading recipients">
                                                {[0, 1, 2].map(i => (
                                                    <div key={i} className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl sm:rounded-xl border border-gray-100 bg-white animate-pulse">
                                                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gray-100" />
                                                        <div className="flex-1 space-y-2">
                                                            <div className="h-3.5 w-2/5 rounded bg-gray-100" />
                                                            <div className="h-3 w-1/4 rounded bg-gray-100" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : beneficiariesQuery.isError ? (
                                            /* ── Error loading recipients ── */
                                            <div className="flex flex-col items-center text-center py-10 px-6 space-y-4 rounded-2xl border border-destructive/20 bg-destructive/5">
                                                <AlertCircle className="w-8 h-8 text-destructive" />
                                                <div className="space-y-1">
                                                    <h3 className="font-bold text-foreground">We couldn't load your recipients</h3>
                                                    <p className="text-sm text-muted-foreground">Please check your connection and try again.</p>
                                                </div>
                                                <Button variant="outline" className="h-11 sm:h-auto rounded-xl" onClick={() => beneficiariesQuery.refetch()}>
                                                    Try again
                                                </Button>
                                            </div>
                                        ) : recentRecipients.length === 0 ? (
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
                                                    onClick={() => setShowAddRecipient(true)}
                                                    data-testid="button-add-first-recipient"
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
                                                    <div className="flex gap-3 sm:gap-6 overflow-x-auto pb-3 sm:pb-4 -mx-3 px-3 sm:mx-0 sm:px-0 snap-x">
                                                        {recentRecipients.slice(0, 5).map(r => (
                                                            <div key={r.id} className="flex flex-col items-center gap-2 cursor-pointer group min-w-[72px] sm:min-w-[80px] snap-start active:scale-95 transition-transform" onClick={() => selectRecipient(r)}>
                                                                <div className={`w-14 h-14 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-bold text-lg lg:text-base ${r.color} group-hover:ring-2 ring-primary ring-offset-2 transition-all`}>
                                                                    {r.initials}
                                                                </div>
                                                                <span className="text-xs font-medium text-gray-600 text-center truncate w-full">{r.name.split(' ')[0]}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Search and New Recipient */}
                                                <div className="flex gap-2.5 sm:gap-4">
                                                    <div className="relative flex-1 min-w-0">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="search"
                                                            value={recipientSearch}
                                                            onChange={e => setRecipientSearch(e.target.value)}
                                                            aria-label="Search recipient"
                                                            placeholder="Search recipient"
                                                            className="w-full h-11 sm:h-10 pl-10 pr-4 rounded-xl sm:rounded-lg border bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                        />
                                                    </div>
                                                    <Button variant="outline" className="gap-2 h-11 sm:h-10 px-3 sm:px-4 rounded-xl sm:rounded-md whitespace-nowrap bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm" onClick={() => setShowAddRecipient(true)} data-testid="button-new-recipient">
                                                        <UserPlus className="w-4 h-4" />
                                                        <span className="hidden min-[360px]:inline">New Recipient</span><span className="min-[360px]:hidden">New</span>
                                                    </Button>
                                                </div>

                                                {/* All Recipients List */}
                                                <div className="space-y-2 sm:space-y-1">
                                                    {filteredRecipients.length === 0 && (
                                                        <p className="text-sm text-muted-foreground text-center py-6">
                                                            No recipients match "{recipientSearch}".{" "}
                                                            <button type="button" className="text-primary font-medium hover:underline" onClick={() => setShowAddRecipient(true)}>Add a new recipient</button>
                                                        </p>
                                                    )}
                                                    {filteredRecipients.map(r => (
                                                        <div
                                                            key={r.id}
                                                            role="button"
                                                            data-testid={`recipient-row-${r.id}`}
                                                            onClick={() => selectRecipient(r)}
                                                            className="flex items-center justify-between gap-3 p-3.5 sm:p-4 lg:py-3 bg-white sm:bg-transparent border border-gray-100 sm:border-0 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:shadow-none hover:bg-gray-50 active:bg-gray-50 rounded-2xl sm:rounded-xl cursor-pointer transition-colors group"
                                                        >
                                                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                                <div className={`w-11 h-11 sm:w-12 sm:h-12 lg:w-10 lg:h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${r.color} relative`}>
                                                                    {r.initials}
                                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="font-bold text-gray-900 truncate">{r.name}</div>
                                                                    <div className="text-sm text-gray-500 truncate">{r.bank}</div>
                                                                    {/* Banking detail chip (Rhemito) */}
                                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                                        <span className="inline-flex items-center text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">
                                                                            Acct: {maskAccount(r.account)}
                                                                        </span>
                                                                    </div>
                                                                    {r.narration && (
                                                                        <div className="text-xs text-gray-400 italic mt-0.5 truncate max-w-[200px] sm:max-w-[260px]">"{r.narration}"</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-right text-xs sm:text-sm shrink-0">
                                                                <div className="text-primary font-medium">{r.serviceType}</div>
                                                                <div className="text-gray-400 font-mono">{r.currency}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <Button className="w-full h-12 lg:h-10 bg-primary/10 text-primary hover:bg-primary/15 sm:bg-primary sm:hover:bg-primary/90 sm:text-white font-semibold sm:font-medium rounded-xl">
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
                                                    <span className="font-medium text-gray-900">{receiveAmount} NGN</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Transaction Fee</span>
                                                    <span className="font-medium text-gray-900">{fee.toFixed(2)} GBP</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Exchange Rate</span>
                                                    <span className="font-medium text-gray-900">1 GBP = {EXCHANGE_RATE.toFixed(2)} NGN</span>
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
                                className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-6 w-full"
                            >
                                {/* Left Column: Form Details */}
                                <div className="lg:col-span-3 space-y-8 lg:space-y-5">
                                    <Card className="rounded-2xl sm:rounded-xl">
                                        <CardHeader className="px-4 sm:px-6 lg:pt-5 lg:pb-4">
                                            <CardTitle className="text-lg lg:text-base">Recipient Details</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 px-4 sm:px-6">
                                            {isBusinessRecipient ? (
                                                <div className="space-y-2">
                                                    <Label htmlFor="rd-first-name">Business Name <span className="text-destructive">*</span></Label>
                                                    <Input
                                                        id="rd-first-name"
                                                        className="h-11 sm:h-9"
                                                        value={recipientDetails.firstName}
                                                        onChange={e => updateDetail("firstName", e.target.value)}
                                                        aria-invalid={Boolean(detailErrors.firstName)}
                                                    />
                                                    {detailErrors.firstName && <p className="text-xs text-destructive">{detailErrors.firstName}</p>}
                                                </div>
                                            ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="rd-first-name">First Name <span className="text-destructive">*</span></Label>
                                                    <Input
                                                        id="rd-first-name"
                                                        className="h-11 sm:h-9"
                                                        value={recipientDetails.firstName}
                                                        onChange={e => updateDetail("firstName", e.target.value)}
                                                        aria-invalid={Boolean(detailErrors.firstName)}
                                                    />
                                                    {detailErrors.firstName && <p className="text-xs text-destructive">{detailErrors.firstName}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="rd-last-name">Last Name <span className="text-destructive">*</span></Label>
                                                    <Input
                                                        id="rd-last-name"
                                                        className="h-11 sm:h-9"
                                                        value={recipientDetails.lastName}
                                                        onChange={e => updateDetail("lastName", e.target.value)}
                                                        aria-invalid={Boolean(detailErrors.lastName)}
                                                    />
                                                    {detailErrors.lastName && <p className="text-xs text-destructive">{detailErrors.lastName}</p>}
                                                </div>
                                            </div>
                                            )}

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Relationship</Label>
                                                    <Select value={recipientDetails.relationship} onValueChange={val => updateDetail("relationship", val)}>
                                                        <SelectTrigger className="h-11 sm:h-9 text-base sm:text-sm"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="family">Family</SelectItem>
                                                            <SelectItem value="friend">Friend</SelectItem>
                                                            <SelectItem value="business">Business Service</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="rd-nickname">Nickname (Optional)</Label>
                                                    <Input
                                                        id="rd-nickname"
                                                        className="h-11 sm:h-9"
                                                        placeholder="e.g. My Brother"
                                                        value={recipientDetails.nickName}
                                                        onChange={e => updateDetail("nickName", e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Reason for transfer <span className="text-destructive">*</span></Label>
                                                <Select value={recipientDetails.reason} onValueChange={val => updateDetail("reason", val)}>
                                                    <SelectTrigger className="h-11 sm:h-9 text-base sm:text-sm"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="family_support">Family Support</SelectItem>
                                                        <SelectItem value="education">Education</SelectItem>
                                                        <SelectItem value="bills">Bills</SelectItem>
                                                        <SelectItem value="medical">Medical Expenses</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {recipientDetails.reason === "other" && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="rd-other-reason">Please specify reason <span className="text-destructive">*</span></Label>
                                                    <Input
                                                        id="rd-other-reason"
                                                        className="h-11 sm:h-9"
                                                        placeholder="e.g. Consulting, Event sponsorship, etc."
                                                        value={recipientDetails.otherReason}
                                                        onChange={e => updateDetail("otherReason", e.target.value)}
                                                        aria-invalid={Boolean(detailErrors.otherReason)}
                                                    />
                                                    {detailErrors.otherReason && <p className="text-xs text-destructive">{detailErrors.otherReason}</p>}
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label htmlFor="rd-narration">Narration{" "}
                                                    {requiresNarration(recipientDetails.country)
                                                        ? <span className="text-destructive">*</span>
                                                        : <span className="text-muted-foreground font-normal">(Optional)</span>}
                                                </Label>
                                                <Textarea
                                                    id="rd-narration"
                                                    placeholder="e.g. Monthly allowance for February"
                                                    value={recipientDetails.narration}
                                                    onChange={e => updateDetail("narration", e.target.value)}
                                                    className="resize-none text-base sm:text-sm"
                                                    rows={3}
                                                    aria-invalid={Boolean(detailErrors.narration)}
                                                />
                                                {detailErrors.narration
                                                    ? <p className="text-xs text-destructive">{detailErrors.narration}</p>
                                                    : requiresNarration(recipientDetails.country) && <p className="text-xs text-amber-600">Narration is required for Nigerian accounts.</p>}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Banking Details — Rhemito: NGN needs bank name + 10-digit account number */}
                                    <Card className="rounded-2xl sm:rounded-xl">
                                        <CardHeader className="px-4 sm:px-6 lg:pt-5 lg:pb-4 flex flex-row items-center justify-between gap-3">
                                            <CardTitle className="text-lg lg:text-base">Banking Details</CardTitle>
                                            <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                {recipientDetails.country} · {recipientDetails.currency}
                                            </span>
                                        </CardHeader>
                                        <CardContent className="space-y-4 px-4 sm:px-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="rd-bank-name">Bank Name <span className="text-destructive">*</span></Label>
                                                <Input
                                                    id="rd-bank-name"
                                                    className="h-11 sm:h-9"
                                                    placeholder="e.g. GTBank, Access Bank"
                                                    value={recipientDetails.bankName}
                                                    onChange={e => updateDetail("bankName", e.target.value)}
                                                    aria-invalid={Boolean(detailErrors.bankName)}
                                                />
                                                {detailErrors.bankName && <p className="text-xs text-destructive">{detailErrors.bankName}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="rd-account-number">Account Number <span className="text-destructive">*</span></Label>
                                                <Input
                                                    id="rd-account-number"
                                                    className="h-11 sm:h-9 font-mono tracking-wide"
                                                    placeholder="10-digit account number"
                                                    inputMode="numeric"
                                                    maxLength={10}
                                                    value={recipientDetails.accountNumber}
                                                    onChange={e => updateDetail("accountNumber", e.target.value.replace(/\D/g, ""))}
                                                    aria-invalid={Boolean(detailErrors.accountNumber)}
                                                />
                                                {detailErrors.accountNumber && <p className="text-xs text-destructive">{detailErrors.accountNumber}</p>}
                                            </div>
                                            {selectedRecipient?.uniqueCode && (
                                                <p className="text-xs text-muted-foreground">
                                                    Saved recipient · Unique code <span className="font-mono font-semibold text-foreground">{selectedRecipient.uniqueCode}</span>
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <div className={actionBarClass}>
                                        <MobileActionSummary
                                            label="Total to pay"
                                            value={`${(parseFloat(amount || "0") + effectiveFee).toFixed(2)} GBP`}
                                            subLabel="They receive"
                                            subValue={`${parseFloat(receiveAmount || "0").toLocaleString('en-GB', { minimumFractionDigits: 2 })} NGN`}
                                        />
                                        <div className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={handleBack}
                                                className={actionBtnClass}
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                onClick={handleDetailsContinue}
                                                data-testid="button-details-continue"
                                                className={`${actionBtnClass} bg-primary hover:bg-primary/90`}
                                            >
                                                Continue
                                            </Button>
                                        </div>
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
                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-6 w-full lg:pb-10">
                                    <div className="lg:col-span-3 space-y-4 sm:space-y-6">

                                        {/* Info Banner */}
                                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                                            <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                                            <p className="text-sm text-primary/90 leading-relaxed">
                                                Please review your transaction details below. Everything looks good? Hit <strong>Confirm & Continue</strong> to proceed to payment. Need changes? Use the <strong>Back</strong> button.
                                            </p>
                                        </div>

                                        {/* Amount Section */}
                                        <Card className="shadow-sm border-border rounded-2xl sm:rounded-xl">
                                            <CardHeader className="pb-3 px-4 sm:px-6 border-b flex flex-row items-center justify-between">
                                                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Wallet className="w-3.5 h-3.5 text-primary" />
                                                    </div>
                                                    Transfer Amount
                                                </CardTitle>
                                                <button onClick={() => setCurrentStep(1)} className="text-xs text-primary hover:underline font-semibold sm:font-medium px-3 py-1.5 -mr-2 sm:p-0 sm:mr-0 rounded-full bg-primary/10 sm:bg-transparent">Edit</button>
                                            </CardHeader>
                                            <CardContent className="pt-4 px-4 sm:px-6 space-y-3 text-sm">
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
                                        <Card className="shadow-sm border-border rounded-2xl sm:rounded-xl">
                                            <CardHeader className="pb-3 px-4 sm:px-6 border-b flex flex-row items-center justify-between">
                                                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <User className="w-3.5 h-3.5 text-primary" />
                                                    </div>
                                                    Recipient Details
                                                </CardTitle>
                                                <button onClick={() => setCurrentStep(3)} className="text-xs text-primary hover:underline font-semibold sm:font-medium px-3 py-1.5 -mr-2 sm:p-0 sm:mr-0 rounded-full bg-primary/10 sm:bg-transparent">Edit</button>
                                            </CardHeader>
                                            <CardContent className="pt-4 px-4 sm:px-6 space-y-3 text-sm">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Full Name</span>
                                                    <span className="font-semibold text-foreground">
                                                        {detailsFullName}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Relationship</span>
                                                    <span className="font-semibold text-foreground capitalize">{recipientDetails.relationship.replace('_', ' ')}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Reason for Transfer</span>
                                                    <span className="font-semibold text-foreground capitalize text-right">{reasonLabel}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Bank Account</span>
                                                    <span className="font-semibold text-foreground font-mono">
                                                        {recipientDetails.accountNumber || "—"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Bank</span>
                                                    <span className="font-semibold text-foreground">
                                                        {recipientDetails.bankName || "—"}
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
                                        <div className="rounded-2xl sm:rounded-xl bg-primary/5 border border-primary/15 p-4 sm:p-5 flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-0.5">Total to Pay</p>
                                                <p className="text-xl sm:text-2xl lg:text-xl font-bold text-foreground">{totalPay.toFixed(2)} GBP</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground mb-0.5">They Receive</p>
                                                <p className="text-lg sm:text-xl lg:text-lg font-bold text-teal">{parseFloat(finalReceiveAmount).toLocaleString('en-GB', { minimumFractionDigits: 2 })} NGN</p>
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
                                        <div className={cn(actionBarClass, "lg:pt-2")}>
                                            <MobileActionSummary
                                                label="Total to pay"
                                                value={`${totalPay.toFixed(2)} GBP`}
                                                subLabel="They receive"
                                                subValue={`${parseFloat(finalReceiveAmount).toLocaleString('en-GB', { minimumFractionDigits: 2 })} NGN`}
                                            />
                                            <div className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={handleBack}
                                                className="flex-1 h-12 lg:h-11 text-base rounded-xl border-border hover:bg-muted"
                                                disabled={submittingTransaction}
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                onClick={handleSubmitTransaction}
                                                disabled={submittingTransaction}
                                                className="flex-[1.4] lg:flex-1 h-12 lg:h-11 text-base rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
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
                                className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-8 lg:gap-6 lg:pb-24"
                            >
                                {/* Left Column: Input Sections */}
                                <div className="lg:col-span-3 space-y-4 sm:space-y-6">

                                    {/* Bonus Redemption Section */}
                                    <Card className="border-green-100 bg-green-50/30 rounded-2xl sm:rounded-xl">
                                        <CardHeader className="pb-3 px-4 sm:px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                    <Wallet className="w-4 h-4" />
                                                </div>
                                                <CardTitle className="text-base text-green-800">Referral Bonus Available</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4 px-4 sm:px-6">
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

                                            <div className="pl-0 sm:pl-7 space-y-3 pt-1 sm:pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <p className="text-sm font-medium text-gray-700">How would you like to use it?</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div
                                                        onClick={() => { setUseBonus(true); setBonusType('pay_less'); }}
                                                        className={`
                                                            cursor-pointer border rounded-xl sm:rounded-lg p-3.5 sm:p-3 flex items-center gap-3 transition-all active:scale-[0.99]
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
                                                            cursor-pointer border rounded-xl sm:rounded-lg p-3.5 sm:p-3 flex items-center gap-3 transition-all active:scale-[0.99]
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
                                    <Card className="rounded-2xl sm:rounded-xl">
                                        <CardHeader className="pb-4 px-4 sm:px-6">
                                            <CardTitle className="text-base">Promo Code</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3 px-4 sm:px-6">
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
                                                    className="uppercase font-mono h-11 sm:h-9 min-w-0 max-sm:placeholder:normal-case max-sm:placeholder:font-sans"
                                                    disabled={promoLoading}
                                                />
                                                <Button
                                                    variant="outline"
                                                    className="h-11 sm:h-auto px-5 sm:px-4 shrink-0"
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
                                    <Card className="rounded-2xl sm:rounded-xl">
                                        <CardHeader className="px-4 sm:px-6 lg:pt-5 lg:pb-4">
                                            <CardTitle className="text-lg lg:text-base">How would you like to pay?</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
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
                                                    className={`p-3.5 sm:p-4 min-h-[68px] border rounded-2xl sm:rounded-xl cursor-pointer flex items-center gap-3 sm:gap-4 transition-all active:scale-[0.99] ${paymentMethod === method.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-gray-300"
                                                        }`}
                                                >
                                                    <div className={`w-11 h-11 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center border ${paymentMethod === method.id ? "text-primary border-primary bg-white" : "text-primary sm:text-gray-500 border-primary/10 sm:border-gray-200 bg-primary/5 sm:bg-white"
                                                        }`}>
                                                        <method.icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-medium">{method.title}</div>
                                                        <div className="text-xs text-muted-foreground">{method.desc}</div>
                                                    </div>
                                                    {paymentMethod === method.id
                                                        ? <div className="ml-auto text-primary shrink-0"><Check className="w-5 h-5" /></div>
                                                        : <ChevronRight className="ml-auto w-5 h-5 text-gray-300 shrink-0 sm:hidden" />}
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>


                                    <div className="mt-2 sm:mt-6 flex items-start gap-2 p-4 bg-yellow-50 rounded-2xl sm:rounded-lg text-yellow-800 text-sm">
                                        <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                                        <p>By selecting a payment option, you agree to our Terms of Use and Privacy Policy. Funds are usually delivered within minutes.</p>
                                    </div>
                                </div>

                                {/* Right Column: Amount Summary (Sticky) */}
                                <div className="lg:col-span-2">
                                    <div className="sticky top-6 space-y-6">
                                        <Card className="border-2 border-gray-200 shadow-sm rounded-2xl sm:rounded-xl">
                                            <CardHeader className="pb-4 px-4 sm:px-6 bg-gray-50/50 border-b">
                                                <CardTitle className="text-base">Amount Summary</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3 text-sm pt-4 px-4 sm:px-6">
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

                                {/* Mobile: docked amount recap (desktop keeps the sticky summary card). No Back here — same as desktop, the transaction is already submitted at this step. */}
                                <div className={`${actionBarClass} lg:hidden`}>
                                    <MobileActionSummary
                                        label="Total to pay"
                                        value={`${totalPay.toFixed(2)} GBP`}
                                        subLabel="They receive"
                                        subValue={`${parseFloat(finalReceiveAmount).toLocaleString('en-GB', { minimumFractionDigits: 2 })} NGN`}
                                    />
                                    <p className="text-[11px] text-muted-foreground text-center">Choose a payment method above to continue</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 5 — Bank Transfer Details (Inline Page) */}
                        {currentStep === 5 && showBankTransferPage && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-10"
                            >
                                {/* Back Button */}
                                <button
                                    onClick={() => { setShowBankTransferPage(false); setPaymentTimerActive(false); }}
                                    className="flex items-center gap-2 h-10 -ml-2 px-2 sm:h-auto sm:ml-0 sm:px-0 rounded-lg text-gray-600 hover:text-gray-900 transition-colors group"
                                >
                                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                                    <span className="text-sm font-medium">Back to Payment Methods</span>
                                </button>

                                {/* Status Tracker */}
                                <Card className="border-2 border-gray-100 shadow-sm overflow-hidden">
                                    <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary" />
                                    <CardContent className="pt-6 pb-5 px-3 sm:px-6">
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
                                                <CardContent className="py-6 sm:py-8 px-4 sm:px-6">
                                                    <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
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
                                        <div className="flex items-center justify-between gap-3">
                                            <CardTitle className="text-base sm:text-lg font-bold">Pay with Bank Transfer</CardTitle>
                                            <button
                                                onClick={handleCopyAll}
                                                className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 sm:bg-transparent hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
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
                                                <div key={item.key} className="flex items-center justify-between py-3 sm:py-3.5 px-3.5 sm:px-4 hover:bg-gray-50/50 transition-colors">
                                                    <div className="space-y-0.5 flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500 font-medium">{item.label}</p>
                                                        <p className="text-sm font-semibold text-gray-900 truncate">{item.value}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCopy(item.value, item.key)}
                                                        className="ml-3 w-10 h-10 sm:w-auto sm:h-auto sm:p-2 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors shrink-0"
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
                                    <CardContent className="pt-5 pb-5 px-4 sm:px-6 space-y-4">
                                        {!transferComplete && (
                                            <Button
                                                onClick={() => setLocation("/dashboard")}
                                                variant="outline"
                                                className="w-full h-auto min-h-14 py-3 sm:py-2 sm:h-14 whitespace-normal sm:whitespace-nowrap text-base rounded-xl font-semibold border-2 border-gray-300 hover:border-primary/40 hover:bg-primary/5 transition-all"
                                            >
                                                <div className="flex flex-col items-center gap-0.5 max-sm:text-center max-sm:leading-snug">
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

            {/* Add Recipient — Rhemito recipient form, locked to this corridor's country */}
            <AddBeneficiaryModal
                open={showAddRecipient}
                onOpenChange={setShowAddRecipient}
                lockedCountry={PAYOUT_COUNTRY}
                defaultServiceType={serviceTypeForDeliveryMethod(deliveryMethod)}
                onCreated={(created) => {
                    setShowAddRecipient(false);
                    setRecipientSearch("");
                    selectRecipient(toRecipientRow(created));
                }}
            />

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
