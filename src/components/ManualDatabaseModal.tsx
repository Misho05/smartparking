import React, { useState } from 'react';
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
} from 'lucide-react';
import { EmployeeRecord, PaidCustomerRecord, Language } from '../types';
import { OFFICIAL_PRICING_TIERS, calculateParkingPrice } from '../utils/pricing';

interface ManualDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: EmployeeRecord[];
  onAddEmployee: (employee: Omit<EmployeeRecord, 'id' | 'addedAt'>) => void;
  onDeleteEmployee: (id: string) => void;
  paidCustomers: PaidCustomerRecord[];
  onAddPaidCustomer: (customer: Omit<PaidCustomerRecord, 'id'>) => void;
  onDeletePaidCustomer: (id: string) => void;
  onTestPlateInCamera: (plate: string) => void;
  lang: Language;
}

export const ManualDatabaseModal: React.FC<ManualDatabaseModalProps> = ({
  isOpen,
  onClose,
  employees,
  onAddEmployee,
  onDeleteEmployee,
  paidCustomers,
  onAddPaidCustomer,
  onDeletePaidCustomer,
  onTestPlateInCamera,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'paid'>('employees');
  const [searchQuery, setSearchQuery] = useState('');

  // New Employee Form State
  const [empPlate, setEmpPlate] = useState('');
  const [empName, setEmpName] = useState('');
  const [empDept, setEmpDept] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [showEmpForm, setShowEmpForm] = useState(false);

  // New Paid Customer Form State
  const [paidPlate, setPaidPlate] = useState('');
  const [paidName, setPaidName] = useState('');
  const [paidPhone, setPaidPhone] = useState('');
  const [paidHours, setPaidHours] = useState<number>(3); // default to popular 3h
  const [showPaidForm, setShowPaidForm] = useState(false);

  if (!isOpen) return null;

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empPlate.trim() || !empName.trim()) return;

    onAddEmployee({
      plateNumber: empPlate.trim().toUpperCase(),
      fullName: empName.trim(),
      department: empDept.trim() || 'თანამშრომელი',
      phone: empPhone.trim() || '+995 500 00 00 00',
    });

    setEmpPlate('');
    setEmpName('');
    setEmpDept('');
    setEmpPhone('');
    setShowEmpForm(false);
  };

  const handleCreatePaidCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paidPlate.trim() || !paidName.trim()) return;

    const amountPaid = calculateParkingPrice(paidHours);
    const validUntil = new Date(Date.now() + paidHours * 3600000).toISOString();

    onAddPaidCustomer({
      plateNumber: paidPlate.trim().toUpperCase(),
      driverName: paidName.trim(),
      phone: paidPhone.trim() || '+995 500 00 00 00',
      validUntil,
      amountPaid,
      status: 'active',
    });

    setPaidPlate('');
    setPaidName('');
    setPaidPhone('');
    setShowPaidForm(false);
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPaidCustomers = paidCustomers.filter(
    (c) =>
      c.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.driverName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="manual-database-modal"
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>საპარკინგე მონაცემთა ბაზის მართვა</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  მანუალური ბაზა
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                კამერა ავტომატურად ამოიცნობს ნომერს და ამ ბაზის მიხედვით დაახარისხებს: A (თანამშრომელი) თუ B (ფასიანი)
              </p>
            </div>
          </div>

          <button
            id="close-db-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector & Search */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              id="tab-employees-btn"
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'employees'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-700/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>A პარკინგი • თანამშრომლები ({employees.length})</span>
            </button>

            <button
              id="tab-paid-btn"
              onClick={() => setActiveTab('paid')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'paid'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>B პარკინგი • ფასიანი კლიენტები ({paidCustomers.length})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ნომრის ან სახელის ძებნა..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: EMPLOYEES (A PARKING) */}
          {activeTab === 'employees' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                    <span>A პარკინგი — თანამშრომელთა ავტომობილების სია</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    ამ სიაში მყოფ ნომრებს კამერა ავტომატურად ამოიცნობს და A პარკინგზე დაუშვებს (უფასოდ).
                  </p>
                </div>

                <button
                  id="add-employee-trigger-btn"
                  onClick={() => setShowEmpForm(!showEmpForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-600/20 text-teal-300 border border-teal-500/40 hover:bg-teal-600/30 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showEmpForm ? 'ფორმის დახურვა' : 'თანამშრომლის დამატება'}</span>
                </button>
              </div>

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
                  <div className="col-span-2 py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    თანამშრომლის ჩანაწერი ვერ მოიძებნა
                  </div>
                ) : (
                  filteredEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      className="bg-slate-950 border border-slate-800 hover:border-teal-500/40 rounded-2xl p-3.5 flex flex-col justify-between transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/30">
                            {emp.plateNumber}
                          </span>
                          <span className="text-[10px] font-bold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-800/60">
                            A პარკინგი (უფასო)
                          </span>
                        </div>

                        <h5 className="text-xs font-bold text-white">{emp.fullName}</h5>
                        <p className="text-[11px] text-slate-400 mt-0.5">{emp.department}</p>
                        {emp.phone && (
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-600" />
                            <span>{emp.phone}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => {
                            onTestPlateInCamera(emp.plateNumber);
                            onClose();
                          }}
                          className="text-[11px] text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
                          title="კამერაზე დატესტვა"
                        >
                          <Camera className="w-3 h-3" />
                          <span>კამერით ტესტი</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteEmployee(emp.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                          title="წაშლა"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PAID CUSTOMERS (B PARKING) */}
          {activeTab === 'paid' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>B პარკინგი — ფასიანი საშვები & ჯავშნები</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    ტარიფი: <strong className="text-white">1 სთ = 1.00 ₾</strong> | <strong className="text-white">3 სთ = 2.00 ₾</strong> | <strong className="text-white">24 სთ = 5.00 ₾</strong>
                  </p>
                </div>

                <button
                  id="add-paid-trigger-btn"
                  onClick={() => setShowPaidForm(!showPaidForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showPaidForm ? 'ფორმის დახურვა' : 'ფასიანი საშვის გაცემა'}</span>
                </button>
              </div>

              {/* Add Paid Customer Form */}
              {showPaidForm && (
                <form
                  onSubmit={handleCreatePaidCustomer}
                  className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-emerald-400">
                    <span>ახალი ფასიანი საშვის გაცემა B პარკინგისთვის</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        ავტომობილის ნომერი *
                      </label>
                      <input
                        type="text"
                        value={paidPlate}
                        onChange={(e) => setPaidPlate(e.target.value.toUpperCase())}
                        placeholder="მაგ: GE-482-TB"
                        required
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        მძღოლის სახელი და გვარი *
                      </label>
                      <input
                        type="text"
                        value={paidName}
                        onChange={(e) => setPaidName(e.target.value)}
                        placeholder="მაგ: ლევან მაისურაძე"
                        required
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                        სატარიფო პაკეტის არჩევა *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {OFFICIAL_PRICING_TIERS.map((tier) => (
                          <button
                            key={tier.hours}
                            type="button"
                            onClick={() => setPaidHours(tier.hours)}
                            className={`p-2.5 rounded-xl border text-center transition-all ${
                              paidHours === tier.hours
                                ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span className="text-xs block font-bold">{tier.label}</span>
                            <span className="text-sm font-black text-emerald-400 font-mono">
                              {tier.price.toFixed(2)} ₾
                            </span>
                            {tier.badge && (
                              <span className="text-[9px] text-emerald-300/80 block mt-0.5">
                                {tier.badge}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowPaidForm(false)}
                      className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-400 hover:bg-slate-800"
                    >
                      გაუქმება
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-700/30 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>საშვის დამატება ({calculateParkingPrice(paidHours).toFixed(2)} ₾)</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Paid Customer Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredPaidCustomers.length === 0 ? (
                  <div className="col-span-2 py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    ფასიანი საშვის ჩანაწერი ვერ მოიძებნა
                  </div>
                ) : (
                  filteredPaidCustomers.map((cust) => (
                    <div
                      key={cust.id}
                      className="bg-slate-950 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-3.5 flex flex-col justify-between transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            {cust.plateNumber}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60 font-mono">
                            გადახდილია: {cust.amountPaid.toFixed(2)} ₾
                          </span>
                        </div>

                        <h5 className="text-xs font-bold text-white">{cust.driverName}</h5>
                        <div className="flex items-center gap-1 text-[11px] text-amber-400 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>მოქმედია: {new Date(cust.validUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => {
                            onTestPlateInCamera(cust.plateNumber);
                            onClose();
                          }}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                          title="კამერაზე დატესტვა"
                        >
                          <Camera className="w-3 h-3" />
                          <span>კამერით ტესტი</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeletePaidCustomer(cust.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                          title="წაშლა"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-400" />
            <span>ბაზა ლოკალურად ინახება და მყისიერად გადაეცემა ANPR კამერას</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            დახურვა
          </button>
        </div>
      </div>
    </div>
  );
};
