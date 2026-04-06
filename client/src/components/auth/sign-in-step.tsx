import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import PasswordInput from "./password-input";

interface SignInStepProps {
  email: string;
  onBack: () => void;
}

export default function SignInStep({ email, onBack }: SignInStepProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await res.json();
      queryClient.setQueryData(["/api/auth/me"], { user: data.user });
      toast({ title: "Welcome back!", description: "You have signed in successfully." });
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err.message?.includes("401")
        ? "Invalid email or password"
        : err.message || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email (read-only) + Edit link */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
        <div className="flex items-center gap-2">
          <input
            type="email"
            value={email}
            disabled
            className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-500"
          />
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-primary hover:underline font-medium whitespace-nowrap"
          >
            Edit email
          </button>
        </div>
      </div>

      {/* Password */}
      <PasswordInput
        value={password}
        onChange={(v) => { setPassword(v); setError(""); }}
        error={error}
      />

      {/* Forgot password */}
      <div className="text-right">
        <button type="button" className="text-xs text-primary hover:underline">
          Forgot password?
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !password}
        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}
