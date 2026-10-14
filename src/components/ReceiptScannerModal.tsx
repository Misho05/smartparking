import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ScanLine,
  Camera,
  Barcode,
  Search,
  CheckCircle2,
  AlertCircle,
  Car,
  User,
  Phone,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ParkingTicket, ParkingSpot, Language } from '../types';
import { BarcodeVisual, QrCodeVisual } from './BarcodeVisual';
import { calculateStayDurationAndFee, StayFeeCalculation } from '../utils/pricing';
import { lookupDriverByPlate } from '../utils/driverDirectory';

export type PaymentMethodOption = 'cash' | 'bog' | 'tbc' | 'card';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: ParkingTicket[];
  spots: ParkingSpot[];
  initialCode?: string;
  onRecordPayment: (
    ticketId: string,
    amount: number,
    method: 'cash' | 'card' | 'pos' | 'bog' | 'tbc'
  ) => void;
  onManualOpenBarrierAndFreeSpot: (ticketId: string, spotId: 'A' | 'B') => void;
  onViewPrintReceipt: (ticket: ParkingTicket) => void;
  lang?: Language;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  tickets,
  spots,
  initialCode,
  onRecordPayment,
  onManualOpenBarrierAndFreeSpot,
  onViewPrintReceipt,
}) => {
  const [scanMode, setScanMode] = useState<'qr' | 'barcode' | 'manual'>('qr');
  const [scannedCode, setScannedCode] = useState('');
  const [matchedTicket, setMatchedTicket] = useState<ParkingTicket | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Payment states
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodOption>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isBarrierOpened, setIsBarrierOpened] = useState(false);

  // Laser scanning animation state
  const [isScanningLaserActive, setIsScanningLaserActive] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Active tickets available to scan
  const activeTickets = tickets.filter((t) => t.status === 'active' || t.status === 'paid');

  // Trigger search when input or initial code changes
  useEffect(() => {
    if (isOpen) {
      if (initialCode) {
        handleLookupCode(initialCode);
      } else if (activeTickets.length > 0 && !matchedTicket) {
        // Pre-select first active ticket for convenience if none matched
        handleLookupCode(activeTickets[0].ticketId);
      }
      setIsBarrierOpened(false);
      setPaymentSuccess(false);
      setIsScanningLaserActive(true);
    }
  }, [isOpen, initialCode]);

  // Focus input when modal opens or mode changes
  useEffect(() => {
    if (isOpen && (scanMode === 'barcode' || scanMode === 'manual')) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, scanMode]);

  // Lookup ticket by QR, Barcode, Ticket ID, or Plate
  const handleLookupCode = (rawCode: string) => {
    setScannedCode(rawCode);
    setSearchError(null);
    setPaymentSuccess(false);
    setIsBarrierOpened(false);

    const clean = rawCode.trim().toUpperCase();
    if (!clean) {
      setMatchedTicket(null);
      return;
    }

    // Try finding by ticketId, barcode, plate number, or phone
    const found = tickets.find((t) => {
      const matchId = t.ticketId.toUpperCase() === clean;
      const matchBarcode = t.barcode.toUpperCase() === clean;
      const matchPlate = t.plateNumber.toUpperCase().replace(/\s|-/g, '') === clean.replace(/\s|-/g, '');
      const matchPhone = t.driverPhone && t.driverPhone.replace(/\s/g, '').includes(clean.replace(/\s/g, ''));
      return matchId || matchBarcode || matchPlate || matchPhone;
    });

    if (found) {
      setMatchedTicket(found);
      setSearchError(null);
      setCashTendered('');
      // Audio cue simulation
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Beep sound
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } catch {
        // Ignore if audio context not allowed
      }
    } else {
      setMatchedTicket(null);
      if (clean.length >= 3) {
        setSearchError(`ქვითარი ან მანქანა კოდით "${rawCode}" ვერ მოიძებნა.`);
      }
    }
  };

  // Fee calculation for matched ticket
  const calc: StayFeeCalculation | null = matchedTicket
    ? calculateStayDurationAndFee(matchedTicket.entryTime, new Date())
    : null;

  // Auto-fill driver details if missing on ticket
  const driverProfile = matchedTicket
    ? lookupDriverByPlate(matchedTicket.plateNumber)
    : null;
  const displayDriverName =
    matchedTicket?.driverFullName || driverProfile?.fullName || 'ადგილზე კლიენტი';
  const displayDriverPhone =
    matchedTicket?.driverPhone || driverProfile?.phone || null;

  // Cash change calculation
  const currentAmountDue = matchedTicket?.status === 'paid' ? 0 : calc?.amountDue || 1.0;
  const cashNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, cashNum - currentAmountDue);

  // Quick cash tender buttons helper
  const handleSetQuickCash = (amount: number) => {
    setCashTendered(amount.toString());
  };

  // Handle Complete Payment & Gate Open
  const handleExecutePayment = (autoOpenBarrier: boolean = false) => {
    if (!matchedTicket || !calc) return;
    setIsProcessingPayment(true);

    // Map payment option to ticket paymentMethod
    let finalMethod: 'cash' | 'card' | 'pos' | 'bog' | 'tbc' = 'cash';
    if (selectedPaymentMethod === 'cash') finalMethod = 'cash';
    else if (selectedPaymentMethod === 'bog') finalMethod = 'bog';
    else if (selectedPaymentMethod === 'tbc') finalMethod = 'tbc';
    else finalMethod = 'pos';

    setTimeout(() => {
      onRecordPayment(matchedTicket.ticketId, calc.amountDue, finalMethod);
      setMatchedTicket((prev) =>
        prev
          ? {
              ...prev,
              status: 'paid',
              amountPaid: calc.amountDue,
              paymentMethod: finalMethod,
              paidAt: new Date().toISOString(),
            }
          : null
      );
      setIsProcessingPayment(false);
      setPaymentSuccess(true);

      try {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      } catch {
        // Ignore
      }

      if (autoOpenBarrier) {
        setIsBarrierOpened(true);
        setTimeout(() => {
          onManualOpenBarrierAndFreeSpot(matchedTicket.ticketId, matchedTicket.spotId);
        }, 1200);
      }
    }, 400);
  };

  // Handle open barrier only (if already paid)
  const handleOpenBarrierOnly = () => {
    if (!matchedTicket) return;
    setIsBarrierOpened(true);
    setTimeout(() => {
      onManualOpenBarrierAndFreeSpot(matchedTicket.ticketId, matchedTicket.spotId);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* ========================================================================= */}
        {/* MODAL HEADER */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shrink-0 shadow-md">
              <ScanLine className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight">
                  ქვითრის სკანერი & გადახდის სალარო
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                  QR • შტრიხკოდი • კოდი
                </span>
              </div>
              <p className="text-xs text-slate-400">
                დაასკანერეთ ქვითარი — მონაცემები და ნომერი მომენტალურად ამოვა და იქვე გადაიხდით
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SCANNER CONTROLS AND METHOD PICKER */}
        {/* ========================================================================= */}
        <div className="px-6 pt-4 pb-3 bg-slate-950/60 border-b border-slate-800">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Mode Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setScanMode('qr')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  scanMode === 'qr'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>📷 QR სკანერი</span>
              </button>

              <button
                type="button"
                onClick={() => setScanMode('barcode')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  scanMode === 'barcode'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Barcode className="w-3.5 h-3.5" />
                <span>⚡ შტრიხკოდი</span>
              </button>

              <button
                type="button"
                onClick={() => setScanMode('manual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  scanMode === 'manual'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>⌨️ კოდის / ნომრის ჩაწერა</span>
              </button>
            </div>

            {/* Quick Available Tickets Counter */}
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span>აქტიური ქვითრები:</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-bold border border-slate-700">
                {activeTickets.length}
              </span>
            </div>
          </div>

          {/* Quick Click-to-Scan Buttons for Available Cars */}
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500 font-medium">სწრაფი ტესტ-სკანირება:</span>
            {activeTickets.slice(0, 3).map((ticket) => (
              <button
                key={ticket.ticketId}
                onClick={() => handleLookupCode(ticket.ticketId)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 border ${
                  matchedTicket?.ticketId === ticket.ticketId
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="text-teal-400">{ticket.spotId}</span>
                <span>•</span>
                <span>{ticket.plateNumber}</span>
                <span className="text-[10px] text-slate-500">({ticket.ticketId})</span>
              </button>
            ))}

            {/* Quick Test Past/Yesterday Receipts */}
            {tickets.filter((t) => t.status === 'completed').slice(0, 2).map((ticket) => (
              <button
                key={ticket.ticketId}
                onClick={() => handleLookupCode(ticket.ticketId)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 border ${
                  matchedTicket?.ticketId === ticket.ticketId
                    ? 'bg-amber-950/70 border-amber-500 text-amber-300'
                    : 'bg-slate-900 border-amber-500/40 text-amber-300 hover:border-amber-400'
                }`}
                title="გასული/გუშინდელი ქვითრის სკანირება"
              >
                <span>⭐ გუშინ:</span>
                <span>{ticket.plateNumber}</span>
                <span className="text-[10px] text-amber-500/80">({ticket.ticketId})</span>
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN BODY: SCANNER RETICLE / INPUT + MATCHED DETAILS & PAYMENT */}
        {/* ========================================================================= */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* SEARCH INPUT BAR */}
          <div className="relative">
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ScanLine className="w-4 h-4 text-emerald-400" />
                <span>
                  {scanMode === 'qr'
                    ? 'დაასკანერეთ ქვითრის QR კოდი ან შეიყვანეთ:'
                    : scanMode === 'barcode'
                    ? 'დაასკანერეთ შტრიხკოდი ლაზერით ან ჩაწერეთ:'
                    : 'შეიყვანეთ ქვითრის კოდი, შტრიხკოდი ან მანქანის ნომერი:'}
                </span>
              </span>
              <span className="text-[10px] text-slate-500">მომენტალური ამოგდება</span>
            </label>

            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                id="receipt-scanner-input"
                value={scannedCode}
                onChange={(e) => handleLookupCode(e.target.value)}
                placeholder="მაგ: TKT-849201 ან 8942104591 ან GE-482-TB..."
                className="w-full pl-11 pr-24 py-3 bg-slate-950 border-2 border-slate-700 focus:border-emerald-400 rounded-2xl text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner tracking-wider"
              />
              <Search className="w-5 h-5 text-slate-500 absolute left-3.5 pointer-events-none" />

              {scannedCode && (
                <button
                  onClick={() => {
                    setScannedCode('');
                    setMatchedTicket(null);
                    setSearchError(null);
                  }}
                  className="absolute right-3 px-2 py-1 rounded-lg text-xs bg-slate-800 text-slate-400 hover:text-white"
                >
                  გასუფთავება
                </button>
              )}
            </div>

            {searchError && (
              <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}
          </div>

          {/* VISUAL SCANNER HUD (IF QR OR BARCODE MODE) */}
          {(scanMode === 'qr' || scanMode === 'barcode') && !matchedTicket && (
            <div className="bg-slate-950/80 border-2 border-dashed border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-center text-center">
              {/* Laser line animation */}
              <div className="w-64 h-48 border-2 border-emerald-500/40 rounded-2xl relative flex items-center justify-center bg-slate-900/50 overflow-hidden shadow-2xl">
                {/* Corner reticles */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

                {/* Sweeping Laser Beam */}
                {isScanningLaserActive && (
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-bounce" />
                )}

                {scanMode === 'qr' ? (
                  <div className="text-center p-3">
                    <Camera className="w-10 h-10 text-emerald-400/80 mx-auto mb-2 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-slate-300 block">
                      მიუშვით ქვითრის QR კამერას
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      ან შეიყვანეთ ქვითრის კოდი ზემოთ
                    </span>
                  </div>
                ) : (
                  <div className="text-center p-3">
                    <Barcode className="w-12 h-10 text-emerald-400/80 mx-auto mb-2 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-slate-300 block">
                      შტრიხკოდის ლაზერული სკანერი
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      დაასკანერეთ ქვითარი შტრიხკოდის წამკითხველით
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (activeTickets.length > 0) {
                      handleLookupCode(activeTickets[0].ticketId);
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ტესტ-სკანირების სიმულაცია (1-Click Scan)</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MATCHED CAR DATA & INSTANT PAYMENT MATRIX */}
          {/* ========================================================================= */}
          {matchedTicket && calc && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              {/* 1. MATCHED CAR BANNER WITH GEORGIAN LICENSE PLATE */}
              <div className="bg-gradient-to-r from-emerald-950/70 via-slate-950 to-slate-950 border-2 border-emerald-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Plate and Driver info */}
                  <div className="flex items-start gap-4">
                    {/* Authentic Georgian Number Plate Badge */}
                    <div className="inline-flex items-stretch border-2 border-slate-900 rounded-xl overflow-hidden bg-white shadow-xl shadow-slate-950/50 shrink-0">
                      {/* Left blue GEO strip */}
                      <div className="bg-blue-700 text-white flex flex-col items-center justify-between px-1.5 py-1 select-none">
                        <span className="text-[9px] leading-none">★</span>
                        <span className="text-[10px] font-black leading-none tracking-tighter">GE</span>
                        <span className="text-[9px] leading-none">🇬🇪</span>
                      </div>
                      {/* Plate text */}
                      <div className="px-3.5 py-1.5 flex items-center justify-center font-mono font-black text-xl sm:text-2xl text-slate-950 tracking-widest select-none">
                        {matchedTicket.plateNumber}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-black text-white">
                          {displayDriverName}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 uppercase font-sans">
                          ✓ ამოგდებული მონაცემი
                        </span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 text-teal-300 border border-slate-700">
                          {matchedTicket.spotId} პარკინგი
                        </span>
                      </div>

                      {/* Driver phone and notes */}
                      <div className="flex items-center gap-3 text-xs text-slate-300 mt-1.5 flex-wrap">
                        {displayDriverPhone && (
                          <span className="flex items-center gap-1 text-teal-300 font-mono font-bold">
                            <Phone className="w-3.5 h-3.5 text-teal-400" />
                            <span>{displayDriverPhone}</span>
                          </span>
                        )}
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          ქვითარი: #{matchedTicket.ticketId}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          შტრიხკოდი: {matchedTicket.barcode}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Tariff amount box */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-right shrink-0">
                    <span className="text-[11px] font-bold text-slate-400 block mb-0.5">
                      გაანგარიშებული თანხა:
                    </span>
                    <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-400">
                      {matchedTicket.status === 'paid' || matchedTicket.status === 'completed'
                        ? `${(matchedTicket.amountPaid || calc.amountDue).toFixed(2)} ₾ (გადახდილია)`
                        : `${calc.amountDue.toFixed(2)} ₾`}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                      ტარიფი: 1სთ=1₾ • 3სთ=2₾ • 24სთ=5₾
                    </span>
                  </div>
                </div>

                {/* Duration and timestamps grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-800 text-xs">
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">შემოსვლის დრო:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {new Date(matchedTicket.entryTime).toLocaleTimeString('ka-GE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">გატარებული დრო:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {matchedTicket.durationFormatted || calc.formattedDuration}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">ტარიფის ტიპი:</span>
                    <span className="font-bold text-teal-300">
                      {calc.tierDescription}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">ქვითრის სტატუსი:</span>
                    <span
                      className={`font-bold ${
                        matchedTicket.status === 'completed'
                          ? 'text-sky-400'
                          : matchedTicket.status === 'paid'
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {matchedTicket.status === 'completed'
                        ? '✓ გასულია (არქივი)'
                        : matchedTicket.status === 'paid'
                        ? '✓ გადახდილია'
                        : '⏳ გადასახდელია'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. PAYMENT METHODS SECTION (ქეშით ან ბარათით: საქ / თიბისი) */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span>გადახდის მეთოდის არჩევა (ქეში ან საბანკო ბარათი)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      აირჩიეთ ნაღდი ფული ან ქართული ბანკის ბარათი (საქართველოს ბანკი / თიბისი ბანკი)
                    </p>
                  </div>

                  <button
                    onClick={() => onViewPrintReceipt(matchedTicket)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>ქვითარი</span>
                  </button>
                </div>

                {/* 4 PAYMENT TABS: ქეში | საქ (BOG) | თიბისი (TBC) | სხვა ბარათი */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* 1. CASH / ქეშით */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('cash')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                      selectedPaymentMethod === 'cash'
                        ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <Banknote className="w-4 h-4" />
                      </div>
                      {selectedPaymentMethod === 'cash' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <span className="font-black text-xs sm:text-sm text-white block">
                      💵 ქეშით (ნაღდი)
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      ნაღდი ანგარიშსწორება
                    </span>
                  </button>

                  {/* 2. BANK OF GEORGIA / საქ (საქართველოს ბანკი) */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('bog')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                      selectedPaymentMethod === 'bog'
                        ? 'bg-orange-950/60 border-orange-500 ring-2 ring-orange-500/30 shadow-lg'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-xs font-sans">
                        BOG
                      </div>
                      {selectedPaymentMethod === 'bog' && (
                        <CheckCircle2 className="w-4 h-4 text-orange-400" />
                      )}
                    </div>
                    <span className="font-black text-xs sm:text-sm text-white block">
                      🟧 საქ (საქართველოს ბანკი)
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      BOG POS / QR / ბარათი
                    </span>
                  </button>

                  {/* 3. TBC BANK / თიბისი (თიბისი ბანკი) */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('tbc')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                      selectedPaymentMethod === 'tbc'
                        ? 'bg-cyan-950/60 border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-xs font-sans">
                        TBC
                      </div>
                      {selectedPaymentMethod === 'tbc' && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <span className="font-black text-xs sm:text-sm text-white block">
                      🟦 თიბისი (TBC ბანკი)
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      TBC POS / QR / ბარათი
                    </span>
                  </button>

                  {/* 4. OTHER CARD / POS ბარათი */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('card')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                      selectedPaymentMethod === 'card'
                        ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      {selectedPaymentMethod === 'card' && (
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      )}
                    </div>
                    <span className="font-black text-xs sm:text-sm text-white block">
                      💳 სხვა ბარათი (POS)
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Visa / Mastercard
                    </span>
                  </button>
                </div>

                {/* CASH DETAILS: TENDER INPUT & CHANGE CALCULATOR */}
                {selectedPaymentMethod === 'cash' && (
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-300 block mb-1">
                          მიღებული თანხა (₾):
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.5"
                            min={calc.amountDue}
                            value={cashTendered}
                            onChange={(e) => setCashTendered(e.target.value)}
                            placeholder={`${calc.amountDue.toFixed(2)}`}
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-400"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">
                            GEL
                          </span>
                        </div>
                      </div>

                      {/* Quick cash denomination buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap self-end">
                        <span className="text-[11px] text-slate-500">სწრაფი:</span>
                        <button
                          type="button"
                          onClick={() => handleSetQuickCash(calc.amountDue)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700"
                        >
                          ზუსტი ({calc.amountDue.toFixed(2)}₾)
                        </button>
                        {[5, 10, 20, 50].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => handleSetQuickCash(amt)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                          >
                            {amt} ₾
                          </button>
                        ))}
                      </div>

                      {/* Change Due Display */}
                      <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-right min-w-[140px]">
                        <span className="text-[10px] text-slate-400 block">ხურდა დასაბრუნებელი:</span>
                        <span className="text-lg font-mono font-black text-teal-300">
                          {changeDue.toFixed(2)} ₾
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* GEORGIAN BANK CARD (BOG / TBC) INFO CALLOUT */}
                {(selectedPaymentMethod === 'bog' || selectedPaymentMethod === 'tbc') && (
                  <div
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                      selectedPaymentMethod === 'bog'
                        ? 'bg-orange-950/30 border-orange-500/40 text-orange-200'
                        : 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          selectedPaymentMethod === 'bog'
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-cyan-500/20 text-cyan-400'
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-black text-white block">
                          {selectedPaymentMethod === 'bog'
                            ? 'საქართველოს ბანკი (საქ / Bank of Georgia)'
                            : 'თიბისი ბანკი (თიბისი / TBC Bank)'}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          გადახდა ტერმინალით (POS) ან მობილურის QR კოდით • თანხა: {calc.amountDue.toFixed(2)} ₾
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 font-mono text-emerald-400 font-bold shrink-0">
                      ტარიფი: {calc.amountDue.toFixed(2)} ₾
                    </span>
                  </div>
                )}

                {/* PAYMENT CONFIRMATION AND GATE OPEN BUTTONS */}
                {matchedTicket.status === 'active' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* 1-Click Pay AND Open Barrier */}
                    <button
                      type="button"
                      disabled={isProcessingPayment}
                      onClick={() => handleExecutePayment(true)}
                      className="py-4 px-5 rounded-2xl text-sm font-black text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 shadow-xl shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 transform active:scale-[0.99]"
                    >
                      <Zap className="w-5 h-5" />
                      <span>
                        გადახდის დაფიქსირება & შლაგბაუმის გახსნა ({calc.amountDue.toFixed(2)} ₾)
                      </span>
                    </button>

                    {/* Pay Only */}
                    <button
                      type="button"
                      disabled={isProcessingPayment}
                      onClick={() => handleExecutePayment(false)}
                      className="py-4 px-5 rounded-2xl text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>მხოლოდ გადახდის დაფიქსირება ბაზაში</span>
                    </button>
                  </div>
                ) : (
                  /* ALREADY PAID OR ARCHIVED COMPLETED BANNER */
                  <div className="space-y-3 pt-2">
                    <div className="p-4 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/60 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-black text-emerald-300 block">
                            {matchedTicket.status === 'completed'
                              ? '✓ გასული & გადახდილი ქვითარი (არქივი)'
                              : '✓ გადახდა დაფიქსირებულია ბაზაში!'}
                          </span>
                          <span className="text-xs text-slate-300">
                            მეთოდი:{' '}
                            {matchedTicket.paymentMethod === 'bog'
                              ? 'საქართველოს ბანკი (საქ)'
                              : matchedTicket.paymentMethod === 'tbc'
                              ? 'თიბისი ბანკი'
                              : matchedTicket.paymentMethod === 'cash'
                              ? 'ნაღდი ფული (ქეში)'
                              : 'საბანკო ბარათი'}{' '}
                            • თანხა: {(matchedTicket.amountPaid || calc.amountDue).toFixed(2)} ₾
                          </span>
                          {matchedTicket.exitTime && (
                            <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                              გასვლის დრო: {new Date(matchedTicket.exitTime).toLocaleString('ka-GE')}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onViewPrintReceipt(matchedTicket)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-md shrink-0"
                        title="სრული ქვითრის გახსნა & ბეჭდვა"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>ქვითრის ნახვა</span>
                      </button>
                    </div>

                    {/* Barrier Visual & Manual Trigger */}
                    <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-300 font-bold px-2">
                        <span>გასასვლელი შლაგბაუმის სტატუსი:</span>
                        <span
                          className={`font-black ${
                            isBarrierOpened ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isBarrierOpened ? 'ღიაა (მანქანა გადის) ✓' : 'დაკეტილია'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenBarrierOnly}
                        className="w-full py-3.5 px-5 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 hover:from-teal-400 hover:to-emerald-400 shadow-lg shadow-teal-950/40 transition-all flex items-center justify-center gap-2"
                      >
                        <ArrowRight className="w-5 h-5" />
                        <span>შლაგბაუმის გაღება & ადგილის განთავისუფლება</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* FOOTER BAR */}
        {/* ========================================================================= */}
        <div className="p-4 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>საქართველოს ბანკი (საქ) • თიბისი ბანკი • ნაღდი ანგარიშსწორება</span>
          </div>

          <div className="flex items-center gap-2">
            {matchedTicket && (
              <button
                onClick={() => {
                  setMatchedTicket(null);
                  setScannedCode('');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium"
              >
                სხვა ქვითრის დასკანერება
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
            >
              დახურვა
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
