import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Download,
  Calendar,
  Car,
  UserCheck,
  Users,
  DollarSign,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Copy,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';
import { ParkingTicket, PaidCustomerRecord, VehicleActivityLog, EmployeeRecord } from '../types';

interface AdminMonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialYear?: number | 'all';
  initialMonth?: number | 'all'; // 1 - 12
  tickets: ParkingTicket[];
  customers: PaidCustomerRecord[];
  vehicleLogs: VehicleActivityLog[];
  employees: EmployeeRecord[];
  onViewReceipt?: (ticket: ParkingTicket) => void;
}

const MONTH_NAMES_KA = [
  'იანვარი',
  'თებერვალი',
  'მარტი',
  'აპრილი',
  'მაისი',
  'ივნისი',
  'ივლისი',
  'აგვისტო',
  'სექტემბერი',
  'ოქტომბერი',
  'ნოემბერი',
  'დეკემბერი',
];

export const AdminMonthlyReportModal: React.FC<AdminMonthlyReportModalProps> = ({
  isOpen,
  onClose,
  initialYear,
  initialMonth,
  tickets,
  customers,
  vehicleLogs,
  employees,
  onViewReceipt,
}) => {
  const currentYearNow = new Date().getFullYear();
  const currentMonthNow = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<number | 'all'>(
    initialYear !== undefined ? initialYear : currentYearNow
  );
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(
    initialMonth !== undefined ? initialMonth : currentMonthNow
  );
  const [activeReportSection, setActiveReportSection] = useState<'summary' | 'daily' | 'entries' | 'financial'>(
    'summary'
  );
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Available Years
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(2026);
    yearsSet.add(2025);

    tickets.forEach((t) => {
      if (t.entryTime) {
        const y = new Date(t.entryTime).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    customers.forEach((c) => {
      if (c.validUntil) {
        const y = new Date(c.validUntil).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    vehicleLogs.forEach((l) => {
      if (l.timestamp) {
        const y = new Date(l.timestamp).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [tickets, customers, vehicleLogs]);

  // Date Filter Predicate
  const isDateInFilter = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    if (selectedYear !== 'all' && d.getFullYear() !== selectedYear) {
      return false;
    }
    if (selectedMonth !== 'all' && d.getMonth() + 1 !== selectedMonth) {
      return false;
    }
    return true;
  };

  // Filtered Tickets for chosen Month/Year
  const filteredTickets = useMemo(() => {
    return tickets
      .filter((t) => isDateInFilter(t.entryTime || t.paidAt))
      .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
  }, [tickets, selectedYear, selectedMonth]);

  // Filtered Customers for chosen Month/Year
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => isDateInFilter(c.validUntil))
      .sort((a, b) => new Date(b.validUntil).getTime() - new Date(a.validUntil).getTime());
  }, [customers, selectedYear, selectedMonth]);

  // Filtered Vehicle Logs for chosen Month/Year
  const filteredLogs = useMemo(() => {
    return vehicleLogs
      .filter((l) => isDateInFilter(l.timestamp))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [vehicleLogs, selectedYear, selectedMonth]);

  // VEHICLE ENTRIES BREAKDOWN: თანამშრომელი ცალკე, მომხმარებელი ცალკე
  const entryLogs = useMemo(() => {
    return filteredLogs.filter((l) => l.direction === 'entry');
  }, [filteredLogs]);

  const employeeEntries = useMemo(() => {
    return entryLogs.filter((l) => l.category === 'employee' || l.spotId === 'A');
  }, [entryLogs]);

  const customerEntries = useMemo(() => {
    return entryLogs.filter((l) => l.category !== 'employee' && l.spotId !== 'A');
  }, [entryLogs]);

  // FINANCIAL TOTALS FOR PERIOD
  const ticketRevenue = useMemo(() => {
    return filteredTickets.reduce((sum, t) => sum + (t.amountPaid || t.amountDue || 0), 0);
  }, [filteredTickets]);

  const customerPassRevenue = useMemo(() => {
    return filteredCustomers.reduce((sum, c) => sum + (c.amountPaid || 0), 0);
  }, [filteredCustomers]);

  const grossRevenue = ticketRevenue + customerPassRevenue;

  // PAYMENT METHODS BREAKDOWN
  const paymentBreakdown = useMemo(() => {
    const stats: Record<string, { count: number; amount: number; label: string }> = {
      bog: { count: 0, amount: 0, label: 'საქართველოს ბანკი (BOG)' },
      tbc: { count: 0, amount: 0, label: 'თიბისი ბანკი (TBC)' },
      pos: { count: 0, amount: 0, label: 'POS ტერმინალი / ბარათი' },
      cash: { count: 0, amount: 0, label: 'ნაღდი ფული (სალარო)' },
    };

    filteredTickets.forEach((t) => {
      const amt = t.amountPaid || t.amountDue || 0;
      const method = (t.paymentMethod || 'cash').toLowerCase();
      if (method.includes('bog') || method.includes('საქ')) {
        stats.bog.count++;
        stats.bog.amount += amt;
      } else if (method.includes('tbc') || method.includes('თიბ')) {
        stats.tbc.count++;
        stats.tbc.amount += amt;
      } else if (method.includes('pos') || method.includes('card') || method.includes('ბარათ')) {
        stats.pos.count++;
        stats.pos.amount += amt;
      } else {
        stats.cash.count++;
        stats.cash.amount += amt;
      }
    });

    return stats;
  }, [filteredTickets]);

  // DAILY BREAKDOWN (დღეების მიხედვით გაშიფვრა)
  const dailyBreakdown = useMemo(() => {
    const dayMap: Record<
      string,
      {
        date: string;
        employeeCount: number;
        customerCount: number;
        ticketRevenue: number;
        passRevenue: number;
        totalRevenue: number;
        transactionsCount: number;
      }
    > = {};

    const getDayKey = (dStr: string) => {
      const d = new Date(dStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // Employee & customer entries
    entryLogs.forEach((l) => {
      const key = getDayKey(l.timestamp);
      if (!dayMap[key]) {
        dayMap[key] = {
          date: key,
          employeeCount: 0,
          customerCount: 0,
          ticketRevenue: 0,
          passRevenue: 0,
          totalRevenue: 0,
          transactionsCount: 0,
        };
      }
      if (l.category === 'employee' || l.spotId === 'A') {
        dayMap[key].employeeCount++;
      } else {
        dayMap[key].customerCount++;
      }
    });

    // Tickets
    filteredTickets.forEach((t) => {
      const key = getDayKey(t.entryTime || t.paidAt || new Date().toISOString());
      if (!dayMap[key]) {
        dayMap[key] = {
          date: key,
          employeeCount: 0,
          customerCount: 0,
          ticketRevenue: 0,
          passRevenue: 0,
          totalRevenue: 0,
          transactionsCount: 0,
        };
      }
      const amt = t.amountPaid || t.amountDue || 0;
      dayMap[key].ticketRevenue += amt;
      dayMap[key].totalRevenue += amt;
      dayMap[key].transactionsCount++;
    });

    // Customer passes
    filteredCustomers.forEach((c) => {
      const key = getDayKey(c.validUntil);
      if (!dayMap[key]) {
        dayMap[key] = {
          date: key,
          employeeCount: 0,
          customerCount: 0,
          ticketRevenue: 0,
          passRevenue: 0,
          totalRevenue: 0,
          transactionsCount: 0,
        };
      }
      const amt = c.amountPaid || 0;
      dayMap[key].passRevenue += amt;
      dayMap[key].totalRevenue += amt;
      dayMap[key].transactionsCount++;
    });

    return Object.values(dayMap).sort((a, b) => b.date.localeCompare(a.date));
  }, [entryLogs, filteredTickets, filteredCustomers]);

  // Human title for period
  const periodTitle = useMemo(() => {
    if (selectedYear === 'all' && selectedMonth === 'all') {
      return 'სრული ისტორიული პერიოდი (ყველა თვე და წელი)';
    }
    if (selectedMonth === 'all') {
      return `${selectedYear} წლის სრული ანგარიში`;
    }
    if (selectedYear === 'all') {
      return `ყოველწლიური ${MONTH_NAMES_KA[selectedMonth - 1]}`;
    }
    return `${selectedYear} წლის ${MONTH_NAMES_KA[selectedMonth - 1]}`;
  }, [selectedYear, selectedMonth]);

  // Average Daily Revenue
  const activeDaysCount = dailyBreakdown.length || 1;
  const avgDailyRevenue = grossRevenue / activeDaysCount;

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  // Export CSV (with UTF-8 BOM for Georgian character display in Excel)
  const handleExportCSV = () => {
    let csv = '\uFEFF'; // UTF-8 BOM
    csv += `"სმარტ პარკინგი — ოფიციალური რეპორტი: ${periodTitle}"\r\n`;
    csv += `"გენერირების თარიღი: ${new Date().toLocaleString('ka-GE')}"\r\n\r\n`;

    csv += `"--- შემაჯამებელი მაჩვენებლები ---"\r\n`;
    csv += `"ჯამური ფინანსური შემოსავალი:","${grossRevenue.toFixed(2)} ₾"\r\n`;
    csv += `"სალაროს ქვითრებიდან:","${ticketRevenue.toFixed(2)} ₾"\r\n`;
    csv += `"საშვებიდან & ჯავშნებიდან:","${customerPassRevenue.toFixed(2)} ₾"\r\n`;
    csv += `"სულ შემოსული ავტომობილები:","${entryLogs.length}"\r\n`;
    csv += `"თანამშრომლის ავტომობილები (A ზონა):","${employeeEntries.length}"\r\n`;
    csv += `"მომხმარებლის ავტომობილები (B ზონა):","${customerEntries.length}"\r\n\r\n`;

    csv += `"--- დღიური განაწილება ---"\r\n`;
    csv += `"თარიღი","თანამშრომელი (მანქანა)","მომხმარებელი (მანქანა)","სულ მანქანა","სალარო (₾)","საშვები (₾)","ჯამი (₾)"\r\n`;
    dailyBreakdown.forEach((row) => {
      csv += `"${row.date}","${row.employeeCount}","${row.customerCount}","${row.employeeCount + row.customerCount}","${row.ticketRevenue.toFixed(2)}","${row.passRevenue.toFixed(2)}","${row.totalRevenue.toFixed(2)}"\r\n`;
    });
    csv += `\r\n`;

    csv += `"--- ფინანსური ოპერაციების რეესტრი თავისივე თარიღებით ---"\r\n`;
    csv += `"თარიღი და დრო","ტიპი / ქვითარი","ნომერი","მძღოლი","თანხა (₾)","გადახდის მეთოდი"\r\n`;
    filteredTickets.forEach((t) => {
      const dt = t.entryTime ? new Date(t.entryTime).toLocaleString('ka-GE') : '—';
      csv += `"${dt}","ქვითარი #${t.ticketId}","${t.plateNumber}","${t.driverFullName || '—'}","${(t.amountPaid || t.amountDue || 0).toFixed(2)}","${t.paymentMethod || 'სალარო'}"\r\n`;
    });
    filteredCustomers.forEach((c) => {
      const dt = c.validUntil ? new Date(c.validUntil).toLocaleString('ka-GE') : '—';
      csv += `"${dt}","მომხმარებლის საშვი #${c.id}","${c.plateNumber}","${c.driverName || '—'}","${(c.amountPaid || 0).toFixed(2)}","ონლაინ / ბაზა"\r\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `smartpark_report_${selectedYear}_${selectedMonth}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Summary text to Clipboard
  const handleCopySummary = () => {
    const text = `📊 სმარტ პარკინგის რეპორტი: ${periodTitle}
━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 ჯამური შემოსავალი: ${grossRevenue.toFixed(2)} ₾
  • სალაროს ქვითრებიდან: ${ticketRevenue.toFixed(2)} ₾
  • საშვებიდან / ჯავშნებიდან: ${customerPassRevenue.toFixed(2)} ₾
  • დღიური საშუალო: ${avgDailyRevenue.toFixed(2)} ₾ / დღეში

🚗 შემოსული მანქანები (სულ): ${entryLogs.length}
  • 👔 თანამშრომელი ცალკე (A): ${employeeEntries.length} მანქანა
  • 💳 მომხმარებელი ცალკე (B): ${customerEntries.length} მანქანა

📅 აქტიური დღეები: ${dailyBreakdown.length} დღე
გენერირებულია: ${new Date().toLocaleString('ka-GE')}`;

    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="monthly-report-modal"
        className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-white"
      >
        {/* ================= MODAL HEADER ================= */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  ყოველთვიური & წლიური ოფიციალური რეპორტი
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  ადმინ სალარო
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                შპს სმარტ პარკინგი • {periodTitle}
              </p>
            </div>
          </div>

          {/* Quick Actions: Print, CSV, Copy, Close */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              title="რეპორტის ბეჭდვა / PDF"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">ბეჭდვა / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
              title="CSV / Excel ექსპორტი (UTF-8 ქართულით)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel / CSV</span>
            </button>

            <button
              type="button"
              onClick={handleCopySummary}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
              title="რეზიუმეს კოპირება"
            >
              {copiedSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              title="დახურვა"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= PERIOD SELECTOR TOOLBAR (წელი & თვე) ================= */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Year and Month controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>პერიოდი:</span>
            </span>

            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                setSelectedYear(val);
              }}
              className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">ყველა წელი</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y} წელი
                </option>
              ))}
            </select>

            {/* Month Selector */}
            <select
              value={selectedMonth}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                setSelectedMonth(val);
              }}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">ყველა თვე (წლიური რეზიუმე)</option>
              {MONTH_NAMES_KA.map((mName, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {String(idx + 1).padStart(2, '0')} - {mName}
                </option>
              ))}
            </select>

            {/* Quick Presets */}
            <div className="hidden md:flex items-center gap-1 ml-1 pl-2 border-l border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedYear(2026);
                  setSelectedMonth(10);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  selectedYear === 2026 && selectedMonth === 10
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                ოქტომბერი 2026 (მიმდინარე)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedYear(2026);
                  setSelectedMonth(9);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  selectedYear === 2026 && selectedMonth === 9
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                სექტემბერი 2026
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedYear(2026);
                  setSelectedMonth('all');
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  selectedYear === 2026 && selectedMonth === 'all'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                2026 (სრული წელი)
              </button>
            </div>
          </div>

          {/* Section Navigation Tabs within Report */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveReportSection('summary')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeReportSection === 'summary'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              შემაჯამებელი
            </button>
            <button
              type="button"
              onClick={() => setActiveReportSection('daily')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeReportSection === 'daily'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              დღიური ცხრილი ({dailyBreakdown.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveReportSection('entries')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeReportSection === 'entries'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              მანქანების შესვლა ({entryLogs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveReportSection('financial')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeReportSection === 'financial'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ყველა ტრანზაქცია ({filteredTickets.length + filteredCustomers.length})
            </button>
          </div>
        </div>

        {/* ================= MODAL BODY CONTENT ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ================= HIGH-LEVEL KPI METRICS ================= */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1. Total Revenue */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/70 to-slate-900 border border-emerald-500/40 relative overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-emerald-300">ჯამური შემოსავალი</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                {grossRevenue.toFixed(2)} <span className="text-emerald-400 text-lg">₾</span>
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-1 flex items-center justify-between font-mono">
                <span>სალარო: {ticketRevenue.toFixed(2)} ₾</span>
                <span>საშვები: {customerPassRevenue.toFixed(2)} ₾</span>
              </div>
            </div>

            {/* 2. Total Vehicles Entered */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-300">სულ შესული მანქანა</span>
                <Car className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                {entryLogs.length} <span className="text-slate-400 text-xs font-sans">მანქანა</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                არჩეულ საანგარიშგებო პერიოდში
              </div>
            </div>

            {/* 3. Employee Vehicles (ცალკე) */}
            <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-500/30 relative overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-teal-300">თანამშრომელი (A საშვი)</span>
                <UserCheck className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-teal-200">
                {employeeEntries.length} <span className="text-teal-400 text-xs font-sans">მანქანა</span>
              </div>
              <div className="text-[10px] text-teal-300/80 mt-1">
                {entryLogs.length > 0
                  ? `${Math.round((employeeEntries.length / entryLogs.length) * 100)}% საერთო შესვლებიდან`
                  : '0%'}
              </div>
            </div>

            {/* 4. Customer Vehicles (ცალკე) */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 relative overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-emerald-300">მომხმარებელი (B ფასიანი)</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-200">
                {customerEntries.length} <span className="text-emerald-400 text-xs font-sans">მანქანა</span>
              </div>
              <div className="text-[10px] text-emerald-300/80 mt-1">
                {entryLogs.length > 0
                  ? `${Math.round((customerEntries.length / entryLogs.length) * 100)}% საერთო შესვლებიდან`
                  : '0%'}
              </div>
            </div>
          </div>

          {/* Ratio Progress Bar: Employee vs Customer */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-teal-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                თანამშრომლის ავტომობილი (A): {employeeEntries.length} მანქანა
              </span>
              <span className="text-emerald-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                მომხმარებლის ავტომობილი (B): {customerEntries.length} მანქანა
              </span>
            </div>

            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${
                    entryLogs.length > 0 ? (employeeEntries.length / entryLogs.length) * 100 : 50
                  }%`,
                }}
                className="h-full bg-teal-500 transition-all duration-500"
                title={`თანამშრომელი: ${employeeEntries.length}`}
              />
              <div
                style={{
                  width: `${
                    entryLogs.length > 0 ? (customerEntries.length / entryLogs.length) * 100 : 50
                  }%`,
                }}
                className="h-full bg-emerald-500 transition-all duration-500"
                title={`მომხმარებელი: ${customerEntries.length}`}
              />
            </div>
          </div>

          {/* ================= SECTION: SUMMARY & BREAKDOWNS ================= */}
          {activeReportSection === 'summary' && (
            <div className="space-y-5">
              {/* Payment methods breakdown grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(paymentBreakdown).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{val.label}</span>
                      <span className="font-mono text-slate-300">{val.count} ტრანზაქცია</span>
                    </div>
                    <div className="text-lg font-black font-mono text-emerald-400">
                      {val.amount.toFixed(2)} ₾
                    </div>
                  </div>
                ))}
              </div>

              {/* Day-by-Day Preview Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white">
                      დღიური შეჯამება ({dailyBreakdown.length} აქტიური დღე)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveReportSection('daily')}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <span>სრული ნახვა</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                        <th className="py-2.5 px-3">თარიღი</th>
                        <th className="py-2.5 px-3 text-teal-400">თანამშრომელი (A)</th>
                        <th className="py-2.5 px-3 text-emerald-400">მომხმარებელი (B)</th>
                        <th className="py-2.5 px-3">სულ მანქანა</th>
                        <th className="py-2.5 px-3 font-mono text-right">დღიური შემოსავალი (₾)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {dailyBreakdown.map((row) => (
                        <tr key={row.date} className="hover:bg-slate-900/50">
                          <td className="py-2 px-3 font-mono font-bold text-white">{row.date}</td>
                          <td className="py-2 px-3 text-teal-300 font-bold font-mono">
                            {row.employeeCount} მანქანა
                          </td>
                          <td className="py-2 px-3 text-emerald-300 font-bold font-mono">
                            {row.customerCount} მანქანა
                          </td>
                          <td className="py-2 px-3 text-slate-300 font-mono">
                            {row.employeeCount + row.customerCount}
                          </td>
                          <td className="py-2 px-3 font-mono font-black text-emerald-400 text-right">
                            {row.totalRevenue.toFixed(2)} ₾
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION: FULL DAILY TABLE ================= */}
          {activeReportSection === 'daily' && (
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <span className="text-xs font-bold text-white">
                  დღეების მიხედვით დეტალური ანგარიში ({dailyBreakdown.length} დღე)
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  საშუალო: {avgDailyRevenue.toFixed(2)} ₾ / დღეში
                </span>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                      <th className="py-2.5 px-3">თარიღი</th>
                      <th className="py-2.5 px-3 text-teal-300">თანამშრომელი (A)</th>
                      <th className="py-2.5 px-3 text-emerald-300">მომხმარებელი (B)</th>
                      <th className="py-2.5 px-3">სულ მანქანა</th>
                      <th className="py-2.5 px-3">სალარო</th>
                      <th className="py-2.5 px-3">საშვები</th>
                      <th className="py-2.5 px-3 font-mono text-right">ჯამი</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {dailyBreakdown.map((row) => (
                      <tr key={row.date} className="hover:bg-slate-900/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-white">{row.date}</td>
                        <td className="py-2.5 px-3 text-teal-300 font-bold font-mono">
                          {row.employeeCount}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-300 font-bold font-mono">
                          {row.customerCount}
                        </td>
                        <td className="py-2.5 px-3 text-white font-mono font-bold">
                          {row.employeeCount + row.customerCount}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">
                          {row.ticketRevenue.toFixed(2)} ₾
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">
                          {row.passRevenue.toFixed(2)} ₾
                        </td>
                        <td className="py-2.5 px-3 font-mono font-black text-emerald-400 text-right">
                          {row.totalRevenue.toFixed(2)} ₾
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= SECTION: VEHICLE ENTRIES (თანამშრომელი ცალკე, მომხმარებელი ცალკე) ================= */}
          {activeReportSection === 'entries' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">
                  შესული ავტომობილების სრული რეესტრი ({entryLogs.length} მანქანა):
                </span>
                <span className="text-slate-300 font-mono text-[11px]">
                  თანამშრომელი: <strong className="text-teal-400">{employeeEntries.length}</strong> | მომხმარებელი:{' '}
                  <strong className="text-emerald-400">{customerEntries.length}</strong>
                </span>
              </div>

              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                        <th className="py-2.5 px-3">თარიღი & დრო</th>
                        <th className="py-2.5 px-3">კატეგორია</th>
                        <th className="py-2.5 px-3">ნომერი</th>
                        <th className="py-2.5 px-3">მძღოლი / თანამშრომელი</th>
                        <th className="py-2.5 px-3">ზონა</th>
                        <th className="py-2.5 px-3">შენიშვნა</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {entryLogs.map((log) => {
                        const isEmp = log.category === 'employee' || log.spotId === 'A';
                        const dateFormatted = new Date(log.timestamp).toLocaleString('ka-GE', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <tr key={log.id} className="hover:bg-slate-900/50">
                            <td className="py-2.5 px-3 font-mono text-slate-300 text-[11px]">
                              {dateFormatted}
                            </td>
                            <td className="py-2.5 px-3">
                              {isEmp ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-500/40">
                                  თანამშრომელი (A)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                                  მომხმარებელი (B)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-white">
                              {log.plateNumber}
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">
                              {log.driverName || '—'}
                            </td>
                            <td className="py-2.5 px-3 font-bold font-mono">
                              {log.spotId === 'A' ? (
                                <span className="text-teal-400">A</span>
                              ) : (
                                <span className="text-emerald-400">B</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                              {log.notes || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION: ALL TRANSACTIONS WITH EXACT DATES ================= */}
          {activeReportSection === 'financial' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">
                  ყველა ფინანსური შემოსავალი თავისივე თარიღებით:
                </span>
                <span className="text-emerald-400 font-mono font-black text-sm">
                  სულ: {grossRevenue.toFixed(2)} ₾
                </span>
              </div>

              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                        <th className="py-2.5 px-3">თარიღი & დრო</th>
                        <th className="py-2.5 px-3">ოპერაცია</th>
                        <th className="py-2.5 px-3">ნომერი</th>
                        <th className="py-2.5 px-3">მძღოლი</th>
                        <th className="py-2.5 px-3">თანხა</th>
                        <th className="py-2.5 px-3">მეთოდი</th>
                        <th className="py-2.5 px-3 text-right">მოქმედება</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {/* Tickets */}
                      {filteredTickets.map((t) => {
                        const dateFormatted = t.entryTime
                          ? new Date(t.entryTime).toLocaleString('ka-GE', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—';

                        return (
                          <tr key={`tkt-${t.ticketId}`} className="hover:bg-slate-900/50">
                            <td className="py-2 px-3 font-mono text-slate-300 text-[11px]">
                              {dateFormatted}
                            </td>
                            <td className="py-2 px-3 font-mono text-amber-400 font-semibold text-[11px]">
                              ქვითარი #{t.ticketId}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-white">
                              {t.plateNumber}
                            </td>
                            <td className="py-2 px-3 text-slate-300">{t.driverFullName || '—'}</td>
                            <td className="py-2 px-3 font-mono font-bold text-emerald-400">
                              {(t.amountPaid || t.amountDue || 0).toFixed(2)} ₾
                            </td>
                            <td className="py-2 px-3 text-slate-400">{t.paymentMethod || 'სალარო'}</td>
                            <td className="py-2 px-3 text-right">
                              {onViewReceipt && (
                                <button
                                  type="button"
                                  onClick={() => onViewReceipt(t)}
                                  className="text-amber-400 hover:text-amber-300 font-bold text-[11px]"
                                >
                                  ქვითარი
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Customer passes */}
                      {filteredCustomers.map((c) => {
                        const dateFormatted = c.validUntil
                          ? new Date(c.validUntil).toLocaleString('ka-GE', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—';

                        return (
                          <tr key={`cust-${c.id}`} className="hover:bg-slate-900/50">
                            <td className="py-2 px-3 font-mono text-slate-300 text-[11px]">
                              {dateFormatted}
                            </td>
                            <td className="py-2 px-3 font-mono text-indigo-400 font-semibold text-[11px]">
                              მომხმარებლის საშვი #{c.id}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-white">
                              {c.plateNumber}
                            </td>
                            <td className="py-2 px-3 text-slate-300">{c.driverName || '—'}</td>
                            <td className="py-2 px-3 font-mono font-bold text-emerald-400">
                              {(c.amountPaid || 0).toFixed(2)} ₾
                            </td>
                            <td className="py-2 px-3 text-slate-400">ონლაინ / ბაზა</td>
                            <td className="py-2 px-3 text-right text-slate-500 text-[11px]">
                              დადასტურებული
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              საანგარიშგებო პერიოდი: <strong className="text-white">{periodTitle}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>ბეჭდვა</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all flex items-center gap-1.5 shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>ჩამოტვირთვა (CSV / Excel)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
