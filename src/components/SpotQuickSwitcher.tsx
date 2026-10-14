import React from 'react';
import {
  UserCheck,
  CreditCard,
  Layers,
  ArrowRight,
  Car,
  Receipt,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { ParkingSpot, Language } from '../types';

interface SpotQuickSwitcherProps {
  spots: ParkingSpot[];
  activeView: 'all' | 'A' | 'B';
  onSelectView: (view: 'all' | 'A' | 'B') => void;
  onOpenSpotDetails: (spot: ParkingSpot) => void;
  onToggleEmployeeStatus: () => void;
  onOpenStaffTerminal?: () => void;
  onOpenManualDatabase: () => void;
  onStartBookingSpotB: () => void;
  lang: Language;
}

export const SpotQuickSwitcher: React.FC<SpotQuickSwitcherProps> = ({
  spots,
  activeView,
  onSelectView,
  onOpenSpotDetails,
  onToggleEmployeeStatus,
  onOpenStaffTerminal,
  onOpenManualDatabase,
  onStartBookingSpotB,
  lang,
}) => {
  const spotA = spots.find((s) => s.id === 'A') || spots[0];
  const spotB = spots.find((s) => s.id === 'B') || spots[1];

  const spotAIsAvailable = spotA?.status === 'available';
  const spotBIsAvailable = spotB?.status === 'available';
  const spotBIsUserBooking = spotB?.occupiedBy?.isUserBooking;

  return (
    <div className="mb-6">
      {/* Top Filter Buttons / Tab Pill */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>სწრაფი გადასვლა ადგილებს შორის:</span>
          </span>
        </div>

        {/* View mode toggle tabs */}
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-inner text-xs font-semibold">
          <button
            id="tab-view-all"
            onClick={() => onSelectView('all')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeView === 'all'
                ? 'bg-slate-700 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ორივე (A & B)</span>
          </button>

          <button
            id="tab-view-a"
            onClick={() => onSelectView('A')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeView === 'A'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-700/40 font-bold'
                : 'text-teal-400 hover:text-teal-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>მხოლოდ A (თანამშრომლები)</span>
          </button>

          <button
            id="tab-view-b"
            onClick={() => onSelectView('B')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeView === 'B'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/40 font-bold'
                : 'text-emerald-400 hover:text-emerald-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>მხოლოდ B (ფასიანი)</span>
          </button>
        </div>
      </div>

      {/* DEDICATED CARDS / BIG INTERACTIVE ICONS FOR SPOT A & SPOT B */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ================= SPOT A SEPARATE ICON & CONTROL CARD ================= */}
        <div
          id="quick-card-spot-a"
          className={`relative rounded-2xl p-4.5 border-2 transition-all cursor-pointer group ${
            activeView === 'A'
              ? 'bg-gradient-to-br from-teal-950/70 via-slate-900 to-slate-950 border-teal-400 ring-2 ring-teal-400/30 shadow-xl'
              : 'bg-slate-900/90 border-slate-800 hover:border-teal-500/50 shadow-md hover:bg-slate-900'
          }`}
          onClick={() => {
            onSelectView('A');
            if (spotA) {
              const el = document.getElementById(`spot-${spotA.id}`);
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
        >
          {/* Active Highlight Ribbon */}
          {activeView === 'A' && (
            <div className="absolute top-2.5 right-3 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/40">
              ფოკუსირებულია
            </div>
          )}

          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              {/* Distinctive Spot A Icon */}
              <div className="relative">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex flex-col items-center justify-center font-mono font-black text-xl shadow-lg shadow-teal-900/50 border border-teal-300/40 group-hover:scale-105 transition-transform">
                  <span>A</span>
                  <span className="text-[8px] font-sans tracking-tight opacity-90">STAFF</span>
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                    spotAIsAvailable ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  title={spotAIsAvailable ? 'თავისუფალი' : 'დაკავებული'}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-extrabold text-white tracking-tight group-hover:text-teal-300 transition-colors">
                    🅿️ A პარკინგი (თანამშრომლები)
                  </h4>
                </div>
                <p className="text-xs text-teal-400 font-medium flex items-center gap-1 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>სამსახურებრივი საშვით • უფასო დაშვება</span>
                </p>
              </div>
            </div>

            {/* Status Pill */}
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
                spotAIsAvailable
                  ? 'bg-teal-500/15 text-teal-300 border-teal-500/40'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              }`}
            >
              {spotAIsAvailable ? '🟢 თავისუფალია' : '🟡 თანამშრომელი ადგილზეა'}
            </span>
          </div>

          {/* Current Occupancy Mini Info */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">მიმდინარე მდგომარეობა:</span>
            {spotAIsAvailable ? (
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                მზადაა გასაჩერებლად
              </span>
            ) : (
              <div className="flex items-center gap-1.5 font-mono">
                <Car className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-teal-300 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {spotA?.occupiedBy?.plateNumber || 'EMP-777-GE'}
                </span>
                <span className="text-[11px] text-slate-400">
                  ({spotA?.occupiedBy?.driverName || 'თანამშრომელი'})
                </span>
              </div>
            )}
          </div>

          {/* Dedicated Quick Action Buttons for Spot A */}
          <div
            className="flex items-center gap-2 pt-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              id="quick-a-toggle-btn"
              onClick={onToggleEmployeeStatus}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-teal-900/40"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{spotAIsAvailable ? 'გაჩერება (საშვი)' : 'ადგილის გათავისუფლება'}</span>
            </button>

            <button
              id="quick-a-db-btn"
              onClick={onOpenManualDatabase}
              className="py-2 px-3 rounded-xl text-xs font-semibold text-teal-300 bg-slate-800 hover:bg-slate-700 border border-teal-500/30 transition-all flex items-center gap-1.5"
              title="თანამშრომელთა ბაზა"
            >
              <Database className="w-3.5 h-3.5" />
              <span>ბაზა</span>
            </button>

            <button
              id="quick-a-details-btn"
              onClick={() => spotA && onOpenSpotDetails(spotA)}
              className="py-2 px-2.5 rounded-xl text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:text-white transition-all"
              title="A ადგილის სრული მონაცემები"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ================= SPOT B SEPARATE ICON & CONTROL CARD ================= */}
        <div
          id="quick-card-spot-b"
          className={`relative rounded-2xl p-4.5 border-2 transition-all cursor-pointer group ${
            activeView === 'B'
              ? 'bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border-emerald-400 ring-2 ring-emerald-400/30 shadow-xl'
              : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/50 shadow-md hover:bg-slate-900'
          }`}
          onClick={() => {
            onSelectView('B');
            if (spotB) {
              const el = document.getElementById(`spot-${spotB.id}`);
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
        >
          {/* Active Highlight Ribbon */}
          {activeView === 'B' && (
            <div className="absolute top-2.5 right-3 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              ფოკუსირებულია
            </div>
          )}

          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              {/* Distinctive Spot B Icon */}
              <div className="relative">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex flex-col items-center justify-center font-mono font-black text-xl shadow-lg shadow-emerald-900/50 border border-emerald-300/40 group-hover:scale-105 transition-transform">
                  <span>B</span>
                  <span className="text-[8px] font-sans tracking-tight opacity-90">PAID</span>
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                    spotBIsAvailable
                      ? 'bg-emerald-500'
                      : spotBIsUserBooking
                      ? 'bg-indigo-500'
                      : 'bg-rose-500'
                  }`}
                  title={
                    spotBIsAvailable
                      ? 'თავისუფალი'
                      : spotBIsUserBooking
                      ? 'თქვენი ჯავშანი'
                      : 'დაკავებული'
                  }
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-extrabold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                    🅿️ B პარკინგი (ფასიანი კლიენტები)
                  </h4>
                </div>
                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>1₾/სთ • 2₾/3სთ • 5₾/24სთ • სალარო & ქვითარი</span>
                </p>
              </div>
            </div>

            {/* Status Pill */}
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
                spotBIsAvailable
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : spotBIsUserBooking
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
              }`}
            >
              {spotBIsAvailable
                ? '🟢 თავისუფალია'
                : spotBIsUserBooking
                ? '🟣 აქტიური ჯავშანი'
                : '🔴 დაკავებულია'}
            </span>
          </div>

          {/* Current Occupancy Mini Info */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">მიმდინარე მდგომარეობა:</span>
            {spotBIsAvailable ? (
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                თავისუფალია (მზადაა კლიენტისთვის)
              </span>
            ) : (
              <div className="flex items-center gap-1.5 font-mono">
                <Car className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-amber-300 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {spotB?.occupiedBy?.plateNumber || 'ავტომობილი'}
                </span>
                {spotB?.occupiedBy?.isUserBooking && (
                  <span className="text-[10px] text-indigo-300 bg-indigo-950/80 px-1 py-0.5 rounded border border-indigo-800">
                    ონლაინ
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Dedicated Quick Action Buttons for Spot B */}
          <div
            className="flex items-center gap-2 pt-1"
            onClick={(e) => e.stopPropagation()}
          >
            {onOpenStaffTerminal && (
              <button
                id="quick-b-terminal-btn"
                onClick={onOpenStaffTerminal}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-amber-900/40"
              >
                <Receipt className="w-3.5 h-3.5 text-slate-950" />
                <span>სალარო / ბილეთის გაცემა</span>
              </button>
            )}

            <button
              id="quick-b-reserve-btn"
              onClick={onStartBookingSpotB}
              disabled={!spotBIsAvailable}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                spotBIsAvailable
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>დაჯავშნა</span>
            </button>

            <button
              id="quick-b-details-btn"
              onClick={() => spotB && onOpenSpotDetails(spotB)}
              className="py-2 px-2.5 rounded-xl text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:text-white transition-all"
              title="B ადგილის სრული მონაცემები"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
