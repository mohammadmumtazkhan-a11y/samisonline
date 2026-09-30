import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface EmailStepProps {
  onRegistered: (email: string) => void;
  onNew: (email: string) => void;
  onPending: (email: string, devOtp?: string) => void;
}

export default function EmailStep({ onRegistered, onNew, onPending }: EmailStepProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/check-email", { email });
      const data = await res.json();

      if (data.registered) {
        if (data.status === "pending") {
          onPending(email);
        } else if (data.status === "active") {
          onRegistered(email);
        } else if (data.status === "blocked") {
          setError("This account has been blocked. Please contact support.");
        }
      } else {
        onNew(email);
      }
    } catch (err: any) {
      const msg = err.message || "Something went wrong";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Email Address <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="you@example.com"
            required
            className={`w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 ${
              error
                ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:border-primary focus:ring-primary/20"
            }`}
          />
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={loading || !email}
        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Checking...
          </>
        ) : (
          "Continue"
        )}
      </button>
    </form>
  );
}
