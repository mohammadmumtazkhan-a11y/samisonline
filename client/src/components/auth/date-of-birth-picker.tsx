import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DateOfBirthPickerProps {
  value: string; // ISO string yyyy-MM-dd or ""
  onChange: (iso: string) => void;
  error?: string;
  fromYear?: number;
  toYear?: number;
}

export default function DateOfBirthPicker({
  value,
  onChange,
  error,
  fromYear = 1920,
  toYear = new Date().getFullYear(),
}: DateOfBirthPickerProps) {
  // DD / MM / YYYY keyboard fields
  const [dd, setDd] = useState("");
  const [mm, setMm] = useState("");
  const [yyyy, setYyyy] = useState("");

  // Calendar state
  const [open, setOpen] = useState(false);
  const [calMonth, setCalMonth] = useState<Date>(new Date(2000, 0, 1));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const mmRef = useRef<HTMLInputElement>(null);
  const yyRef = useRef<HTMLInputElement>(null);

  // Sync external value → local fields on mount / external change
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-");
      setDd(d);
      setMm(m);
      setYyyy(y);
      const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      if (!isNaN(dt.getTime())) {
        setSelectedDate(dt);
        setCalMonth(dt);
      }
    }
  }, []); // only on mount

  // Build ISO from parts and push up
  const syncIso = useCallback(
    (d: string, m: string, y: string) => {
      if (d.length === 2 && m.length === 2 && y.length === 4) {
        const day = parseInt(d, 10);
        const month = parseInt(m, 10);
        const year = parseInt(y, 10);
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= fromYear && year <= toYear) {
          const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
          onChange(iso);
          const dt = new Date(year, month - 1, day);
          setSelectedDate(dt);
          setCalMonth(dt);
          return;
        }
      }
      onChange("");
      setSelectedDate(undefined);
    },
    [onChange, fromYear, toYear]
  );

  const handleDay = (v: string) => {
    const num = v.replace(/\D/g, "").slice(0, 2);
    setDd(num);
    syncIso(num, mm, yyyy);
    if (num.length === 2) mmRef.current?.focus();
  };

  const handleMonth = (v: string) => {
    const num = v.replace(/\D/g, "").slice(0, 2);
    setMm(num);
    syncIso(dd, num, yyyy);
    if (num.length === 2) yyRef.current?.focus();
  };

  const handleYear = (v: string) => {
    const num = v.replace(/\D/g, "").slice(0, 4);
    setYyyy(num);
    syncIso(dd, mm, num);
  };

  // Calendar pick → fill keyboard fields
  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) return;
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = String(date.getFullYear());
    setDd(d);
    setMm(m);
    setYyyy(y);
    setSelectedDate(date);
    setCalMonth(date);
    onChange(`${y}-${m}-${d}`);
    setOpen(false);
  };

  // Year list for dropdown (descending)
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let i = toYear; i >= fromYear; i--) arr.push(i);
    return arr;
  }, [fromYear, toYear]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const handleMonthDropdown = (name: string) => {
    const idx = monthNames.indexOf(name);
    const d = new Date(calMonth);
    d.setMonth(idx);
    setCalMonth(d);
  };

  const handleYearDropdown = (y: string) => {
    const d = new Date(calMonth);
    d.setFullYear(parseInt(y));
    setCalMonth(d);
  };

  // Field styling — all inline-safe, no color-mix
  const inputBase: React.CSSProperties = {
    textAlign: "center",
    fontSize: "0.875rem",
    padding: "0.625rem 0.5rem",
    borderRadius: "0.5rem",
    border: "1px solid",
    borderColor: error ? "#f87171" : "#d1d5db",
    outline: "none",
    width: "100%",
    backgroundColor: "#fff",
    WebkitAppearance: "none",
    MozAppearance: "none" as any,
    appearance: "none" as any,
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Date of Birth <span className="text-red-500">*</span>
      </label>

      <div className="flex items-center gap-2">
        {/* DD / MM / YYYY keyboard inputs */}
        <div className="grid grid-cols-3 gap-2 flex-1">
          <input
            type="text"
            inputMode="numeric"
            placeholder="DD"
            maxLength={2}
            value={dd}
            onChange={(e) => handleDay(e.target.value)}
            style={inputBase}
            onFocus={(e) => { e.target.style.borderColor = "#49256a"; e.target.style.boxShadow = "0 0 0 2px rgba(73,37,106,0.15)"; }}
            onBlur={(e) => { e.target.style.borderColor = error ? "#f87171" : "#d1d5db"; e.target.style.boxShadow = "none"; }}
            aria-label="Day"
          />
          <input
            ref={mmRef}
            type="text"
            inputMode="numeric"
            placeholder="MM"
            maxLength={2}
            value={mm}
            onChange={(e) => handleMonth(e.target.value)}
            style={inputBase}
            onFocus={(e) => { e.target.style.borderColor = "#49256a"; e.target.style.boxShadow = "0 0 0 2px rgba(73,37,106,0.15)"; }}
            onBlur={(e) => { e.target.style.borderColor = error ? "#f87171" : "#d1d5db"; e.target.style.boxShadow = "none"; }}
            aria-label="Month"
          />
          <input
            ref={yyRef}
            type="text"
            inputMode="numeric"
            placeholder="YYYY"
            maxLength={4}
            value={yyyy}
            onChange={(e) => handleYear(e.target.value)}
            style={inputBase}
            onFocus={(e) => { e.target.style.borderColor = "#49256a"; e.target.style.boxShadow = "0 0 0 2px rgba(73,37,106,0.15)"; }}
            onBlur={(e) => { e.target.style.borderColor = error ? "#f87171" : "#d1d5db"; e.target.style.boxShadow = "none"; }}
            aria-label="Year"
          />
        </div>

        {/* Calendar icon → opens dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Open calendar"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "42px",
                height: "42px",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
                backgroundColor: "#fff",
                cursor: "pointer",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f3f0f7"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fff"; }}
            >
              <CalendarIcon style={{ width: "18px", height: "18px", color: "#49256a" }} />
            </button>
          </DialogTrigger>

          <DialogContent
            className="p-0 gap-0 overflow-hidden border-none rounded-2xl bg-white"
            style={{
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              width: "min(320px, 92vw)",
              maxWidth: "320px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Premium gradient header — Samis purple, all inline for Safari */}
            <div
              style={{
                background: "linear-gradient(135deg, #49256a 0%, #6b3fa0 50%, #49256a 100%)",
                padding: "1rem 1rem",
                color: "#fff",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.85 }}>
                  Select Date of Birth
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.375rem" }}>
                  <span style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.025em" }}>
                    {selectedDate ? format(selectedDate, "d") : "--"}
                  </span>
                  <span style={{ fontSize: "1rem", fontWeight: 300, opacity: 0.9 }}>
                    {selectedDate ? format(selectedDate, "MMMM yyyy") : "Pick a date"}
                  </span>
                </div>
              </div>
            </div>

            {/* Month / Year dropdowns */}
            <div style={{ padding: "0.75rem 0.5rem 0", backgroundColor: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem", gap: "0.5rem" }}>
                <Select
                  value={monthNames[calMonth.getMonth()]}
                  onValueChange={handleMonthDropdown}
                >
                  <SelectTrigger
                    className="h-8 border-none font-semibold text-xs"
                    style={{ backgroundColor: "#f3f0f7", color: "#49256a", boxShadow: "none", width: "115px", minWidth: "115px" }}
                  >
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {monthNames.map((m) => (
                        <SelectItem key={m} value={m} className="font-medium cursor-pointer text-sm">{m}</SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>

                <Select
                  value={calMonth.getFullYear().toString()}
                  onValueChange={handleYearDropdown}
                >
                  <SelectTrigger
                    className="h-8 border-none font-semibold text-xs"
                    style={{ backgroundColor: "#f3f0f7", color: "#49256a", boxShadow: "none", width: "80px", minWidth: "80px" }}
                  >
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {years.map((y) => (
                        <SelectItem key={y} value={y.toString()} className="font-medium cursor-pointer text-sm">{y}</SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleCalendarSelect}
                month={calMonth}
                onMonthChange={setCalMonth}
                disabled={(d: Date) =>
                  d > new Date() || d < new Date(`${fromYear}-01-01`)
                }
                classNames={{
                  nav: "hidden",
                  month_caption: "hidden",
                }}
                className="p-0 pointer-events-auto [--cell-size:1.75rem] text-sm"
                style={{ width: "100%" }}
              />
            </div>

            {/* Bottom padding */}
            <div style={{ height: "0.5rem", backgroundColor: "#fff" }} />
          </DialogContent>
        </Dialog>
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
