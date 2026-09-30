import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface CurrencyOption {
  code: string;
  flag: string;
  name: string;
  country: string;
}

export const allCurrencies: CurrencyOption[] = [
  { code: "GBP", flag: "https://flagcdn.com/w40/gb.png", name: "British Pound", country: "UK" },
  { code: "NGN", flag: "https://flagcdn.com/w40/ng.png", name: "Nigerian Naira", country: "Nigeria" },
  { code: "USD", flag: "https://flagcdn.com/w40/us.png", name: "US Dollar", country: "USA" },
  { code: "EUR", flag: "https://flagcdn.com/w40/eu.png", name: "Euro", country: "Europe" },
  { code: "GHS", flag: "https://flagcdn.com/w40/gh.png", name: "Ghanaian Cedi", country: "Ghana" },
  { code: "KES", flag: "https://flagcdn.com/w40/ke.png", name: "Kenyan Shilling", country: "Kenya" },
  { code: "ZAR", flag: "https://flagcdn.com/w40/za.png", name: "South African Rand", country: "South Africa" },
  { code: "CAD", flag: "https://flagcdn.com/w40/ca.png", name: "Canadian Dollar", country: "Canada" },
  { code: "AUD", flag: "https://flagcdn.com/w40/au.png", name: "Australian Dollar", country: "Australia" },
  { code: "INR", flag: "https://flagcdn.com/w40/in.png", name: "Indian Rupee", country: "India" },
  { code: "AED", flag: "https://flagcdn.com/w40/ae.png", name: "UAE Dirham", country: "UAE" },
  { code: "CNY", flag: "https://flagcdn.com/w40/cn.png", name: "Chinese Yuan", country: "China" },
  { code: "JPY", flag: "https://flagcdn.com/w40/jp.png", name: "Japanese Yen", country: "Japan" },
];

interface CurrencyPickerProps {
  value: string;
  onChange: (code: string) => void;
  exclude?: string;
}

export default function CurrencyPicker({ value, onChange, exclude }: CurrencyPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [dropdownWidth, setDropdownWidth] = useState("100%");
  const [dropdownLeft, setDropdownLeft] = useState("0px");

  const selected = allCurrencies.find((c) => c.code === value);

  const filtered = allCurrencies.filter((c) => {
    if (c.code === exclude) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)
    );
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Match dropdown width to the input row (the direct parent with border)
  useEffect(() => {
    if (open && ref.current) {
      // The input row is the parent div with class "flex items-center border"
      const inputRow = ref.current.closest(".flex.items-center.border") as HTMLElement;
      if (inputRow) {
        const rowRect = inputRow.getBoundingClientRect();
        const pickerRect = ref.current.getBoundingClientRect();
        setDropdownWidth(`${rowRect.width}px`);
        setDropdownLeft(`${rowRect.left - pickerRect.left}px`);
      }
    }
  }, [open]);

  // Focus search when opening
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-r border-gray-200 hover:bg-gray-100 transition-colors shrink-0 min-w-[110px] rounded-l-lg"
      >
        <img
          src={selected?.flag}
          alt={selected?.code}
          className="w-6 h-4 object-cover rounded-sm shadow-sm"
        />
        <span className="text-sm font-semibold text-black">{selected?.code}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden"
            style={{ width: dropdownWidth, left: dropdownLeft }}
          >
            {/* Search */}
            <div className="p-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-black placeholder:text-gray-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Currency list */}
            <div className="max-h-[280px] overflow-y-auto">
              {filtered.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-6">No currencies found</p>
              )}
              {filtered.map((currency) => {
                const isSelected = currency.code === value;
                return (
                  <button
                    key={currency.code}
                    type="button"
                    onClick={() => {
                      onChange(currency.code);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "bg-primary/5"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <img
                      src={currency.flag}
                      alt={currency.country}
                      className="w-8 h-5 object-cover rounded-sm shadow-sm shrink-0"
                    />
                    <span className="flex-1 text-sm text-black font-medium">
                      {currency.country}
                    </span>
                    <span className="text-sm text-gray-500 font-medium">
                      {currency.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
