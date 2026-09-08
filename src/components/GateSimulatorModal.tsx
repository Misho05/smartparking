import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Car,
  Camera,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ArrowUp,
  Radio,
  Layers,
  Database,
  UserCheck,
  CreditCard,
  Sparkles,
  Search,
  ScanLine,
  ArrowRight,
} from 'lucide-react';
import { Reservation, EmployeeRecord, PaidCustomerRecord, Language } from '../types';
import { translations } from '../utils/translations';
import { OFFICIAL_PRICING_TIERS } from '../utils/pricing';

interface GateSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeReservations: Reservation[];
  employees: EmployeeRecord[];
  paidCustomers: PaidCustomerRecord[];
  onOpenManualDatabase: () => void;
  onOpenStaffTerminal?: (plate?: string) => void;
  onSimulateCarArrival: (
    plateNumber: string,
    classification: 'employee' | 'paid',
    details: { driverName?: string; expiresAt?: string; bookingId?: string }
  ) => boolean;
  onStartBookingForPlate: (plateNumber: string) => void;
  lang: Language;
}

export const GateSimulatorModal: React.FC<GateSimulatorModalProps> = ({
  isOpen,
  onClose,
  activeReservations,
  employees,
  paidCustomers,
  onOpenManualDatabase,
  onOpenStaffTerminal,
  onSimulateCarArrival,
  onStartBookingForPlate,
  lang,
}) => {
  if (!isOpen) return null;
  const t = translations[lang];

  const [inputPlate, setInputPlate] = useState('EMP-777-GE');
  const [gateStatus, setGateStatus] = useState<'idle' | 'scanning' | 'granted' | 'denied'>('idle');
  const [gateMessage, setGateMessage] = useState('');
  const [classificationResult, setClassificationResult] = useState<{
    type: 'employee' | 'paid' | 'unregistered';
    spot: 'A' | 'B' | null;
    title: string;
    details: string;
    priceInfo?: string;
  } | null>(null);

  // Trigger Automatic Camera OCR Recognition and Auto-Classification
  const handleScanAndClassify = (plateToScan?: string) => {
    const targetPlate = (plateToScan || inputPlate).trim().toUpperCase();
    if (!targetPlate) return;

    // 1. Camera automatically fills the plate number into input
    setInputPlate(targetPlate);
    setGateStatus('scanning');
    setGateMessage('კამერა აფიქსირებს ნომერს და ამოწმებს ბაზაში...');
    setClassificationResult(null);

    setTimeout(() => {
      // 2. Check in Employee Database (A პარკინგი)
      const empMatch = employees.find(
        (e) => e.plateNumber.replace(/\s|-/g, '').toUpperCase() === targetPlate.replace(/\s|-/g, '')
      );

      if (empMatch) {
        setGateStatus('granted');
        setGateMessage(`დადასტურებულია! თანამშრომელი: ${empMatch.fullName}`);
        setClassificationResult({
          type: 'employee',
          spot: 'A',
          title: 'თანამშრომელი • დაშვებულია A პარკინგზე',
          details: `${empMatch.fullName} (${empMatch.department}) — უფასო სამსახურებრივი საშვი`,
        });

        onSimulateCarArrival(targetPlate, 'employee', {
          driverName: empMatch.fullName,
          expiresAt: new Date(Date.now() + 8 * 3600000).toISOString(),
        });
        return;
      }

      // 3. Check in Paid Reservations & Paid Customer Database (B პარკინგი)
      const activeRes = activeReservations.find(
        (r) => r.vehiclePlate.replace(/\s|-/g, '').toUpperCase() === targetPlate.replace(/\s|-/g, '')
      );

      const paidRecord = paidCustomers.find(
        (p) => p.plateNumber.replace(/\s|-/g, '').toUpperCase() === targetPlate.replace(/\s|-/g, '')
      );

      if (activeRes || paidRecord) {
        const driver = activeRes?.driverName || paidRecord?.driverName || 'ფასიანი კლიენტი';
        const amount = activeRes?.totalAmount ?? paidRecord?.amountPaid ?? 2.0;

        setGateStatus('granted');
        setGateMessage(`საშვი დადასტურებულია! გადახდილია: ${amount.toFixed(2)} ₾`);
        setClassificationResult({
          type: 'paid',
          spot: 'B',
          title: 'ფასიანი პარკინგი • დაშვებულია B პარკინგზე',
          details: `მძღოლი: ${driver} — წინასწარ გადახდილია (${amount.toFixed(2)} ₾)`,
          priceInfo: 'ტარიფი: 1 სთ = 1.00 ₾ | 3 სთ = 2.00 ₾ | 24 სთ = 5.00 ₾',
        });

        onSimulateCarArrival(targetPlate, 'paid', {
          driverName: driver,
          bookingId: activeRes?.id || paidRecord?.id,
          expiresAt: activeRes?.endTime || paidRecord?.validUntil,
        });
        return;
      }

      // 4. Unregistered / Unknown Plate
      setGateStatus('denied');
      setGateMessage('ნომერი ვერ მოიძებნა ბაზაში. შლაგბაუმი დახურულია.');
      setClassificationResult({
        type: 'unregistered',
        spot: null,
        title: 'დაურეგისტრირებელი ავტომობილი',
        details: 'ავტომობილი არ ირიცხება თანამშრომელთა სიაში და არ გააჩნია წინასწარი ჯავშანი.',
        priceInfo: 'B პარკინგის ტარიფები: 1 სთ = 1.00 ₾, 3 სთ = 2.00 ₾, 24 სთ = 5.00 ₾',
      });
    }, 900);
  };

  const handleResetGate = () => {
    setGateStatus('idle');
    setGateMessage('');
    setClassificationResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="gate-simulator-modal"
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>ANPR კამერა & შლაგბაუმი</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  ავტო-დახარისხება
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                ამოიცნობს ნომერს, ამოწმებს ბაზას და ანაწილებს: A (თანამშრომლები) / B (ფასიანი)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenManualDatabase}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
              title="მანუალური ბაზის ნახვა/რედაქტირება"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ბაზა</span>
            </button>

            <button
              id="close-gate-simulator-btn"
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Simulated ANPR Camera Viewfinder with OCR bounding box */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 relative overflow-hidden text-center">
            {/* Camera Viewfinder Overlay Grid */}
            <div className="absolute top-2 left-2 text-[9px] font-mono text-cyan-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>LIVE CAM-01 • ANPR RECOGNITION</span>
            </div>

            {/* Traffic Light LED Status */}
            <div className="absolute top-2 right-2 flex items-center gap-1 p-1 rounded-full bg-slate-900 border border-slate-800">
              <div
                className={`w-3 h-3 rounded-full transition-colors ${
                  gateStatus === 'granted'
                    ? 'bg-emerald-500 shadow-lg shadow-emerald-500/80 animate-pulse'
                    : 'bg-emerald-950'
                }`}
              />
              <div
                className={`w-3 h-3 rounded-full transition-colors ${
                  gateStatus === 'denied'
                    ? 'bg-rose-500 shadow-lg shadow-rose-500/80 animate-pulse'
                    : 'bg-rose-950'
                }`}
              />
            </div>

            {/* Simulated License Plate View with Laser Scan Line */}
            <div className="my-3 py-4 flex flex-col items-center justify-center">
              <div className="relative border-2 border-dashed border-cyan-500/60 p-2 rounded-2xl bg-slate-900/60 max-w-xs w-full">
                {/* Laser Scanning Animation */}
                {gateStatus === 'scanning' && (
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#22d3ee] animate-[bounce_1.5s_infinite]" />
                )}

                <div className="flex items-center justify-center border-2 border-slate-400 rounded-xl overflow-hidden bg-white text-slate-900 shadow-md">
                  <div className="bg-blue-700 text-white px-2.5 py-2 flex flex-col items-center justify-center font-bold text-[9px] select-none">
                    <span>GE</span>
                    <span className="text-[7px]">🇬🇪</span>
                  </div>
                  <div className="px-4 py-1.5 font-mono text-xl sm:text-2xl font-black tracking-widest uppercase">
                    {inputPlate || '--- --- ---'}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-cyan-400 font-mono mt-1.5 px-1">
                  <span>OCR CONFIDENCE: 99.4%</span>
                  <span>CAM: ENTRY_BARRIER</span>
                </div>
              </div>
            </div>

            {/* Barrier Gate Arm Graphic */}
            <div className="h-16 flex flex-col justify-end items-center relative mt-1">
              <div className="w-8 h-12 bg-gradient-to-t from-slate-800 to-amber-500 rounded-t-lg border border-amber-400/50 relative z-10 flex flex-col items-center justify-start pt-1">
                <Radio className="w-3 h-3 text-slate-950" />
              </div>

              {/* Barrier Arm */}
              <div
                className={`absolute bottom-8 left-1/2 h-3 bg-gradient-to-r from-red-600 via-white to-red-600 rounded-full border border-slate-900 transition-all duration-700 origin-left ${
                  gateStatus === 'granted'
                    ? '-rotate-75 w-36 shadow-lg shadow-emerald-500/30'
                    : 'rotate-0 w-44'
                }`}
              />
              <div className="w-full h-1 bg-slate-800" />
            </div>

            {/* Status Feedback Box */}
            <div className="mt-3 min-h-[44px] flex items-center justify-center">
              {gateStatus === 'idle' && (
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <ScanLine className="w-4 h-4 text-cyan-400" />
                  <span>აირჩიეთ ნომერი ან დააჭირეთ „კამერით ამოცნობა“-ს</span>
                </span>
              )}
              {gateStatus === 'scanning' && (
                <div className="flex items-center gap-2 text-xs text-cyan-400">
                  <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>{gateMessage}</span>
                </div>
              )}
              {gateStatus === 'granted' && (
                <div className="text-xs text-emerald-400 font-bold bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-800/80 max-w-md mx-auto flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{gateMessage}</span>
                </div>
              )}
              {gateStatus === 'denied' && (
                <div className="text-xs text-rose-400 font-medium bg-rose-950/60 p-2.5 rounded-xl border border-rose-800/80 max-w-md mx-auto flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{gateMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* CLASSIFICATION RESULT CARD */}
          {classificationResult && (
            <div
              className={`p-4 rounded-2xl border transition-all animate-in slide-in-from-top-2 ${
                classificationResult.type === 'employee'
                  ? 'bg-teal-950/40 border-teal-500/50'
                  : classificationResult.type === 'paid'
                  ? 'bg-emerald-950/40 border-emerald-500/50'
                  : 'bg-rose-950/40 border-rose-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      classificationResult.type === 'employee'
                        ? 'bg-teal-500/20 text-teal-400'
                        : classificationResult.type === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {classificationResult.type === 'employee' ? (
                      <UserCheck className="w-5 h-5" />
                    ) : classificationResult.type === 'paid' ? (
                      <CreditCard className="w-5 h-5" />
                    ) : (
                      <Car className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{classificationResult.title}</span>
                      {classificationResult.spot && (
                        <span className="font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs text-cyan-300">
                          ადგილი: {classificationResult.spot}
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">{classificationResult.details}</p>
                    {classificationResult.priceInfo && (
                      <p className="text-[11px] text-slate-400 mt-1">{classificationResult.priceInfo}</p>
                    )}
                  </div>
                </div>

                {classificationResult.type === 'unregistered' && (
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {onOpenStaffTerminal && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenStaffTerminal(inputPlate);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-md shadow-amber-900/30"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>ადგილზე ქვითარი (შტრიხკოდი)</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onClose();
                        onStartBookingForPlate(inputPlate);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-700/20"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>B პარკინგის დაჯავშნა</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QUICK PRESET VEHICLES TO TEST CLASSIFICATION */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              სატესტო ავტომობილები (დააჭირეთ კამერის ავტო-ამოცნობისთვის):
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option 1: Employee Vehicle */}
              <button
                type="button"
                onClick={() => {
                  const p = employees[0]?.plateNumber || 'EMP-777-GE';
                  setInputPlate(p);
                  handleScanAndClassify(p);
                }}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-teal-500/40 hover:border-teal-400 text-left transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-teal-400 uppercase">A პარკინგი</span>
                  <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                </div>
                <span className="text-xs font-mono font-black text-white block mt-0.5">
                  {employees[0]?.plateNumber || 'EMP-777-GE'}
                </span>
                <span className="text-[10px] text-slate-400 truncate block">თანამშრომელი (უფასო)</span>
              </button>

              {/* Option 2: Paid Customer Vehicle */}
              <button
                type="button"
                onClick={() => {
                  const p =
                    activeReservations[0]?.vehiclePlate ||
                    paidCustomers[0]?.plateNumber ||
                    'GE-482-TB';
                  setInputPlate(p);
                  handleScanAndClassify(p);
                }}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/40 hover:border-emerald-400 text-left transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">B პარკინგი</span>
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-xs font-mono font-black text-white block mt-0.5">
                  {activeReservations[0]?.vehiclePlate ||
                    paidCustomers[0]?.plateNumber ||
                    'GE-482-TB'}
                </span>
                <span className="text-[10px] text-slate-400 truncate block">ფასიანი საშვი / ჯავშანი</span>
              </button>

              {/* Option 3: Unregistered Guest */}
              <button
                type="button"
                onClick={() => {
                  const p = 'NEW-999-GE';
                  setInputPlate(p);
                  handleScanAndClassify(p);
                }}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-700 hover:border-rose-500/40 text-left transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">დაურეგისტრირებელი</span>
                  <Car className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="text-xs font-mono font-black text-white block mt-0.5">NEW-999-GE</span>
                <span className="text-[10px] text-slate-400 truncate block">ახალი სტუმარი (უცნობი)</span>
              </button>
            </div>
          </div>

          {/* MANUAL PLATE INPUT / CUSTOM SCAN TRIGGER */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold text-slate-300 block">
              სხვა ნომრის შეყვანა / კამერით სკანირება:
            </label>

            <div className="flex gap-2">
              <input
                id="gate-plate-input"
                type="text"
                value={inputPlate}
                onChange={(e) => setInputPlate(e.target.value.toUpperCase())}
                placeholder="მაგ: AA-100-BB ან TB-001-ST"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-cyan-500"
              />

              <button
                id="gate-scan-btn"
                type="button"
                onClick={() => handleScanAndClassify()}
                disabled={gateStatus === 'scanning' || !inputPlate.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-700/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>კამერით ამოცნობა</span>
              </button>
            </div>
          </div>

          {gateStatus !== 'idle' && (
            <button
              type="button"
              onClick={handleResetGate}
              className="w-full py-2 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 text-xs transition-colors"
            >
              შლაგბაუმის დაწევა / კამერის გადატვირთვა
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
