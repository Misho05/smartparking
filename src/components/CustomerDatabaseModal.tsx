import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  Search,
  Filter,
  Plus,
  Trash2,
  Receipt,
  LogOut,
  LogIn,
  Camera,
  CheckCircle2,
  Clock,
  Car,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Smartphone,
  Phone,
  User,
  ExternalLink,
  ChevronRight,
  Database,
  Building,
  Lock,
  ShieldAlert,
  Edit3,
} from 'lucide-react';
import {
  PaidCustomerRecord,
  ParkingTicket,
  Reservation,
  VehicleActivityLog,
  ParkingSpot,
  Language,
} from '../types';
import { usePricingConfig, calculateParkingPrice } from '../utils/pricing';

export interface CustomerDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  paidCustomers: PaidCustomerRecord[];
  tickets: ParkingTicket[];
  reservations: Reservation[];
  vehicleLogs: VehicleActivityLog[];
  spotB?: ParkingSpot;
  onAddPaidCustomer: (customer: Omit<PaidCustomerRecord, 'id'>) => void;
  onUpdatePaidCustomer?: (id: string, updated: Partial<PaidCustomerRecord>) => void;
  onDeletePaidCustomer: (id: string) => void;
  onViewReceipt?: (ticket: ParkingTicket) => void;
  onManualCheckoutAndExit?: (ticket: ParkingTicket) => void;
  onTestPlateInCamera: (plate: string) => void;
  onSwitchToEmployeeDb?: () => void;
  onOpenAdminPanel?: () => void;
  isAdmin?: boolean;
  lang: Language;
}

