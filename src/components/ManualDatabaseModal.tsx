import React, { useState, useMemo } from 'react';
import {
  X,
  Database,
  UserCheck,
  CreditCard,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  Car,
  Shield,
  Phone,
  User,
  Sparkles,
  Camera,
  LogIn,
  LogOut,
  ArrowRight,
  ShieldCheck,
  Users,
  Building,
  RefreshCw,
  Lock,
  ShieldAlert,
  Edit3,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import {
  EmployeeRecord,
  PaidCustomerRecord,
  VehicleActivityLog,
  ParkingSpot,
  Language,
} from '../types';
import { PRESET_AVATARS, compressAndReadImage } from '../utils/avatarUtils';

export interface ManualDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: EmployeeRecord[];
  onAddEmployee: (employee: Omit<EmployeeRecord, 'id' | 'addedAt'>) => void;
  onDeleteEmployee: (id: string) => void;
  paidCustomers?: PaidCustomerRecord[];
  onAddPaidCustomer?: (customer: Omit<PaidCustomerRecord, 'id'>) => void;
  onDeletePaidCustomer?: (id: string) => void;
  vehicleLogs?: VehicleActivityLog[];
  spotA?: ParkingSpot;
  onRecordEmployeeArrival?: (emp: EmployeeRecord) => void;
  onRecordEmployeeExit?: (emp: EmployeeRecord) => void;
  onSwitchToCustomerDb?: () => void;
  onOpenAdminPanel?: () => void;
  isAdmin?: boolean;
  onTestPlateInCamera: (plate: string) => void;
  lang: Language;
}

