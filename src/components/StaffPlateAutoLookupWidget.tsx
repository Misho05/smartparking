import React, { useState, useMemo } from 'react';
import {
  Search,
  User,
  Car,
  Phone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  UserCheck,
  Receipt,
  X,
  History,
  Plus,
} from 'lucide-react';
import { lookupDriverByPlate, searchDrivers, DriverProfile } from '../utils/driverDirectory';
import { Language } from '../types';

interface StaffPlateAutoLookupWidgetProps {
  onOpenStaffTerminal?: (plate?: string) => void;
  onOpenGateSimulator?: (plate?: string) => void;
  onOpenReceiptScanner?: (plateOrCode?: string) => void;
  onOpenPastReceipts?: () => void;
  onOpenQuickAdd?: (plate?: string) => void;
  lang?: Language;
}

export const StaffPlateAutoLookupWidget: React.FC<StaffPlateAutoLookupWidgetProps> = ({
  onOpenStaffTerminal,
  onOpenGateSimulator,
  onOpenReceiptScanner,
  onOpenPastReceipts,
  onOpenQuickAdd,
  lang,
}) => {
  const [queryPlate, setQueryPlate] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Live lookup
  const matchedDriver = useMemo<DriverProfile | null>(() => {
    if (!queryPlate.trim() || queryPlate.trim().length < 2) return null;
    return lookupDriverByPlate(queryPlate);
  }, [queryPlate]);

  // Autocomplete suggestions
  const suggestions = useMemo<DriverProfile[]>(() => {
    if (!queryPlate.trim() || queryPlate.trim().length < 2) return [];
    return searchDrivers(queryPlate).slice(0, 4);
  }, [queryPlate]);

  const handleSelectSuggestion = (p: DriverProfile) => {
    setQueryPlate(p.plateNumber);
  };

  const sampleQuickPlates = ['GE-482-TB', 'VIP-999-GE', 'EMP-777-GE', 'AA-100-BB', 'TB-890-XX'];

  return (
    <div className="bg-gradient-to-br from-slate-900/95 via-slate-900 to-slate-950 border-2 border-teal-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-bold shadow-md">
            <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white tracking-tight">
                ნომრის ავტომატური ამოგდება & მძღოლის იდენტიფიკატორი
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 uppercase">
                AI / LIVE SEARCH
              </span>
            </div>
            <p className="text-xs text-slate-400">
              ჩაწერეთ ნომერი — სისტემა ბაზიდან <strong>მომენტალურად ამოგიგდებთ მძღოლის სახელსა და გვარს</strong>
            </p>
          </div>
        </div>

        {/* Quick Sample Plates */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500">სწრაფი ტესტი:</span>
          {sampleQuickPlates.map((plate) => (
            <button
              key={plate}
              onClick={() => setQueryPlate(plate)}
              className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-teal-300 border border-slate-800 hover:border-teal-500/50 transition-all font-bold"
            >
              {plate}
            </button>
          ))}
        </div>
      </div>

      {/* Main Input Field */}
      <div className="relative mb-4">
        <div className="relative flex items-center">
          <div className="absolute left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-teal-400" />
          </div>
          <input
            type="text"
            id="staff-plate-auto-lookup-input"
            value={queryPlate}
            onChange={(e) => setQueryPlate(e.target.value.toUpperCase())}
            onFocus={() => setIsFocused(true)}
            placeholder="შეიყვანეთ სახელმწიფო ნომერი (მაგ: GE-482-TB ან EMP-777-GE)..."
            className="w-full bg-slate-950 border-2 border-slate-700 focus:border-teal-400 rounded-2xl py-3.5 pl-12 pr-12 text-sm sm:text-base font-mono font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400/20 tracking-wider shadow-inner"
          />
          {queryPlate && (
            <button
              onClick={() => setQueryPlate('')}
              className="absolute right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* RESULT CARD: AUTOMATICALLY POPPED-UP DRIVER INFO */}
      {matchedDriver ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-950 to-slate-950 border-2 border-emerald-500/60 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold shrink-0 shadow-lg">
              <UserCheck className="w-7 h-7 text-emerald-400" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-black text-white">
                  {matchedDriver.fullName}
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 uppercase font-sans tracking-wide">
                  ✓ ავტომატურად ამოგდებულია
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-teal-300">
                  {matchedDriver.plateNumber}
                </span>
              </div>

              <div className="text-xs text-slate-300 flex items-center gap-3 mt-1.5 flex-wrap">
                {matchedDriver.phone && (
                  <span className="flex items-center gap-1 text-slate-300 font-mono">
                    <Phone className="w-3.5 h-3.5 text-teal-400" />
                    <span>{matchedDriver.phone}</span>
                  </span>
                )}
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 font-medium">
                  {matchedDriver.category === 'employee'
                    ? '🏢 თანამშრომელი (A პარკინგი • საშვი)'
                    : matchedDriver.category === 'online_booking'
                    ? '📅 ონლაინ დაჯავშნილი კლიენტი (B პარკინგი)'
                    : '💳 რეგისტრირებული კლიენტი (B პარკინგი)'}
                </span>
                {matchedDriver.notes && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 text-[11px]">{matchedDriver.notes}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Staff Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-800 flex-wrap">
            {onOpenQuickAdd && (
              <button
                onClick={() => onOpenQuickAdd(matchedDriver.plateNumber)}
                className="py-2.5 px-3.5 rounded-xl text-xs font-black bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-slate-950 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40"
                title="ამ ნომრის პარკირება (+დამატება: A ან B)"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ დამატება</span>
              </button>
            )}

            {onOpenReceiptScanner && (
              <button
                onClick={() => onOpenReceiptScanner(matchedDriver.plateNumber)}
                className="py-2.5 px-3.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-500 text-slate-950 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40"
                title="ქვითრის დასკანერება, მონაცემების ნახვა და გადახდა (ქეში / საქ / თიბისი)"
              >
                <Receipt className="w-4 h-4 text-slate-950" />
                <span>📷 ქვითარი & გადახდა</span>
              </button>
            )}

            {onOpenStaffTerminal && (
              <button
                onClick={() => onOpenStaffTerminal(matchedDriver.plateNumber)}
                className="flex-1 md:flex-initial py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-900/30"
              >
                <span>სალარო / ბილეთი</span>
              </button>
            )}

            {onOpenGateSimulator && (
              <button
                onClick={() => onOpenGateSimulator(matchedDriver.plateNumber)}
                className="py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 transition-all flex items-center gap-1.5"
                title="შლაგბაუმის ტესტი ამ ნომრით"
              >
                <Car className="w-4 h-4" />
                <span>შლაგბაუმზე ტესტი</span>
              </button>
            )}

            {onOpenPastReceipts && (
              <button
                onClick={onOpenPastReceipts}
                className="py-2.5 px-3 rounded-xl text-xs font-bold bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 transition-all flex items-center gap-1.5"
                title="გასული ქვითრები & არქივი (მაგ: გუშინდელი ქვითარი)"
              >
                <History className="w-4 h-4 text-sky-400" />
                <span>გასული ქვითრები</span>
              </button>
            )}
          </div>
        </div>
      ) : queryPlate.trim().length >= 3 ? (
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              ნომერი <strong className="text-white font-mono">{queryPlate}</strong> ბაზაში ჯერ არ ფიქსირდება.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenQuickAdd && (
              <button
                onClick={() => onOpenQuickAdd(queryPlate)}
                className="py-1.5 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-slate-950 flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ დამატება ({queryPlate})</span>
              </button>
            )}
            {onOpenStaffTerminal && (
              <button
                onClick={() => onOpenStaffTerminal(queryPlate)}
                className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>სალაროდან</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-400 flex items-center justify-between flex-wrap gap-2 pt-1">
          <span className="flex items-center gap-1 text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
            <span>როდესაც კლიენტი ჯავშნის ან რეგისტრირდება, მისი სახელი და გვარი ავტომატურად ინახება.</span>
          </span>
          <span className="text-[11px] text-teal-400/90 font-mono">
            სისტემაშია 7+ რეგისტრირებული პროფილი
          </span>
        </div>
      )}
    </div>
  );
};
