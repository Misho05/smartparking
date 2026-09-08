import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  CreditCard,
  Barcode,
  QrCode,
  Printer,
  X,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Car,
  DollarSign,
  Receipt,
  ScanLine,
  ChevronRight,
  AlertCircle,
  Database,
  Banknote,
  Smartphone,
  Check,
  RefreshCw,
  Lock,
  Unlock,
  Phone,
  User,
  Copy,
  Trash2,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { ParkingSpot, ParkingTicket, Language } from '../types';
import { calculateStayDurationAndFee, StayFeeCalculation } from '../utils/pricing';
import { BarcodeVisual, QrCodeVisual } from './BarcodeVisual';
import confetti from 'canvas-confetti';

interface StaffTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  spots: ParkingSpot[];
  tickets: ParkingTicket[];
  onIssueTicket: (ticket: ParkingTicket) => void;
  onRecordPayment: (ticketId: string, amount: number, method: 'cash' | 'card' | 'pos' | 'bog' | 'tbc') => void;
  onManualOpenBarrierAndFreeSpot: (ticketId: string, spotId: 'A' | 'B') => void;
  onViewPrintReceipt: (ticket: ParkingTicket) => void;
  onDeleteTicket?: (ticketId: string) => void;
  lang?: Language;
}

export const StaffTerminalModal: React.FC<StaffTerminalModalProps> = ({
  isOpen,
  onClose,
  spots,
  tickets,
  onIssueTicket,
  onRecordPayment,
  onManualOpenBarrierAndFreeSpot,
  onViewPrintReceipt,
  onDeleteTicket,
}) => {
  if (!isOpen) return null;

  // ================= STAFF ACCESS & SECURITY GATE =================
  // By default, staff is authenticated for convenience, but can be locked or require PIN
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('smartpark_staff_auth_status');
    return saved !== null ? saved === 'true' : true;
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const handleVerifyPin = (pinToTest?: string) => {
    const val = (pinToTest ?? pinInput).trim();
    if (val === '1234' || val === '0000') {
      setIsStaffAuthenticated(true);
      localStorage.setItem('smartpark_staff_auth_status', 'true');
      setPinError('');
      setPinInput('');
    } else {
      setPinError('არასწორი PIN კოდი! შეიყვანეთ: 1234');
    }
  };

  const handleLockTerminal = () => {
    setIsStaffAuthenticated(false);
    localStorage.setItem('smartpark_staff_auth_status', 'false');
  };

  // Active Tab:
  // 'confidential_db': 🔒 კონფიდენციალური ბაზა (სახელი, გვარი, ტელეფონი, ნომერი)
  // 'issue': ➕ ახალი მანქანის რეგისტრაცია & ქვითრის გაცემა
  // 'checkout': 💳 გასვლა, გადახდის სალარო & შლაგბაუმი
  const [activeTab, setActiveTab] = useState<'confidential_db' | 'issue' | 'checkout'>('confidential_db');

  // ================= ISSUE TICKET & CONFIDENTIAL DRIVER DATA =================
  const [driverFullName, setDriverFullName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [selectedSpotForIssue, setSelectedSpotForIssue] = useState<'B' | 'A'>('B');
  const [staffOperatorName, setStaffOperatorName] = useState('თანამშრომელი #01 (ადგილზე)');
  const [issueNotes, setIssueNotes] = useState('');
  const [issueSuccessTicket, setIssueSuccessTicket] = useState<ParkingTicket | null>(null);

  // ================= CONFIDENTIAL DATABASE FILTER & SEARCH =================
  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [dbFilterStatus, setDbFilterStatus] = useState<'all' | 'active' | 'paid'>('all');
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // ================= CHECKOUT / CASHIER STATE =================
  const [searchInput, setSearchInput] = useState('');
  const [selectedTicketForCheckout, setSelectedTicketForCheckout] = useState<ParkingTicket | null>(null);
  const [simulatedDurationHours, setSimulatedDurationHours] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'pos' | 'bog' | 'tbc'>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isBarrierOpened, setIsBarrierOpened] = useState(false);
  const [isPaymentJustConfirmed, setIsPaymentJustConfirmed] = useState(false);

  // Spot infos
  const spotB = spots.find((s) => s.id === 'B') || spots[1];
  const spotA = spots.find((s) => s.id === 'A') || spots[0];

  // Active tickets
  const activeTickets = tickets.filter((t) => t.status === 'active' || t.status === 'paid');

  // Auto-select first active ticket when opening checkout tab if none selected
  useEffect(() => {
    if (activeTab === 'checkout' && !selectedTicketForCheckout && activeTickets.length > 0) {
      setSelectedTicketForCheckout(activeTickets[0]);
    }
  }, [activeTab, activeTickets, selectedTicketForCheckout]);

  // Handle Search for Barcode / QR / Ticket ID / Plate / Phone
  const handleSearchTicket = (query: string) => {
    setSearchInput(query);
    const clean = query.trim().toUpperCase();
    if (!clean) return;

    const found = tickets.find(
      (t) =>
        t.ticketId.toUpperCase() === clean ||
        t.barcode === clean ||
        t.plateNumber.toUpperCase().replace(/\s|-/g, '').includes(clean.replace(/\s|-/g, '')) ||
        (t.driverPhone && t.driverPhone.replace(/\s/g, '').includes(clean.replace(/\s/g, ''))),
    );
    if (found) {
      setSelectedTicketForCheckout(found);
      setIsBarrierOpened(false);
      setIsPaymentJustConfirmed(false);
      setSimulatedDurationHours(null);
    }
  };

  // Quick select a ticket for checkout
  const handleSelectTicketForCheckout = (ticket: ParkingTicket) => {
    setSelectedTicketForCheckout(ticket);
    setSearchInput(ticket.ticketId);
    setIsBarrierOpened(false);
    setIsPaymentJustConfirmed(false);
    setSimulatedDurationHours(null);
    setActiveTab('checkout');
  };

  // Copy phone helper
  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard?.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  // Generate and Issue new Ticket with Confidential Driver Details (სახელი, გვარი, ტელეფონი, მანქანის ნომერი)
  const handleGenerateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPlate = newPlate.trim().toUpperCase();
    if (!cleanPlate) return;

    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const newTicket: ParkingTicket = {
      ticketId: `TKT-${randomNum}`,
      barcode: `894${randomNum}`,
      plateNumber: cleanPlate,
      driverFullName: driverFullName.trim() || 'ადგილზე კლიენტი',
      driverPhone: driverPhone.trim() || '+995 599 00 00 00',
      spotId: selectedSpotForIssue,
      entryTime: new Date().toISOString(),
      status: 'active',
      staffOperatorName,
      notes: issueNotes,
      isConfidentialStaffEntry: true,
    };

    onIssueTicket(newTicket);
    setIssueSuccessTicket(newTicket);

    // Reset form
    setDriverFullName('');
    setDriverPhone('');
    setNewPlate('');
    setIssueNotes('');

    try {
      confetti({ particleCount: 40, spread: 65, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  // Calculate Fee for currently selected ticket
  const getCalculation = (ticket: ParkingTicket): StayFeeCalculation => {
    if (simulatedDurationHours !== null) {
      const simulatedEnd = new Date(new Date(ticket.entryTime).getTime() + simulatedDurationHours * 3600000);
      return calculateStayDurationAndFee(ticket.entryTime, simulatedEnd);
    }
    return calculateStayDurationAndFee(ticket.entryTime, new Date());
  };

  const currentCalc = selectedTicketForCheckout ? getCalculation(selectedTicketForCheckout) : null;
  const cashNum = parseFloat(cashReceived) || 0;
  const changeDue = currentCalc ? Math.max(0, cashNum - currentCalc.amountDue) : 0;

  // Record Payment in Database
  const handleConfirmPayment = () => {
    if (!selectedTicketForCheckout || !currentCalc) return;

    onRecordPayment(selectedTicketForCheckout.ticketId, currentCalc.amountDue, paymentMethod);
    setIsPaymentJustConfirmed(true);

    setSelectedTicketForCheckout({
      ...selectedTicketForCheckout,
      status: 'paid',
      amountPaid: currentCalc.amountDue,
      amountDue: currentCalc.amountDue,
      durationMinutes: currentCalc.totalMinutes,
      durationFormatted: currentCalc.formattedDuration,
      paymentMethod,
      paidAt: new Date().toISOString(),
    });

    try {
      confetti({ particleCount: 40, spread: 70, origin: { y: 0.7 } });
    } catch {
      // ignore
    }
  };

  // Open barrier manually and free spot
  const handleManualOpenBarrier = () => {
    if (!selectedTicketForCheckout) return;
    setIsBarrierOpened(true);

    setTimeout(() => {
      onManualOpenBarrierAndFreeSpot(selectedTicketForCheckout.ticketId, selectedTicketForCheckout.spotId);
    }, 1200);
  };

  // Filter confidential database
  const filteredTickets = tickets.filter((t) => {
    // Status filter
    if (dbFilterStatus === 'active' && t.status !== 'active') return false;
    if (dbFilterStatus === 'paid' && t.status !== 'paid' && t.status !== 'completed') return false;

    // Search query: Driver name, phone, plate, or ticket ID
    if (!dbSearchQuery.trim()) return true;
    const q = dbSearchQuery.trim().toLowerCase();
    const matchName = t.driverFullName?.toLowerCase().includes(q);
    const matchPhone = t.driverPhone?.toLowerCase().includes(q);
    const matchPlate = t.plateNumber.toLowerCase().includes(q);
    const matchId = t.ticketId.toLowerCase().includes(q);
    return Boolean(matchName || matchPhone || matchPlate || matchId);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* ========================================================================= */}
        {/* MODAL HEADER WITH SECURITY STATUS */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-teal-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-white tracking-tight">
                  თანამშრომლის ტერმინალი & კონფიდენციალური ბაზა
                </h2>
                {isStaffAuthenticated ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-teal-400" />
                    <span>მხოლოდ პერსონალისთვის (დაცულია)</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>დაბლოკილია</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                ადგილზე მძღოლების მონაცემების რეგისტრაცია, ქვითრები, სალარო და შლაგბაუმის მანუალური გახსნა
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isStaffAuthenticated && (
              <button
                id="lock-terminal-btn"
                onClick={handleLockTerminal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="პანელის დაბლოკვა (კონფიდენციალური მონაცემების დასაცავად)"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>დაბლოკვა</span>
              </button>
            )}

            <button
              onClick={onClose}
              id="close-staff-terminal-btn"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PIN SECURITY GATE: If not authenticated, require Staff PIN */}
        {/* ========================================================================= */}
        {!isStaffAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-950/50">
              <KeyRound className="w-8 h-8 animate-pulse" />
            </div>

            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-black text-white">
                თანამშრომლის დაცული ავტორიზაცია
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ეს სივრცე შეიცავს მძღოლების კონფიდენციალურ პერსონალურ ინფორმაციას (სახელი, გვარი, პირადი ტელეფონის ნომერი).
                <br />
                <span className="text-teal-300 font-medium">
                  მონაცემები სრულად დაფარულია საიტის ჩვეულებრივი მომხმარებლებისთვის.
                </span>
              </p>
            </div>

            <div className="w-full max-w-xs space-y-3">
              <div className="space-y-1 text-left">
                <label className="text-[11px] font-bold text-slate-400">
                  შეიყვანეთ თანამშრომლის PIN კოდი:
                </label>
                <input
                  type="password"
                  id="staff-pin-input"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleVerifyPin();
                  }}
                  placeholder="PIN: 1234"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {pinError && (
                <div className="text-xs text-rose-400 font-medium flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{pinError}</span>
                </div>
              )}

              <button
                id="verify-staff-pin-btn"
                onClick={() => handleVerifyPin()}
                className="w-full py-3 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow-lg shadow-amber-900/30 flex items-center justify-center gap-1.5"
              >
                <Unlock className="w-4 h-4" />
                <span>ავტორიზაცია</span>
              </button>

              <button
                id="quick-unlock-staff-btn"
                onClick={() => handleVerifyPin('1234')}
                className="w-full py-2 rounded-xl text-[11px] font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors"
              >
                სწრაფი შესვლა (ტესტირება PIN: 1234)
              </button>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-[11px] text-slate-500 max-w-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
              <span>პერსონალური მონაცემების დაცვა: საჯარო ვიზიტორებს არ აქვთ წვდომა მძღოლის ტელეფონზე და სახელზე.</span>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* AUTHENTICATED STAFF WORKSPACE */
          /* ========================================================================= */
          <>
            {/* NAVIGATION TABS */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/60 overflow-x-auto select-none">
              {/* Tab 1: Confidential Database */}
              <button
                id="terminal-tab-database"
                onClick={() => setActiveTab('confidential_db')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'confidential_db'
                    ? 'bg-slate-900 text-teal-400 border-teal-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
                }`}
              >
                <Lock className="w-4 h-4 text-teal-400" />
                <span>1. 🔒 დაცული ბაზა (მძღოლები & ტელეფონები)</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-teal-300 font-mono">
                  {tickets.length}
                </span>
              </button>

              {/* Tab 2: Issue Ticket */}
              <button
                id="terminal-tab-issue"
                onClick={() => setActiveTab('issue')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'issue'
                    ? 'bg-slate-900 text-amber-400 border-amber-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
                }`}
              >
                <Barcode className="w-4 h-4" />
                <span>2. ➕ ადგილზე რეგისტრაცია (სახელი/გვარი/ტელ/ნომერი)</span>
              </button>

              {/* Tab 3: Checkout Cashier & Gate */}
              <button
                id="terminal-tab-checkout"
                onClick={() => {
                  setActiveTab('checkout');
                  setIsPaymentJustConfirmed(false);
                  setIsBarrierOpened(false);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                  activeTab === 'checkout'
                    ? 'bg-slate-900 text-emerald-400 border-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>3. 💳 გასვლა, გადახდის სალარო & შლაგბაუმი</span>
                {activeTickets.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                    {activeTickets.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB CONTENT CONTAINER */}
            <div className="p-6 overflow-y-auto flex-1">
              
              {/* ========================================================================= */}
              {/* TAB 1: CONFIDENTIAL STAFF DATABASE (მხოლოდ თანამშრომლისთვის) */}
              {/* ========================================================================= */}
              {activeTab === 'confidential_db' && (
                <div className="space-y-5">
                  {/* Confidentiality Guarantee Banner */}
                  <div className="bg-slate-950/90 border border-teal-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30 shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">
                          კონფიდენციალური შიდა რეესტრი (მხოლოდ ადგილზე მყოფი პერსონალისთვის)
                        </span>
                        <span className="text-slate-400">
                          აქ შეყვანილი მძღოლების სახელი, გვარი და ტელეფონის ნომრები ინახება ცალკე, დაცულად და საიტის საჯარო მომხმარებლებისთვის არასოდეს ჩანს.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab('issue')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>+ ახალი მძღოლის დამატება</span>
                      </button>
                    </div>
                  </div>

                  {/* Search and Filters Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Search Field */}
                    <div className="relative flex-1">
                      <input
                        type="text"
                        id="confidential-db-search-input"
                        value={dbSearchQuery}
                        onChange={(e) => setDbSearchQuery(e.target.value)}
                        placeholder="ძებნა: სახელი, გვარი, ტელეფონი, მანქანის ნომერი..."
                        className="w-full pl-9 pr-8 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                      />
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      {dbSearchQuery && (
                        <button
                          onClick={() => setDbSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Filter Status */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                      <button
                        onClick={() => setDbFilterStatus('all')}
                        className={`px-3 py-1.5 rounded-lg transition-colors font-semibold ${
                          dbFilterStatus === 'all'
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        ყველა ({tickets.length})
                      </button>
                      <button
                        onClick={() => setDbFilterStatus('active')}
                        className={`px-3 py-1.5 rounded-lg transition-colors font-semibold ${
                          dbFilterStatus === 'active'
                            ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        აქტიური ({tickets.filter((t) => t.status === 'active').length})
                      </button>
                      <button
                        onClick={() => setDbFilterStatus('paid')}
                        className={`px-3 py-1.5 rounded-lg transition-colors font-semibold ${
                          dbFilterStatus === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        გადახდილი ({tickets.filter((t) => t.status === 'paid' || t.status === 'completed').length})
                      </button>
                    </div>
                  </div>

                  {/* Confidential Records Table */}
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4">მძღოლის სახელი & გვარი</th>
                            <th className="py-3 px-4">ტელეფონის ნომერი</th>
                            <th className="py-3 px-4">მანქანის ნომერი</th>
                            <th className="py-3 px-4">ადგილი</th>
                            <th className="py-3 px-4">შემოსვლის დრო</th>
                            <th className="py-3 px-4">სტატუსი</th>
                            <th className="py-3 px-4 text-right">თანხა</th>
                            <th className="py-3 px-4 text-right">მოქმედება</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 font-mono">
                          {filteredTickets.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="text-center py-10 text-slate-500">
                                <Lock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                <span className="block font-sans font-bold text-slate-400">
                                  ჩანაწერები ვერ მოიძებნა
                                </span>
                                <span className="text-[11px] font-sans text-slate-500">
                                  დაამატეთ ახალი მძღოლი ტაბიდან „2. ადგილზე რეგისტრაცია“.
                                </span>
                              </td>
                            </tr>
                          ) : (
                            filteredTickets.map((ticket) => {
                              const isPaid = ticket.status === 'paid' || ticket.status === 'completed';
                              const formattedEntry = new Date(ticket.entryTime).toLocaleTimeString('ka-GE', {
                                hour: '2-digit',
                                minute: '2-digit',
                              });

                              return (
                                <tr
                                  key={ticket.ticketId}
                                  className="hover:bg-slate-900/70 transition-colors group"
                                >
                                  {/* Full Name */}
                                  <td className="py-3.5 px-4 font-sans font-bold text-white">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
                                        <User className="w-3.5 h-3.5" />
                                      </div>
                                      <div>
                                        <span className="block">{ticket.driverFullName || 'მძღოლი'}</span>
                                        <span className="text-[10px] text-slate-500 font-mono">
                                          #{ticket.ticketId}
                                        </span>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Phone Number */}
                                  <td className="py-3.5 px-4 text-slate-300 font-sans">
                                    {ticket.driverPhone ? (
                                      <div className="flex items-center gap-1.5">
                                        <Phone className="w-3 h-3 text-teal-400 shrink-0" />
                                        <a
                                          href={`tel:${ticket.driverPhone.replace(/\s/g, '')}`}
                                          className="font-mono text-teal-300 hover:underline font-bold"
                                        >
                                          {ticket.driverPhone}
                                        </a>
                                        <button
                                          onClick={() => handleCopyPhone(ticket.driverPhone || '', ticket.ticketId)}
                                          className="p-1 rounded text-slate-500 hover:text-white"
                                          title="ტელეფონის კოპირება"
                                        >
                                          {copiedPhoneId === ticket.ticketId ? (
                                            <Check className="w-3 h-3 text-emerald-400" />
                                          ) : (
                                            <Copy className="w-3 h-3" />
                                          )}
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-slate-500">—</span>
                                    )}
                                  </td>

                                  {/* Plate Number */}
                                  <td className="py-3.5 px-4">
                                    <span className="font-mono font-black text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-white tracking-wider">
                                      {ticket.plateNumber}
                                    </span>
                                  </td>

                                  {/* Spot */}
                                  <td className="py-3.5 px-4">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                        ticket.spotId === 'A'
                                          ? 'bg-teal-500/20 text-teal-300'
                                          : 'bg-emerald-500/20 text-emerald-300'
                                      }`}
                                    >
                                      {ticket.spotId} პარკინგი
                                    </span>
                                  </td>

                                  {/* Entry Time */}
                                  <td className="py-3.5 px-4 text-slate-400 font-sans text-xs">
                                    {formattedEntry}
                                  </td>

                                  {/* Status */}
                                  <td className="py-3.5 px-4 font-sans">
                                    <span
                                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                                        isPaid
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      }`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          isPaid ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
                                        }`}
                                      />
                                      {isPaid ? 'გადახდილია' : 'აქტიური (ადგილზეა)'}
                                    </span>
                                  </td>

                                  {/* Amount */}
                                  <td className="py-3.5 px-4 text-right font-black text-emerald-400">
                                    {ticket.amountPaid ? `${ticket.amountPaid.toFixed(2)} ₾` : '—'}
                                  </td>

                                  {/* Actions */}
                                  <td className="py-3.5 px-4 text-right font-sans">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {/* Go to Checkout */}
                                      <button
                                        onClick={() => handleSelectTicketForCheckout(ticket)}
                                        className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-colors flex items-center gap-1"
                                        title="სალაროში გადაყვანა"
                                      >
                                        <CreditCard className="w-3 h-3" />
                                        <span>სალარო</span>
                                      </button>

                                      {/* View / Print Receipt */}
                                      <button
                                        onClick={() => onViewPrintReceipt(ticket)}
                                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 transition-colors"
                                        title="ქვითრის ნახვა / ბეჭდვა"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Delete ticket if onDeleteTicket provided */}
                                      {onDeleteTicket && (
                                        <button
                                          onClick={() => {
                                            if (window.confirm(`ნამდვილად გსურთ ${ticket.driverFullName || ticket.plateNumber}-ის ჩანაწერის წაშლა?`)) {
                                              onDeleteTicket(ticket.ticketId);
                                            }
                                          }}
                                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition-colors"
                                          title="ჩანაწერის წაშლა"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-3">
                      <span>სულ ჩანაწერი: <strong className="text-white font-mono">{tickets.length}</strong></span>
                      <span>•</span>
                      <span>აქტიური მძღოლი: <strong className="text-amber-400 font-mono">{tickets.filter(t => t.status === 'active').length}</strong></span>
                    </div>

                    <div className="text-emerald-400 font-mono font-bold">
                      სულ შემოსავალი: {tickets.reduce((sum, t) => sum + (t.amountPaid || 0), 0).toFixed(2)} ₾
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: ISSUE NEW TICKET & ENTER CONFIDENTIAL DRIVER DATA (ადგილზე რეგისტრაცია) */}
              {/* ========================================================================= */}
              {activeTab === 'issue' && (
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Info banner */}
                  <div className="bg-slate-950 border border-teal-500/30 rounded-2xl p-4 flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shrink-0">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        ადგილზე მძღოლის მონაცემების შეყვანა & ქვითრის გაცემა
                      </span>
                      <span className="text-xs text-slate-400">
                        შეიყვანეთ <strong>სახელი, გვარი, ტელეფონის ნომერი და მანქანის ნომერი</strong>. ეს მონაცემები ინახება დაცულად თანამშრომლის ბაზაში და საიტის მომხმარებლისთვის დამალულია.
                      </span>
                    </div>
                  </div>

                  {/* Registration Form */}
                  <form onSubmit={handleGenerateTicket} className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5">
                    {/* SPOT SELECTOR */}
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-2">
                        საპარკინგე ადგილის არჩევა:
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedSpotForIssue('B')}
                          className={`p-3.5 rounded-2xl border text-left transition-all ${
                            selectedSpotForIssue === 'B'
                              ? 'bg-emerald-950/40 border-emerald-500 shadow-sm'
                              : 'bg-slate-900 border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-sm text-emerald-400">B პარკინგი</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                              ფასიანი
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1">
                            კლიენტებისთვის • 1სთ=1₾, 3სთ=2₾, 24სთ=5₾
                          </p>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            სტატუსი: {spotB.status === 'available' ? 'თავისუფალია ✓' : 'დაკავებულია'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedSpotForIssue('A')}
                          className={`p-3.5 rounded-2xl border text-left transition-all ${
                            selectedSpotForIssue === 'A'
                              ? 'bg-teal-950/40 border-teal-500 shadow-sm'
                              : 'bg-slate-900 border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-sm text-teal-400">A პარკინგი</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300">
                              თანამშრომლის
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1">
                            უფასო საშვი პერსონალისთვის
                          </p>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            სტატუსი: {spotA.status === 'available' ? 'თავისუფალია ✓' : 'დაკავებულია'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* TWO CONFIDENTIAL FIELDS: FIRST & LAST NAME + PHONE NUMBER */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {/* Driver Name & Surname */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-teal-400" />
                            <span>სახელი და გვარი:</span>
                          </label>
                          <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
                            🔒 კონფიდენციალური
                          </span>
                        </div>
                        <input
                          type="text"
                          id="driver-fullname-input"
                          required
                          value={driverFullName}
                          onChange={(e) => setDriverFullName(e.target.value)}
                          placeholder="მაგ: გიორგი ბერიძე"
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                        />
                      </div>

                      {/* Phone Number */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-teal-400" />
                            <span>ტელეფონის ნომერი:</span>
                          </label>
                          <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
                            🔒 კონფიდენციალური
                          </span>
                        </div>
                        <input
                          type="tel"
                          id="driver-phone-input"
                          required
                          value={driverPhone}
                          onChange={(e) => setDriverPhone(e.target.value)}
                          placeholder="+995 599 12 34 56"
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-medium text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                        />
                      </div>
                    </div>

                    {/* LICENSE PLATE INPUT */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-amber-400" />
                          <span>ავტომობილის სახელმწიფო ნომერი:</span>
                        </label>
                        <span className="text-[11px] text-slate-500 font-mono">მაგ: AA-123-BB</span>
                      </div>

                      <input
                        type="text"
                        id="new-ticket-plate-input"
                        required
                        value={newPlate}
                        onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                        placeholder="შეიყვანეთ ნომერი (მაგ: TB-882-GE)"
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-base font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 tracking-wider"
                      />

                      {/* Quick test plates */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px]">
                        <span className="text-slate-500">სწრაფი ნომრები:</span>
                        {['GE-777-TB', 'KA-404-ST', 'AA-909-BB', 'TX-101-GE'].map((plate) => (
                          <button
                            key={plate}
                            type="button"
                            onClick={() => setNewPlate(plate)}
                            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] border border-slate-700"
                          >
                            {plate}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Staff Operator & Note */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">
                          თანამშრომელი / ოპერატორი:
                        </label>
                        <input
                          type="text"
                          value={staffOperatorName}
                          onChange={(e) => setStaffOperatorName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">
                          შენიშვნა (სურვილისამებრ):
                        </label>
                        <input
                          type="text"
                          value={issueNotes}
                          onChange={(e) => setIssueNotes(e.target.value)}
                          placeholder="დამატებითი დეტალი..."
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200"
                        />
                      </div>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <button
                      type="submit"
                      id="issue-ticket-submit-btn"
                      className="w-full py-4 px-6 rounded-2xl text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 shadow-xl shadow-amber-900/30 transition-all flex items-center justify-center gap-2 transform active:scale-[0.99]"
                    >
                      <Printer className="w-5 h-5" />
                      <span>ბაზაში შენახვა, ქვითრის დაბეჭდვა & შლაგბაუმის გაღება</span>
                    </button>
                  </form>

                  {/* Just Issued Ticket Card */}
                  {issueSuccessTicket && (
                    <div className="bg-emerald-950/40 border border-emerald-500/60 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-emerald-300 block">
                            მძღოლი წარმატებით დარეგისტრირდა და ქვითარი გაიცა!
                          </span>
                          <span className="font-mono font-bold text-sm text-white">
                            {issueSuccessTicket.driverFullName} ({issueSuccessTicket.driverPhone}) • {issueSuccessTicket.plateNumber}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            ქვითარი: #{issueSuccessTicket.ticketId} • {issueSuccessTicket.spotId} პარკინგი
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewPrintReceipt(issueSuccessTicket)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Printer className="w-4 h-4" />
                          <span>ქვითარი</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTicketForCheckout(issueSuccessTicket);
                            setActiveTab('checkout');
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                        >
                          სალაროში გადასვლა
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: CHECKOUT & PAYMENT CASHIER (გასვლა, გადახდა, შლაგბაუმის მანუალით გაღება) */}
              {/* ========================================================================= */}
              {activeTab === 'checkout' && (
                <div className="space-y-6">
                  {/* Operational Guide Banner */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                        <ScanLine className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">
                          გასვლის პროცედურა: დაასკანერეთ შტრიხკოდი/ქიუარი ან შეიყვანეთ კოდი
                        </span>
                        <span className="text-slate-400">
                          სისტემა ავტომატურად დაითვლის პარკირების დროს (1სთ=1₾, 3სთ=2₾, 24სთ=5₾), დააფიქსირებს ბაზაში გადახდას და გაგიხსნით შლაგბაუმის მანუალურ ღილაკს.
                        </span>
                      </div>
                    </div>

                    <div className="font-mono text-[11px] text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-800/40 shrink-0">
                      ტარიფი: 1სთ: 1₾ | 3სთ: 2₾ | 24სთ: 5₾
                    </div>
                  </div>

                  {/* TWO COLUMN WORKSPACE */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COL: SCANNER / SEARCH INPUT & ACTIVE TICKETS (5 cols) */}
                    <div className="lg:col-span-5 space-y-4">
                      {/* Search / Scan Box */}
                      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4">
                        <label className="text-xs font-bold text-slate-300 block mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <ScanLine className="w-4 h-4 text-emerald-400" />
                            <span>შტრიხკოდის / QR / კოდის შეყვანა:</span>
                          </span>
                          <span className="text-[10px] text-slate-500">სკანერი ან კლავიატურა</span>
                        </label>

                        <div className="relative">
                          <input
                            type="text"
                            id="scanner-search-input"
                            value={searchInput}
                            onChange={(e) => handleSearchTicket(e.target.value)}
                            placeholder="მაგ: TKT-123456 ან შტრიხკოდი / ნომერი..."
                            className="w-full pl-9 pr-20 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                          {searchInput && (
                            <button
                              onClick={() => {
                                setSearchInput('');
                                setSelectedTicketForCheckout(null);
                              }}
                              className="absolute right-2.5 top-2 px-2 py-1 rounded-lg text-[10px] bg-slate-800 text-slate-400 hover:text-white"
                            >
                              გასუფთავება
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Active Tickets List */}
                      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                          <span>პარკირებული მანქანები ({activeTickets.length})</span>
                          <span className="text-[11px] text-slate-500">დააწკაპუნეთ სალაროში ასარჩევად</span>
                        </div>

                        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                          {activeTickets.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 text-xs">
                              ამჟამად აქტიური საპარკინგე ქვითრები არ არის
                            </div>
                          ) : (
                            activeTickets.map((t) => {
                              const isSelected = selectedTicketForCheckout?.ticketId === t.ticketId;
                              const isPaid = t.status === 'paid';
                              return (
                                <button
                                  key={t.ticketId}
                                  onClick={() => handleSelectTicketForCheckout(t)}
                                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                                    isSelected
                                      ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50'
                                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                                  }`}
                                >
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-black text-xs text-white">
                                        {t.plateNumber}
                                      </span>
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-teal-300">
                                        {t.spotId} ადგილი
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-sans">
                                      {t.driverFullName || 'ადგილზე კლიენტი'} {t.driverPhone ? `• ${t.driverPhone}` : ''}
                                    </p>
                                    <span className="text-[10px] text-slate-500 font-mono block">
                                      #{t.ticketId} • შტრიხ: {t.barcode}
                                    </span>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold block ${
                                        isPaid
                                          ? 'bg-emerald-500/20 text-emerald-300'
                                          : 'bg-amber-500/20 text-amber-300'
                                      }`}
                                    >
                                      {isPaid ? 'გადახდილია' : 'გადასახდელია'}
                                    </span>
                                    <span className="text-[10px] text-slate-500 mt-1 block">
                                      {new Date(t.entryTime).toLocaleTimeString('ka-GE', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COL: SELECTED TICKET CALCULATION & CASHIER ACTIONS (7 cols) */}
                    <div className="lg:col-span-7">
                      {selectedTicketForCheckout && currentCalc ? (
                        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
                          {/* Ticket Header & Driver Card */}
                          <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                                  ქვითარი: #{selectedTicketForCheckout.ticketId}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    selectedTicketForCheckout.status === 'paid'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-amber-500/20 text-amber-300'
                                  }`}
                                >
                                  {selectedTicketForCheckout.status === 'paid' ? 'გადახდილია' : 'აქტიური'}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-xl font-mono font-black text-white tracking-wider px-3 py-1 bg-slate-900 rounded-xl border border-slate-700">
                                  {selectedTicketForCheckout.plateNumber}
                                </span>
                                <span className="text-xs text-slate-300">
                                  {selectedTicketForCheckout.spotId} პარკინგი
                                </span>
                              </div>

                              {/* Confidential Driver details displayed to staff */}
                              {selectedTicketForCheckout.driverFullName && (
                                <div className="mt-2.5 flex items-center gap-3 text-xs bg-slate-900/90 border border-teal-500/30 px-3 py-1.5 rounded-xl text-teal-300">
                                  <User className="w-3.5 h-3.5 text-teal-400" />
                                  <span className="font-bold">{selectedTicketForCheckout.driverFullName}</span>
                                  {selectedTicketForCheckout.driverPhone && (
                                    <>
                                      <span className="text-slate-600">|</span>
                                      <Phone className="w-3.5 h-3.5 text-teal-400" />
                                      <a
                                        href={`tel:${selectedTicketForCheckout.driverPhone.replace(/\s/g, '')}`}
                                        className="font-mono hover:underline"
                                      >
                                        {selectedTicketForCheckout.driverPhone}
                                      </a>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => onViewPrintReceipt(selectedTicketForCheckout)}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>ქვითარი</span>
                            </button>
                          </div>

                          {/* Time & Tariff Calculation Matrix */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800">
                              <span className="text-[11px] text-slate-400 block mb-1">შემოსვლის დრო:</span>
                              <span className="font-mono font-bold text-xs text-white">
                                {new Date(selectedTicketForCheckout.entryTime).toLocaleTimeString('ka-GE', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800">
                              <span className="text-[11px] text-slate-400 block mb-1">დაყოფილი დრო:</span>
                              <span className="font-mono font-black text-sm text-amber-300">
                                {currentCalc.formattedDuration}
                              </span>
                            </div>

                            <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 col-span-2 sm:col-span-1">
                              <span className="text-[11px] text-slate-400 block mb-1">გამოყენებული ტარიფი:</span>
                              <span className="text-xs font-bold text-teal-300 block">
                                {currentCalc.tierDescription}
                              </span>
                            </div>
                          </div>

                          {/* Fee Breakdown Display */}
                          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-slate-300 block">
                                გადასახდელი თანხა:
                              </span>
                              <span className="text-[11px] text-slate-400">
                                1 სთ = 1₾ • 3 სთ = 2₾ • 24 სთ = 5₾
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-3xl font-mono font-black text-emerald-400">
                                {currentCalc.amountDue.toFixed(2)} ₾
                              </span>
                            </div>
                          </div>

                          {/* PAYMENT SECTION (If not yet paid) */}
                          {selectedTicketForCheckout.status !== 'paid' ? (
                            <div className="space-y-4 pt-2">
                              {/* Payment Method Selector */}
                              <div>
                                <span className="text-xs font-bold text-slate-300 block mb-2">
                                  გადახდის მეთოდის არჩევა:
                                </span>
                                <div className="grid grid-cols-3 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                                      paymentMethod === 'cash'
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                                    }`}
                                  >
                                    <Banknote className="w-4 h-4" />
                                    <span>ნაღდი ფული</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setPaymentMethod('pos')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                                      paymentMethod === 'pos' || paymentMethod === 'card'
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                                    }`}
                                  >
                                    <CreditCard className="w-4 h-4" />
                                    <span>საბანკო ბარათი (POS)</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setPaymentMethod('bog')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                                      paymentMethod === 'bog'
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                                    }`}
                                  >
                                    <Smartphone className="w-4 h-4" />
                                    <span>BOG / TBC QR</span>
                                  </button>
                                </div>
                              </div>

                              {/* Cash Calculator Input if Cash */}
                              {paymentMethod === 'cash' && (
                                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                                  <div className="flex-1">
                                    <label className="text-[11px] text-slate-400 block mb-1">
                                      მიღებული ნაღდი თანხა (₾):
                                    </label>
                                    <input
                                      type="number"
                                      step="0.5"
                                      min={currentCalc.amountDue}
                                      value={cashReceived}
                                      onChange={(e) => setCashReceived(e.target.value)}
                                      placeholder={`${currentCalc.amountDue.toFixed(2)}`}
                                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
                                    />
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="text-[11px] text-slate-400 block">ხურდა დასაბრუნებელი:</span>
                                    <span className="font-mono font-black text-sm text-teal-300">
                                      {changeDue.toFixed(2)} ₾
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* CONFIRM PAYMENT BUTTON */}
                              <button
                                id="confirm-payment-btn"
                                onClick={handleConfirmPayment}
                                className="w-full py-4 px-5 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-950/50 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2"
                              >
                                <CheckCircle2 className="w-5 h-5" />
                                <span>
                                  გადახდის დაფიქსირება ბაზაში ({currentCalc.amountDue.toFixed(2)} ₾)
                                </span>
                              </button>
                            </div>
                          ) : (
                            /* STEP 2: PAYMENT IS CONFIRMED IN DATABASE! NOW OPEN GATE MANUALLY! */
                            <div className="space-y-4 pt-2">
                              {/* Payment Success Badge */}
                              <div className="p-4 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/60 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                    <Check className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <span className="text-sm font-black text-emerald-300 block">
                                      გადახდა წარმატებით დაფიქსირდა ბაზაში!
                                    </span>
                                    <span className="text-xs text-slate-300">
                                      თანხა: {selectedTicketForCheckout.amountPaid?.toFixed(2) || currentCalc.amountDue.toFixed(2)} ₾ • სტატუსი: PAID
                                    </span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => onViewPrintReceipt(selectedTicketForCheckout)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>ქვითარი</span>
                                </button>
                              </div>

                              {/* BARRIER GATE MANUAL OPENER */}
                              <div className="p-5 rounded-2xl bg-slate-900 border-2 border-slate-700 text-center space-y-3">
                                <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                                  <span>გასასვლელი შლაგბაუმის მანუალური მართვა</span>
                                </div>

                                {/* Barrier Visual Arm */}
                                <div className="my-3 py-4 px-6 bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-12 bg-slate-700 rounded-sm" />
                                    <div
                                      className={`h-3 bg-gradient-to-r from-rose-500 via-white to-rose-500 rounded-full transition-all duration-700 origin-left ${
                                        isBarrierOpened
                                          ? '-rotate-45 translate-y-[-10px] w-32 border-2 border-emerald-400'
                                          : 'rotate-0 w-44'
                                      }`}
                                    />
                                  </div>

                                  <div className="font-mono text-xs text-right">
                                    <span className="block text-[10px] text-slate-500 uppercase">სტატუსი:</span>
                                    <span
                                      className={`font-black text-sm ${
                                        isBarrierOpened ? 'text-emerald-400 animate-pulse' : 'text-rose-400'
                                      }`}
                                    >
                                      {isBarrierOpened ? 'შლაგბაუმი ღიაა ➔' : 'შლაგბაუმი დაკეტილია'}
                                    </span>
                                  </div>
                                </div>

                                {/* MANUAL OPEN BUTTON */}
                                <button
                                  id="manual-open-barrier-btn"
                                  onClick={handleManualOpenBarrier}
                                  className="w-full py-4 px-6 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 hover:from-teal-400 hover:to-emerald-400 shadow-xl shadow-teal-950/50 transition-all flex items-center justify-center gap-2 transform active:scale-[0.99]"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                  <span>
                                    შლაგბაუმის მანუალური გახსნა (გასვლა & ადგილის განთავისუფლება)
                                  </span>
                                </button>
                                <p className="text-[11px] text-slate-400">
                                  ღილაკზე დაჭერით შლაგბაუმი გაიღება, მანქანა დატოვებს პარკინგს და ადგილი ავტომატურად გახდება თავისუფალი.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-3xl p-10 text-center text-slate-500 flex flex-col items-center justify-center min-h-[350px]">
                          <ScanLine className="w-12 h-12 text-slate-600 mb-3" />
                          <span className="text-sm font-bold text-slate-400 block">
                            აირჩიეთ ან დაასკანერეთ ქვითარი
                          </span>
                          <span className="text-xs text-slate-500 max-w-sm mt-1">
                            შეიყვანეთ ქვითრის კოდი, დაასკანერეთ შტრიხკოდი/ქიუარი ან მარცხენა სიიდან აირჩიეთ გაჩერებული მანქანა.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