export const ManualDatabaseModal: React.FC<ManualDatabaseModalProps> = ({
  isOpen,
  onClose,
  employees,
  onAddEmployee,
  onDeleteEmployee,
  vehicleLogs = [],
  spotA,
  onRecordEmployeeArrival,
  onRecordEmployeeExit,
  onSwitchToCustomerDb,
  onOpenAdminPanel,
  isAdmin = false,
  onTestPlateInCamera,
  lang,
}) => {
  // Tab within Employee Database:
  // 'directory' = თანამშრომელთა სია (რეესტრი)
  // 'movements' = გასვლა-მოსვლა (მოძრაობის ჟურნალი)
  const [activeTab, setActiveTab] = useState<'directory' | 'movements'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [movementFilter, setMovementFilter] = useState<'all' | 'entry' | 'exit'>('all');

  // New Employee Form State
  const [empPlate, setEmpPlate] = useState('');
  const [empName, setEmpName] = useState('');
  const [empDept, setEmpDept] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empAvatar, setEmpAvatar] = useState('');
  const [isUploadingEmpAvatar, setIsUploadingEmpAvatar] = useState(false);
  const [showEmpForm, setShowEmpForm] = useState(false);

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empPlate.trim() || !empName.trim()) return;

    onAddEmployee({
      plateNumber: empPlate.trim().toUpperCase(),
      fullName: empName.trim(),
      department: empDept.trim() || 'თანამშრომელი',
      phone: empPhone.trim() || '+995 500 00 00 00',
      avatarUrl: empAvatar || undefined,
    });

    setEmpPlate('');
    setEmpName('');
    setEmpDept('');
    setEmpPhone('');
    setEmpAvatar('');
    setShowEmpForm(false);
  };

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (emp) =>
        emp.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.phone.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [employees, searchQuery]);

  // Employee-only activity logs (გასვლა-მოსვლა)
  const employeeMovementLogs = useMemo(() => {
    return vehicleLogs
      .filter((log) => log.category === 'employee' || log.spotId === 'A')
      .filter((log) => {
        if (movementFilter !== 'all' && log.direction !== movementFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchPlate = log.plateNumber.toLowerCase().includes(q);
          const matchDriver = log.driverName?.toLowerCase().includes(q);
          const matchNotes = log.notes?.toLowerCase().includes(q);
          if (!matchPlate && !matchDriver && !matchNotes) return false;
        }
        return true;
      });
  }, [vehicleLogs, movementFilter, searchQuery]);

  // Check if an employee is currently parked on Spot A
  const isEmployeeCurrentlyParked = (plate: string) => {
    return spotA?.status === 'occupied' && spotA?.occupiedBy?.plateNumber === plate;
  };

  // Employee arrival and exit counts
  const totalEntries = vehicleLogs.filter(
    (l) => (l.category === 'employee' || l.spotId === 'A') && l.direction === 'entry'
  ).length;
  const totalExits = vehicleLogs.filter(
    (l) => (l.category === 'employee' || l.spotId === 'A') && l.direction === 'exit'
  ).length;
  const isSpotAOccupied = spotA?.status === 'occupied';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="employee-database-modal"
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* ================= MODAL HEADER ================= */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold shadow-inner">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  თანამშრომელთა ბაზა
                </h3>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-500/40">
                  A პარკინგი (სამსახურებრივი)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                თანამშრომელთა სია, ავტომობილების ნომრები & გასვლა-მოსვლის (მოძრაობის) ჟურნალი
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Switcher to Customer Database */}
            {onSwitchToCustomerDb && (
              <button
                type="button"
                onClick={onSwitchToCustomerDb}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all"
                title="მომხმარებელთა ბაზაზე გადართვა"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>მომხმარებელთა ბაზა</span>
              </button>
            )}

            {/* Direct Admin Panel Trigger (Only for active Admin) */}
            {isAdmin && onOpenAdminPanel && (
              <button
                id="manual-db-to-admin-panel-btn"
                onClick={onOpenAdminPanel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/50 transition-all shadow-sm ring-1 ring-indigo-400/30"
                title="ადმინ პანელი: თანამშრომელთა და მომხმარებელთა მართვა"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                <span>ადმინ პანელი</span>
              </button>
            )}

            <button
              id="close-employee-db-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Role Access Notice */}
        {!isAdmin && (
          <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                თანამშრომლის რეჟიმი (ოპერატორი): მოსვლა/გასვლის დაფიქსირება. მონაცემების კორექტირება ან წაშლა დაშვებულია მხოლოდ <strong className="text-indigo-300">ადმინ პანელიდან</strong>.
              </span>
            </div>
            {onOpenAdminPanel && (
              <button
                onClick={onOpenAdminPanel}
                className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-all shrink-0 ml-2 shadow-sm"
              >
                ადმინ შესვლა
              </button>
            )}
          </div>
        )}

        {/* ================= SUMMARY STATS BAR ================= */}
        <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">სულ სიაში</span>
              <span className="text-sm font-black text-teal-400 font-mono">
                {employees.length} თანამშრომელი
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">A ადგილი</span>
              <span className="text-xs font-black text-white font-mono">
                {isSpotAOccupied ? (
                  <span className="text-amber-400">დაკავებულია ({spotA?.occupiedBy?.plateNumber})</span>
                ) : (
                  <span className="text-teal-400">თავისუფალია</span>
                )}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">დღეს მოსვლა</span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                {totalEntries} შესვლა
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">დღეს გასვლა</span>
              <span className="text-sm font-black text-rose-400 font-mono">
                {totalExits} გასვლა
              </span>
            </div>
          </div>
        </div>

        {/* ================= TABS AND SEARCH ================= */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              id="emp-tab-directory-btn"
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'directory'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-700/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>თანამშრომელთა სია ({employees.length})</span>
            </button>

            <button
              id="emp-tab-movements-btn"
              onClick={() => setActiveTab('movements')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'movements'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-700/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>გასვლა-მოსვლა / ჟურნალი ({employeeMovementLogs.length})</span>
            </button>
          </div>

          {/* Search Bar & Action Trigger */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ნომრის, სახელის ან განყოფილების ძებნა..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>

            {activeTab === 'directory' && (
              <button
                id="add-employee-trigger-btn"
                onClick={() => setShowEmpForm(!showEmpForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-600/20 text-teal-300 border border-teal-500/40 hover:bg-teal-600/30 transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showEmpForm ? 'დახურვა' : '+ დამატება'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ================= CONTENT AREA ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* ================= TAB 1: EMPLOYEES DIRECTORY ================= */}
          {activeTab === 'directory' && (
            <div className="space-y-4">
              {/* Add Employee Inline Form */}
              {showEmpForm && (
                <form
                  onSubmit={handleCreateEmployee}
                  className="bg-slate-950 border border-teal-500/40 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-teal-400">
                    <span>ახალი თანამშრომლის რეგისტრაცია A პარკინგისთვის</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        ავტომობილის ნომერი *
                      </label>
                      <input
                        type="text"
                        value={empPlate}
                        onChange={(e) => setEmpPlate(e.target.value.toUpperCase())}
                        placeholder="მაგ: EMP-777-GE ან AA-100-BB"
                        required
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        თანამშრომლის სახელი და გვარი *
                      </label>
                      <input
                        type="text"
                        value={empName}
                        onChange={(e) => setEmpName(e.target.value)}
                        placeholder="მაგ: დავით კობახიძე"
                        required
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        განყოფილება / თანამდებობა
                      </label>
                      <input
                        type="text"
                        value={empDept}
                        onChange={(e) => setEmpDept(e.target.value)}
                        placeholder="მაგ: IT & უსაფრთხოება"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        ტელეფონის ნომერი
                      </label>
                      <input
                        type="text"
                        value={empPhone}
                        onChange={(e) => setEmpPhone(e.target.value)}
                        placeholder="+995 599 00 00 00"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {/* Photo Upload & Built-in Default Avatars */}
                  <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-white flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
                        <span>თანამშრომლის პროფილის ფოტო & ავატარი</span>
                      </label>
                      {empAvatar && (
                        <button
                          type="button"
                          onClick={() => setEmpAvatar('')}
                          className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          ფოტოს წაშლა
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-950 border border-teal-500/40 shrink-0 flex items-center justify-center">
                        {empAvatar ? (
                          <img src={empAvatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-slate-500" />
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer shadow-sm transition-all active:scale-95">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploadingEmpAvatar ? 'მუშავდება...' : 'ფოტოს ატვირთვა'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              setIsUploadingEmpAvatar(true);
                              try {
                                const url = await compressAndReadImage(f, 256, 0.85);
                                setEmpAvatar(url);
                              } catch {}
                              setIsUploadingEmpAvatar(false);
                            }}
                          />
                        </label>
                        <span className="text-[10px] text-slate-400 block">
                          ან აირჩიეთ ჩაშენებული დეფაულტ ავატარი:
                        </span>
                      </div>
                    </div>

                    {/* Presets */}
                    <div className="grid grid-cols-6 gap-1.5 pt-1 border-t border-slate-800">
                      {PRESET_AVATARS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setEmpAvatar(preset.url)}
                          title={preset.label}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all p-0.5 ${
                            empAvatar === preset.url
                              ? 'border-teal-400 ring-2 ring-teal-400/50 scale-105'
                              : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={preset.url} alt={preset.label} className="w-full h-full object-cover rounded" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEmpForm(false)}
                      className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-400 hover:bg-slate-800"
                    >
                      გაუქმება
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-700/30 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ბაზაში შენახვა</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Employee Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredEmployees.length === 0 ? (
                  <div className="col-span-2 py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    თანამშრომლის ჩანაწერი ვერ მოიძებნა
                  </div>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isCurrentlyParked = isEmployeeCurrentlyParked(emp.plateNumber);

                    return (
                      <div
                        key={emp.id}
                        className={`bg-slate-950 border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                          isCurrentlyParked
                            ? 'border-teal-500/60 shadow-lg shadow-teal-950/20'
                            : 'border-slate-800 hover:border-teal-500/40'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/30 tracking-wider">
                              {emp.plateNumber}
                            </span>

                            {isCurrentlyParked ? (
                              <span className="text-[10px] font-bold text-teal-300 bg-teal-950 px-2 py-0.5 rounded-full border border-teal-600 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                                ამჟამად A-ზე გაჩერებულია
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                                საშვი აქტიურია
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5 mt-1">
                            {emp.avatarUrl ? (
                              <img
                                src={emp.avatarUrl}
                                alt={emp.fullName}
                                className="w-9 h-9 rounded-xl object-cover border border-teal-500/40 shadow-sm shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-center font-bold text-xs shrink-0">
                                <User className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <h5 className="text-xs font-bold text-white">{emp.fullName}</h5>
                              <p className="text-[11px] text-slate-400">{emp.department}</p>
                            </div>
                          </div>
                          {emp.phone && (
                            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-600" />
                              <span>{emp.phone}</span>
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80">
                          <div className="flex items-center gap-1.5">
                            {/* Record Arrival / Departure button */}
                            {isCurrentlyParked ? (
                              onRecordEmployeeExit && (
                                <button
                                  type="button"
                                  onClick={() => onRecordEmployeeExit(emp)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                                  title="გასვლის დაფიქსირება & A ადგილის განთავისუფლება"
                                >
                                  <LogOut className="w-3 h-3 text-rose-400" />
                                  <span>გასვლა</span>
                                </button>
                              )
                            ) : (
                              onRecordEmployeeArrival && (
                                <button
                                  type="button"
                                  onClick={() => onRecordEmployeeArrival(emp)}
                                  className="px-2.5 py-1 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                                  title="მოსვლის დაფიქსირება & A ადგილზე გაჩერება"
                                >
                                  <LogIn className="w-3 h-3 text-teal-400" />
                                  <span>მოსვლა / შესვლა</span>
                                </button>
                              )
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                onTestPlateInCamera(emp.plateNumber);
                                onClose();
                              }}
                              className="text-[11px] text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-teal-950/40"
                              title="კამერაზე დატესტვა"
                            >
                              <Camera className="w-3 h-3" />
                              <span>კამერით ტესტი</span>
                            </button>
                          </div>

                          {isAdmin ? (
                            <div className="flex items-center gap-1">
                              {onOpenAdminPanel && (
                                <button
                                  type="button"
                                  onClick={onOpenAdminPanel}
                                  className="text-indigo-400 hover:text-indigo-300 p-1.5 rounded-lg hover:bg-indigo-950/40 transition-colors"
                                  title="კორექტირება (ადმინ პანელი)"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onDeleteEmployee(emp.id)}
                                className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors"
                                title="თანამშრომლის წაშლა (ადმინისტრატორი)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={onOpenAdminPanel}
                              className="text-slate-600 hover:text-indigo-400 p-1.5 rounded-lg transition-colors"
                              title="თანამშრომლის წაშლა დაშვებულია მხოლოდ ადმინისტრატორისთვის"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 2: MOVEMENTS / ARRIVALS & DEPARTURES LOG ================= */}
          {activeTab === 'movements' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>თანამშრომელთა გასვლა-მოსვლის ქრონოლოგიური ჟურნალი</span>
                    <span className="text-[10px] text-teal-400 font-mono">
                      (A პარკინგის მოძრაობა)
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    ფიქსირდება ყველა შემოსვლა (მოსვლა) და გასვლა დროის, ხანგრძლივობისა და შლაგბაუმის მითითებით
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setMovementFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      movementFilter === 'all'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ყველა
                  </button>
                  <button
                    onClick={() => setMovementFilter('entry')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      movementFilter === 'entry'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    მოსვლა (შემოსვლა)
                  </button>
                  <button
                    onClick={() => setMovementFilter('exit')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      movementFilter === 'exit'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    გასვლა
                  </button>
                </div>
              </div>

              {employeeMovementLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  გასვლა-მოსვლის ჩანაწერები ვერ მოიძებნა
                </div>
              ) : (
                <div className="space-y-2">
                  {employeeMovementLogs.map((log) => {
                    const isEntry = log.direction === 'entry';

                    return (
                      <div
                        key={log.id}
                        className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
                          isEntry
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : 'bg-rose-950/20 border-rose-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                              isEntry
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                            }`}
                          >
                            {isEntry ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-900 text-white border border-slate-700">
                                {log.plateNumber}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isEntry
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                                    : 'bg-rose-950 text-rose-300 border border-rose-600'
                                }`}
                              >
                                {isEntry ? 'მოსვლა / შემოსვლა' : 'გასვლა'}
                              </span>
                              {log.durationFormatted && (
                                <span className="text-[10px] text-amber-400 font-mono font-semibold">
                                  ხანგრძლივობა: {log.durationFormatted}
                                </span>
                              )}
                            </div>

                            <p className="text-xs font-bold text-slate-200 mt-1">
                              {log.driverName || 'თანამშრომელი'}
                            </p>
                            {log.notes && (
                              <p className="text-[11px] text-slate-400 mt-0.5">{log.notes}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between text-right text-xs">
                          <span className="font-mono text-slate-300 font-medium">
                            {new Date(log.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(log.timestamp).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= FOOTER ================= */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              თანამშრომელთა ბაზა ავტომატურად გადაეცემა ANPR კამერას A ადგილზე უფასო დაშვებისთვის.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onSwitchToCustomerDb && (
              <button
                type="button"
                onClick={onSwitchToCustomerDb}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>მომხმარებელთა ბაზა</span>
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
