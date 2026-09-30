/**
 * DateOfBirthPicker
 *
 * Cross-browser (Chrome, Safari, Firefox, Edge) date picker combining:
 *  - DD / MM / YYYY manual keyboard entry fields
 *  - Premium calendar popup dialog with pure inline-style rendering
 *
 * No Tailwind colour utilities, no CSS variables, no color-mix() inside the
 * dialog — all colours are hard-coded rgba/hex so Safari renders them correctly.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

/* ─────────────────────────── constants ─────────────────────────── */

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const BRAND      = "#49256a";
const BRAND_DARK = "#3a1b52";
const BRAND_LITE = "#f3f0f7";
const BRAND_MID  = "#6b3fa0";

/* ─────────────────────────── helpers ───────────────────────────── */

/** Days in a given month (1-indexed month). */
function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

/** Leading-day offset (0=Sun) for the 1st of month. */
function firstDayOffset(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

/** Build calendar grid rows (padded with 0 for empty cells). */
function buildGrid(year: number, month: number): number[][] {
  const dim    = daysInMonth(year, month);
  const offset = firstDayOffset(year, month);
  const cells: number[] = [];
  for (let i = 0; i < offset; i++) cells.push(0);
  for (let d = 1; d <= dim; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(0);
  const rows: number[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

/** Is date "today" or in future / past-limit? */
function isDisabled(year: number, month: number, day: number, fromYear: number) {
  const today = new Date();
  const d = new Date(year, month - 1, day);
  return d > today || d < new Date(fromYear, 0, 1);
}

/* ─────────────────────────── component ─────────────────────────── */

interface DateOfBirthPickerProps {
  value: string;          // ISO yyyy-MM-dd or ""
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
  toYear   = new Date().getFullYear(),
}: DateOfBirthPickerProps) {

  /* ── keyboard state ── */
  const [dd,   setDd]   = useState("");
  const [mm,   setMm]   = useState("");
  const [yyyy, setYyyy] = useState("");

  /* ── calendar state ── */
  const [open,      setOpen]      = useState(false);
  const [calYear,   setCalYear]   = useState(2000);
  const [calMonth,  setCalMonth]  = useState(1);          // 1-indexed
  const [selDate,   setSelDate]   = useState<{y:number;m:number;d:number}|null>(null);
  const [hovered,   setHovered]   = useState<number>(0);  // hovered day

  const mmRef = useRef<HTMLInputElement>(null);
  const yyRef = useRef<HTMLInputElement>(null);

  /* ── year list ── */
  const years = useMemo(() => {
    const a: number[] = [];
    for (let i = toYear; i >= fromYear; i--) a.push(i);
    return a;
  }, [fromYear, toYear]);

  /* ── sync ISO value on mount ── */
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-");
      setDd(d); setMm(m); setYyyy(y);
      const yn = parseInt(y), mn = parseInt(m), dn = parseInt(d);
      setSelDate({ y: yn, m: mn, d: dn });
      setCalYear(yn); setCalMonth(mn);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── build ISO & propagate ── */
  const syncIso = useCallback((d: string, m: string, y: string) => {
    if (d.length === 2 && m.length === 2 && y.length === 4) {
      const di = parseInt(d,10), mi = parseInt(m,10), yi = parseInt(y,10);
      if (di>=1&&di<=31&&mi>=1&&mi<=12&&yi>=fromYear&&yi<=toYear) {
        onChange(`${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`);
        setSelDate({ y:yi, m:mi, d:di });
        setCalYear(yi); setCalMonth(mi);
        return;
      }
    }
    onChange(""); setSelDate(null);
  }, [onChange, fromYear, toYear]);

  /* ── keyboard handlers ── */
  const handleDay = (v: string) => {
    const n = v.replace(/\D/g,"").slice(0,2);
    setDd(n); syncIso(n,mm,yyyy);
    if (n.length===2) mmRef.current?.focus();
  };
  const handleMonth = (v: string) => {
    const n = v.replace(/\D/g,"").slice(0,2);
    setMm(n); syncIso(dd,n,yyyy);
    if (n.length===2) yyRef.current?.focus();
  };
  const handleYear = (v: string) => {
    const n = v.replace(/\D/g,"").slice(0,4);
    setYyyy(n); syncIso(dd,mm,n);
  };

  /* ── calendar pick ── */
  const pickDay = (day: number) => {
    if (!day || isDisabled(calYear, calMonth, day, fromYear)) return;
    const d = String(day).padStart(2,"0");
    const m = String(calMonth).padStart(2,"0");
    const y = String(calYear);
    setDd(d); setMm(m); setYyyy(y);
    setSelDate({ y: calYear, m: calMonth, d: day });
    onChange(`${y}-${m}-${d}`);
    setOpen(false);
  };

  /* ── nav ── */
  const prevMonth = () => {
    if (calMonth === 1) { setCalMonth(12); setCalYear(y => y-1); }
    else setCalMonth(m => m-1);
  };
  const nextMonth = () => {
    if (calMonth === 12) { setCalMonth(1); setCalYear(y => y+1); }
    else setCalMonth(m => m+1);
  };

  /* ── derived display ── */
  const grid       = buildGrid(calYear, calMonth);
  const isSelected = (d: number) =>
    !!selDate && selDate.y===calYear && selDate.m===calMonth && selDate.d===d;
  const isToday = (d: number) => {
    const t = new Date();
    return t.getFullYear()===calYear && (t.getMonth()+1)===calMonth && t.getDate()===d;
  };

  /* ── shared inline styles ── */
  const inputBase: React.CSSProperties = {
    textAlign: "center", fontSize: "0.875rem",
    padding: "0.625rem 0.5rem", borderRadius: "0.5rem",
    border: `1px solid ${error ? "#f87171" : "#d1d5db"}`,
    outline: "none", width: "100%",
    backgroundColor: "#ffffff",
    WebkitAppearance: "none",
    appearance: "none" as any,
    color: "#111827", fontFamily: "inherit",
    boxSizing: "border-box" as any,
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor  = BRAND;
    e.target.style.boxShadow    = `0 0 0 2px rgba(73,37,106,0.18)`;
  };
  const onBlur  = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = error ? "#f87171" : "#d1d5db";
    e.target.style.boxShadow   = "none";
  };

  /* ── render ── */
  return (
    <div>
      <label style={{ display:"block", fontSize:"0.875rem", fontWeight:500, color:"#374151", marginBottom:"0.375rem" }}>
        Date of Birth <span style={{ color:"#ef4444" }}>*</span>
      </label>

      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>

        {/* ── DD / MM / YYYY inputs ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1.4fr", gap:"0.5rem", flex:1 }}>
          <input
            type="text" inputMode="numeric" placeholder="DD"
            maxLength={2} value={dd}
            onChange={e => handleDay(e.target.value)}
            style={inputBase} onFocus={onFocus} onBlur={onBlur}
            aria-label="Day of birth"
          />
          <input
            ref={mmRef} type="text" inputMode="numeric" placeholder="MM"
            maxLength={2} value={mm}
            onChange={e => handleMonth(e.target.value)}
            style={inputBase} onFocus={onFocus} onBlur={onBlur}
            aria-label="Month of birth"
          />
          <input
            ref={yyRef} type="text" inputMode="numeric" placeholder="YYYY"
            maxLength={4} value={yyyy}
            onChange={e => handleYear(e.target.value)}
            style={inputBase} onFocus={onFocus} onBlur={onBlur}
            aria-label="Year of birth"
          />
        </div>

        {/* ── calendar icon button ── */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              type="button" aria-label="Open calendar picker"
              style={{
                display:"flex", alignItems:"center", justifyContent:"center",
                width:"42px", height:"42px", borderRadius:"0.5rem",
                border:`1px solid #d1d5db`, backgroundColor:"#ffffff",
                cursor:"pointer", flexShrink:0, outline:"none",
                transition:"background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = BRAND_LITE)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#ffffff")}
              onFocus={e    => (e.currentTarget.style.boxShadow = `0 0 0 2px rgba(73,37,106,0.25)`)}
              onBlur={e     => (e.currentTarget.style.boxShadow = "none")}
            >
              <CalendarIcon style={{ width:"18px", height:"18px", color: BRAND }} />
            </button>
          </DialogTrigger>

          {/* ──────────────── DIALOG ──────────────── */}
          <DialogContent
            className="p-0 gap-0 border-none rounded-2xl overflow-hidden bg-white"
            style={{
              width: "min(300px, 92vw)",
              maxWidth: "300px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px -10px rgba(0,0,0,0.3)",
            }}
          >
            {/* ── gradient header ── */}
            <div style={{
              background: `linear-gradient(135deg, ${BRAND_DARK} 0%, ${BRAND_MID} 60%, ${BRAND} 100%)`,
              padding: "0.875rem 1rem",
              color: "#ffffff",
            }}>
              <p style={{ margin:0, fontSize:"0.65rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", opacity:0.8 }}>
                Date of Birth
              </p>
              <div style={{ display:"flex", alignItems:"baseline", gap:"0.375rem", marginTop:"0.125rem" }}>
                <span style={{ fontSize:"1.6rem", fontWeight:700, lineHeight:1 }}>
                  {selDate && selDate.y===calYear && selDate.m===calMonth ? selDate.d : "—"}
                </span>
                <span style={{ fontSize:"0.95rem", fontWeight:300, opacity:0.9 }}>
                  {selDate ? `${MONTH_NAMES[calMonth-1]} ${calYear}` : "Pick a date"}
                </span>
              </div>
            </div>

            {/* ── month / year nav bar ── */}
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"0.625rem 0.75rem 0.375rem", backgroundColor:"#ffffff",
            }}>
              {/* prev */}
              <button type="button" onClick={prevMonth} aria-label="Previous month"
                style={{ ...navBtn }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = BRAND_LITE)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
              >‹</button>

              {/* month select */}
              <div style={{ display:"flex", gap:"0.375rem" }}>
                <select
                  value={calMonth}
                  onChange={e => setCalMonth(parseInt(e.target.value))}
                  style={selectStyle}
                >
                  {MONTH_NAMES.map((name, i) => (
                    <option key={name} value={i+1}>{name}</option>
                  ))}
                </select>

                {/* year select */}
                <select
                  value={calYear}
                  onChange={e => setCalYear(parseInt(e.target.value))}
                  style={selectStyle}
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* next */}
              <button type="button" onClick={nextMonth} aria-label="Next month"
                style={{ ...navBtn }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = BRAND_LITE)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
              >›</button>
            </div>

            {/* ── calendar grid ── */}
            <div style={{ padding:"0 0.75rem 0.75rem", backgroundColor:"#ffffff" }}>

              {/* day-of-week headers */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:"0.25rem" }}>
                {DAY_LABELS.map(l => (
                  <div key={l} style={{
                    textAlign:"center", fontSize:"0.65rem", fontWeight:600,
                    color:"#9ca3af", padding:"0.25rem 0",
                    userSelect:"none",
                  }}>{l}</div>
                ))}
              </div>

              {/* day cells */}
              {grid.map((row, ri) => (
                <div key={ri} style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"1px" }}>
                  {row.map((day, ci) => {
                    const disabled = !day || isDisabled(calYear, calMonth, day, fromYear);
                    const selected = day > 0 && isSelected(day);
                    const today    = day > 0 && isToday(day);
                    const hovering = day > 0 && !disabled && hovered === day;

                    let bg = "transparent";
                    let color = "#374151";
                    let fontWeight: React.CSSProperties["fontWeight"] = 400;
                    let boxShadow = "none";
                    let border = "none";

                    if (!day) {
                      bg = "transparent"; color = "transparent";
                    } else if (disabled) {
                      color = "#d1d5db";
                    } else if (selected) {
                      bg = BRAND; color = "#ffffff"; fontWeight = 700;
                      boxShadow = `0 2px 8px rgba(73,37,106,0.35)`;
                    } else if (hovering) {
                      bg = BRAND_LITE; color = BRAND; fontWeight = 600;
                    } else if (today) {
                      border = `1.5px solid ${BRAND}`;
                      color  = BRAND; fontWeight = 700;
                    }

                    return (
                      <button
                        key={ci} type="button"
                        disabled={!day || disabled}
                        onClick={() => pickDay(day)}
                        onMouseEnter={() => setHovered(day)}
                        onMouseLeave={() => setHovered(0)}
                        style={{
                          display:"flex", alignItems:"center", justifyContent:"center",
                          width:"100%", aspectRatio:"1/1",
                          borderRadius:"50%", border,
                          backgroundColor: bg, color,
                          fontWeight, fontSize:"0.78rem",
                          cursor: (!day||disabled) ? "default" : "pointer",
                          outline:"none", boxShadow,
                          fontFamily:"inherit",
                          transition:"background 0.1s, color 0.1s",
                          padding:0,
                          /* accessibility: visible focus for keyboard nav */
                        }}
                        onFocus={e => { if (!selected) e.currentTarget.style.outline = `2px solid ${BRAND}`; }}
                        onBlur={e  => { e.currentTarget.style.outline = "none"; }}
                        aria-label={day ? `${day} ${MONTH_NAMES[calMonth-1]} ${calYear}` : undefined}
                        aria-pressed={selected}
                      >
                        {day || ""}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <p style={{ fontSize:"0.75rem", color:"#ef4444", marginTop:"0.25rem", marginBottom:0 }}>
          {error}
        </p>
      )}
    </div>
  );
}

/* ─── shared micro-styles (defined outside render to avoid re-creation) ─── */

const navBtn: React.CSSProperties = {
  display:"flex", alignItems:"center", justifyContent:"center",
  width:"28px", height:"28px", borderRadius:"6px",
  border:"none", backgroundColor:"#f9fafb",
  cursor:"pointer", fontSize:"1.2rem", color:"#374151",
  outline:"none", lineHeight:1, padding:0,
  fontFamily:"inherit", transition:"background 0.15s",
};

const selectStyle: React.CSSProperties = {
  fontSize:"0.8rem", fontWeight:600, color: "#49256a",
  backgroundColor:"#f3f0f7",
  border:"none", borderRadius:"6px",
  padding:"0.25rem 0.375rem",
  cursor:"pointer", outline:"none",
  /* Safari / Firefox safe — no appearance tricks needed for <select> with plain background */
  WebkitAppearance: "none",
  MozAppearance: "none" as any,
  appearance: "none" as any,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2349256a' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 0.3rem center",
  paddingRight: "1.4rem",
  fontFamily:"inherit",
};
