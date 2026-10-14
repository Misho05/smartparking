import React, { useState, useEffect } from 'react';
import {
  Car,
  Plus,
  Unlock,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Clock,
  CreditCard,
  UserCheck,
  ShieldCheck,
  Phone,
  User,
  Building,
  Receipt,
  Banknote,
  Smartphone,
  Tag,
  ArrowRight,
  Info,
  Calendar,
  Zap,
} from 'lucide-react';
import { ParkingSpot, EmployeeRecord, PaidCustomerRecord, Language } from '../types';
import { translations } from '../utils/translations';
import { lookupDriverByPlate } from '../utils/driverDirectory';
import confetti from 'canvas-confetti';

export interface QuickAddSubmitData {
  spotId: 'A' | 'B';
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  vehicleType: string;
  durationHours: number;
  department: string;
  paymentMethod: 'cash' | 'card' | 'pos' | 'bog' | 'tbc' | 'on_exit';
  isPaidImmediately: boolean;
  amountPaid: number;
  saveToDb: boolean;
  replaceIfOccupied: boolean;
  openReceiptAfter: boolean;
}

export interface QuickAddDbOnlyData {
  spotId: 'A' | 'B';
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  department?: string;
  durationDays?: number;
}

interface QuickAddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  spots: ParkingSpot[];
  employees: EmployeeRecord[];
  paidCustomers: PaidCustomerRecord[];
  onParkVehicle: (data: QuickAddSubmitData) => void;
  onSaveToDbOnly: (data: QuickAddDbOnlyData) => void;
  lang?: Language;
  defaultSpotId?: 'A' | 'B';
  prefilledPlate?: string;
}

const SAMPLE_PLATES = ['GEO-777', 'EMP-555', 'TB-123-BC', 'AA-999-AA', 'VIP-001'];

