import React from 'react';
import { Database, Ticket, Camera, Receipt, ScanLine } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface NavbarProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  activeBookingsCount: number;
  activeTicketsCount?: number;
  onOpenMyBookings: () => void;
  onOpenGateSimulator: () => void;
  onOpenManualDatabase: () => void;
  onOpenStaffTerminal: () => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onLanguageChange,
  activeBookingsCount,
  activeTicketsCount = 0,
  onOpenMyBookings,
  onOpenGateSimulator,
  onOpenManualDatabase,
  onOpenStaffTerminal,
  isSimulating,
  onToggleSimulation,
}) => {
  const t = translations[lang];

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-700 shadow-lg shadow-teal-500/20 text-white font-black text-xl tracking-tight border border-teal-400/30">
            <span>P</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white">SmartPark</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
                A & B პარკინგი
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              ადგილზე მომსახურების ტერმინალი • შტრიხკოდი/ქიუარ ქვითარი • 1₾/სთ, 2₾/3სთ, 5₾/24სთ
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Staff Terminal & Cashier (POS / Tickets) Button */}
          <button
            id="nav-staff-terminal-btn"
            onClick={onOpenStaffTerminal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition-all shadow-sm"
            title="თანამშრომლის დაცული ტერმინალი: მძღოლების მონაცემები (კონფიდენციალური), ქვითრები & სალარო"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
            <span>🔒 თანამშრომლის ტერმინალი & სალარო</span>
            {activeTicketsCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 font-mono">
                {activeTicketsCount}
              </span>
            )}
          </button>

          {/* Manual Database Button */}
          <button
            id="nav-manual-db-btn"
            onClick={onOpenManualDatabase}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-teal-300 border border-teal-500/30 hover:border-teal-400 transition-all shadow-sm"
          >
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span>მანუალური ბაზა</span>
          </button>

          {/* Gate Simulator Button */}
          <button
            id="gate-simulator-btn"
            onClick={onOpenGateSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all hover:border-slate-600 shadow-sm"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>ANPR კამერა</span>
          </button>

          {/* My Bookings Button */}
          <button
            id="my-bookings-btn"
            onClick={onOpenMyBookings}
            className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all"
          >
            <Ticket className="w-4 h-4" />
            <span>{t.myBookings}</span>
            {activeBookingsCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-white text-emerald-700">
                {activeBookingsCount}
              </span>
            )}
          </button>

          {/* Language Switch */}
          <div className="flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            <button
              id="lang-ka-btn"
              onClick={() => onLanguageChange('ka')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                lang === 'ka'
                  ? 'bg-slate-700 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ქარ
            </button>
            <button
              id="lang-en-btn"
              onClick={() => onLanguageChange('en')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                lang === 'en'
                  ? 'bg-slate-700 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

