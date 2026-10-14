import React from 'react';
import {
  Car,
  CreditCard,
  UserCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Camera,
  Info,
  BadgeAlert,
  Compass,
  Database,
  Tag,
  Clock,
  Receipt,
  ScanLine,
  LogIn,
  LogOut,
  Plus,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { ParkingSpot, Language, VehicleActivityLog } from '../types';
import { translations } from '../utils/translations';
import { usePricingConfig } from '../utils/pricing';
import { SpotQuickSwitcher } from './SpotQuickSwitcher';

interface ParkingMapProps {
  spots: ParkingSpot[];
  selectedSpotId: string | null;
  activeView?: 'all' | 'A' | 'B';
  onSelectView?: (view: 'all' | 'A' | 'B') => void;
  onSelectSpot: (spot: ParkingSpot) => void;
  onStartBooking: (spot: ParkingSpot) => void;
  onToggleEmployeeStatus: () => void;
  onOpenGateSimulator: () => void;
  onOpenManualDatabase: () => void;
  onOpenCustomerDatabase?: () => void;
  onOpenAdminPanel?: () => void;
  onOpenStaffTerminal?: () => void;
  onOpenQuickAdd?: (spotId?: 'A' | 'B') => void;
  vehicleLogs?: VehicleActivityLog[];
  lang: Language;
}

export const ParkingMap: React.FC<ParkingMapProps> = ({
  spots,
  selectedSpotId,
  activeView = 'all',
  onSelectView,
  onSelectSpot,
  onStartBooking,
  onToggleEmployeeStatus,
  onOpenGateSimulator,
  onOpenManualDatabase,
  onOpenCustomerDatabase,
  onOpenAdminPanel,
  onOpenStaffTerminal,
  onOpenQuickAdd,
  vehicleLogs = [],
  lang,
}) => {
  const t = translations[lang];
  const { tiers: pricingTiers } = usePricingConfig();

  // Spot A is Employee Spot, Spot B is Paid Spot
  const employeeSpot = spots.find((s) => s.id === 'A') || spots.find((s) => s.type === 'employee') || spots[0];
  const paidSpot = spots.find((s) => s.id === 'B') || spots.find((s) => s.type === 'paid') || spots[1];

  const spotALogs = vehicleLogs.filter((l) => l.spotId === 'A');
  const spotBLogs = vehicleLogs.filter((l) => l.spotId === 'B');

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2">
      {/* Top Banner Notice: 2 Dedicated Spots (A & B) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0 font-mono font-black text-sm">
            2🅿️
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
              <span>საპარკინგე სისტემა (სულ 2 ადგილი)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
                A: თანამშრომლების
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                B: ფასიანი პარკინგი
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              ადგილზე თანამშრომლის სალარო & ქვითრები • ANPR კამერის ამოცნობა • 1₾/სთ, 2₾/3სთ, 5₾/24სთ
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onOpenQuickAdd && (
            <button
              id="top-banner-quick-add-btn"
              onClick={() => onOpenQuickAdd()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 hover:from-teal-300 hover:to-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
              title="ავტომობილის სწრაფი დამატება (A ან B პარკინგი)"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ დამატება</span>
            </button>
          )}

          {onOpenStaffTerminal && (
            <button
              id="top-banner-staff-terminal-btn"
              onClick={onOpenStaffTerminal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 transition-all shadow-sm"
            >
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>ადგილზე სალარო & ქვითრები</span>
            </button>
          )}

          <button
            id="open-employee-db-btn"
            onClick={onOpenManualDatabase}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-teal-950/60 hover:bg-teal-900/60 text-teal-300 border border-teal-500/30 transition-all hover:border-teal-400 shadow-sm"
            title="თანამშრომელთა ბაზა (A ადგილი & გასვლა-მოსვლა)"
          >
            <UserCheck className="w-4 h-4 text-teal-400" />
            <span>თანამშრომელთა ბაზა</span>
          </button>

          {onOpenCustomerDatabase && (
            <button
              id="open-customer-db-btn"
              onClick={onOpenCustomerDatabase}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 transition-all hover:border-emerald-400 shadow-sm"
              title="მომხმარებელთა ბაზა (B ადგილი, ბილეთები & ონლაინ)"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>მომხმარებელთა ბაზა</span>
            </button>
          )}

          {onOpenAdminPanel && (
            <button
              id="banner-open-admin-panel-btn"
              onClick={onOpenAdminPanel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/40 transition-all hover:border-indigo-400 shadow-sm"
              title="ადმინ პანელი: მომხმარებელთა კორექტირება & წაშლა, ტარიფები"
            >
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <span>ადმინ პანელი</span>
            </button>
          )}

          <button
            id="quick-open-gate-simulator-btn"
            onClick={onOpenGateSimulator}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md shadow-teal-900/30 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>ANPR კამერა</span>
          </button>
        </div>
      </div>

      {/* DEDICATED SPOT A & B QUICK SWITCHER COMPONENT */}
      <SpotQuickSwitcher
        spots={spots}
        activeView={activeView}
        onSelectView={onSelectView || (() => {})}
        onOpenSpotDetails={onSelectSpot}
        onToggleEmployeeStatus={onToggleEmployeeStatus}
        onOpenStaffTerminal={onOpenStaffTerminal}
        onOpenManualDatabase={onOpenManualDatabase}
        onStartBookingSpotB={() => paidSpot && onStartBooking(paidSpot)}
        lang={lang}
      />

      {/* Main Visual Parking Arena */}
      <div className="bg-slate-950 border border-slate-800/90 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Asphalt pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        {/* Entrance Gate Header & Signage */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5 text-cyan-300 bg-cyan-950/40 border border-cyan-800/60 px-3.5 py-1.5 rounded-xl text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>შესასვლელი შლაგბაუმი • ANPR კამერა (ავტო-დახარისხება)</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-xs font-mono bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>ნომრის ავტომატური შეყვანა & შედარება ბაზასთან</span>
          </div>

          <div className="flex items-center gap-2 text-rose-400 bg-rose-950/40 border border-rose-800/60 px-3.5 py-1.5 rounded-xl text-xs font-bold">
            <span>გასასვლელი ➔</span>
          </div>
        </div>

        {/* ROADWAY APPROACH LANE */}
        <div className="relative z-10 mb-6 py-3 px-5 bg-slate-900/80 border-y-2 border-dashed border-amber-500/40 rounded-xl flex items-center justify-between select-none">
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-amber-400">
            <ArrowRight className="w-4 h-4 animate-pulse" />
            <span>
              {activeView === 'A'
                ? 'ფოკუსირებულია: A პარკინგი (თანამშრომლები)'
                : activeView === 'B'
                ? 'ფოკუსირებულია: B პარკინგი (ფასიანი კლიენტები)'
                : 'მიმართულება ➔ A პარკინგი (მარცხნივ) | B პარკინგი (მარჯვნივ)'}
            </span>
          </div>
          <div className="font-mono text-xs text-slate-500 tracking-widest hidden sm:block">
            --- 🚗 2-SPOT DEDICATED PARKING ---
          </div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-amber-400">
            {activeView !== 'all' && (
              <button
                onClick={() => onSelectView?.('all')}
                className="text-[11px] underline text-teal-400 hover:text-teal-300 font-sans"
              >
                ორივეს ჩვენება
              </button>
            )}
            <ArrowRight className="w-4 h-4 animate-pulse" />
          </div>
        </div>

        {/* THE PARKING BAYS (BASED ON ACTIVE VIEW) */}
        <div
          className={`relative z-10 ${
            activeView === 'all'
              ? 'grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8'
              : 'max-w-2xl mx-auto'
          }`}
        >
          {/* SPOT A: EMPLOYEE SPOT */}
          {(activeView === 'all' || activeView === 'A') && employeeSpot && (
            <div className="space-y-3">
              {activeView === 'A' && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-teal-950/60 border border-teal-800 text-xs text-teal-300 font-semibold">
                  <span>🏢 A პარკინგის დეტალური ხედი (თანამშრომელი)</span>
                  <button
                    onClick={() => onSelectView?.('B')}
                    className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>გადასვლა B პარკინგზე</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
              {renderEmployeeSpotCard(employeeSpot)}
            </div>
          )}

          {/* SPOT B: PAID CUSTOMER SPOT */}
          {(activeView === 'all' || activeView === 'B') && paidSpot && (
            <div className="space-y-3">
              {activeView === 'B' && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 font-semibold">
                  <span>💳 B პარკინგის დეტალური ხედი (ფასიანი კლიენტი)</span>
                  <button
                    onClick={() => onSelectView?.('A')}
                    className="text-teal-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>გადასვლა A პარკინგზე</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
              {renderPaidSpotCard(paidSpot)}
            </div>
          )}
        </div>

        {/* Bottom System Legend */}
        <div className="relative z-10 mt-8 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              <span>თავისუფალი (B პარკინგი)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
              <span>თანამშრომლის ადგილი (A პარკინგი)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>დაკავებული</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
              <span>თქვენი ჯავშანი</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>ტარიფი: 1 სთ = 1.00 ₾ | 3 სთ = 2.00 ₾ | 24 სთ = 5.00 ₾</span>
          </div>
        </div>
      </div>
    </div>
  );

  // RENDER SPOT A: EMPLOYEE SPOT
  function renderEmployeeSpotCard(spot: ParkingSpot) {
    const isSelected = selectedSpotId === spot.id;
    const isAvailable = spot.status === 'available';

    return (
      <div
        id={`spot-${spot.id}`}
        className={`group relative rounded-3xl p-6 border-2 transition-all duration-300 flex flex-col justify-between ${
          isSelected ? 'ring-2 ring-teal-400 ring-offset-4 ring-offset-slate-950' : ''
        } ${
          isAvailable
            ? 'bg-gradient-to-b from-teal-950/40 via-slate-900 to-slate-950 border-teal-500/60 shadow-xl'
            : 'bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950 border-slate-800 shadow-md'
        }`}
      >
        {/* Stall Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono font-black border border-teal-500/40 bg-teal-500/10 text-teal-400 shadow-lg">
              <span className="text-xl leading-none">{spot.id}</span>
              <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5 text-teal-400/80">პარკინგი</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  A პარკინგი (თანამშრომლების)
                </h3>
              </div>
              <p className="text-xs text-teal-400 flex items-center gap-1.5 mt-0.5 font-medium">
                <UserCheck className="w-3.5 h-3.5" />
                <span>მხოლოდ პერსონალისთვის • უფასო საშვი</span>
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 border ${
              isAvailable
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-teal-400' : 'bg-amber-400'}`} />
            {isAvailable ? 'თავისუფალი (საშვით)' : 'თანამშრომელი ადგილზეა'}
          </span>
        </div>

        {/* Stall Center Visualization */}
        <div className="my-6 p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 relative overflow-hidden flex flex-col items-center justify-center min-h-[160px]">
          {/* Parking Stall Boundary Lines */}
          <div className="absolute inset-y-2 left-4 w-1 bg-teal-500/50 rounded-full" />
          <div className="absolute inset-y-2 right-4 w-1 bg-teal-500/50 rounded-full" />
          <div className="absolute top-2 inset-x-4 h-1 bg-teal-500/30 rounded-full" />

          {isAvailable ? (
            <div className="flex flex-col items-center text-center gap-2 z-10">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-inner">
                <UserCheck className="w-7 h-7" />
              </div>
              <div>
                <span className="text-sm font-bold text-teal-300 block">
                  A ადგილი მზადაა თანამშრომლისთვის
                </span>
                <span className="text-xs text-slate-400">
                  კამერა ავტომატურად ამოიცნობს ნომერს და გახსნის შლაგბაუმს
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-2 z-10">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-teal-400 shadow-inner">
                <Car className="w-7 h-7" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-200 block">
                  თანამშრომლის ავტომობილი გაჩერებულია
                </span>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-teal-300">
                    {spot.occupiedBy?.plateNumber || 'EMP-777-GE'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    სამსახურებრივი საშვი
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pricing & Features */}
        <div className="space-y-3 mb-5">
          <div className="flex items-baseline justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs font-medium text-slate-400">ტარიფი:</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-teal-300">უფასო</span>
              <span className="text-xs text-slate-400 font-medium">(კომპანიის პერსონალისთვის)</span>
            </div>
          </div>

          <ul className="space-y-1.5 text-xs text-slate-300">
            {spot.features.slice(0, 3).map((f, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Spot A Recent Entries & Exits Activity Box */}
        <div className="mb-4 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>A ადგილის მოძრაობები (შემოსული / გასული):</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
              {spotALogs.length} ჩანაწერი
            </span>
          </div>

          <div className="space-y-1.5">
            {spotALogs.slice(0, 3).map((l) => (
              <div
                key={l.id}
                className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                  l.direction === 'entry'
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`p-1 rounded-lg shrink-0 ${
                      l.direction === 'entry'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {l.direction === 'entry' ? (
                      <LogIn className="w-3.5 h-3.5" />
                    ) : (
                      <LogOut className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <span className="font-mono font-bold tracking-tight shrink-0">{l.plateNumber}</span>
                  <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                    {l.driverName}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
                    l.direction === 'entry'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {l.direction === 'entry' ? '🟢 შემოსული' : '🔴 გასული'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center gap-3">
            <button
              id="toggle-employee-spot-status-btn"
              onClick={onToggleEmployeeStatus}
              className="flex-1 py-3.5 px-4 rounded-xl text-xs font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-teal-500/30 hover:border-teal-400 transition-all flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-teal-400" />
              <span>
                {isAvailable ? 'სწრაფი გაჩერება' : 'გასვლა / განთავისუფლება'}
              </span>
            </button>

            <button
              id="spot-emp01-info-btn"
              onClick={() => onSelectSpot(spot)}
              className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors shrink-0"
              title="სრული დეტალები"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RENDER SPOT B: PAID SPOT
  function renderPaidSpotCard(spot: ParkingSpot) {
    const isSelected = selectedSpotId === spot.id;
    const isUserBooking = spot.occupiedBy?.isUserBooking;
    const isAvailable = spot.status === 'available';

    return (
      <div
        id={`spot-${spot.id}`}
        className={`group relative rounded-3xl p-6 border-2 transition-all duration-300 flex flex-col justify-between ${
          isSelected ? 'ring-2 ring-emerald-400 ring-offset-4 ring-offset-slate-950' : ''
        } ${
          isUserBooking
            ? 'bg-gradient-to-b from-indigo-950/90 via-slate-900 to-slate-950 border-indigo-500 shadow-2xl shadow-indigo-950/50'
            : isAvailable
            ? 'bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-slate-950 border-emerald-500/60 hover:border-emerald-400 shadow-xl hover:shadow-emerald-950/40'
            : 'bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950 border-rose-950 hover:border-rose-900/60 shadow-md'
        }`}
      >
        {/* Stall Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono font-black border shadow-lg ${
                isUserBooking
                  ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                  : isAvailable
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              }`}
            >
              <span className="text-xl leading-none">{spot.id}</span>
              <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5 text-slate-400">პარკინგი</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  B პარკინგი (ფასიანი პარკინგი)
                </h3>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span>კლიენტებისთვის • წინასწარი ონლაინ დაჯავშნა და გადახდა</span>
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 border ${
              isUserBooking
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse'
                : isAvailable
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isUserBooking ? 'bg-indigo-400' : isAvailable ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
              }`}
            />
            {isUserBooking ? 'თქვენი ჯავშანი' : isAvailable ? t.spotStatuses.available : t.spotStatuses.occupied}
          </span>
        </div>

        {/* Stall Center Visualization */}
        <div className="my-6 p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 relative overflow-hidden flex flex-col items-center justify-center min-h-[160px]">
          {/* Parking Stall Boundary Lines */}
          <div className="absolute inset-y-2 left-4 w-1 bg-amber-400/70 rounded-full" />
          <div className="absolute inset-y-2 right-4 w-1 bg-amber-400/70 rounded-full" />
          <div className="absolute top-2 inset-x-4 h-1 bg-amber-400/30 rounded-full" />

          {isAvailable ? (
            <div className="flex flex-col items-center text-center gap-2 z-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-sm font-bold text-emerald-400 block">
                  B ადგილი თავისუფალია!
                </span>
                <span className="text-xs text-slate-400">
                  დაჯავშნეთ წინასწარ, გადაიხადეთ და მიიღეთ ელექტრონული საშვი
                </span>
              </div>
            </div>
          ) : isUserBooking ? (
            <div className="flex flex-col items-center text-center gap-2 z-10">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center text-indigo-300 shadow-lg">
                <Sparkles className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <span className="text-sm font-black text-indigo-300 block">
                  აქტიური ჯავშანი თქვენია
                </span>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700 text-indigo-200">
                    {spot.occupiedBy?.plateNumber}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    საშვი: #{spot.occupiedBy?.bookingId}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-2 z-10">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-rose-400 shadow-inner">
                <Car className="w-7 h-7" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-300 block">
                  B ადგილი ამჟამად დაკავებულია
                </span>
                <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 inline-block mt-1">
                  {spot.occupiedBy?.plateNumber || 'ავტომობილი გაჩერებულია'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* OFFICIAL PRICING TIERS DISPLAY */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Tag className="w-3.5 h-3.5" />
              <span>ოფიციალური ტარიფები B პარკინგისთვის:</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {pricingTiers.map((tier) => (
              <div
                key={tier.hours}
                className={`p-2.5 rounded-xl border text-center ${
                  tier.isPopular
                    ? 'bg-emerald-500/15 border-emerald-500/50 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-300 block">{tier.label}</span>
                <span className="text-sm font-black text-emerald-400 font-mono mt-0.5 block">
                  {tier.price.toFixed(2)} ₾
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Spot B Recent Entries & Exits Activity Box */}
        <div className="mb-4 p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>B ადგილის მოძრაობები (შემოსული / გასული):</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {spotBLogs.length} ჩანაწერი
            </span>
          </div>

          <div className="space-y-1.5">
            {spotBLogs.slice(0, 3).map((l) => (
              <div
                key={l.id}
                className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                  l.direction === 'entry'
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`p-1 rounded-lg shrink-0 ${
                      l.direction === 'entry'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {l.direction === 'entry' ? (
                      <LogIn className="w-3.5 h-3.5" />
                    ) : (
                      <LogOut className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <span className="font-mono font-bold tracking-tight shrink-0">{l.plateNumber}</span>
                  <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                    {l.driverName}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {typeof l.amountPaid === 'number' && (
                    <span className="text-[10px] font-bold text-emerald-400 font-mono">
                      {l.amountPaid.toFixed(2)}₾
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                      l.direction === 'entry'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {l.direction === 'entry' ? '🟢 შემოსული' : '🔴 გასული'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center gap-3">
            {isAvailable ? (
              <button
                id="book-paid-spot-direct-btn"
                onClick={() => onStartBooking(spot)}
                className="flex-1 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-700/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>ონლაინ დაჯავშნა და გადახდა</span>
              </button>
            ) : isUserBooking ? (
              <button
                id="view-my-booking-btn"
                onClick={() => onSelectSpot(spot)}
                className="flex-1 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/30 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>ჯავშნის დეტალები & საშვი</span>
              </button>
            ) : (
              <button
                id="view-occupied-paid-spot-btn"
                onClick={() => onSelectSpot(spot)}
                className="flex-1 py-3.5 px-4 rounded-xl text-xs font-semibold text-slate-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Info className="w-4 h-4 text-slate-400" />
                <span>დაკავებული ადგილის ინფო</span>
              </button>
            )}

            <button
              id="spot-p01-info-btn"
              onClick={() => onSelectSpot(spot)}
              className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors shrink-0"
              title="სრული დეტალები"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          {/* On-Site Staff Workflow Button */}
          {onOpenStaffTerminal && (
            <button
              id="spot-b-staff-terminal-btn"
              onClick={onOpenStaffTerminal}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>
                {isAvailable
                  ? 'ადგილზე მანქანის მიღება (შტრიხკოდიანი ქვითრით)'
                  : 'ადგილზე სალარო: გასვლა, გადახდა & შლაგბაუმის გაღება'}
              </span>
            </button>
          )}
        </div>
      </div>
    );
  }
};
