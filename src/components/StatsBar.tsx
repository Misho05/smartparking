import React from 'react';
import { ShieldCheck, CreditCard, UserCheck, Camera, Database, Tag, Users } from 'lucide-react';
import { ParkingSpot, Language } from '../types';
import { translations } from '../utils/translations';

interface StatsBarProps {
  spots: ParkingSpot[];
  employeesCount: number;
  paidCustomersCount: number;
  onOpenManualDatabase: () => void;
  onOpenCustomerDatabase?: () => void;
  lang: Language;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  spots,
  employeesCount,
  paidCustomersCount,
  onOpenManualDatabase,
  onOpenCustomerDatabase,
  lang,
}) => {
  const t = translations[lang];

  const employeeSpot = spots.find((s) => s.id === 'A') || spots.find((s) => s.type === 'employee') || spots[0];
  const paidSpot = spots.find((s) => s.id === 'B') || spots.find((s) => s.type === 'paid') || spots[1];

  const isPaidAvailable = paidSpot?.status === 'available';
  const isPaidUserBooking = paidSpot?.occupiedBy?.isUserBooking;
  const isEmployeeAvailable = employeeSpot?.status === 'available';

  return (
    <div id="stats-banner" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-7xl mx-auto px-4 lg:px-8 py-3.5">
      {/* A PARKING: Employee Spot Quick Status */}
      <div className={`border rounded-2xl p-4 transition-all duration-300 relative overflow-hidden flex items-center gap-3.5 ${
        isEmployeeAvailable
          ? 'bg-gradient-to-br from-teal-950/40 via-slate-900/80 to-slate-900/60 border-teal-500/40 shadow-lg shadow-teal-950/20'
          : 'bg-slate-900/70 border-slate-800'
      }`}>
        <div className={`p-2.5 rounded-xl border shrink-0 ${
          isEmployeeAvailable
            ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        }`}>
          <UserCheck className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 truncate">
              A პარკინგი (თანამშრომლების)
            </span>
            <span className="font-mono text-xs font-black text-teal-400 ml-1">
              {employeeSpot?.id || 'A'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
              isEmployeeAvailable
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isEmployeeAvailable ? 'bg-teal-400' : 'bg-amber-400'}`} />
              {isEmployeeAvailable ? 'თავისუფალი (საშვით)' : 'თანამშრომელი გაჩერებულია'}
            </span>
          </div>
        </div>
        <div className={`absolute right-0 top-0 bottom-0 w-1 ${isEmployeeAvailable ? 'bg-teal-500' : 'bg-amber-500'}`} />
      </div>

      {/* B PARKING: Paid Spot Quick Status */}
      <div className={`border rounded-2xl p-4 transition-all duration-300 relative overflow-hidden flex items-center gap-3.5 ${
        isPaidUserBooking
          ? 'bg-gradient-to-br from-indigo-950/70 to-slate-900 border-indigo-500/50 shadow-lg shadow-indigo-950/20'
          : isPaidAvailable
          ? 'bg-gradient-to-br from-emerald-950/50 via-slate-900/80 to-slate-900/60 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
          : 'bg-slate-900/70 border-rose-900/40'
      }`}>
        <div className={`p-2.5 rounded-xl border shrink-0 ${
          isPaidUserBooking
            ? 'bg-indigo-500/20 border-indigo-400/30 text-indigo-300'
            : isPaidAvailable
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <CreditCard className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 truncate">
              B პარკინგი (ფასიანი)
            </span>
            <span className="font-mono text-xs font-black text-emerald-400 ml-1">
              {paidSpot?.id || 'B'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
              isPaidUserBooking
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                : isPaidAvailable
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                isPaidUserBooking ? 'bg-indigo-400 animate-pulse' : isPaidAvailable ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
              }`} />
              {isPaidUserBooking ? 'თქვენი ჯავშანი' : isPaidAvailable ? t.spotStatuses.available : t.spotStatuses.occupied}
            </span>
            <span className="text-[11px] text-emerald-400 font-bold font-mono">
              1სთ: 1₾ | 3სთ: 2₾ | 24სთ: 5₾
            </span>
          </div>
        </div>
        <div className={`absolute right-0 top-0 bottom-0 w-1 ${
          isPaidUserBooking ? 'bg-indigo-500' : isPaidAvailable ? 'bg-emerald-500' : 'bg-rose-500'
        }`} />
      </div>

      {/* ANPR Live Camera Recognition */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
          <Camera className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200">ANPR კამერა</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            ნომრის ამოცნობა & A / B ავტო-დახარისხება
          </p>
        </div>
      </div>

      {/* Databases Quick Actions (თანამშრომელთა ბაზა & მომხმარებელთა ბაზა) */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between gap-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onOpenManualDatabase}
            className="flex-1 flex items-center gap-2 p-1.5 rounded-xl bg-teal-950/40 hover:bg-teal-900/40 border border-teal-500/30 hover:border-teal-400 text-left transition-all group"
            title="თანამშრომელთა ბაზის გახსნა"
          >
            <div className="p-1 rounded-lg bg-teal-500/10 text-teal-400 shrink-0">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-teal-300 block truncate">
                თანამშრომლები
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {employeesCount} საშვი
              </span>
            </div>
          </button>

          <span className="text-slate-700 px-1 font-mono">|</span>

          <button
            type="button"
            onClick={onOpenCustomerDatabase || onOpenManualDatabase}
            className="flex-1 flex items-center gap-2 p-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/30 hover:border-emerald-400 text-left transition-all group"
            title="მომხმარებელთა ბაზის გახსნა"
          >
            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-emerald-300 block truncate">
                მომხმარებლები
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {paidCustomersCount} ჩანაწერი
              </span>
            </div>
          </button>
        </div>
        <p className="text-[10px] text-slate-400 text-center font-medium">
          A და B პარკინგის განცალკევებული ბაზები
        </p>
      </div>
    </div>
  );
};
