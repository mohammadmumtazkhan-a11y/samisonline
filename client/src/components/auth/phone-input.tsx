import { countries } from "@/data/countries";

interface PhoneInputProps {
  codeValue: string;
  numberValue: string;
  onCodeChange: (code: string) => void;
  onNumberChange: (number: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
}

export default function PhoneInput({
  codeValue,
  numberValue,
  onCodeChange,
  onNumberChange,
  label = "Mobile Number",
  required = true,
  error,
}: PhoneInputProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="flex gap-2">
        <select
          value={codeValue}
          onChange={(e) => onCodeChange(e.target.value)}
          className={`w-[110px] px-2 py-2.5 text-sm rounded-lg border bg-white focus:outline-none focus:ring-1 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-200"
              : "border-gray-300 focus:border-primary focus:ring-primary/20"
          }`}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.dialCode}>
              {c.dialCode} {c.code}
            </option>
          ))}
        </select>
        <input
          type="tel"
          value={numberValue}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            onNumberChange(val);
          }}
          placeholder="Phone number"
          required={required}
          className={`flex-1 px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-200"
              : "border-gray-300 focus:border-primary focus:ring-primary/20"
          }`}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
