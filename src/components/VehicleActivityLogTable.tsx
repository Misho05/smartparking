import React, { useState, useMemo } from 'react';
import {
  LogIn,
  LogOut,
  Car,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  CreditCard,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  FileText,
  BadgeAlert,
} from 'lucide-react';
import { VehicleActivityLog, Language } from '../types';

interface VehicleActivityLogTableProps {
  logs: VehicleActivityLog[];
  activeSpotFilter?: 'all' | 'A' | 'B';
  onFilterSpotChange?: (spot: 'all' | 'A' | 'B') => void;
  onViewReceiptForPlate?: (plate: string) => void;
  lang: Language;
}

export const VehicleActivityLogTable: React.FC<VehicleActivityLogTableProps> = ({
  logs,
  activeSpotFilter = 'all',
  onFilterSpotChange,
  onViewReceiptForPlate,
  lang,
}) => {
  const [directionFilter, setDirectionFilter] = useState<'all' | 'entry' | 'exit'>('all');
  const [spotFilter, setSpotFilter] = useState<'all' | 'A' | 'B'>(activeSpotFilter);
  const [searchQuery, setSearchQuery] = useState('');

  // Keep internal spotFilter synchronized if parent changes it
  React.useEffect(() => {
    setSpotFilter(activeSpotFilter);
  }, [activeSpotFilter]);

  const handleSpotChange = (val: 'all' | 'A' | 'B') => {
    setSpotFilter(val);
    onFilterSpotChange?.(val);
  };

  // Filtered list
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Spot filter
      if (spotFilter !== 'all' && log.spotId !== spotFilter) {
        return false;
      }
      // Direction filter
      if (directionFilter !== 'all' && log.direction !== directionFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesPlate = log.plateNumber.toLowerCase().includes(query);
        const matchesDriver = log.driverName?.toLowerCase().includes(query);
        const matchesNotes = log.notes?.toLowerCase().includes(query);
        if (!matchesPlate && !matchesDriver && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [logs, spotFilter, directionFilter, searchQuery]);

  // Statistics counts
  const totalEntries = logs.filter((l) => l.direction === 'entry').length;
  const totalExits = logs.filter((l) => l.direction === 'exit').length;
  const spotAEntries = logs.filter((l) => l.spotId === 'A' && l.direction === 'entry').length;
  const spotAExits = logs.filter((l) => l.spotId === 'A' && l.direction === 'exit').length;
  const spotBEntries = logs.filter((l) => l.spotId === 'B' && l.direction === 'entry').length;
  const spotBExits = logs.filter((l) => l.spotId === 'B' && l.direction === 'exit').length;

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }) + ' (' +
        d.toLocaleDateString('ka-GE', { month: 'short', day: 'numeric' }) + ')';
    } catch {
      return isoString;
    }
  };

  return (
    <div id="vehicle-activity-log-section" className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Header and Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              📋
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>შემოსული და გასული მანქანების რეესტრი</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  სულ: {logs.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                A და B პარკინგის მოძრაობის სრული ჟურნალი • ფერებითა და აიქონებით გამიჯნული
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Entries Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <LogIn className="w-3.5 h-3.5 text-emerald-400" />
            <span>შემოსული: {totalEntries}</span>
          </div>

          {/* Exits Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-bold">
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>გასული: {totalExits}</span>
          </div>

          {/* Spot A / B stats mini */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono">
            <span className="text-teal-400 font-bold">A: {spotAEntries}↓ / {spotAExits}↑</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold">B: {spotBEntries}↓ / {spotBExits}↑</span>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Spot Filter Buttons (All, Spot A, Spot B) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => handleSpotChange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              spotFilter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ყველა (A & B)
          </button>

          <button
            onClick={() => handleSpotChange('A')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              spotFilter === 'A'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-700/30'
                : 'text-teal-400 hover:text-teal-200'
            }`}
          >
            <div className="w-4 h-4 rounded bg-teal-400 text-slate-950 text-[10px] font-black flex items-center justify-center font-mono">
              A
            </div>
            <span>A პარკინგი (თანამშრომელი)</span>
          </button>

          <button
            onClick={() => handleSpotChange('B')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              spotFilter === 'B'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                : 'text-emerald-400 hover:text-emerald-200'
            }`}
          >
            <div className="w-4 h-4 rounded bg-emerald-400 text-slate-950 text-[10px] font-black flex items-center justify-center font-mono">
              B
            </div>
            <span>B პარკინგი (ფასიანი)</span>
          </button>
        </div>

        {/* Direction Filter Buttons (All, Entry Only, Exit Only) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setDirectionFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              directionFilter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ყველა
          </button>

          <button
            onClick={() => setDirectionFilter('entry')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              directionFilter === 'entry'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                : 'text-emerald-400 hover:text-emerald-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>მხოლოდ შემოსული</span>
          </button>

          <button
            onClick={() => setDirectionFilter('exit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              directionFilter === 'exit'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-700/30'
                : 'text-rose-400 hover:text-rose-200'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>მხოლოდ გასული</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ძებნა ნომრით ან მძღოლით..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* THE LOG ITEMS LIST */}
      <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-500 text-xs">
            მითითებული ფილტრით ჩანაწერები არ მოიძებნა.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isEntry = log.direction === 'entry';
            const isSpotA = log.spotId === 'A';

            return (
              <div
                key={log.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isEntry
                    ? 'bg-gradient-to-r from-emerald-950/30 via-slate-950 to-slate-950 border-emerald-500/40 hover:border-emerald-400'
                    : 'bg-gradient-to-r from-rose-950/30 via-slate-950 to-slate-950 border-rose-500/30 hover:border-rose-400'
                }`}
              >
                {/* Left: Direction Icon + Plate + Spot Badge */}
                <div className="flex items-center gap-3">
                  {/* Distinctive Direction Icon Badge */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-md ${
                      isEntry
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-950/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-rose-950/40'
                    }`}
                    title={isEntry ? 'შემოსული მანქანა (პარკირებულია)' : 'გასული მანქანა (დატოვა პარკინგი)'}
                  >
                    {isEntry ? (
                      <LogIn className="w-5 h-5 animate-pulse" />
                    ) : (
                      <LogOut className="w-5 h-5" />
                    )}
                  </div>

                  {/* Plate Number & Direction Tag */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Georgian Plate Style */}
                      <span className="font-mono font-black text-sm tracking-wide px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-white shadow-inner">
                        {log.plateNumber}
                      </span>

                      {/* Direction Tag with Color */}
                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1 ${
                          isEntry
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isEntry ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        />
                        <span>{isEntry ? '🟢 შემოსული' : '🔴 გასული'}</span>
                      </span>

                      {/* Spot Badge (A or B) */}
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border font-mono flex items-center gap-1 ${
                          isSpotA
                            ? 'bg-teal-500/15 text-teal-300 border-teal-500/40'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        <span>🅿️ {log.spotId}</span>
                        <span className="text-[10px] font-sans">
                          ({isSpotA ? 'თანამშრომელი' : 'ფასიანი'})
                        </span>
                      </span>
                    </div>

                    {/* Driver details & description */}
                    <div className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                      {log.driverName && (
                        <span className="font-semibold text-slate-200">
                          {log.driverName}
                        </span>
                      )}
                      {log.notes && (
                        <span className="text-slate-400 text-[11px]">
                          • {log.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Time, Duration & Payment */}
                <div className="sm:text-right shrink-0 space-y-1 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="text-xs text-slate-300 flex sm:justify-end items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatTime(log.timestamp)}</span>
                  </div>

                  {/* For Exits: Duration and Payment details */}
                  {!isEntry && (
                    <div className="flex sm:justify-end items-center gap-2 text-xs flex-wrap">
                      {log.durationFormatted && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
                          ⏱️ {log.durationFormatted}
                        </span>
                      )}
                      {typeof log.amountPaid === 'number' && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                          {log.amountPaid.toFixed(2)} ₾
                        </span>
                      )}
                      {log.paymentMethod && (
                        <span className="text-[10px] text-slate-400">
                          ({log.paymentMethod})
                        </span>
                      )}
                      {onViewReceiptForPlate && (
                        <button
                          type="button"
                          onClick={() => onViewReceiptForPlate(log.plateNumber)}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 transition-colors flex items-center gap-1 shadow-sm ml-1"
                          title="გასული ქვითრის ნახვა & ბეჭდვა"
                        >
                          <FileText className="w-3 h-3 text-sky-400" />
                          <span>ქვითარი</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* For Entries: Status reminder */}
                  {isEntry && (
                    <div className="text-[11px] text-emerald-400 font-medium flex sm:justify-end items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>პარკირებულია</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
