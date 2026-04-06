import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Mail, RefreshCw, Info } from "lucide-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface OtpStepProps {
  email: string;
  devOtp?: string;
  onBack: () => void;
}

export default function OtpStep({ email, devOtp, onBack }: OtpStepProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const [expirySeconds, setExpirySeconds] = useState(60 * 60); // 60 minutes
  const [resendCooldown, setResendCooldown] = useState(0);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Expiry countdown
  useEffect(() => {
    if (expirySeconds <= 0 || isVerified) return;
    const timer = setInterval(() => setExpirySeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [expirySeconds, isVerified]);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/verify-otp", { email, code });
      const data = await res.json();
      setIsVerified(true);
      queryClient.setQueryData(["/api/auth/me"], { user: data.user });
      // Mark this session as a brand-new customer so the send-money flow
      // shows the empty-recipients state instead of a pre-populated list.
      sessionStorage.setItem("isNewCustomer", "true");
      toast({ title: "Email verified!", description: "Your account is now active." });
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err: any) {
      const msg = err.message?.includes("400")
        ? "Invalid OTP code. Please try again."
        : err.message || "Verification failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      const res = await apiRequest("POST", "/api/auth/resend-otp", { email });
      const data = await res.json();
      setResendCooldown(60);
      setExpirySeconds(60 * 60);
      toast({ title: "OTP resent", description: "A new code has been sent to your email." });
    } catch {
      toast({ title: "Error", description: "Failed to resend OTP", variant: "destructive" });
    }
  };

  if (isVerified) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-black mb-1">Email Verified!</h3>
        <p className="text-sm text-gray-500">Redirecting you to Dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5">
        <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">Verification code sent</p>
          <p className="text-xs text-blue-700 mt-0.5">
            We've sent a 6-digit code to <span className="font-semibold">{email}</span>
          </p>
        </div>
      </div>

      {/* Dev tip — prototype only */}
      {devOtp && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            <span className="font-bold">Dev tip:</span> Use code <span className="font-mono font-bold">{devOtp}</span>
          </p>
        </div>
      )}

      {/* Expiry timer */}
      <div className="text-center mb-4">
        <p className="text-xs text-gray-500">
          Code expires in{" "}
          <span className={`font-mono font-bold ${expirySeconds < 300 ? "text-red-500" : "text-black"}`}>
            {formatTime(expirySeconds)}
          </span>
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        {/* OTP input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Verification Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(val);
              setError("");
            }}
            placeholder="000000"
            maxLength={6}
            className={`w-full px-4 py-3 text-center text-2xl font-mono font-bold tracking-[0.5em] rounded-lg border focus:outline-none focus:ring-1 ${
              error
                ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:border-primary focus:ring-primary/20"
            }`}
          />
          {error && <p className="text-xs text-red-500 mt-1 text-center">{error}</p>}
        </div>

        {/* Verify button */}
        <button
          type="submit"
          disabled={loading || code.length !== 6 || expirySeconds <= 0}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
          ) : (
            "Verify"
          )}
        </button>
      </form>

      {/* Resend */}
      <div className="text-center mt-4">
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="text-sm text-primary hover:underline disabled:text-gray-400 disabled:no-underline inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
        </button>
      </div>
    </div>
  );
}
