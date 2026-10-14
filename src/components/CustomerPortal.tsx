import React, { useState } from 'react';
import {
  Car,
  CreditCard,
  Clock,
  Sparkles,
  Ticket,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  MapPin,
  QrCode,
  ArrowRight,
  Zap,
  Phone,
  Calendar,
  Lock,
} from 'lucide-react';
import { ParkingSpot, Reservation, Language } from '../types';
import { PricingConfig, getPricingConfig, getPricingTiers, calculateParkingPrice } from '../utils/pricing';
import { translations } from '../utils/translations';

interface CustomerPortalProps {
  spotB: ParkingSpot | undefined;
  activeReservations: Reservation[];
  onStartBooking: () => void;
  onOpenMyBookings: () => void;
  onOpenStaffLogin: () => void;
  pricingConfig?: PricingConfig;
  lang: Language;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  spotB,
  activeReservations,
  onStartBooking,
  onOpenMyBookings,
  onOpenStaffLogin,
  pricingConfig,
  lang,
}) => {
  const t = translations[lang];
  const activePricing = pricingConfig || getPricingConfig();
  const isAvailable = spotB?.status === 'available';
  const hasUserActiveBooking = spotB?.occupiedBy?.isUserBooking;
  const userReservationsCount = activeReservations.length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* HERO SECTION */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>სმარტ პარკინგი • ონლაინ დაჯავშნა და გარანტირებული ადგილი</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                დაჯავშნე პარკინგი{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  მარტივად და სწრაფად
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                შეიყვანეთ ავტომობილის სახელმწიფო ნომერი, აირჩიეთ დრო და გადაიხადეთ ონლაინ.
                შესასვლელთან ჭიშკარი ავტომატურად გაიღება თქვენი ნომრის ამოცნობით ან QR კოდის სკანირებით.
              </p>
            </div>

            {/* Dynamic Price pills */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
                <span className="text-slate-400">{activePricing.hourlyHours || 1} საათი: </span>
                <span className="font-extrabold text-white">{activePricing.hourlyRate.toFixed(2)} ₾</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
                <span className="text-slate-400">{activePricing.packageHours || 3} საათი: </span>
                <span className="font-extrabold text-emerald-400">
                  {(activePricing.packageRate ?? activePricing.threeHourRate ?? 2.0).toFixed(2)} ₾
                </span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
                <span className="text-slate-400">{activePricing.dailyHours || 24} საათი: </span>
                <span className="font-extrabold text-teal-400">{activePricing.dailyRate.toFixed(2)} ₾</span>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="customer-hero-book-btn"
                onClick={onStartBooking}
                disabled={!isAvailable && !hasUserActiveBooking}
                className={`px-6 py-3.5 rounded-2xl text-sm font-extrabold flex items-center gap-2.5 transition-all shadow-lg ${
                  isAvailable
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-emerald-500/25 scale-100 hover:scale-[1.02] cursor-pointer'
                    : hasUserActiveBooking
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>
                  {isAvailable
                    ? 'ადგილის დაჯავშნა ახლავე (ონლაინ)'
                    : hasUserActiveBooking
                    ? 'თქვენი ჯავშნის ნახვა'
                    : 'ადგილი დროებით დაკავებულია'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {userReservationsCount > 0 && (
                <button
                  id="customer-hero-my-bookings-btn"
                  onClick={onOpenMyBookings}
                  className="px-5 py-3.5 rounded-2xl text-sm font-bold bg-slate-800/90 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-2"
                >
                  <Ticket className="w-4 h-4 text-emerald-400" />
                  <span>ჩემი ჯავშნები ({userReservationsCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Spot B Real-Time Status Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl p-6 bg-slate-950/90 border-2 border-emerald-500/40 shadow-2xl relative overflow-hidden backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 flex flex-col items-center justify-center font-mono font-black text-xl shadow-lg border border-emerald-400/40">
                    <span>B</span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">ფასიანი პარკინგი</h3>
                    <p className="text-xs text-slate-400">ადგილი #B • სენსორით მონიტორინგი</p>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    isAvailable
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : hasUserActiveBooking
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {isAvailable
                    ? '🟢 თავისუფალია'
                    : hasUserActiveBooking
                    ? '🟣 თქვენი ჯავშანი'
                    : '🔴 დაკავებულია'}
                </span>
              </div>

              {/* Center status visual */}
              <div className="py-6 px-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-center mb-5 flex flex-col items-center justify-center min-h-[140px]">
                {isAvailable ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-emerald-400 block">
                      ადგილი თავისუფალია!
                    </span>
                    <span className="text-xs text-slate-400 block">
                      მზადაა მყისიერი ონლაინ დაჯავშნისთვის
                    </span>
                  </div>
                ) : hasUserActiveBooking ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="text-sm font-black text-indigo-300 block">
                      თქვენი ჯავშანი აქტიურია
                    </span>
                    <span className="text-xs text-slate-400 font-mono block">
                      ნომერი: {spotB?.occupiedBy?.plateNumber}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-400">
                      <Car className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-300 block">
                      ამჟამად დაკავებულია
                    </span>
                    <span className="text-xs text-slate-400 block">
                      გთხოვთ შეამოწმოთ ცოტა ხანში
                    </span>
                  </div>
                )}
              </div>

              {/* Quick specs */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>24/7 დაცული ზონა</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>QR / ANPR საშვი</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS / STEPS */}
      <div className="space-y-5">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight">
            როგორ მუშაობს ონლაინ ჯავშანი?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            სამი მარტივი ნაბიჯი პარკინგზე შეუფერხებლად შესასვლელად
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              1
            </div>
            <h3 className="text-base font-bold text-white">შეიყვანეთ ნომერი & დრო</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              მიუთითეთ თქვენი ავტომობილის სახელმწიფო ნომერი და სასურველი ხანგრძლივობა (1 საათი, 3 საათი ან 24 საათი).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
              2
            </div>
            <h3 className="text-base font-bold text-white">გადაიხადეთ ონლაინ</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              გადაიხადეთ უსაფრთხოდ ნებისმიერი ბარათით, Apple Pay, Google Pay, ან საქართველოს ბანკის / თიბისის სისტემით.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
              3
            </div>
            <h3 className="text-base font-bold text-white">მიიღეთ ციფრული საშვი</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              ჭიშკართან მისვლისას კამერა ავტომატურად ამოიცნობს ნომერს და გაიღება ბარიერი, ან გამოიყენეთ QR კოდი.
            </p>
          </div>
        </div>
      </div>

      {/* OFFICIAL TARIFFS TABLE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800/80 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-white">ოფიციალური ტარიფები</h3>
            <p className="text-xs text-slate-400">გამჭვირვალე ფასები ყოველგვარი ფარული გადასახადის გარეშე</p>
          </div>
          <div className="text-xs text-emerald-400 font-semibold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
            ✓ 0₾ საკომისიო ონლაინ გადახდისას
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">სტანდარტული</span>
              <h4 className="text-lg font-bold text-white mt-1">1 საათი</h4>
              <p className="text-xs text-slate-400 mt-1">სწრაფი შეჩერებისთვის</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <span className="text-2xl font-black text-white">1.00 ₾</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-950/30 to-slate-950/70 border-2 border-emerald-500/50 flex flex-col justify-between shadow-lg">
            <div>
              <div className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500 text-slate-950 mb-1">
                პოპულარული
              </div>
              <h4 className="text-lg font-bold text-white">3 საათი</h4>
              <p className="text-xs text-slate-400 mt-1">საქმიანი შეხვედრებისთვის</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <span className="text-2xl font-black text-emerald-400">2.00 ₾</span>
              <span className="text-[11px] text-emerald-400/80 block mt-0.5">დაზოგეთ 1.00 ₾</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">დღიური პაკეტი</span>
              <h4 className="text-lg font-bold text-white mt-1">24 საათი</h4>
              <p className="text-xs text-slate-400 mt-1">სრული დღე-ღამის გარანტია</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <span className="text-2xl font-black text-teal-400">5.00 ₾</span>
              <span className="text-[11px] text-teal-400/80 block mt-0.5">მაქსიმალური ეკონომია</span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER & STAFF ACCESS LINK (DISCRETE AT BOTTOM) */}
      <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          <span>SmartPark &copy; 2026. ყველა უფლება დაცულია. ტექნიკური მხარდაჭერა: 24/7.</span>
        </div>

        {/* Staff entrance discrete button */}
        <button
          id="customer-footer-staff-login-btn"
          onClick={onOpenStaffLogin}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
        >
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>თანამშრომლის შესვლა (Staff Portal)</span>
        </button>
      </div>
    </div>
  );
};
