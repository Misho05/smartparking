import React, { useState } from 'react';
import {
  Database,
  Ticket,
  Camera,
  Receipt,
  ScanLine,
  UserCheck,
  CreditCard,
  Lock,
  ArrowLeft,
  Sparkles,
  Shield,
  Layers,
  History,
  Plus,
  Users,
  ShieldAlert,
  User,
  LogOut,
  ChevronDown,
  UserCog,
  Settings,
} from 'lucide-react';
import { Language, ParkingSpot, UserAccount } from '../types';
import { translations } from '../utils/translations';

interface NavbarProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  portalMode: 'customer' | 'staff' | 'admin';
  onSwitchPortal: (mode: 'customer' | 'staff' | 'admin') => void;
  onOpenStaffAuth: () => void;
  onOpenAdminPanel?: () => void;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  onOpenEditProfile?: () => void;
  activeBookingsCount: number;
  activeTicketsCount?: number;
  spots?: ParkingSpot[];
  activeView?: 'all' | 'A' | 'B';
  onSelectView?: (view: 'all' | 'A' | 'B') => void;
  onStartBooking?: () => void;
  onOpenMyBookings: () => void;
  onOpenGateSimulator: () => void;
  onOpenManualDatabase: () => void;
  onOpenCustomerDatabase?: () => void;
  onOpenStaffTerminal: () => void;
  onOpenReceiptScanner?: () => void;
  onOpenPastReceipts?: () => void;
  onOpenQuickAdd?: () => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onLanguageChange,
  portalMode,
  onSwitchPortal,
  onOpenStaffAuth,
  onOpenAdminPanel,
  currentUser,
  onLogout,
  onOpenEditProfile,
  activeBookingsCount,
  activeTicketsCount = 0,
  spots = [],
  activeView = 'all',
  onSelectView,
  onStartBooking,
  onOpenMyBookings,
  onOpenGateSimulator,
  onOpenManualDatabase,
  onOpenCustomerDatabase,
  onOpenStaffTerminal,
  onOpenReceiptScanner,
  onOpenPastReceipts,
  onOpenQuickAdd,
  isSimulating,
  onToggleSimulation,
}) => {
  const t = translations[lang];
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const spotA = spots.find((s) => s.id === 'A');
  const spotB = spots.find((s) => s.id === 'B');
  const spotAIsAvailable = spotA ? spotA.status === 'available' : true;
  const spotBIsAvailable = spotB ? spotB.status === 'available' : true;
  const spotBIsUser = spotB?.occupiedBy?.isUserBooking;

  const handleQuickNavA = () => {
    onSelectView?.('A');
    const el = document.getElementById('spot-A') || document.getElementById('quick-card-spot-a');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleQuickNavB = () => {
    onSelectView?.('B');
    const el = document.getElementById('spot-B') || document.getElementById('quick-card-spot-b');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onSwitchPortal('customer')}
            className="cursor-pointer relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-700 shadow-lg shadow-teal-500/20 text-white font-black text-xl tracking-tight border border-teal-400/30"
          >
            <span>P</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                onClick={() => onSwitchPortal('customer')}
                className="text-xl font-extrabold tracking-tight text-white cursor-pointer"
              >
                SmartPark
              </span>
              {portalMode === 'admin' ? (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/25 text-indigo-200 border border-indigo-500/50 flex items-center gap-1 shadow-sm ring-1 ring-indigo-400/40">
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                  <span>ადმინ პანელი</span>
                </span>
              ) : portalMode === 'staff' ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>თანამშრომლის რეჟიმი</span>
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  მომხმარებლის რეჟიმი
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {portalMode === 'admin'
                ? 'ადმინისტრატორის სრული წვდომა • მომხმარებელთა კორექტირება & წაშლა • ტარიფები • შლაგბაუმები'
                : portalMode === 'staff'
                ? 'თანამშრომლის ოპერატორის რეჟიმი • ANPR კამერა • სალარო & ქვითრები'
                : 'მომხმარებლის ონლაინ პორტალი • დაჯავშნა და ციფრული საშვი • 1₾/სთ, 2₾/3სთ, 5₾/24სთ'}
            </p>
          </div>
        </div>

        {/* CONTROLS BASED ON PORTAL MODE */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* ================= IF IN CUSTOMER PORTAL ================= */}
          {portalMode === 'customer' ? (
            <>
              {/* Online Book Button */}
              {onStartBooking && (
                <button
                  id="nav-customer-book-now-btn"
                  onClick={onStartBooking}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>დაჯავშნე ონლაინ</span>
                </button>
              )}

              {/* My Bookings Button */}
              <button
                id="my-bookings-btn"
                onClick={onOpenMyBookings}
                className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 transition-all"
              >
                <Ticket className="w-4 h-4 text-emerald-400" />
                <span>{t.myBookings}</span>
                {activeBookingsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-emerald-500 text-slate-950 font-mono">
                    {activeBookingsCount}
                  </span>
                )}
              </button>

              {/* Switch to Staff Mode Button */}
              <button
                id="nav-switch-to-staff-btn"
                onClick={() => onSwitchPortal('staff')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-all shadow-sm"
                title="თანამშრომლის რეჟიმში გადასვლა"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>თანამშრომლის რეჟიმი</span>
              </button>

              {/* Switch to Admin Panel Button (Requires Admin Login) */}
              <button
                id="nav-switch-to-admin-btn"
                onClick={() => {
                  if (currentUser?.role === 'admin') {
                    onOpenAdminPanel?.();
                  } else {
                    onSwitchPortal('admin');
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 transition-all shadow-sm ring-1 ring-indigo-400/30"
                title="ადმინ პანელში შესვლა: მხოლოდ სისტემის ადმინისტრატორისთვის (იუზერი & პაროლი)"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                <span>ადმინ პანელი</span>
              </button>
            </>
          ) : (
            /* ================= IF IN STAFF PORTAL ================= */
            <>
              {/* + დამატება Primary Action Button for Staff */}
              {onOpenQuickAdd && (
                <button
                  id="nav-quick-add-btn"
                  onClick={onOpenQuickAdd}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 hover:from-teal-300 hover:to-emerald-300 text-slate-950 shadow-md shadow-emerald-500/30 transition-all transform active:scale-95 ring-1 ring-emerald-300/40"
                  title="ავტომობილის სწრაფი დამატება: აირჩიეთ A ან B პარკინგი, მიუთითეთ ნომერი და შემოიყვანეთ"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ დამატება</span>
                </button>
              )}

              {/* Quick Spot Switcher Icons for Staff */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 shadow-inner">
                {/* Spot A Icon Button */}
                <button
                  id="nav-quick-spot-a-btn"
                  onClick={handleQuickNavA}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeView === 'A'
                      ? 'bg-teal-500/25 text-teal-200 border border-teal-400 shadow-sm shadow-teal-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                  title="A პარკინგი (თანამშრომლები): სწრაფი გადასვლა"
                >
                  <div className="w-5 h-5 rounded-md bg-teal-500 text-slate-950 font-black text-xs flex items-center justify-center font-mono shadow-sm">
                    A
                  </div>
                  <span className="hidden sm:inline">A პარკინგი</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      spotAIsAvailable ? 'bg-teal-400' : 'bg-amber-400'
                    }`}
                    title={spotAIsAvailable ? 'თავისუფალია' : 'დაკავებულია'}
                  />
                </button>

                {/* Spot B Icon Button */}
                <button
                  id="nav-quick-spot-b-btn"
                  onClick={handleQuickNavB}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeView === 'B'
                      ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400 shadow-sm shadow-emerald-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                  title="B პარკინგი (ფასიანი კლიენტები): სწრაფი გადასვლა"
                >
                  <div className="w-5 h-5 rounded-md bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center font-mono shadow-sm">
                    B
                  </div>
                  <span className="hidden sm:inline">B პარკინგი</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      spotBIsAvailable
                        ? 'bg-emerald-400'
                        : spotBIsUser
                        ? 'bg-indigo-400'
                        : 'bg-rose-400'
                    }`}
                    title={
                      spotBIsAvailable
                        ? 'თავისუფალია'
                        : spotBIsUser
                        ? 'თქვენი ჯავშანი'
                        : 'დაკავებულია'
                    }
                  />
                </button>
              </div>

              {/* Staff Terminal & Cashier (POS / Tickets) Button */}
              <button
                id="nav-staff-terminal-btn"
                onClick={onOpenStaffTerminal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition-all shadow-sm"
                title="თანამშრომლის დაცული ტერმინალი: მძღოლების მონაცემები (კონფიდენციალური), ქვითრები & სალარო"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                <span>სალარო & ქვითრები</span>
                {activeTicketsCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 font-mono">
                    {activeTicketsCount}
                  </span>
                )}
              </button>

              {/* Instant Receipt QR / Barcode Scanner */}
              {onOpenReceiptScanner && (
                <button
                  id="nav-receipt-scanner-btn"
                  onClick={onOpenReceiptScanner}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 transition-all shadow-sm"
                  title="ქვითრის დასკანერება: QR / შტრიხკოდი / კოდი — მონაცემების მყისიერი ამოგდება და გადახდა"
                >
                  <ScanLine className="w-3.5 h-3.5 text-emerald-400" />
                  <span>📷 ქვითრის სკანერი</span>
                </button>
              )}

              {/* Past Receipts Archive Button (გასული ქვითრები) */}
              {onOpenPastReceipts && (
                <button
                  id="nav-past-receipts-btn"
                  onClick={onOpenPastReceipts}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 transition-all shadow-sm"
                  title="გასული ქვითრები (გუშინდელი, წინა დღეები და არქივი)"
                >
                  <History className="w-3.5 h-3.5 text-sky-400" />
                  <span>🧾 გასული ქვითრები</span>
                </button>
              )}

              {/* Employee Database Button (თანამშრომელთა ბაზა) */}
              <button
                id="nav-employee-db-btn"
                onClick={onOpenManualDatabase}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-950/60 hover:bg-teal-900/60 text-teal-300 border border-teal-500/30 hover:border-teal-400 transition-all shadow-sm"
                title="თანამშრომელთა ბაზა (A პარკინგი, საშვები, გასვლა-მოსვლა)"
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">თანამშრომელთა ბაზა</span>
              </button>

              {/* Customer Database Button (მომხმარებელთა ბაზა) */}
              {onOpenCustomerDatabase && (
                <button
                  id="nav-customer-db-btn"
                  onClick={onOpenCustomerDatabase}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 transition-all shadow-sm"
                  title="მომხმარებელთა ბაზა (B პარკინგი, ბილეთები, ონლაინ ჯავშნები)"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">მომხმარებელთა ბაზა</span>
                </button>
              )}

              {/* Admin Panel Direct Button - ONLY visible if user is authenticated as Admin */}
              {currentUser?.role === 'admin' && onOpenAdminPanel && (
                <button
                  id="nav-admin-panel-btn"
                  onClick={onOpenAdminPanel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/50 transition-all shadow-sm ring-1 ring-indigo-400/40"
                  title="ადმინ პანელი: მომხმარებელთა კორექტირება & წაშლა, ტარიფები, ფინანსები"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">ადმინ პანელი</span>
                </button>
              )}

              {/* Gate Simulator Button */}
              <button
                id="gate-simulator-btn"
                onClick={onOpenGateSimulator}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all hover:border-slate-600 shadow-sm"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">ANPR კამერა</span>
              </button>

              {/* Return to Customer Portal */}
              <button
                id="nav-back-to-customer-btn"
                onClick={() => onSwitchPortal('customer')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                title="მომხმარებლის გვერდზე დაბრუნება"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>კლიენტის ხედი</span>
              </button>
            </>
          )}

          {/* Language Switch */}
          <div className="flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            <button
              id="lang-ka-btn"
              onClick={() => onLanguageChange('ka')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                lang === 'ka'
                  ? 'bg-slate-700 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ქარ
            </button>
            <button
              id="lang-en-btn"
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                lang === 'en'
                  ? 'bg-slate-700 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>

          {/* ================= ჩემი ანგარიში / მომხმარებლის პროფილი ================= */}
          {/* Matches the user request: "ზემოთ მარჯვენა კუთხეში ადმინზეც და ჩვეულებრივ იუზერი სადაც სახელი წერია გადაიტანე მარჯვნივ ზემოთ კუთხეში სადაც სიცარიელეა სმარტ პარკინგის გასწვრივ სახელ და გვარს რომ დააჭერ უნდა ჩამოიშალოს პროფილის რედაქტირება და გასვლა." */}
          <div className="relative">
            {currentUser ? (
              <div>
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all shadow-md ${
                    currentUser.role === 'admin'
                      ? 'bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 hover:border-indigo-400 border border-indigo-500/50 text-indigo-200 ring-1 ring-indigo-500/30'
                      : 'bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 hover:border-teal-400 border border-teal-500/50 text-teal-200 ring-1 ring-teal-500/30'
                  }`}
                  title="დააჭირეთ: პროფილის რედაქტირება & გასვლა"
                >
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      className="w-7 h-7 rounded-xl object-cover border border-white/20 shadow-inner shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shadow-inner shrink-0 ${
                        currentUser.role === 'admin'
                          ? 'bg-indigo-600 text-white shadow-indigo-700/40'
                          : 'bg-[#00824b] text-white shadow-emerald-700/40'
                      }`}
                    >
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className="flex flex-col items-start text-left leading-tight">
                    <span className="font-black text-white text-xs truncate max-w-[130px] sm:max-w-[150px]">
                      {currentUser.fullName}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        currentUser.role === 'admin' ? 'text-indigo-400' : 'text-emerald-400'
                      }`}
                    >
                      {currentUser.role === 'admin' ? '⚡ ადმინისტრატორი' : '🛡️ იუზერი (თანამშრომელი)'}
                    </span>
                  </div>

                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      isUserMenuOpen ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu when clicking Full Name */}
                {isUserMenuOpen && (
                  <div
                    id="user-profile-dropdown"
                    className="absolute right-0 top-full mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left ring-1 ring-white/10"
                  >
                    {/* User Summary Header */}
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        {currentUser.avatarUrl ? (
                          <img
                            src={currentUser.avatarUrl}
                            alt={currentUser.fullName}
                            className="w-7 h-7 rounded-xl object-cover border border-white/20 shadow-inner shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                              currentUser.role === 'admin'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-teal-600 text-white'
                            }`}
                          >
                            <User className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span className="font-extrabold text-white text-xs truncate">
                          {currentUser.fullName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <span>იუზერი:</span>
                        <strong className="text-slate-200">
                          {currentUser.email.split('@')[0] || currentUser.email}
                        </strong>
                      </div>
                      {currentUser.department && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {currentUser.department}
                        </div>
                      )}
                    </div>

                    {/* Menu Actions */}
                    <div className="space-y-1">
                      {/* პროფილის რედაქტირება */}
                      <button
                        id="dropdown-edit-profile-btn"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenEditProfile?.();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800/90 transition-all text-left group"
                      >
                        <UserCog className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                        <span>პროფილის რედაქტირება</span>
                      </button>

                      {/* ადმინ პანელის სწრაფი ბმული (თუ ადმინია) */}
                      {currentUser.role === 'admin' && onOpenAdminPanel && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenAdminPanel();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-300 hover:text-white hover:bg-indigo-950/60 transition-all text-left"
                        >
                          <ShieldAlert className="w-4 h-4 text-indigo-400" />
                          <span>ადმინ პანელი</span>
                        </button>
                      )}

                      {/* გასვლა (Logout) */}
                      <button
                        id="dropdown-logout-btn"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout?.();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-all text-left border-t border-slate-800/80 mt-1 pt-2 group"
                      >
                        <LogOut className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                        <span>გასვლა</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="my-account-btn"
                onClick={onOpenStaffAuth}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-bold text-white bg-slate-800/90 hover:bg-slate-700 hover:border-teal-500/40 border border-slate-700 transition-all shadow-sm group"
                title="შედით სისტემაში: ადმინისტრატორი ან იუზერი (თანამშრომელი)"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-slate-950 font-black flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <User className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                </div>
                <span>შესვლა (ადმინი / იუზერი)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