export const QuickAddVehicleModal: React.FC<QuickAddVehicleModalProps> = ({
  isOpen,
  onClose,
  spots,
  employees,
  paidCustomers,
  onParkVehicle,
  onSaveToDbOnly,
  lang = 'ka',
  defaultSpotId = 'A',
  prefilledPlate = '',
}) => {
  const [selectedSpotId, setSelectedSpotId] = useState<'A' | 'B'>(defaultSpotId);
  const [plateNumber, setPlateNumber] = useState(prefilledPlate);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('sedan');
  
  // Spot A specific
  const [department, setDepartment] = useState('ადმინისტრაცია');
  const [employeePassType, setEmployeePassType] = useState<'permanent' | 'temporary'>('permanent');
  
  // Spot B specific
  const [durationTier, setDurationTier] = useState<number>(3); // 1, 3, 24, or custom
  const [paymentChoice, setPaymentChoice] = useState<'on_exit' | 'cash' | 'bog' | 'tbc' | 'card'>('on_exit');
  const [openReceiptAfter, setOpenReceiptAfter] = useState<boolean>(true);
  
  // Common
  const [saveToDb, setSaveToDb] = useState<boolean>(true);
  const [replaceIfOccupied, setReplaceIfOccupied] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Sync initial props
  useEffect(() => {
    if (isOpen) {
      if (defaultSpotId) setSelectedSpotId(defaultSpotId);
      if (prefilledPlate) {
        setPlateNumber(prefilledPlate.toUpperCase());
        autoCheckPlate(prefilledPlate.toUpperCase());
      }
      setErrorMsg('');
    }
  }, [isOpen, defaultSpotId, prefilledPlate]);

  // Lookup on plate change
  const autoCheckPlate = (plate: string) => {
    const clean = plate.trim().toUpperCase();
    if (!clean) return;

    // 1. Check existing employees
    const emp = employees.find((e) => e.plateNumber.toUpperCase() === clean);
    if (emp) {
      if (!driverName) setDriverName(emp.fullName);
      if (!driverPhone) setDriverPhone(emp.phone);
      if (emp.department) setDepartment(emp.department);
      return;
    }

    // 2. Check existing paid customers
    const cust = paidCustomers.find((c) => c.plateNumber.toUpperCase() === clean);
    if (cust) {
      if (!driverName) setDriverName(cust.driverName);
      if (!driverPhone) setDriverPhone(cust.phone);
      return;
    }

    // 3. Check directory
    const dir = lookupDriverByPlate(clean);
    if (dir) {
      if (!driverName) setDriverName(dir.fullName);
      if (!driverPhone && dir.phone) setDriverPhone(dir.phone);
      if (dir.notes && dir.notes.includes('დეპარტამენტი:')) {
        const parts = dir.notes.split('დეპარტამენტი:')[1];
        if (parts) setDepartment(parts.trim());
      }
    }
  };

  const handlePlateChange = (val: string) => {
    const formatted = val.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setPlateNumber(formatted);
    setErrorMsg('');
    if (formatted.length >= 3) {
      autoCheckPlate(formatted);
    }
  };

  const currentSpot = spots.find((s) => s.id === selectedSpotId);
  const spotA = spots.find((s) => s.id === 'A');
  const spotB = spots.find((s) => s.id === 'B');

  const isCurrentSpotOccupied = currentSpot?.status === 'occupied';

  // Calculate pricing for Spot B
  const calculateTierPrice = (hours: number) => {
    if (hours === 1) return 1.0;
    if (hours === 3) return 2.0;
    if (hours === 24) return 5.0;
    return hours * 1.0;
  };

  const spotBPrice = calculateTierPrice(durationTier);

  // Matched info for visual banner
  const matchedEmp = employees.find(
    (e) => plateNumber && e.plateNumber.toUpperCase() === plateNumber.trim().toUpperCase()
  );
  const matchedCust = paidCustomers.find(
    (c) => plateNumber && c.plateNumber.toUpperCase() === plateNumber.trim().toUpperCase()
  );

  const handleApplySamplePlate = (sample: string) => {
    setPlateNumber(sample);
    autoCheckPlate(sample);
  };

  // Submit: Park car now
  const handleParkNow = () => {
    const cleanPlate = plateNumber.trim().toUpperCase();
    if (!cleanPlate) {
      setErrorMsg('გთხოვთ მიუთითოთ ავტომობილის სანომრე ნიშანი (მაგ. AA-123-BB)');
      return;
    }

    const name = driverName.trim() || (selectedSpotId === 'A' ? 'თანამშრომელი' : 'კლიენტი');
    const isPaid = selectedSpotId === 'B' && paymentChoice !== 'on_exit';
    const amount = selectedSpotId === 'A' ? 0 : spotBPrice;

    // Trigger visual confetti
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // Ignore if unavailable
    }

    onParkVehicle({
      spotId: selectedSpotId,
      plateNumber: cleanPlate,
      driverName: name,
      driverPhone: driverPhone.trim(),
      vehicleType,
      durationHours: selectedSpotId === 'A' ? 8 : durationTier,
      department: selectedSpotId === 'A' ? department : '',
      paymentMethod: selectedSpotId === 'A' ? 'cash' : (paymentChoice as any),
      isPaidImmediately: isPaid,
      amountPaid: isPaid ? amount : 0,
      saveToDb,
      replaceIfOccupied,
      openReceiptAfter: selectedSpotId === 'B' && openReceiptAfter,
    });

    onClose();
  };

  // Submit: Save to DB only
  const handleSaveDbOnly = () => {
    const cleanPlate = plateNumber.trim().toUpperCase();
    if (!cleanPlate) {
      setErrorMsg('გთხოვთ მიუთითოთ ავტომობილის სანომრე ნიშანი');
      return;
    }

    const name = driverName.trim() || (selectedSpotId === 'A' ? 'თანამშრომელი' : 'კლიენტი');

    onSaveToDbOnly({
      spotId: selectedSpotId,
      plateNumber: cleanPlate,
      driverName: name,
      driverPhone: driverPhone.trim(),
      department: selectedSpotId === 'A' ? department : undefined,
      durationDays: selectedSpotId === 'A' ? 365 : 30,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header Bar */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-teal-900/60 via-slate-900 to-indigo-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/20">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  + დამატება • რეგისტრაცია & მანუალით გაღება
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  თანამშრომლის რეჟიმი
                </span>
              </div>
              <p className="text-xs text-slate-400">
                აირჩიეთ <strong className="text-teal-300">A</strong> ან{' '}
                <strong className="text-indigo-300">B</strong> პარკინგი: მხოლოდ ბაზაში დამატება ან მანუალით გაღება (ხელით გახსნა)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="დახურვა"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* STEP 1: CHOOSE A OR B PARKING */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  1
                </span>
                <span>საპარკინგე ადგილის არჩევა (A თუ B)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                დააჭირეთ სასურველ პარკინგს
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Option A: Employee Spot */}
              <button
                type="button"
                onClick={() => setSelectedSpotId('A')}
                className={`relative text-left p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  selectedSpotId === 'A'
                    ? 'bg-teal-950/40 border-teal-400 ring-2 ring-teal-400/30 shadow-lg shadow-teal-500/10'
                    : 'bg-slate-850/60 border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-500 text-slate-950 font-black text-sm flex items-center justify-center font-mono shadow-sm">
                        A
                      </div>
                      <span className="font-extrabold text-sm text-white">
                        A პარკინგი
                      </span>
                    </div>
                    {selectedSpotId === 'A' ? (
                      <div className="w-5 h-5 rounded-full bg-teal-400 text-slate-950 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">არჩევა</span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-teal-300 mb-2">
                    სამსახურებრივი / თანამშრომელი
                  </p>

                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>სტატუსი:</span>
                      {spotA?.status === 'available' ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" /> თავისუფალია
                        </span>
                      ) : (
                        <span className="text-amber-300 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />{' '}
                          დაკავებულია ({spotA?.occupiedBy?.plateNumber || 'მანქანა'})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>ტარიფი:</span>
                      <span className="font-bold text-white">0.00 ₾ (უფასო)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-1 text-[11px] text-teal-400/90 font-medium">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>სამსახურებრივი საშვი & ANPR ავტო-დაშვება</span>
                </div>
              </button>

              {/* Option B: Paid Customer Spot */}
              <button
                type="button"
                onClick={() => setSelectedSpotId('B')}
                className={`relative text-left p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  selectedSpotId === 'B'
                    ? 'bg-indigo-950/40 border-indigo-400 ring-2 ring-indigo-400/30 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-850/60 border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white font-black text-sm flex items-center justify-center font-mono shadow-sm">
                        B
                      </div>
                      <span className="font-extrabold text-sm text-white">
                        B პარკინგი
                      </span>
                    </div>
                    {selectedSpotId === 'B' ? (
                      <div className="w-5 h-5 rounded-full bg-indigo-400 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">არჩევა</span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-indigo-300 mb-2">
                    ფასიანი კლიენტი / სტუმარი
                  </p>

                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>სტატუსი:</span>
                      {spotB?.status === 'available' ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" /> თავისუფალია
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-400" />{' '}
                          დაკავებულია ({spotB?.occupiedBy?.plateNumber || 'მანქანა'})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>ტარიფი:</span>
                      <span className="font-bold text-amber-300">1₾/სთ • 2₾/3სთ • 5₾/24სთ</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-1 text-[11px] text-indigo-300 font-medium">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>სალარო, ქვითარი QR/შტრიხკოდით & გადახდა</span>
                </div>
              </button>
            </div>
          </div>

          {/* STEP 2: PLATE NUMBER INPUT WITH GEORGIAN VISUAL PLATE */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  2
                </span>
                <span>ავტომობილის სანომრე ნიშანი</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                სწრაფი ნიმუშები:
              </span>
            </div>

            {/* Quick samples bar */}
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
              {SAMPLE_PLATES.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => handleApplySamplePlate(sample)}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shrink-0 transition-all hover:border-teal-500/50"
                >
                  {sample}
                </button>
              ))}
            </div>

            {/* Realistic Plate Box & Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Graphic plate badge */}
              <div className="relative shrink-0 flex items-center bg-white border-2 border-slate-300 rounded-xl overflow-hidden shadow-md h-13 px-1 min-w-[200px]">
                {/* Georgian flag strip */}
                <div className="bg-blue-800 text-white h-full px-2.5 flex flex-col items-center justify-center rounded-l-lg select-none">
                  <div className="text-[9px] font-black leading-none text-red-500 bg-white px-0.5 rounded-xs">
                    + +
                  </div>
                  <span className="text-[11px] font-black tracking-widest mt-0.5">GE</span>
                </div>
                {/* Plate center */}
                <div className="flex-1 text-center px-3 font-mono font-black text-xl text-slate-950 tracking-wider">
                  {plateNumber || 'AA-123-BB'}
                </div>
              </div>

              {/* Main text input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={plateNumber}
                  onChange={(e) => handlePlateChange(e.target.value)}
                  placeholder="მაგ: AA-123-BB ან GEO-777"
                  className="w-full h-13 px-4 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-lg focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 placeholder:text-slate-600 transition-all uppercase"
                />
              </div>
            </div>

            {/* Matched Banner if exists */}
            {(matchedEmp || matchedCust) && (
              <div className="mt-2.5 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between text-xs text-teal-300 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>
                    ნაპოვნია ბაზაში:{' '}
                    <strong className="text-white">
                      {matchedEmp ? matchedEmp.fullName : matchedCust?.driverName}
                    </strong>{' '}
                    ({matchedEmp ? `თანამშრომელი: ${matchedEmp.department}` : 'ფასიანი კლიენტი'})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (matchedEmp) {
                      setDriverName(matchedEmp.fullName);
                      setDriverPhone(matchedEmp.phone);
                      setDepartment(matchedEmp.department);
                      setSelectedSpotId('A');
                    } else if (matchedCust) {
                      setDriverName(matchedCust.driverName);
                      setDriverPhone(matchedCust.phone);
                      setSelectedSpotId('B');
                    }
                  }}
                  className="px-2 py-1 rounded bg-teal-500 text-slate-950 font-bold text-[11px] hover:bg-teal-400 transition-colors"
                >
                  მონაცემების შევსება
                </button>
              </div>
            )}
          </div>

          {/* STEP 3: DRIVER & VEHICLE DETAILS */}
          <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 space-y-3.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 font-black text-xs flex items-center justify-center">
                3
              </span>
              <span>მძღოლის & ავტომობილის მონაცემები</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Driver Full Name */}
              <div>
                <label className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>მძღოლის სახელი და გვარი</span>
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder={selectedSpotId === 'A' ? 'მაგ: გიორგი ბერიძე' : 'მაგ: დავით კაპანაძე'}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Driver Phone */}
              <div>
                <label className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>ტელეფონის ნომერი (SMS ქვითრისთვის)</span>
                </label>
                <input
                  type="tel"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="მაგ: 599 12 34 56"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-slate-500" />
                <span>ავტომობილის კატეგორია</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'sedan', label: 'სედანი', icon: '🚗' },
                  { id: 'suv', label: 'ჯიპი / SUV', icon: '🚙' },
                  { id: 'electric', label: 'EV ელექტრო', icon: '⚡' },
                  { id: 'van', label: 'მინივენი', icon: '🚐' },
                ].map((vt) => (
                  <button
                    key={vt.id}
                    type="button"
                    onClick={() => setVehicleType(vt.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      vehicleType === vt.id
                        ? 'bg-teal-500/20 text-teal-200 border-teal-400 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{vt.icon}</span>
                    <span className="hidden sm:inline">{vt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 4: SPOT-SPECIFIC SETTINGS */}
          {selectedSpotId === 'A' ? (
            /* ============= CONFIGURATION FOR SPOT A (EMPLOYEE) ============= */
            <div className="p-4 rounded-2xl bg-teal-950/20 border border-teal-500/30 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-teal-300 font-bold text-xs">
                  <UserCheck className="w-4 h-4 text-teal-400" />
                  <span>A პარკინგის პარამეტრები (თანამშრომლის საშვი)</span>
                </div>
                <span className="text-[11px] font-black text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                  0.00 ₾ • უფასო
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-teal-400" />
                    <span>დეპარტამენტი / სამსახური</span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-400"
                  >
                    <option value="ადმინისტრაცია">ადმინისტრაცია</option>
                    <option value="IT & განვითარება">IT & განვითარება</option>
                    <option value="მენეჯმენტი">მენეჯმენტი</option>
                    <option value="უსაფრთხოება / დაცვა">უსაფრთხოება / დაცვა</option>
                    <option value="ფინანსები & ბუღალტერია">ფინანსები & ბუღალტერია</option>
                    <option value="ლოჯისტიკა">ლოჯისტიკა</option>
                    <option value="სტუმარი / დელეგაცია">სტუმარი / დელეგაცია</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    <span>საშვის ტიპი</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEmployeePassType('permanent')}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                        employeePassType === 'permanent'
                          ? 'bg-teal-500/25 text-teal-200 border-teal-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      მუდმივი თანამშრომელი
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmployeePassType('temporary')}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                        employeePassType === 'temporary'
                          ? 'bg-teal-500/25 text-teal-200 border-teal-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      ერთჯერადი საშვი
                    </button>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={saveToDb}
                  onChange={(e) => setSaveToDb(e.target.checked)}
                  className="rounded border-slate-700 text-teal-500 focus:ring-teal-400 w-4 h-4"
                />
                <span>
                  შენახვა თანამშრომელთა მუდმივ ბაზაში (ANPR კამერა ავტომატურად გაუღებს შლაგბაუმს შემდეგ ვიზიტზე)
                </span>
              </label>
            </div>
          ) : (
            /* ============= CONFIGURATION FOR SPOT B (PAID) ============= */
            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                  <Receipt className="w-4 h-4 text-indigo-400" />
                  <span>B პარკინგის ტარიფი & გადახდა</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  <span>თანხა:</span>
                  <span className="text-base font-black">{spotBPrice.toFixed(2)} ₾</span>
                </div>
              </div>

              {/* Tiers */}
              <div>
                <label className="text-[11px] text-slate-400 font-semibold mb-1 block">
                  პარკირების დრო / სატარიფო პაკეტი:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { hours: 1, label: '1 საათი', price: '1.00 ₾' },
                    { hours: 3, label: '3 საათი (პოპულარული)', price: '2.00 ₾' },
                    { hours: 24, label: '24 საათი (დღე-ღამე)', price: '5.00 ₾' },
                  ].map((tier) => (
                    <button
                      key={tier.hours}
                      type="button"
                      onClick={() => setDurationTier(tier.hours)}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        durationTier === tier.hours
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/20'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-extrabold text-xs">{tier.label}</div>
                      <div className="font-mono text-[11px] text-amber-300 mt-0.5 font-bold">
                        {tier.price}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-[11px] text-slate-400 font-semibold mb-1 block">
                  გადახდის მეთოდი:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentChoice('on_exit')}
                    className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                      paymentChoice === 'on_exit'
                        ? 'bg-amber-500/25 text-amber-200 border-amber-400 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>გადახდა გასვლისას</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentChoice('cash')}
                    className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                      paymentChoice === 'cash'
                        ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ნაღდი (სალარო)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentChoice('bog')}
                    className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                      paymentChoice === 'bog'
                        ? 'bg-orange-500/25 text-orange-200 border-orange-400 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-orange-500" />
                    <span>BOG QR / ბანკი</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentChoice('tbc')}
                    className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                      paymentChoice === 'tbc'
                        ? 'bg-sky-500/25 text-sky-200 border-sky-400 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-sky-500" />
                    <span>თიბისი (TBC QR)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentChoice('card')}
                    className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                      paymentChoice === 'card'
                        ? 'bg-indigo-500/25 text-indigo-200 border-indigo-400 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                    <span>POS / ბარათი</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openReceiptAfter}
                    onChange={(e) => setOpenReceiptAfter(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-500 focus:ring-indigo-400 w-4 h-4"
                  />
                  <span>დამატებისთანავე ქვითრის გახსნა (ამობეჭდვა / QR)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveToDb}
                    onChange={(e) => setSaveToDb(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-500 focus:ring-indigo-400 w-4 h-4"
                  />
                  <span>კლიენტთა ბაზაში შენახვა</span>
                </label>
              </div>
            </div>
          )}

          {/* WARNING IF SPOT IS OCCUPIED */}
          {isCurrentSpotOccupied && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300">
                  ყურადღება: {selectedSpotId} პარკინგი ამჟამად დაკავებულია!
                </p>
                <p className="text-slate-300 mt-0.5">
                  ადგილზე იმყოფება: <strong className="text-white font-mono">{currentSpot?.occupiedBy?.plateNumber}</strong>{' '}
                  ({currentSpot?.occupiedBy?.driverName || 'მძღოლი'}). ახალი ავტომობილის შემოყვანისას, წინა ავტომობილი განთავისუფლდება.
                </p>
                <label className="flex items-center gap-2 mt-2 cursor-pointer font-semibold text-white">
                  <input
                    type="checkbox"
                    checked={replaceIfOccupied}
                    onChange={(e) => setReplaceIfOccupied(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-400 w-4 h-4"
                  />
                  <span>დადასტურება: ძველი მანქანის გაყვანა და ახლის ჩაყენება</span>
                </label>
              </div>
            </div>
          )}

          {/* ERROR DISPLAY */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Operator Note on Manual Barrier Opening */}
        <div className="px-6 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              <strong>მანუალით გაღება:</strong> ამ დროს თანამშრომელი ხელით აღებს შლაგბაუმს და მანქანა შედის {selectedSpotId} პარკინგზე.
            </span>
          </div>
          <span className="text-teal-400 font-mono text-[11px] hidden sm:inline">თანამშრომლის კონტროლი</span>
        </div>

        {/* Modal Action Footer */}
        <div className="p-5 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSaveDbOnly}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-teal-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-teal-500/40 hover:border-teal-400 transition-all flex items-center justify-center gap-2 shadow-sm"
            title="მხოლოდ ბაზაში დამატება (შლაგბაუმის გაღების გარეშე)"
          >
            <span>💾 მხოლოდ ბაზაში დამატება</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
            >
              გაუქმება
            </button>

            <button
              type="button"
              id="quick-add-submit-park-btn"
              onClick={handleParkNow}
              className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg ${
                selectedSpotId === 'A'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 shadow-teal-500/25'
                  : 'bg-gradient-to-r from-indigo-500 via-teal-500 to-emerald-600 hover:opacity-95 text-slate-950 shadow-indigo-500/25'
              }`}
              title="თანამშრომელი ხელით აღებს შლაგბაუმს და აყენებს ავტომობილს"
            >
              <Unlock className="w-4 h-4 stroke-[2.5]" />
              <span>🚧 მანუალით გაღება & {selectedSpotId} პარკირება</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
