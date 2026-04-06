import { useState } from "react";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { countries, genders } from "@/data/countries";
import AccountTypeToggle from "./account-type-toggle";
import PasswordInput from "./password-input";
import PhoneInput from "./phone-input";

interface SignUpFormProps {
  email: string;
  onBack: () => void;
  onOtp: (devOtp?: string) => void;
  onBusinessStep2: (step1Data: Record<string, string>) => void;
}

export default function SignUpForm({ email, onBack, onOtp, onBusinessStep2 }: SignUpFormProps) {
  const [accountType, setAccountType] = useState<"individual" | "business">("individual");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Individual fields
  const [country, setCountry] = useState("GB");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [mobileCode, setMobileCode] = useState("+44");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Business fields
  const [businessName, setBusinessName] = useState("");
  const [businessRegNo, setBusinessRegNo] = useState("");
  const [businessPhoneCode, setBusinessPhoneCode] = useState("+44");
  const [businessPhoneNumber, setBusinessPhoneNumber] = useState("");

  // Auto-set dial code when country changes
  const handleCountryChange = (code: string) => {
    setCountry(code);
    const c = countries.find((co) => co.code === code);
    if (c) {
      setMobileCode(c.dialCode);
      setBusinessPhoneCode(c.dialCode);
    }
  };

  const validatePassword = (pw: string) => {
    const errs: string[] = [];
    if (pw.length < 8) errs.push("At least 8 characters");
    if (!/[A-Z]/.test(pw)) errs.push("One uppercase letter");
    if (!/[0-9]/.test(pw)) errs.push("One number");
    if (!/[^A-Za-z0-9]/.test(pw)) errs.push("One special character");
    return errs;
  };

  const handleSubmitIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!firstName) newErrors.firstName = "Required";
    if (!lastName) newErrors.lastName = "Required";
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
        email,
        accountType: "individual",
        country,
        firstName,
        middleName: middleName || undefined,
        lastName,
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

  const handleSubmitBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!businessName) newErrors.businessName = "Required";
    if (!businessRegNo) newErrors.businessRegNo = "Required";
    if (!businessPhoneNumber) newErrors.businessPhoneNumber = "Required";

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    onBusinessStep2({
      email,
      accountType: "business",
      country,
      businessName,
      businessRegNo,
      businessPhoneCode,
      businessPhoneNumber,
    });
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

      <AccountTypeToggle value={accountType} onChange={setAccountType} />

      {accountType === "individual" ? (
        <form onSubmit={handleSubmitIndividual} className="space-y-3.5">
          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Country <span className="text-red-500">*</span></label>
            <select value={country} onChange={(e) => handleCountryChange(e.target.value)} className={fieldClass("country")}>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name <span className="text-red-500">*</span></label>
              <input value={firstName} onChange={(e) => { setFirstName(e.target.value); setErrors(p => ({...p, firstName: ""})); }} placeholder="First name" className={fieldClass("firstName")} />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name <span className="text-red-500">*</span></label>
              <input value={lastName} onChange={(e) => { setLastName(e.target.value); setErrors(p => ({...p, lastName: ""})); }} placeholder="Last name" className={fieldClass("lastName")} />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
            </div>
          </div>

          {/* Middle name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Middle Name <span className="text-gray-400 text-xs">(optional)</span></label>
            <input value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Middle name" className={fieldClass("middleName")} />
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
                <option value="">Select gender</option>
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
          <PasswordInput
            value={password}
            onChange={(v) => { setPassword(v); setErrors(p => ({...p, password: ""})); }}
            error={errors.password}
          />

          {/* Password requirements hint */}
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

          {/* Confirm Password */}
          <PasswordInput
            value={confirmPassword}
            onChange={(v) => { setConfirmPassword(v); setErrors(p => ({...p, confirmPassword: ""})); }}
            label="Confirm Password"
            placeholder="Re-enter password"
            error={errors.confirmPassword}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : "Create Account"}
          </button>
        </form>
      ) : (
        /* Business Step 1 */
        <form onSubmit={handleSubmitBusiness} className="space-y-3.5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Country <span className="text-red-500">*</span></label>
            <select value={country} onChange={(e) => handleCountryChange(e.target.value)} className={fieldClass("country")}>
              {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Name <span className="text-red-500">*</span></label>
            <input value={businessName} onChange={(e) => { setBusinessName(e.target.value); setErrors(p => ({...p, businessName: ""})); }} placeholder="Company name" className={fieldClass("businessName")} />
            {errors.businessName && <p className="text-xs text-red-500 mt-1">{errors.businessName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Registration Number <span className="text-red-500">*</span></label>
            <input value={businessRegNo} onChange={(e) => { setBusinessRegNo(e.target.value); setErrors(p => ({...p, businessRegNo: ""})); }} placeholder="Business registration number" className={fieldClass("businessRegNo")} />
            {errors.businessRegNo && <p className="text-xs text-red-500 mt-1">{errors.businessRegNo}</p>}
          </div>

          <PhoneInput
            codeValue={businessPhoneCode}
            numberValue={businessPhoneNumber}
            onCodeChange={setBusinessPhoneCode}
            onNumberChange={(v) => { setBusinessPhoneNumber(v); setErrors(p => ({...p, businessPhoneNumber: ""})); }}
            label="Business Phone"
            error={errors.businessPhoneNumber}
          />

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
          >
            Continue
          </button>
        </form>
      )}
    </div>
  );
}
