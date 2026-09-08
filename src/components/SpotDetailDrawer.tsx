import React from 'react';
import {
  X,
  Car,
  CreditCard,
  UserCheck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { ParkingSpot, Language } from '../types';
import { translations } from '../utils/translations';

interface SpotDetailDrawerProps {
  spot: ParkingSpot | null;
  onClose: () => void;
  onStartBooking: (spot: ParkingSpot) => void;
  onOpenMyBookings: () => void;
  onToggleEmployeeStatus: () => void;
  lang: Language;
}

export const SpotDetailDrawer: React.FC<SpotDetailDrawerProps> = ({
  spot,
  onClose,
  onStartBooking,
  onOpenMyBookings,
  onToggleEmployeeStatus,
  lang,
}) => {
  if (!spot) return null;

  const t = translations[lang];
  const isUserBooking = spot.occupiedBy?.isUserBooking;
  const isEmployeeSpot = spot.type === 'employee';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="spot-detail-modal"
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          id="close-spot-detail-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Spot Header */}
        <div className="flex items-start gap-3.5 mb-5">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-mono font-black text-xl shadow-lg ${
              isEmployeeSpot
                ? 'bg-teal-500/20 border border-teal-500/40 text-teal-300'
                : spot.status === 'available'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                : isUserBooking
                ? 'bg-indigo-500/20 border border-indigo-400/40 text-indigo-300'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
            }`}
          >
            {spot.id}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white tracking-tight">{spot.name}</h3>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
              {isEmployeeSpot ? (
                <span className="text-teal-400 flex items-center gap-1 font-semibold">
                  <UserCheck className="w-3.5 h-3.5" />
                  მხოლოდ თანამშრომლებისთვის (Staff Only)
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CreditCard className="w-3.5 h-3.5" />
                  კლიენტის ადგილი • წინასწარი გადახდით
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Spot Highlights Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[11px] font-medium text-slate-400">{t.spotDetails.rate}</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              {isEmployeeSpot ? (
                <>
                  <span className="text-2xl font-black text-teal-400">0.00 ₾</span>
                  <span className="text-xs text-slate-500">/ საშვით უფასო</span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-black text-white">{spot.pricePerHour.toFixed(2)} ₾</span>
                  <span className="text-xs text-slate-500">/ საათი</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[11px] font-medium text-slate-400">{t.spotDetails.category}</span>
            <div className="flex items-center gap-2 mt-1">
              {isEmployeeSpot ? (
                <>
                  <UserCheck className="w-4 h-4 text-teal-400" />
                  <span className="text-sm font-bold text-teal-300">თანამშრომლის ადგილი</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-slate-200">ფასიანი (კლიენტის)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            {t.spotDetails.features}
          </h4>
          <div className="space-y-2">
            {spot.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${isEmployeeSpot ? 'text-teal-400' : 'text-emerald-400'}`} />
                <span>{feature}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>ავტომატური შლაგბაუმის ამოცნობა QR კოდით / ნომრით</span>
            </div>
          </div>
        </div>

        {/* Occupied State Info */}
        {spot.status === 'occupied' && !isUserBooking && (
          <div className="mb-6 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-slate-200">{t.spotDetails.currentlyOccupied}</p>
              {spot.occupiedBy?.plateNumber && (
                <p className="text-slate-400 mt-0.5">
                  ავტომობილის ნომერი: <span className="font-mono text-slate-200 font-bold">{spot.occupiedBy.plateNumber}</span>
                </p>
              )}
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>მძღოლის პირადი მონაცემები (სახელი, ტელეფონი) კონფიდენციალურია და დაფარულია მომხმარებლისთვის.</span>
              </div>
            </div>
          </div>
        )}

        {/* User Active Booking Info */}
        {isUserBooking && (
          <div className="mb-6 bg-indigo-950/40 border border-indigo-800/60 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-xs font-bold text-indigo-200">{t.spotDetails.yourActiveBooking}</p>
                <p className="text-[11px] text-indigo-300/80">
                  ნომერი: <span className="font-mono font-bold">{spot.occupiedBy?.plateNumber}</span>
                </p>
              </div>
            </div>
            <button
              id="view-my-booking-from-spot-btn"
              onClick={onOpenMyBookings}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              საშვის ნახვა
            </button>
          </div>
        )}

        {/* Action Button */}
        {isEmployeeSpot ? (
          <div className="space-y-2">
            <div className="p-3 bg-teal-950/30 border border-teal-800/40 rounded-xl text-xs text-teal-300">
              {t.spotDetails.employeeNotice}
            </div>
            <button
              id="employee-toggle-btn-in-drawer"
              onClick={() => {
                onToggleEmployeeStatus();
                onClose();
              }}
              className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-teal-500/40 transition-colors flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-teal-400" />
              <span>
                {spot.status === 'available' ? 'თანამშრომლის გაჩერება' : 'თანამშრომლის გასვლა (განთავისუფლება)'}
              </span>
            </button>
          </div>
        ) : spot.status === 'available' ? (
          <button
            id="book-spot-btn"
            onClick={() => onStartBooking(spot)}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-700/25 transition-all transform active:scale-[0.99]"
          >
            <CreditCard className="w-4 h-4" />
            <span>{t.spotDetails.reserveNow}</span>
          </button>
        ) : !isUserBooking ? (
          <div className="text-center py-2 text-xs text-slate-500">
            ამჟამად ფასიანი ადგილი დაკავებულია
          </div>
        ) : null}
      </div>
    </div>
  );
};