export const CustomerDatabaseModal: React.FC<CustomerDatabaseModalProps> = ({
  isOpen,
  onClose,
  paidCustomers,
  tickets,
  reservations,
  vehicleLogs,
  spotB,
  onAddPaidCustomer,
  onUpdatePaidCustomer,
  onDeletePaidCustomer,
  onViewReceipt,
  onManualCheckoutAndExit,
  onTestPlateInCamera,
  onSwitchToEmployeeDb,
  onOpenAdminPanel,
  isAdmin = false,
  lang,
}) => {
  const [viewMode, setViewMode] = useState<'dense' | 'grid'>('dense');
  const { tiers: pricingTiers } = usePricingConfig();

  // Filter category
  const [filterType, setFilterType] = useState<
    'all' | 'active_inside' | 'tickets' | 'online_bookings' | 'completed'
  >('all');

  const [searchQuery, setSearchQuery] = useState('');

  // Add Customer Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [selectedHours, setSelectedHours] = useState<number>(3);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bog' | 'tbc'>('cash');
  const [autoOccupySpotB, setAutoOccupySpotB] = useState<boolean>(true);

  // Compile Unified Customer Entries for comprehensive display
  // Merge tickets, reservations, and paidCustomers into an unified customer view list
  const unifiedCustomerList = useMemo(() => {
    interface UnifiedCustomerItem {
      id: string;
      plateNumber: string;
      customerName: string;
      phone?: string;
      source: 'ticket' | 'registry' | 'reservation';
      status: 'inside' | 'paid' | 'completed' | 'reserved';
      entryTime?: string;
      exitTime?: string;
      validUntil?: string;
      durationFormatted?: string;
      amountDue?: number;
      amountPaid?: number;
      paymentMethod?: string;
      ticketRef?: ParkingTicket;
      barcode?: string;
      notes?: string;
    }

    const items: UnifiedCustomerItem[] = [];

    // 1. Tickets (on-site customer passes)
    tickets.forEach((tkt) => {
      let itemStatus: UnifiedCustomerItem['status'] = 'completed';
      if (tkt.status === 'active') {
        itemStatus = 'inside';
      } else if (tkt.status === 'paid') {
        itemStatus = 'paid';
      }

      // Check if spot B is occupied by this ticket
      if (spotB?.occupiedBy?.plateNumber === tkt.plateNumber && spotB?.status === 'occupied') {
        itemStatus = 'inside';
      }

      items.push({
        id: `tkt-${tkt.ticketId}`,
        plateNumber: tkt.plateNumber,
        customerName: tkt.driverFullName || 'მომხმარებელი (ადგილზე)',
        phone: tkt.driverPhone,
        source: 'ticket',
        status: itemStatus,
        entryTime: tkt.entryTime,
        exitTime: tkt.exitTime,
        durationFormatted: tkt.durationFormatted || 'მიმდინარეობს',
        amountDue: tkt.amountDue,
        amountPaid: tkt.amountPaid,
        paymentMethod: tkt.paymentMethod || 'სალარო',
        ticketRef: tkt,
        barcode: tkt.barcode,
        notes: tkt.notes || `სალაროს ქვითარი #${tkt.ticketId}`,
      });
    });

    // 2. Paid Customer Registry (plates stored in system registry)
    paidCustomers.forEach((pc) => {
      // Check if not already added by ticket with active status
      const existing = items.find((it) => it.plateNumber === pc.plateNumber);
      if (!existing) {
        const isCurrentSpotB = spotB?.occupiedBy?.plateNumber === pc.plateNumber;
        items.push({
          id: `pc-${pc.id}`,
          plateNumber: pc.plateNumber,
          customerName: pc.driverName,
          phone: pc.phone,
          source: 'registry',
          status: isCurrentSpotB ? 'inside' : pc.status === 'active' ? 'inside' : 'completed',
          validUntil: pc.validUntil,
          amountPaid: pc.amountPaid,
          paymentMethod: 'საშვი / რეგისტრაცია',
          notes: `ფასიანი საშვი • ვადა: ${new Date(pc.validUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        });
      }
    });

    // 3. Online Reservations
    reservations.forEach((res) => {
      const existing = items.find((it) => it.plateNumber === res.vehiclePlate);
      if (!existing) {
        items.push({
          id: `res-${res.id}`,
          plateNumber: res.vehiclePlate,
          customerName: res.driverName,
          phone: res.driverPhone,
          source: 'reservation',
          status: res.status === 'active' ? 'inside' : 'completed',
          entryTime: res.startTime,
          exitTime: res.endTime,
          durationFormatted: `${res.durationHours} საათი`,
          amountPaid: res.totalAmount,
          paymentMethod: `ონლაინ (${res.paymentMethod.toUpperCase()})`,
          notes: `ონლაინ ჯავშანი #${res.id.slice(-6)}`,
        });
      }
    });

    return items;
  }, [tickets, paidCustomers, reservations, spotB]);

  // Filter unified records
  const filteredRecords = useMemo(() => {
    return unifiedCustomerList.filter((item) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPlate = item.plateNumber.toLowerCase().includes(q);
        const matchesName = item.customerName.toLowerCase().includes(q);
        const matchesPhone = item.phone?.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        const matchesBarcode = item.barcode?.toLowerCase().includes(q);
        if (!matchesPlate && !matchesName && !matchesPhone && !matchesNotes && !matchesBarcode) {
          return false;
        }
      }

      // Category filter
      if (filterType === 'active_inside') {
        return item.status === 'inside' || item.status === 'paid';
      }
      if (filterType === 'tickets') {
        return item.source === 'ticket';
      }
      if (filterType === 'online_bookings') {
        return item.source === 'reservation';
      }
      if (filterType === 'completed') {
        return item.status === 'completed';
      }

      return true;
    });
  }, [unifiedCustomerList, searchQuery, filterType]);

  // Statistics
  const totalInside = unifiedCustomerList.filter(
    (i) => i.status === 'inside' || i.status === 'paid'
  ).length;
  const totalTickets = tickets.length;
  const totalOnline = reservations.length;
  const totalRevenue = unifiedCustomerList.reduce(
    (sum, i) => sum + (i.amountPaid || i.amountDue || 0),
    0
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate.trim() || !newName.trim()) return;

    const price = calculateParkingPrice(selectedHours);
    const validUntil = new Date(Date.now() + selectedHours * 3600000).toISOString();

    onAddPaidCustomer({
      plateNumber: newPlate.trim().toUpperCase(),
      driverName: newName.trim(),
      phone: newPhone.trim() || '+995 500 00 00 00',
      validUntil,
      amountPaid: price,
      status: 'active',
    });

    setNewPlate('');
    setNewName('');
    setNewPhone('');
    setShowAddForm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="customer-database-modal"
        className="w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* ================= MODAL HEADER ================= */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  მომხმარებელთა ბაზა
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono">
                  B პარკინგი • კლიენტები
                </span>
                <span className="hidden md:inline-block text-[11px] text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
                  სულ: {unifiedCustomerList.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                შემოსული მომხმარებლები, ბილეთები, გადახდილი საშვები & ონლაინ ჯავშნები
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Switcher to Staff/Employees Database */}
            {onSwitchToEmployeeDb && (
              <button
                type="button"
                onClick={onSwitchToEmployeeDb}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 transition-all"
                title="თანამშრომელთა ბაზაზე გადართვა"
              >
                <Database className="w-3.5 h-3.5 text-teal-400" />
                <span>თანამშრომელთა ბაზა</span>
              </button>
            )}

            {/* Direct Admin Panel Trigger (Only for active Admin) */}
            {isAdmin && onOpenAdminPanel && (
              <button
                id="customer-db-to-admin-panel-btn"
                onClick={onOpenAdminPanel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/50 transition-all shadow-sm ring-1 ring-indigo-400/30"
                title="ადმინ პანელი: მომხმარებელთა კორექტირება & წაშლა, ტარიფები"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                <span>ადმინ პანელი</span>
              </button>
            )}

            <button
              id="close-customer-db-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role Access & Permission Notice Banner */}
        <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-300 font-bold">
                  ადმინისტრატორის სესია აქტიურია: თქვენ გაქვთ მომხმარებელთა კორექტირებისა და წაშლის უფლება.
                </span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-400">
                  ჩვეულებრივი მომხმარებლის ხედი (მხოლოდ დათვალიერება). მომხმარებლის კორექტირება და წაშლა შეზღუდულია — მხოლოდ <strong className="text-indigo-300">ადმინ პანელიდან</strong>.
                </span>
              </>
            )}
          </div>
          {onOpenAdminPanel && !isAdmin && (
            <button
              onClick={onOpenAdminPanel}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-all shrink-0 ml-2 shadow-sm"
            >
              შესვლა ადმინად
            </button>
          )}
        </div>

        {/* ================= QUICK STATS BANNER ================= */}
        <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">ამჟამად შემოსული</span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                {totalInside} მანქანა
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">სალაროს ქვითრები</span>
              <span className="text-sm font-black text-amber-400 font-mono">
                {totalTickets} ბილეთი
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">ონლაინ ჯავშნები</span>
              <span className="text-sm font-black text-indigo-400 font-mono">
                {totalOnline} ჯავშანი
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">ჯამური გადახდები</span>
              <span className="text-sm font-black text-teal-400 font-mono">
                {totalRevenue.toFixed(2)} ₾
              </span>
            </div>
          </div>
        </div>

        {/* ================= FILTER AND VIEW TOOLBAR ================= */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/70 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                filterType === 'all'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              ყველა ({unifiedCustomerList.length})
            </button>

            <button
              onClick={() => setFilterType('active_inside')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                filterType === 'active_inside'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ამჟამად შემოსულები ({totalInside})</span>
            </button>

            <button
              onClick={() => setFilterType('tickets')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                filterType === 'tickets'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-700/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              სალაროს ქვითრები ({totalTickets})
            </button>

            <button
              onClick={() => setFilterType('online_bookings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                filterType === 'online_bookings'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-700/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              ონლაინ ჯავშნები ({totalOnline})
            </button>

            <button
              onClick={() => setFilterType('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                filterType === 'completed'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              გასულები
            </button>
          </div>

          {/* Search Bar & View Mode Toggle & Add Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ნომერი, სახელი, ტელეფონი, ქვითარი..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Mode: Dense Table vs Cards */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('dense')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  viewMode === 'dense'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="კომპაქტური ცხრილი - მეტის დატევა"
              >
                <span>ცხრილი</span>
                <span className="text-[10px] text-emerald-400 font-mono">(დიდი)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="ბარათების ხედი"
              >
                ბარათები
              </button>
            </div>

            {/* Add Customer Button */}
            <button
              id="add-customer-trigger-btn"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-700/30 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'დახურვა' : '+ დამატება'}</span>
            </button>
          </div>
        </div>

        {/* ================= OPTIONAL ADD CUSTOMER FORM ================= */}
        {showAddForm && (
          <form
            onSubmit={handleCreateCustomer}
            className="p-4 sm:p-5 bg-slate-950 border-b border-emerald-500/30 space-y-3 animate-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Plus className="w-4 h-4" />
                <span>ახალი მომხმარებლის დამატება ბაზაში (B პარკინგი)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-slate-500 hover:text-white text-xs"
              >
                ✕ გაუქმება
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  ავტომობილის ნომერი *
                </label>
                <input
                  type="text"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                  placeholder="მაგ: GE-482-TB"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  მომხმარებლის სახელი და გვარი *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="მაგ: ლევან მაისურაძე"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  ტელეფონის ნომერი
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+995 599 00 00 00"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-slate-300 block">
                სატარიფო პაკეტი
              </label>
              <div className="grid grid-cols-3 gap-2">
                {pricingTiers.map((tier) => (
                  <button
                    key={tier.hours}
                    type="button"
                    onClick={() => setSelectedHours(tier.hours)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      selectedHours === tier.hours
                        ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs block font-bold">{tier.label}</span>
                    <span className="text-xs font-mono font-black text-emerald-400">
                      {tier.price.toFixed(2)} ₾
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-400 hover:bg-slate-800"
              >
                გაუქმება
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-700/30 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>მომხმარებლის შენახვა ({calculateParkingPrice(selectedHours).toFixed(2)} ₾)</span>
              </button>
            </div>
          </form>
        )}

        {/* ================= MAIN CONTENT LIST / DENSE TABLE ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {filteredRecords.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-3xl space-y-2">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">მომხმარებელთა ჩანაწერი ვერ მოიძებნა</p>
              <p className="text-xs text-slate-500">
                შეცვალეთ საძიებო პარამეტრები ან დაამატეთ ახალი მომხმარებელი ღილაკით
              </p>
            </div>
          ) : viewMode === 'dense' ? (
            /* ================= HIGH-CAPACITY COMPACT DENSE TABLE (FITS 20+ RECORDS EASILY) ================= */
            <div className="border border-slate-800/90 rounded-2xl overflow-hidden bg-slate-950/70 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">ნომერი</th>
                      <th className="py-2.5 px-3">მომხმარებელი / მძღოლი</th>
                      <th className="py-2.5 px-3">სტატუსი</th>
                      <th className="py-2.5 px-3">მოსვლა / შესვლა</th>
                      <th className="py-2.5 px-3">ხანგრძლივობა</th>
                      <th className="py-2.5 px-3">თანხა / გადახდა</th>
                      <th className="py-2.5 px-3">ქვითარი / ბარათი</th>
                      <th className="py-2.5 px-3 text-right">მოქმედება</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredRecords.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-900/90 transition-colors ${
                          idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-950/30'
                        }`}
                      >
                        {/* Plate */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 tracking-wider">
                              {item.plateNumber}
                            </span>
                          </div>
                        </td>

                        {/* Customer Name & Phone */}
                        <td className="py-2.5 px-3">
                          <div>
                            <span className="font-bold text-white block text-xs truncate max-w-[170px]">
                              {item.customerName}
                            </span>
                            {item.phone && (
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {item.phone}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3">
                          {item.status === 'inside' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              ადგილზეა (აქტიური)
                            </span>
                          ) : item.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                              <CheckCircle2 className="w-3 h-3 text-amber-400" />
                              გადახდილია
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800/80 text-slate-400 border border-slate-700">
                              გასულია
                            </span>
                          )}
                        </td>

                        {/* Entry Time */}
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                          {item.entryTime ? (
                            <span>
                              {new Date(item.entryTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              <span className="text-[10px] text-slate-500">
                                ({new Date(item.entryTime).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })})
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>

                        {/* Duration */}
                        <td className="py-2.5 px-3 text-xs text-slate-300">
                          {item.durationFormatted ? (
                            <span className="font-medium">{item.durationFormatted}</span>
                          ) : item.validUntil ? (
                            <span className="text-amber-400 text-[11px]">
                              ვადამდე:{' '}
                              {new Date(item.validUntil).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>

                        {/* Amount & Payment Method */}
                        <td className="py-2.5 px-3">
                          <div>
                            <span className="font-mono font-bold text-xs text-emerald-400">
                              {((item.amountPaid ?? item.amountDue) ?? 0).toFixed(2)} ₾
                            </span>
                            {item.paymentMethod && (
                              <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                                {item.paymentMethod}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Ticket Ref / Barcode */}
                        <td className="py-2.5 px-3">
                          {item.barcode ? (
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              #{item.barcode}
                            </span>
                          ) : item.source === 'reservation' ? (
                            <span className="text-[10px] text-indigo-400 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-900/40">
                              ონლაინ
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">საშვი</span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Receipt button if ticket is present */}
                            {item.ticketRef && onViewReceipt && (
                              <button
                                type="button"
                                onClick={() => onViewReceipt(item.ticketRef!)}
                                className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                                title="ქვითრის ნახვა / ბეჭდვა"
                              >
                                <Receipt className="w-3 h-3 text-amber-400" />
                                <span className="hidden sm:inline">ქვითარი</span>
                              </button>
                            )}

                            {/* Manual checkout & exit if inside */}
                            {item.status === 'inside' && item.ticketRef && onManualCheckoutAndExit && (
                              <button
                                type="button"
                                onClick={() => onManualCheckoutAndExit(item.ticketRef!)}
                                className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                                title="გასვლა და შლაგბაუმის გახსნა"
                              >
                                <LogOut className="w-3 h-3 text-emerald-400" />
                                <span className="hidden sm:inline">გასვლა</span>
                              </button>
                            )}

                            {/* Test Plate in camera */}
                            <button
                              type="button"
                              onClick={() => {
                                onTestPlateInCamera(item.plateNumber);
                                onClose();
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-colors"
                              title="კამერაზე დატესტვა"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete & Edit if registry item: Only available to Admin! */}
                            {item.source === 'registry' && (
                              isAdmin ? (
                                <div className="flex items-center gap-1">
                                  {onOpenAdminPanel && (
                                    <button
                                      type="button"
                                      onClick={onOpenAdminPanel}
                                      className="p-1.5 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 transition-colors"
                                      title="კორექტირება (ადმინ პანელი)"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const realId = item.id.replace('pc-', '');
                                      onDeletePaidCustomer(realId);
                                    }}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 transition-colors"
                                    title="წაშლა (ადმინისტრატორი)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={onOpenAdminPanel}
                                  className="p-1.5 rounded-lg bg-slate-900 text-slate-600 hover:text-indigo-400 transition-colors"
                                  title="წაშლა & კორექტირება შეზღუდულია: მხოლოდ ადმინისტრატორს აქვს წვდომა"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ================= CARD GRID VIEW ================= */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredRecords.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 tracking-wider">
                        {item.plateNumber}
                      </span>
                      {item.status === 'inside' ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          ადგილზეა
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                          გასულია
                        </span>
                      )}
                    </div>

                    <h5 className="text-xs font-bold text-white">{item.customerName}</h5>
                    {item.phone && (
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{item.phone}</span>
                      </p>
                    )}

                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">თანხა / გადახდა:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {((item.amountPaid ?? item.amountDue) ?? 0).toFixed(2)} ₾
                      </span>
                    </div>

                    {item.notes && (
                      <p className="text-[10px] text-slate-500 mt-1 truncate">{item.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-1">
                      {item.ticketRef && onViewReceipt && (
                        <button
                          type="button"
                          onClick={() => onViewReceipt(item.ticketRef!)}
                          className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>ქვითარი</span>
                        </button>
                      )}

                      {item.status === 'inside' && item.ticketRef && onManualCheckoutAndExit && (
                        <button
                          type="button"
                          onClick={() => onManualCheckoutAndExit(item.ticketRef!)}
                          className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>გასვლა</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onTestPlateInCamera(item.plateNumber);
                          onClose();
                        }}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>კამერით ტესტი</span>
                      </button>

                      {item.source === 'registry' && (
                        isAdmin ? (
                          <div className="flex items-center gap-1">
                            {onOpenAdminPanel && (
                              <button
                                type="button"
                                onClick={onOpenAdminPanel}
                                className="p-1 rounded-lg bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900 border border-indigo-500/30"
                                title="კორექტირება (ადმინ პანელი)"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const realId = item.id.replace('pc-', '');
                                onDeletePaidCustomer(realId);
                              }}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400"
                              title="წაშლა"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={onOpenAdminPanel}
                            className="p-1 rounded-lg bg-slate-900 text-slate-600 hover:text-indigo-400"
                            title="წაშლა & კორექტირება შეზღუდულია: მხოლოდ ადმინისტრატორს აქვს წვდომა"
                          >
                            <Lock className="w-3 h-3" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              მომხმარებელთა მონაცემები სრულად სინქრონიზებულია სალაროსთან, ANPR კამერასთან და B პარკინგთან.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onSwitchToEmployeeDb && (
              <button
                type="button"
                onClick={onSwitchToEmployeeDb}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Database className="w-3.5 h-3.5 text-teal-400" />
                <span>თანამშრომელთა ბაზა</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              დახურვა
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
