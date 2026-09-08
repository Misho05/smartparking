import React from 'react';
import {
  X,
  Ticket,
  Clock,
  Car,
  QrCode,
  MapPin,
  AlertTriangle,
  PlusCircle,
  XCircle,
  Calendar,
  Layers,
  ChevronRight,
  CreditCard,
} from 'lucide-react';
import { Reservation, Language } from '../types';
import { translations } from '../utils/translations';

interface MyBookingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reservations: Reservation[];
  onCancelBooking: (id: string) => void;
  onExtendBooking: (id: string, additionalHours: number) => void;
  onSelectSpotToView: (spotId: string) => void;
  lang: Language;
}

export const MyBookingsDrawer: React.FC<MyBookingsDrawerProps> = ({
  isOpen,
  onClose,
  reservations,
  onCancelBooking,
  onExtendBooking,
  onSelectSpotToView,
  lang,
}) => {
  if (!isOpen) return null;
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="my-bookings-drawer"
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{t.myBookings}</h3>
              <p className="text-xs text-slate-400">
                სულ ჯავშანი: {reservations.length}
              </p>
            </div>
          </div>

          <button
            id="close-my-bookings-drawer-btn"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bookings List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {reservations.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
                <Ticket className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-300">აქტიური ჯავშნები არ გაქვთ</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                აირჩიეთ რუკაზე ნებისმიერი მწვანე თავისუფალი ადგილი და დაჯავშნეთ წინასწარ.
              </p>
            </div>
          ) : (
            reservations.map((res) => {
              const now = new Date().getTime();
              const end = new Date(res.endTime).getTime();
              const diffMinutes = Math.max(0, Math.round((end - now) / 60000));
              const isExpired = diffMinutes === 0;

              return (
                <div
                  key={res.id}
                  id={`booking-card-${res.id}`}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3 relative overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center font-mono font-black text-indigo-300 text-sm">
                        {res.spotId}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{res.zone}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isExpired
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {isExpired ? 'ვადაგასული' : 'აქტიური'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <CreditCard className="w-3 h-3 text-emerald-400" />
                          <span>ფასიანი ადგილი (P-01)</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-emerald-400 block">
                        {res.totalAmount.toFixed(2)} ₾
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{res.id}</span>
                    </div>
                  </div>

                  {/* Vehicle & Timing Details */}
                  <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80 text-xs grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">ავტომობილის ნომერი:</span>
                      <span className="font-mono font-bold text-white tracking-wider">{res.vehiclePlate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">დარჩენილი დრო:</span>
                      <span className="font-mono font-bold text-amber-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {isExpired ? '0 წუთი' : `${Math.floor(diffMinutes / 60)}სთ ${diffMinutes % 60}წთ`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">დაწყება:</span>
                      <span className="text-slate-300">
                        {new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">დასრულება:</span>
                      <span className="text-slate-300">
                        {new Date(res.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    {/* View on Map */}
                    <button
                      id={`view-spot-on-map-${res.id}`}
                      type="button"
                      onClick={() => {
                        onSelectSpotToView(res.spotId);
                        onClose();
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>რუკაზე ნახვა</span>
                    </button>

                    {/* Extend Time */}
                    <button
                      id={`extend-booking-${res.id}`}
                      type="button"
                      onClick={() => onExtendBooking(res.id, 1)}
                      className="py-1.5 px-2.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 text-xs font-medium flex items-center gap-1 transition-colors"
                      title="+1 საათის დამატება"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+1 სთ</span>
                    </button>

                    {/* Cancel Booking */}
                    <button
                      id={`cancel-booking-${res.id}`}
                      type="button"
                      onClick={() => onCancelBooking(res.id)}
                      className="py-1.5 px-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-900/60 text-rose-300 text-xs font-medium flex items-center gap-1 transition-colors"
                      title="ჯავშნის გაუქმება"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>გაუქმება</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
