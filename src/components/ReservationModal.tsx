import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Car,
  Clock,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Download,
  Printer,
  ChevronRight,
  ArrowLeft,
  QrCode,
  Sparkles,
  Phone,
  User,
  Tag,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ParkingSpot, Reservation, VehicleType, Language } from '../types';
import { translations } from '../utils/translations';
import { OFFICIAL_PRICING_TIERS, calculateParkingPrice } from '../utils/pricing';

interface ReservationModalProps {
  spot: ParkingSpot;
  onClose: () => void;
  onSuccess: (reservation: Reservation) => void;
  onOpenGateSimulator: () => void;
  initialPlate?: string;
  lang: Language;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  spot,
  onClose,
  onSuccess,
  onOpenGateSimulator,
  initialPlate,
  lang,
}) => {
  const t = translations[lang];

  // Steps: 1: Details, 2: Payment, 3: Completed Pass
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form fields
  const [vehiclePlate, setVehiclePlate] = useState(initialPlate || 'GE-482-TB');
  const [driverName, setDriverName] = useState('გიორგი მაისურაძე');
  const [driverPhone, setDriverPhone] = useState('+995 599 12 34 56');
  const [vehicleType, setVehicleType] = useState<VehicleType>(spot.type === 'ev' ? 'ev' : 'sedan');
  const [durationHours, setDurationHours] = useState<number>(3); // default to 3 hours (2 GEL)
  const [isEvChargingRequested, setIsEvChargingRequested] = useState<boolean>(false);

  // Payment fields
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'applepay' | 'googlepay' | 'bog' | 'tbc'>('card');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [cardHolder, setCardHolder] = useState('GIORGI MAISURADZE');
  const [isProcessing, setIsProcessing] = useState(false);

  // Completed reservation state
  const [completedReservation, setCompletedReservation] = useState<Reservation | null>(null);

  // Cost calculation according to official user pricing:
  // 1 hr = 1 GEL, 3 hrs = 2 GEL, 24 hrs = 5 GEL
  const hourlySubtotal = calculateParkingPrice(durationHours);
  const evChargingAddon = isEvChargingRequested ? 10.0 : 0;
  const serviceFee = 0.0; // Clean 0 service fee to keep exact 1₾, 2₾, 5₾ prices
  const totalAmount = hourlySubtotal + evChargingAddon + serviceFee;

  // Georgian plate quick fill examples
  const samplePlates = ['GE-482-TB', 'AA-100-BB', 'EV-555-GE', 'VIP-999-GE'];

  const handleProcessPayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);

      const now = new Date();
      const endTime = new Date(now.getTime() + durationHours * 3600000);
      const resId = `RES-${Math.floor(10000 + Math.random() * 90000)}`;

      const newReservation: Reservation = {
        id: resId,
        spotId: spot.id,
        floor: spot.floor,
        zone: spot.zoneName,
        spotType: spot.type,
        pricePerHour: spot.pricePerHour,
        vehiclePlate: vehiclePlate.toUpperCase().trim(),
        driverName,
        driverPhone,
        vehicleType,
        startTime: now.toISOString(),
        durationHours,
        endTime: endTime.toISOString(),
        hourlySubtotal,
        evChargingAddon,
        serviceFee,
        totalAmount,
        paymentMethod,
        paymentCardLast4: cardNumber.slice(-4),
        status: 'active',
        createdAt: now.toISOString(),
        qrCodeData: `SMARTPARK|${resId}|${spot.id}|${vehiclePlate.toUpperCase()}`,
      };

      setCompletedReservation(newReservation);
      setStep(3);
      onSuccess(newReservation);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#14b8a6', '#6366f1', '#f59e0b'],
        });
      } catch (err) {
        // silent
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="reservation-modal"
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-black text-sm">
              {spot.id}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {spot.name}
              </h3>
              <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <Tag className="w-3 h-3" />
                <span>ტარიფი: 1 სთ = 1.00 ₾ • 3 სთ = 2.00 ₾ • 24 სთ = 5.00 ₾</span>
              </p>
            </div>
          </div>

          <button
            id="close-booking-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Multi-step Breadcrumbs Indicator */}
        <div className="px-6 py-3 bg-slate-950/50 border-b border-slate-800/80 flex items-center justify-between text-xs select-none">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] border border-slate-700">1</span>
            <span>დრო & მანქანა</span>
          </div>
          <div className="flex-1 h-0.5 mx-2 bg-slate-800" />
          <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] border border-slate-700">2</span>
            <span>გადახდა</span>
          </div>
          <div className="flex-1 h-0.5 mx-2 bg-slate-800" />
          <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] border border-slate-700">3</span>
            <span>საშვი</span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: VEHICLE & SCHEDULE */}
          {step === 1 && (
            <div className="space-y-4">
              {/* License Plate Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.bookingModal.plateNumber}</span>
                  </label>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span>სწრაფი:</span>
                    {samplePlates.slice(0, 2).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setVehiclePlate(p)}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Georgian License Plate Mock Field */}
                <div className="flex items-center border-2 border-slate-700 focus-within:border-emerald-500 rounded-xl overflow-hidden bg-slate-950 transition-colors">
                  <div className="bg-blue-700 text-white px-3 py-2 flex flex-col items-center justify-center font-bold text-[10px] border-r border-blue-800 select-none">
                    <span>GE</span>
                    <span className="text-[8px] opacity-75">🇬🇪</span>
                  </div>
                  <input
                    id="vehicle-plate-input"
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="მაგ: GE-482-TB"
                    className="w-full bg-transparent px-3 py-2 text-base font-mono font-bold tracking-widest text-white focus:outline-none placeholder-slate-600 uppercase"
                  />
                </div>
              </div>

              {/* Driver Details (Name & Phone) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.bookingModal.driverName}</span>
                  </label>
                  <input
                    id="driver-name-input"
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.bookingModal.driverPhone}</span>
                  </label>
                  <input
                    id="driver-phone-input"
                    type="text"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* OFFICIAL TARIFF PACKAGES (1₾, 2₾, 5₾) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>აირჩიეთ სატარიფო პაკეტი / დრო:</span>
                  </label>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    ჯამი: {hourlySubtotal.toFixed(2)} ₾
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {OFFICIAL_PRICING_TIERS.map((tier) => {
                    const isSelected = durationHours === tier.hours;
                    return (
                      <button
                        key={tier.hours}
                        type="button"
                        onClick={() => setDurationHours(tier.hours)}
                        className={`p-3 rounded-2xl border text-center transition-all relative flex flex-col items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold ring-2 ring-emerald-500/40'
                            : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {tier.isPopular && (
                          <span className="absolute -top-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                            პოპულარული
                          </span>
                        )}

                        <span className="text-xs font-bold block">{tier.label}</span>
                        <span className="text-lg font-black text-emerald-400 font-mono mt-1">
                          {tier.price.toFixed(2)} ₾
                        </span>
                        {tier.badge && (
                          <span className="text-[10px] text-emerald-300/80 block mt-0.5">
                            {tier.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Additional intermediate hours buttons */}
                <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400 shrink-0">სხვა დრო:</span>
                  {[2, 6, 12].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setDurationHours(h)}
                      className={`flex-1 py-1 rounded-lg text-xs font-mono font-medium border transition-all ${
                        durationHours === h
                          ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {h}სთ ({calculateParkingPrice(h).toFixed(2)}₾)
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Calculation Summary Box */}
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 text-xs space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>საპარკინგე ადგილი ({spot.id} - B პარკინგი):</span>
                  <span className="font-mono">{durationHours} სთ</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>სატარიფო გადასახადი:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {hourlySubtotal.toFixed(2)} ₾
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline font-bold text-white">
                  <span className="text-sm">სულ გადასახდელი:</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    {totalAmount.toFixed(2)} ₾
                  </span>
                </div>
              </div>

              {/* Next Step Button */}
              <button
                id="proceed-to-payment-btn"
                type="button"
                onClick={() => setStep(2)}
                disabled={!vehiclePlate.trim()}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-700/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>გადასვლა გადახდაზე ({totalAmount.toFixed(2)} ₾)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: PAYMENT PROCESSING */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Payment Methods */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 block">
                  გადახდის მეთოდი
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>საბანკო ბარათი</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('applepay')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'applepay'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Apple Pay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bog')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'bog'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>BOG / TBC</span>
                  </button>
                </div>
              </div>

              {/* Card Form */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    ბარათის ნომერი
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      ვადა (MM/YY)
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white text-center focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white text-center focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    ბარათის მფლობელი
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono uppercase text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Total To Pay */}
              <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-300 block">გადასახდელი თანხა:</span>
                  <span className="text-xs text-emerald-400 font-medium">
                    {durationHours} საათი ({spot.name})
                  </span>
                </div>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {totalAmount.toFixed(2)} ₾
                </span>
              </div>

              {/* Navigation & Pay Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-semibold flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>უკან</span>
                </button>

                <button
                  id="confirm-pay-btn"
                  type="button"
                  onClick={handleProcessPayment}
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-700/25 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t.bookingModal.processingPayment}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>გადახდა: {totalAmount.toFixed(2)} ₾</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DIGITAL PARKING PASS / SUCCESS TICKET */}
          {step === 3 && completedReservation && (
            <div className="space-y-4">
              {/* Success Badge */}
              <div className="text-center py-1">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-black text-white">{t.bookingModal.bookingSuccess}</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-0.5">
                  საშვი გაცემულია და ნომერი ავტომატურად გაეგზავნა შესასვლელ ANPR კამერას.
                </p>
              </div>

              {/* Realistic Digital Parking Pass Card */}
              <div
                id="digital-parking-pass"
                className="bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-dashed border-emerald-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden"
              >
                {/* Cutout notches on sides */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-900 border-r border-slate-800" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-900 border-l border-slate-800" />

                {/* Pass Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-emerald-400 tracking-tight text-sm">SMARTPARK</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      {t.pass.statusPaid}
                    </span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">{completedReservation.id}</span>
                </div>

                {/* Pass Core Details */}
                <div className="grid grid-cols-3 gap-3 my-4">
                  <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
                    <span className="text-[10px] text-slate-400">ადგილი</span>
                    <p className="text-xl font-black font-mono text-emerald-400">B პარკინგი</p>
                    <span className="text-[9px] text-slate-500">ფასიანი ადგილი</span>
                  </div>

                  <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
                    <span className="text-[10px] text-slate-400">{t.pass.plate}</span>
                    <p className="text-sm font-bold font-mono text-white mt-0.5">{completedReservation.vehiclePlate}</p>
                    <span className="text-[9px] text-slate-500">{completedReservation.vehicleType}</span>
                  </div>

                  <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
                    <span className="text-[10px] text-slate-400">ხანგრძლივობა</span>
                    <p className="text-sm font-bold font-mono text-amber-400 mt-0.5">{completedReservation.durationHours} სთ</p>
                    <span className="text-[9px] text-slate-500">გადახდილი: {completedReservation.totalAmount.toFixed(2)} ₾</span>
                  </div>
                </div>

                {/* Time range */}
                <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-800 text-[11px] flex items-center justify-between text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[9px]">დაწყება:</span>
                    <span className="font-semibold">
                      {new Date(completedReservation.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-slate-600 font-mono">➔</div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[9px]">დასრულება:</span>
                    <span className="font-semibold text-emerald-400">
                      {new Date(completedReservation.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* QR Code & Barcode Section */}
                <div className="mt-4 pt-4 border-t border-dashed border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-white p-1 rounded-xl shadow flex items-center justify-center">
                      <QrCode className="w-14 h-14 text-slate-950" />
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-white">კამერით ავტო-ამოცნობა</p>
                      <p className="text-[11px] text-slate-400">მიუახლოვდით შლაგბაუმს ნომრით ან QR კოდით</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenGateSimulator();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-teal-300 bg-slate-800 hover:bg-slate-700 border border-teal-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>შლაგბაუმზე დატესტვა (ANPR)</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all"
                >
                  დასრულება
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
