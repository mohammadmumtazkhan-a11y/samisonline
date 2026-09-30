import { useState } from "react";
import { Loader2, Building2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { genders } from "@/data/countries";
import PasswordInput from "./password-input";
import PhoneInput from "./phone-input";

interface BusinessStep2Props {
  email: string;
  step1Data: Record<string, string>;
  onBack: () => void;
  onOtp: (devOtp?: string) => void;
}

const mockDirectors = ["John Smith", "Jane Doe", "Michael Johnson", "Sarah Williams", "David Brown"];

export default function BusinessStep2({ email, step1Data, onBack, onOtp }: BusinessStep2Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [directorName, setDirectorName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [mobileCode, setMobileCode] = useState(step1Data.businessPhoneCode || "+44");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validatePassword = (pw: string) => {
    const errs: string[] = [];
    if (pw.length < 8) errs.push("At least 8 characters");
    if (!/[A-Z]/.test(pw)) errs.push("One uppercase letter");
    if (!/[0-9]/.test(pw)) errs.push("One number");
    if (!/[^A-Za-z0-9]/.test(pw)) errs.push("One special character");
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!directorName) newErrors.directorName = "Required";
    if (!dob) newErrors.dob = "Required";
    if (!gender) newErrors.gender = "Required";
    if (!mobileNumber) newErrors.mobileNumber = "Required";

    const pwErrors = validatePassword(password);
    if (pwErrors.length) newErrors.password = pwErrors.join(", ");
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/register", {
        ...step1Data,
        email,
        directorName,
        dateOfBirth: dob,
        gender,
        mobileCode,
        mobileNumber,
        password,
        confirmPassword,
      });
      const data = await res.json();
      toast({ title: "Registration successful", description: "Please verify your email." });
      onOtp(data.devOtp);
    } catch (err: any) {
      const msg = err.message?.includes("409")
        ? "Email already registered"
        : err.message || "Registration failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (name: string) =>
    `w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 ${
      errors[name]
        ? "border-red-400 focus:border-red-500 focus:ring-red-200"
        : "border-gray-300 focus:border-primary focus:ring-primary/20"
    }`;

  return (
    <div>
      {/* Email (disabled) + Edit link */}
      <div className="mb-4">
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

      {/* Company info banner */}
      <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg p-3 mb-5">
        <Building2 className="w-5 h-5 text-primary shrink-0" />
        <div>
          <p className="text-sm font-semibold text-black">{step1Data.businessName}</p>
          <p className="text-xs text-gray-500">Reg: {step1Data.businessRegNo}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Director */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Director <span className="text-red-500">*</span></label>
          <select value={directorName} onChange={(e) => { setDirectorName(e.target.value); setErrors(p => ({...p, directorName: ""})); }} className={fieldClass("directorName")}>
            <option value="">Select director</option>
            {mockDirectors.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {errors.directorName && <p className="text-xs text-red-500 mt-1">{errors.directorName}</p>}
        </div>

        {/* DOB + Gender */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth <span className="text-red-500">*</span></label>
            <input type="date" value={dob} onChange={(e) => { setDob(e.target.value); setErrors(p => ({...p, dob: ""})); }} className={fieldClass("dob")} />
            {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender <span className="text-red-500">*</span></label>
            <select value={gender} onChange={(e) => { setGender(e.target.value); setErrors(p => ({...p, gender: ""})); }} className={fieldClass("gender")}>
              <option value="">Select</option>
              {genders.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
          </div>
        </div>

        {/* Phone */}
        <PhoneInput
          codeValue={mobileCode}
          numberValue={mobileNumber}
          onCodeChange={setMobileCode}
          onNumberChange={(v) => { setMobileNumber(v); setErrors(p => ({...p, mobileNumber: ""})); }}
          error={errors.mobileNumber}
        />

        {/* Password */}
        <PasswordInput value={password} onChange={(v) => { setPassword(v); setErrors(p => ({...p, password: ""})); }} error={errors.password} />

        {password && (
          <div className="text-xs space-y-0.5">
            {[
              { test: password.length >= 8, label: "At least 8 characters" },
              { test: /[A-Z]/.test(password), label: "One uppercase letter" },
              { test: /[0-9]/.test(password), label: "One number" },
              { test: /[^A-Za-z0-9]/.test(password), label: "One special character" },
            ].map(({ test, label }) => (
              <p key={label} className={test ? "text-green-600" : "text-gray-400"}>
                {test ? "✓" : "○"} {label}
              </p>
            ))}
          </div>
        )}

        <PasswordInput value={confirmPassword} onChange={(v) => { setConfirmPassword(v); setErrors(p => ({...p, confirmPassword: ""})); }} label="Confirm Password" placeholder="Re-enter password" error={errors.confirmPassword} />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : "Create Business Account"}
        </button>
      </form>
    </div>
  );
}
