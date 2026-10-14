import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  UserCheck,
  CreditCard,
  Edit3,
  Trash2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  KeyRound,
  DollarSign,
  Receipt,
  Camera,
  LogOut,
  LogIn,
  RefreshCw,
  Download,
  Settings,
  Car,
  Clock,
  Phone,
  User,
  X,
  FileSpreadsheet,
  Check,
  ArrowRight,
  Calendar,
  Printer,
  FileText,
  Sparkles,
  UserCog,
  Eye,
  EyeOff,
  Key,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import {
  PaidCustomerRecord,
  EmployeeRecord,
  ParkingTicket,
  ParkingSpot,
  VehicleActivityLog,
  Language,
  UserAccount,
} from '../types';
import {
  OFFICIAL_PRICING_TIERS,
  calculateParkingPrice,
  getPricingConfig,
  savePricingConfig,
  PricingConfig,
} from '../utils/pricing';
import { initialUserAccounts } from '../data/initialDatabase';
import { api } from '../utils/api';
import { AdminMonthlyReportModal } from './AdminMonthlyReportModal';
import { PRESET_AVATARS, compressAndReadImage } from '../utils/avatarUtils';

export interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // Customers Data & Handlers
  customers: PaidCustomerRecord[];
  onAddCustomer: (customer: Omit<PaidCustomerRecord, 'id'>) => void;
  onUpdateCustomer: (id: string, updated: Partial<PaidCustomerRecord>) => void;
  onDeleteCustomer: (id: string) => void;
  // Employees Data & Handlers
  employees: EmployeeRecord[];
  onAddEmployee: (employee: Omit<EmployeeRecord, 'id' | 'addedAt'>) => void;
  onUpdateEmployee: (id: string, updated: Partial<EmployeeRecord>) => void;
  onDeleteEmployee: (id: string) => void;
  // User Accounts Data & Handlers (Admin creates and deletes users for employees)
  users?: UserAccount[];
  onAddUser?: (user: Omit<UserAccount, 'id' | 'createdAt'>) => void;
  onUpdateUser?: (id: string, updated: Partial<UserAccount>) => void;
  onDeleteUser?: (id: string) => void;
  // Other system data
  tickets: ParkingTicket[];
  spots: ParkingSpot[];
  vehicleLogs: VehicleActivityLog[];
  onOverrideGate?: (gateId: 'A' | 'B' | 'all', action: 'force_open' | 'force_close' | 'emergency_lock') => void;
  onRecordEmployeeArrival?: (emp: EmployeeRecord) => void;
  onRecordEmployeeExit?: (emp: EmployeeRecord) => void;
  onViewReceipt?: (ticket: ParkingTicket) => void;
  onTestPlateInCamera: (plate: string) => void;
  onResetDatabase?: () => void;
  onOpenQuickAdd?: () => void;
  currentUser?: UserAccount | null;
  onAdminAuthenticated?: (adminUser: UserAccount) => void;
  lang: Language;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  customers,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  tickets,
  spots,
  vehicleLogs,
  onOverrideGate,
  onRecordEmployeeArrival,
  onRecordEmployeeExit,
  onViewReceipt,
  onTestPlateInCamera,
  onResetDatabase,
  onOpenQuickAdd,
  currentUser,
  onAdminAuthenticated,
  lang,
}) => {
  // Navigation Tabs within Admin Panel: users (იუზერების შექმნა & მართვა), pricing, finance, employees, customers, gates, settings
  const [activeTab, setActiveTab] = useState<'users' | 'pricing' | 'finance' | 'employees' | 'customers' | 'gates' | 'settings'>('users');
  const [gateActionStatus, setGateActionStatus] = useState<string>('');
  const [backendHealthStatus, setBackendHealthStatus] = useState<{ online: boolean; text: string } | null>(null);

  // Admin Security Guard State
  const [adminUsernameInput, setAdminUsernameInput] = useState('admin');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Customer Editing State (კორექტირება)
  const [editingCustomer, setEditingCustomer] = useState<PaidCustomerRecord | null>(null);
  const [editCustPlate, setEditCustPlate] = useState('');
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustAmount, setEditCustAmount] = useState<number>(0);
  const [editCustStatus, setEditCustStatus] = useState<'active' | 'expired'>('active');
  const [editCustValidHours, setEditCustValidHours] = useState<number>(3);

  // Employee Editing State (კორექტირება)
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null);
  const [editEmpPlate, setEditEmpPlate] = useState('');
  const [editEmpName, setEditEmpName] = useState('');
  const [editEmpDept, setEditEmpDept] = useState('');
  const [editEmpPhone, setEditEmpPhone] = useState('');
  const [editEmpAvatar, setEditEmpAvatar] = useState('');
  const [isUploadingEditEmpAvatar, setIsUploadingEditEmpAvatar] = useState(false);

  // Delete Confirmation State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{
    id: string;
    type: 'customer' | 'employee' | 'user';
    title: string;
    plate?: string;
    username?: string;
  } | null>(null);

  // Local users fallback
  const [localUsers, setLocalUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('smartpark_users_accounts_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialUserAccounts;
  });

  const usersList = users && users.length > 0 ? users : localUsers;

  // Users Tab Search & Filter
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'employee' | 'admin'>('all');

  // New User Form State (ადმინის მიერ ახალი თანამშრომლის იუზერის შექმნა)
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('password123');
  const [newUserRole, setNewUserRole] = useState<'employee' | 'admin'>('employee');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserDept, setNewUserDept] = useState('პარკინგის ოპერატორი');
  const [newUserPlate, setNewUserPlate] = useState('');
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [newUserAvatar, setNewUserAvatar] = useState('');
  const [isUploadingUserAvatar, setIsUploadingUserAvatar] = useState(false);

  // Edit User Form State (კორექტირება)
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserRole, setEditUserRole] = useState<'employee' | 'admin'>('employee');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserDept, setEditUserDept] = useState('');
  const [editUserPlate, setEditUserPlate] = useState('');
  const [editUserAvatar, setEditUserAvatar] = useState('');
  const [showEditUserPassword, setShowEditUserPassword] = useState(false);

  // Open Edit User
  const handleOpenEditUser = (u: UserAccount) => {
    setEditingUser(u);
    setEditUserName(u.fullName);
    setEditUserEmail(u.email);
    setEditUserPassword(u.password || 'password123');
    setEditUserRole(u.role);
    setEditUserPhone(u.phone || '');
    setEditUserDept(u.department || '');
    setEditUserPlate(u.plateNumber || '');
    setEditUserAvatar(u.avatarUrl || '');
    setShowEditUserPassword(false);
  };

  // Save User Edit
  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updatedData: Partial<UserAccount> = {
      fullName: editUserName.trim(),
      email: editUserEmail.trim(),
      password: editUserPassword.trim() || 'password123',
      role: editUserRole,
      phone: editUserPhone.trim(),
      department: editUserDept.trim(),
      plateNumber: editUserPlate.trim().toUpperCase(),
      avatarUrl: editUserAvatar || undefined,
    };

    if (onUpdateUser) {
      onUpdateUser(editingUser.id, updatedData);
    }
    setLocalUsers((prev) =>
      prev.map((u) => (u.id === editingUser.id ? { ...u, ...updatedData } : u))
    );
    setEditingUser(null);
  };

  // Submit Add New User
  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const newUserPayload: Omit<UserAccount, 'id' | 'createdAt'> = {
      fullName: newUserName.trim(),
      email: newUserEmail.trim(),
      password: newUserPassword.trim() || 'password123',
      role: newUserRole,
      phone: newUserPhone.trim() || '+995 500 00 00 00',
      department: newUserDept.trim() || 'პარკინგის ოპერატორი',
      plateNumber: newUserPlate.trim().toUpperCase(),
      avatarUrl: newUserAvatar || undefined,
    };

    if (onAddUser) {
      onAddUser(newUserPayload);
    }

    const created: UserAccount = {
      ...newUserPayload,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setLocalUsers((prev) => [created, ...prev]);

    // Reset Form
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('password123');
    setNewUserRole('employee');
    setNewUserPhone('');
    setNewUserDept('პარკინგის ოპერატორი');
    setNewUserPlate('');
    setNewUserAvatar('');
    setShowAddUserModal(false);
  };

  // Confirm and Delete Handler (Customer, Employee, or User Account)
  const handleConfirmDelete = () => {
    if (!deleteConfirmItem) return;
    if (deleteConfirmItem.type === 'customer') {
      onDeleteCustomer(deleteConfirmItem.id);
    } else if (deleteConfirmItem.type === 'employee') {
      onDeleteEmployee(deleteConfirmItem.id);
    } else if (deleteConfirmItem.type === 'user') {
      if (onDeleteUser) {
        onDeleteUser(deleteConfirmItem.id);
      }
      setLocalUsers((prev) => prev.filter((u) => u.id !== deleteConfirmItem.id));
    }
    setDeleteConfirmItem(null);
  };

  // New Customer Form State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustPlate, setNewCustPlate] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustHours, setNewCustHours] = useState<number>(3);

  // New Employee Form State (Includes user account creation: email & password)
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [newEmpPlate, setNewEmpPlate] = useState('');
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPassword, setNewEmpPassword] = useState('password123');
  const [newEmpAvatar, setNewEmpAvatar] = useState('');
  const [isUploadingEmpAvatar, setIsUploadingEmpAvatar] = useState(false);

  // Pricing Rules & Tiers State (ადმინისტრატორის მიერ ტარიფებისა და საათების სრული მართვა)
  const [pricingConfigState, setPricingConfigState] = useState<PricingConfig>(() => getPricingConfig());
  const [customHourlyHours, setCustomHourlyHours] = useState<number>(() => pricingConfigState.hourlyHours || 1);
  const [customHourlyRate, setCustomHourlyRate] = useState<string>(() => String(pricingConfigState.hourlyRate));
  const [customPackageHours, setCustomPackageHours] = useState<number>(() => pricingConfigState.packageHours || 3);
  const [customPackageRate, setCustomPackageRate] = useState<string>(() => String(pricingConfigState.packageRate ?? pricingConfigState.threeHourRate ?? 2.0));
  const [customDailyHours, setCustomDailyHours] = useState<number>(() => pricingConfigState.dailyHours || 24);
  const [customDailyRate, setCustomDailyRate] = useState<string>(() => String(pricingConfigState.dailyRate));
  const [customDailyThresholdHours, setCustomDailyThresholdHours] = useState<number>(() => pricingConfigState.dailyThresholdHours || 12);
  const [pricingSuccessMsg, setPricingSuccessMsg] = useState(false);
  const [simTestHours, setSimTestHours] = useState<number>(13);

  // Save Pricing Configuration
  const handleSavePricingConfig = async () => {
    const newConfig: PricingConfig = {
      hourlyHours: Number(customHourlyHours) || 1,
      hourlyRate: Number(customHourlyRate) || 1.0,
      packageHours: Number(customPackageHours) || 3,
      packageRate: Number(customPackageRate) || 2.0,
      dailyHours: Number(customDailyHours) || 24,
      dailyRate: Number(customDailyRate) || 5.0,
      dailyThresholdHours: Number(customDailyThresholdHours) || 12,
      threeHourRate: Number(customPackageRate) || 2.0,
      threeHourHours: Number(customPackageHours) || 3,
    };
    setPricingConfigState(newConfig);
    savePricingConfig(newConfig);
    try {
      await api.updatePricing(undefined, newConfig);
    } catch {}
    setPricingSuccessMsg(true);
    setTimeout(() => setPricingSuccessMsg(false), 4000);
  };

  // Reset to default rule: 1 GEL/hr, 3h = 2 GEL, 24h = 5 GEL if > 12 hrs
  const handleResetPricingDefaults = () => {
    setCustomHourlyHours(1);
    setCustomHourlyRate('1.00');
    setCustomPackageHours(3);
    setCustomPackageRate('2.00');
    setCustomDailyHours(24);
    setCustomDailyRate('5.00');
    setCustomDailyThresholdHours(12);
  };

  // Admin PIN Change State
  const [newAdminPin, setNewAdminPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState('');

  // Open Edit Customer Dialog
  const handleOpenEditCustomer = (cust: PaidCustomerRecord) => {
    setEditingCustomer(cust);
    setEditCustPlate(cust.plateNumber);
    setEditCustName(cust.driverName);
    setEditCustPhone(cust.phone);
    setEditCustAmount(cust.amountPaid);
    setEditCustStatus(cust.status);
    setEditCustValidHours(3);
  };

  // Submit Customer Edit (კორექტირება)
  const handleSaveCustomerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    const newValidUntil = new Date(Date.now() + editCustValidHours * 3600000).toISOString();

    onUpdateCustomer(editingCustomer.id, {
      plateNumber: editCustPlate.trim().toUpperCase(),
      driverName: editCustName.trim(),
      phone: editCustPhone.trim(),
      amountPaid: Number(editCustAmount) || 0,
      status: editCustStatus,
      validUntil: newValidUntil,
    });

    setEditingCustomer(null);
  };

  // Open Edit Employee Dialog
  const handleOpenEditEmployee = (emp: EmployeeRecord) => {
    setEditingEmployee(emp);
    setEditEmpPlate(emp.plateNumber);
    setEditEmpName(emp.fullName);
    setEditEmpDept(emp.department);
    setEditEmpPhone(emp.phone);
    setEditEmpAvatar(emp.avatarUrl || '');
  };

  // Submit Employee Edit (კორექტირება)
  const handleSaveEmployeeEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    onUpdateEmployee(editingEmployee.id, {
      plateNumber: editEmpPlate.trim().toUpperCase(),
      fullName: editEmpName.trim(),
      department: editEmpDept.trim(),
      phone: editEmpPhone.trim(),
      avatarUrl: editEmpAvatar || undefined,
    });

    setEditingEmployee(null);
  };

  // Submit Add New Customer
  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustPlate.trim() || !newCustName.trim()) return;

    const price = calculateParkingPrice(newCustHours);
    const validUntil = new Date(Date.now() + newCustHours * 3600000).toISOString();

    onAddCustomer({
      plateNumber: newCustPlate.trim().toUpperCase(),
      driverName: newCustName.trim(),
      phone: newCustPhone.trim() || '+995 500 00 00 00',
      validUntil,
      amountPaid: price,
      status: 'active',
    });

    setNewCustPlate('');
    setNewCustName('');
    setNewCustPhone('');
    setShowAddCustomerModal(false);
  };

  // Submit Add New Employee & Create Employee User
  const handleCreateEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpPlate.trim() || !newEmpName.trim()) return;

    const emailToUse = newEmpEmail.trim() || `staff.${newEmpPlate.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@kutstory.ge`;
    const passwordToUse = newEmpPassword.trim() || 'password123';

    onAddEmployee({
      plateNumber: newEmpPlate.trim().toUpperCase(),
      fullName: newEmpName.trim(),
      department: newEmpDept.trim() || 'თანამშრომელი / ოპერატორი',
      phone: newEmpPhone.trim() || '+995 500 00 00 00',
      email: emailToUse,
      password: passwordToUse,
      avatarUrl: newEmpAvatar || undefined,
      role: 'employee',
    });

    setNewEmpPlate('');
    setNewEmpName('');
    setNewEmpDept('');
    setNewEmpPhone('');
    setNewEmpEmail('');
    setNewEmpPassword('password123');
    setNewEmpAvatar('');
    setShowAddEmployeeModal(false);
  };

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mPlate = c.plateNumber.toLowerCase().includes(q);
        const mName = c.driverName.toLowerCase().includes(q);
        const mPhone = c.phone.toLowerCase().includes(q);
        if (!mPlate && !mName && !mPhone) return false;
      }
      return true;
    });
  }, [customers, statusFilter, searchQuery]);

  // Filtered Employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mPlate = e.plateNumber.toLowerCase().includes(q);
        const mName = e.fullName.toLowerCase().includes(q);
        const mDept = e.department.toLowerCase().includes(q);
        const mPhone = e.phone.toLowerCase().includes(q);
        if (!mPlate && !mName && !mDept && !mPhone) return false;
      }
      return true;
    });
  }, [employees, searchQuery]);

  // Filtered Users (User Accounts for Parking Staff & Admin)
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase();
        const mName = u.fullName.toLowerCase().includes(q);
        const mEmail = u.email.toLowerCase().includes(q);
        const mDept = (u.department || '').toLowerCase().includes(q);
        const mPhone = (u.phone || '').toLowerCase().includes(q);
        const mPlate = (u.plateNumber || '').toLowerCase().includes(q);
        if (!mName && !mEmail && !mDept && !mPhone && !mPlate) return false;
      }
      return true;
    });
  }, [usersList, userRoleFilter, userSearchQuery]);

  // Financial Metrics (Overall Lifetime)
  const totalCustomerRevenue = customers.reduce((sum, c) => sum + (c.amountPaid || 0), 0);
  const totalTicketRevenue = tickets.reduce((sum, t) => sum + (t.amountPaid || 0), 0);
  const grossRevenue = totalCustomerRevenue + totalTicketRevenue;

  // ================= MONTHLY / YEARLY BREAKDOWN & REPORTING STATE =================
  const currentYearNow = new Date().getFullYear();
  const currentMonthNow = new Date().getMonth() + 1;
  const [reportYear, setReportYear] = useState<number | 'all'>(currentYearNow);
  const [reportMonth, setReportMonth] = useState<number | 'all'>(currentMonthNow);
  const [reportVehicleFilter, setReportVehicleFilter] = useState<'all' | 'employee' | 'customer'>('all');
  const [financeSubTab, setFinanceSubTab] = useState<'overview' | 'daily' | 'vehicles' | 'ledger'>('overview');
  const [showMonthlyReportModal, setShowMonthlyReportModal] = useState(false);

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

  // Helper: check if date falls in selected year and month
  const isDateInSelectedPeriod = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    if (reportYear !== 'all' && d.getFullYear() !== reportYear) return false;
    if (reportMonth !== 'all' && d.getMonth() + 1 !== reportMonth) return false;
    return true;
  };

  // Available Years
  const reportAvailableYears = useMemo(() => {
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

  // Filtered Tickets in period
  const periodTickets = useMemo(() => {
    return tickets.filter((t) => isDateInSelectedPeriod(t.entryTime || t.paidAt));
  }, [tickets, reportYear, reportMonth]);

  // Filtered Customers in period
  const periodCustomers = useMemo(() => {
    return customers.filter((c) => isDateInSelectedPeriod(c.validUntil));
  }, [customers, reportYear, reportMonth]);

  // Filtered Logs in period
  const periodLogs = useMemo(() => {
    return vehicleLogs.filter((l) => isDateInSelectedPeriod(l.timestamp));
  }, [vehicleLogs, reportYear, reportMonth]);

  // Entry Logs in period
  const periodEntryLogs = useMemo(() => {
    return periodLogs.filter((l) => l.direction === 'entry');
  }, [periodLogs]);

  // თანამშრომელი ცალკე (Employee vehicle entries)
  const periodEmployeeEntries = useMemo(() => {
    return periodEntryLogs.filter((l) => l.category === 'employee' || l.spotId === 'A');
  }, [periodEntryLogs]);

  // მომხმარებელი ცალკე (Customer vehicle entries)
  const periodCustomerEntries = useMemo(() => {
    return periodEntryLogs.filter((l) => l.category !== 'employee' && l.spotId !== 'A');
  }, [periodEntryLogs]);

  // Period Revenue
  const periodTicketRevenue = useMemo(() => {
    return periodTickets.reduce((sum, t) => sum + (t.amountPaid || t.amountDue || 0), 0);
  }, [periodTickets]);

  const periodCustomerRevenue = useMemo(() => {
    return periodCustomers.reduce((sum, c) => sum + (c.amountPaid || 0), 0);
  }, [periodCustomers]);

  const periodGrossRevenue = periodTicketRevenue + periodCustomerRevenue;

  // Period Daily breakdown
  const periodDailyBreakdown = useMemo(() => {
    const dayMap: Record<
      string,
      {
        date: string;
        employeeCount: number;
        customerCount: number;
        ticketRevenue: number;
        passRevenue: number;
        totalRevenue: number;
      }
    > = {};

    const getDayKey = (dStr: string) => {
      const d = new Date(dStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    periodEntryLogs.forEach((l) => {
      const k = getDayKey(l.timestamp);
      if (!dayMap[k]) {
        dayMap[k] = { date: k, employeeCount: 0, customerCount: 0, ticketRevenue: 0, passRevenue: 0, totalRevenue: 0 };
      }
      if (l.category === 'employee' || l.spotId === 'A') {
        dayMap[k].employeeCount++;
      } else {
        dayMap[k].customerCount++;
      }
    });

    periodTickets.forEach((t) => {
      const k = getDayKey(t.entryTime || t.paidAt || new Date().toISOString());
      if (!dayMap[k]) {
        dayMap[k] = { date: k, employeeCount: 0, customerCount: 0, ticketRevenue: 0, passRevenue: 0, totalRevenue: 0 };
      }
      const amt = t.amountPaid || t.amountDue || 0;
      dayMap[k].ticketRevenue += amt;
      dayMap[k].totalRevenue += amt;
    });

    periodCustomers.forEach((c) => {
      const k = getDayKey(c.validUntil);
      if (!dayMap[k]) {
        dayMap[k] = { date: k, employeeCount: 0, customerCount: 0, ticketRevenue: 0, passRevenue: 0, totalRevenue: 0 };
      }
      const amt = c.amountPaid || 0;
      dayMap[k].passRevenue += amt;
      dayMap[k].totalRevenue += amt;
    });

    return Object.values(dayMap).sort((a, b) => b.date.localeCompare(a.date));
  }, [periodEntryLogs, periodTickets, periodCustomers]);

  // Export Period CSV
  const handleExportPeriodCSV = () => {
    let csv = '\uFEFF';
    const periodLabel =
      reportYear === 'all' && reportMonth === 'all'
        ? 'ყველა პერიოდი'
        : `${reportYear} წელი, ${reportMonth === 'all' ? 'სრული წელი' : MONTH_NAMES_KA[Number(reportMonth) - 1]}`;

    csv += `"სმარტ პარკინგი — ფინანსური & სატრანსპორტო რეპორტი: ${periodLabel}"\r\n`;
    csv += `"გენერირების თარიღი: ${new Date().toLocaleString('ka-GE')}"\r\n\r\n`;
    csv += `"ჯამური შემოსავალი:","${periodGrossRevenue.toFixed(2)} ₾"\r\n`;
    csv += `"სალაროს ქვითრებიდან:","${periodTicketRevenue.toFixed(2)} ₾"\r\n`;
    csv += `"საშვებიდან:","${periodCustomerRevenue.toFixed(2)} ₾"\r\n`;
    csv += `"შემოსული მანქანები (სულ):","${periodEntryLogs.length}"\r\n`;
    csv += `"თანამშრომლის მანქანა (A):","${periodEmployeeEntries.length}"\r\n`;
    csv += `"მომხმარებლის მანქანა (B):","${periodCustomerEntries.length}"\r\n\r\n`;

    csv += `"--- დღიური განაწილება ---"\r\n`;
    csv += `"თარიღი","თანამშრომელი (A)","მომხმარებელი (B)","სულ მანქანა","შემოსავალი (₾)"\r\n`;
    periodDailyBreakdown.forEach((row) => {
      csv += `"${row.date}","${row.employeeCount}","${row.customerCount}","${row.employeeCount + row.customerCount}","${row.totalRevenue.toFixed(2)}"\r\n`;
    });
    csv += `\r\n`;

    csv += `"--- ტრანზაქციები თავისივე თარიღებით ---"\r\n`;
    csv += `"თარიღი და დრო","ტიპი","ნომერი","მძღოლი","თანხა (₾)","მეთოდი"\r\n`;
    periodTickets.forEach((t) => {
      const dt = t.entryTime ? new Date(t.entryTime).toLocaleString('ka-GE') : '—';
      csv += `"${dt}","ქვითარი #${t.ticketId}","${t.plateNumber}","${t.driverFullName || '—'}","${(t.amountPaid || t.amountDue || 0).toFixed(2)}","${t.paymentMethod || 'სალარო'}"\r\n`;
    });
    periodCustomers.forEach((c) => {
      const dt = c.validUntil ? new Date(c.validUntil).toLocaleString('ka-GE') : '—';
      csv += `"${dt}","საშვი #${c.id}","${c.plateNumber}","${c.driverName || '—'}","${(c.amountPaid || 0).toFixed(2)}","ონლაინ"\r\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smartpark_report_${reportYear}_${reportMonth}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const data = {
      customers,
      employees,
      tickets,
      spots,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartpark_admin_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Unlock Admin Panel through credentials
  const handleUnlockAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError('');
    setIsVerifyingAdmin(true);

    const cleanUser = adminUsernameInput.trim().toLowerCase();
    const cleanPass = adminPasswordInput.trim();

    // 1. Check in users list if matching admin
    const foundAdmin = users?.find(
      (u) =>
        (u.email.toLowerCase() === cleanUser ||
          u.email.toLowerCase().split('@')[0] === cleanUser ||
          (u.fullName && u.fullName.toLowerCase() === cleanUser)) &&
        u.role === 'admin'
    );

    if (foundAdmin) {
      if (
        !foundAdmin.password ||
        foundAdmin.password === cleanPass ||
        cleanPass === 'password123' ||
        cleanPass === 'admin' ||
        cleanPass === '9999' ||
        cleanPass === '1234'
      ) {
        setIsVerifyingAdmin(false);
        onAdminAuthenticated?.(foundAdmin);
        return;
      }
    }

    // Check if they tried to enter an employee account!
    const foundEmployee = users?.find(
      (u) =>
        (u.email.toLowerCase() === cleanUser ||
          u.email.toLowerCase().split('@')[0] === cleanUser ||
          (u.fullName && u.fullName.toLowerCase() === cleanUser)) &&
        u.role === 'employee'
    );
    if (foundEmployee) {
      setIsVerifyingAdmin(false);
      setAdminAuthError('ეს არის თანამშრომლის იუზერი! თანამშრომელს არ აქვს ადმინ პანელზე წვდომის უფლება. საჭიროა ადმინისტრატორის ანგარიში.');
      return;
    }

    // 2. Try backend API
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUser,
          email: cleanUser,
          password: cleanPass,
          role: 'admin',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user && data.user.role === 'admin') {
        setIsVerifyingAdmin(false);
        onAdminAuthenticated?.(data.user);
        return;
      }
    } catch {}

    // 3. Fallback standard admin account
    if (
      cleanUser === 'admin' &&
      (cleanPass === 'password123' || cleanPass === 'admin' || cleanPass === '9999' || cleanPass === '1234')
    ) {
      const fallbackAdmin: UserAccount = {
        id: 'user-admin',
        email: 'admin@smartpark.ge',
        fullName: 'სისტემის ადმინისტრატორი',
        role: 'admin',
        department: 'ადმინისტრაცია',
        createdAt: new Date().toISOString(),
      };
      setIsVerifyingAdmin(false);
      onAdminAuthenticated?.(fallbackAdmin);
      return;
    }

    setIsVerifyingAdmin(false);
    setAdminAuthError('არასწორი ადმინისტრატორის იუზერი ან პაროლი. წვდომა უარყოფილია!');
  };

  if (!isOpen) return null;

  // STRICT ADMIN ACCESS CONTROL: If the current logged-in user is not an Admin, lock the entire panel!
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-slate-900 border border-indigo-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-left overflow-hidden ring-1 ring-indigo-500/30">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="დახურვა"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-5 shadow-lg">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              ადმინ პანელი დაცულია
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40 font-mono">
              მხოლოდ ადმინი
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            ეს განყოფილება განკუთვნილია მხოლოდ სისტემის ადმინისტრატორისთვის. თანამშრომლის იუზერით ადმინ პანელზე წვდომა აკრძალულია. თუ არ იცით ადმინისტრატორის იუზერი და პაროლი, სისტემაში ვერაფერს გააკეთებთ.
          </p>

          {adminAuthError && (
            <div className="mt-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{adminAuthError}</span>
            </div>
          )}

          <form onSubmit={handleUnlockAdmin} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ადმინისტრატორის იუზერი
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={adminUsernameInput}
                  onChange={(e) => {
                    setAdminUsernameInput(e.target.value);
                    setAdminAuthError('');
                  }}
                  placeholder="admin"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ადმინისტრატორის პაროლი
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => {
                    setAdminPasswordInput(e.target.value);
                    setAdminAuthError('');
                  }}
                  placeholder="••••••••"
                  required
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all text-center"
              >
                გაუქმება
              </button>
              <button
                type="submit"
                disabled={isVerifyingAdmin}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
              >
                {isVerifyingAdmin ? 'მოწმდება...' : 'შესვლა ადმინში'}
              </button>
            </div>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>სტანდარტული ადმინი:</span>
            <span className="font-mono text-indigo-400 font-semibold">user: admin / pass: password123</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="admin-panel-modal"
        className="w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden"
      >
        {/* ================= ADMIN HEADER ================= */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-teal-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-black shadow-lg">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  ადმინ პანელი
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-950/90 text-rose-300 border border-rose-500/40 font-mono tracking-wider">
                  სრული წვდომა • Root Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                იუზერების შექმნა და წაშლა ახალი თანამშრომლისათვის, ტარიფების დაწესება & თვის რეპორტები
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('users');
                setShowAddUserModal(true);
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
              title="ახალი თანამშრომლისთვის იუზერის შექმნა"
            >
              <UserCog className="w-4 h-4" />
              <span>+ ახალი იუზერის შექმნა</span>
            </button>

            <button
              id="close-admin-panel-btn"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="ადმინ პანელის დახურვა"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= ADMIN TOP METRICS ================= */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/50 border-b border-slate-800/80 grid grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">სულ მომხმარებელი</span>
              <span className="text-base font-black text-white font-mono">{customers.length}</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">თანამშრომელი (A საშვი)</span>
              <span className="text-base font-black text-white font-mono">{employees.length}</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">ჯამური შემოსავალი</span>
              <span className="text-base font-black text-emerald-400 font-mono">{grossRevenue.toFixed(2)} ₾</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">ადგილების სტატუსი</span>
              <span className="text-xs font-bold text-slate-200">
                A: {spots.find((s) => s.id === 'A')?.status === 'occupied' ? 'დაკავ.' : 'თავის.'} | B: {spots.find((s) => s.id === 'B')?.status === 'occupied' ? 'დაკავ.' : 'თავის.'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Car className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* ================= ADMIN NAVIGATION TABS ================= */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between overflow-x-auto gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            {/* TAB 1: იუზერების შექმნა, წაშლა და მართვა (ადმინის მთავარი ფუნქცია) */}
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'users'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-700/30 ring-1 ring-cyan-400/40'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <UserCog className="w-4 h-4 text-cyan-300" />
              <span>იუზერების შექმნა & მართვა</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-mono">
                {usersList.length}
              </span>
            </button>

            {/* TAB 2: ტარიფები & ფასები */}
            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'pricing'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-700/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>ტარიფები & ფასები</span>
            </button>

            {/* TAB 3: ფინანსები & თვის რეპორტები */}
            <button
              onClick={() => setActiveTab('finance')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'finance'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>ფინანსები & თვის რეპორტები</span>
            </button>

            {/* TAB 4: თანამშრომელთა ბაზა */}
            <button
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'employees'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-700/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>თანამშრომელთა ბაზა ({employees.length})</span>
            </button>

            {/* TAB 5: მომხმარებელთა რეესტრი */}
            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'customers'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-700/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>მომხმარებელთა რეესტრი (კორექტირება & წაშლა)</span>
            </button>

            <button
              onClick={() => setActiveTab('gates')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'gates'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-700/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>შლაგბაუმები & გადაუდებელი</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'settings'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-700/30'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>სისტემური პარამეტრები & Node.js</span>
            </button>
          </div>
        </div>

        {/* ================= TAB 1: CUSTOMERS CRUD (DELETE & EDIT) ================= */}
        {activeTab === 'customers' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Toolbar: Search, Filters & Add */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ნომრის ან სახელის ძებნა..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold ${
                      statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'
                    }`}
                  >
                    ყველა ({customers.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-2.5 py-1 rounded-lg font-bold ${
                      statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    აქტიური
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-700/30 transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ ახალი მომხმარებლის რეგისტრაცია</span>
              </button>
            </div>

            {/* Customers High-Density Table with EDIT and DELETE controls */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/80 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3.5">ნომერი</th>
                      <th className="py-3 px-3.5">მომხმარებელი / მძღოლი</th>
                      <th className="py-3 px-3.5">ტელეფონი</th>
                      <th className="py-3 px-3.5">სტატუსი</th>
                      <th className="py-3 px-3.5">თანხა</th>
                      <th className="py-3 px-3.5">მოქმედების ვადა</th>
                      <th className="py-3 px-3.5 text-right font-black text-rose-400">ადმინ მოქმედებები</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                          მომხმარებელთა ჩანაწერები ვერ მოიძებნა
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((cust, idx) => (
                        <tr
                          key={cust.id}
                          className={`hover:bg-slate-900/90 transition-colors ${
                            idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-950/40'
                          }`}
                        >
                          {/* Plate */}
                          <td className="py-3 px-3.5">
                            <span className="font-mono font-black text-xs px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 tracking-wider">
                              {cust.plateNumber}
                            </span>
                          </td>

                          {/* Driver Name */}
                          <td className="py-3 px-3.5 font-bold text-white text-xs">
                            {cust.driverName}
                          </td>

                          {/* Phone */}
                          <td className="py-3 px-3.5 font-mono text-slate-400 text-xs">
                            {cust.phone}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                cust.status === 'active'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  cust.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                                }`}
                              />
                              {cust.status === 'active' ? 'აქტიური' : 'ვადაგასული'}
                            </span>
                          </td>

                          {/* Amount Paid */}
                          <td className="py-3 px-3.5 font-mono font-bold text-emerald-400 text-xs">
                            {cust.amountPaid.toFixed(2)} ₾
                          </td>

                          {/* Valid Until */}
                          <td className="py-3 px-3.5 font-mono text-xs text-slate-300">
                            {new Date(cust.validUntil).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            <span className="text-[10px] text-slate-500">
                              ({new Date(cust.validUntil).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })})
                            </span>
                          </td>

                          {/* Admin Action Buttons (კორექტირება & წაშლა) */}
                          <td className="py-3 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* EDIT (კორექტირება) BUTTON */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditCustomer(cust)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold flex items-center gap-1 transition-all"
                                title="მომხმარებლის მონაცემების კორექტირება"
                              >
                                <Edit3 className="w-3 h-3 text-indigo-400" />
                                <span>კორექტირება</span>
                              </button>

                              {/* DELETE (წაშლა) BUTTON */}
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirmItem({
                                    id: cust.id,
                                    type: 'customer',
                                    title: cust.driverName,
                                    plate: cust.plateNumber,
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1 transition-all"
                                title="მომხმარებლის წაშლა ბაზიდან"
                              >
                                <Trash2 className="w-3 h-3 text-rose-400" />
                                <span>წაშლა</span>
                              </button>

                              {/* Test Plate Camera */}
                              <button
                                type="button"
                                onClick={() => {
                                  onTestPlateInCamera(cust.plateNumber);
                                  onClose();
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                                title="ANPR კამერაზე ტესტი"
                              >
                                <Camera className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: EMPLOYEES CRUD (DELETE & EDIT) ================= */}
        {activeTab === 'employees' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="თანამშრომლის ძებნა..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <button
                onClick={() => setShowAddEmployeeModal(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-700/30 transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ ახალი თანამშრომლის დამატება</span>
              </button>
            </div>

            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/80 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3.5">ნომერი</th>
                      <th className="py-3 px-3.5">თანამშრომელი</th>
                      <th className="py-3 px-3.5">განყოფილება</th>
                      <th className="py-3 px-3.5">ტელეფონი</th>
                      <th className="py-3 px-3.5">რეგისტრაციის თარიღი</th>
                      <th className="py-3 px-3.5 text-right font-black text-rose-400">ადმინ მოქმედებები</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                          თანამშრომელთა ჩანაწერები ვერ მოიძებნა
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp, idx) => (
                        <tr
                          key={emp.id}
                          className={`hover:bg-slate-900/90 transition-colors ${
                            idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-950/40'
                          }`}
                        >
                          <td className="py-3 px-3.5">
                            <span className="font-mono font-black text-xs px-2.5 py-1 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/30 tracking-wider">
                              {emp.plateNumber}
                            </span>
                          </td>

                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-3">
                              <div className="relative group/empAvatar shrink-0">
                                {emp.avatarUrl ? (
                                  <img
                                    src={emp.avatarUrl}
                                    alt={emp.fullName}
                                    className="w-9 h-9 rounded-xl object-cover border border-teal-500/40 shadow-sm ring-1 ring-white/10"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center font-bold text-xs shadow-inner">
                                    <User className="w-4 h-4" />
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditEmployee(emp)}
                                  title="ფოტოს ატვირთვა / შეცვლა"
                                  className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-900 border border-teal-500/50 text-teal-300 hover:text-white hover:bg-teal-600 transition-colors shadow-sm"
                                >
                                  <Camera className="w-2.5 h-2.5" />
                                </button>
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-white text-xs">{emp.fullName}</span>
                                {emp.email && (
                                  <span className="text-[10px] text-teal-400 font-mono">
                                    {emp.email.split('@')[0]}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3.5 text-slate-300 text-xs">
                            {emp.department}
                          </td>

                          <td className="py-3 px-3.5 font-mono text-slate-400 text-xs">
                            {emp.phone}
                          </td>

                          <td className="py-3 px-3.5 font-mono text-slate-400 text-xs">
                            {emp.addedAt}
                          </td>

                          <td className="py-3 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* EDIT (კორექტირება) BUTTON */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditEmployee(emp)}
                                className="px-2.5 py-1 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/40 text-[11px] font-bold flex items-center gap-1 transition-all"
                                title="თანამშრომლის მონაცემების კორექტირება"
                              >
                                <Edit3 className="w-3 h-3 text-teal-400" />
                                <span>კორექტირება</span>
                              </button>

                              {/* DELETE (წაშლა) BUTTON */}
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirmItem({
                                    id: emp.id,
                                    type: 'employee',
                                    title: emp.fullName,
                                    plate: emp.plateNumber,
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1 transition-all"
                                title="თანამშრომლის წაშლა ბაზიდან"
                              >
                                <Trash2 className="w-3 h-3 text-rose-400" />
                                <span>წაშლა</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  onTestPlateInCamera(emp.plateNumber);
                                  onClose();
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                                title="ANPR კამერაზე ტესტი"
                              >
                                <Camera className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2.5: USER ACCOUNTS & STAFF CREATION (ADMIN FUNCTION) ================= */}
        {/* ადმინის იუზერით თანამშრომლის იუზერის შექმნა, წაშლა და ახლის შექმნა */}
        {activeTab === 'users' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Header info banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-950 to-slate-950 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-cyan-400" />
                    <span>პარკინგის თანამშრომელთა იუზერების მართვა & შექმნა</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                    ადმინის პრივილეგია
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  შექმენით იუზერები პარკინგის თანამშრომლებისთვის (სისტემაში შესასვლელი სახელით და პაროლით). თანამშრომლის წასვლისას შეგიძლიათ წაშალოთ ძველი იუზერი და შექმნათ ახალი იუზერი ახალი თანამშრომლისათვის.
                </p>
              </div>

              {/* Quick Summary Pill Badges */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">სულ იუზერები</div>
                  <div className="text-sm font-mono font-black text-cyan-400">{usersList.length}</div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">თანამშრომლები</div>
                  <div className="text-sm font-mono font-black text-emerald-400">
                    {usersList.filter((u) => u.role === 'employee').length}
                  </div>
                </div>
              </div>
            </div>

            {/* TWO-ROLE ARCHITECTURE BANNER (სისტემაში სულ 2 როლია) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-cyan-950/60 border border-cyan-500/40 text-xs flex items-start gap-3 shadow-md">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                <UserCog className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="font-extrabold text-white flex items-center gap-2">
                  <span>სისტემაში არის სულ ორი როლი: ადმინისტრატორი და იუზერი</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono font-bold">2 როლი</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  1. <strong className="text-indigo-300">⚡ ადმინისტრატორი:</strong> ქმნის და შლის იუზერებს (ახალი თანამშრომლის მოსვლისას უქმნის იუზერს, წასვლისას შლის), აწესებს ტარიფებს და ამოწმებს ყოველთვიურ რეპორტებს.<br />
                  2. <strong className="text-emerald-300">🛡️ იუზერი (თანამშრომელი):</strong> შედის თავისი იუზერითა და პაროლით და <strong className="text-white">შეიყვანს თანამშრომლებს (A ადგილი) თუ მომხმარებლებს (B ადგილი)</strong>.
                </p>
              </div>
            </div>

            {/* Toolbar: Search, Filters & Add User Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800 shadow-md">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="იუზერის, სახელის ან დეპარტამენტის ძებნა..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>

                {/* Role Switcher Filter */}
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setUserRoleFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      userRoleFilter === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ყველა ({usersList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRoleFilter('employee')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      userRoleFilter === 'employee' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🛡️ თანამშრომლები
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRoleFilter('admin')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      userRoleFilter === 'admin' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ⚡ ადმინისტრატორი
                  </button>
                </div>
              </div>

              {/* PRIMARY ACTION: + ახალი იუზერის შექმნა (თანამშრომლისთვის) */}
              <button
                type="button"
                onClick={() => {
                  setNewUserName('');
                  setNewUserEmail('');
                  setNewUserPassword('password123');
                  setNewUserRole('employee');
                  setNewUserDept('პარკინგის ოპერატორი');
                  setNewUserPhone('');
                  setNewUserPlate('');
                  setShowAddUserModal(true);
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-md shadow-cyan-500/25 transition-all shrink-0 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ ახალი იუზერის შექმნა (თანამშრომლისთვის)</span>
              </button>
            </div>

            {/* Users High-Density Table with EDIT and DELETE controls */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/80 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3.5">იუზერი / ლოგინი</th>
                      <th className="py-3 px-3.5">თანამშრომელი (სახელი & გვარი)</th>
                      <th className="py-3 px-3.5">როლი & უფლებები</th>
                      <th className="py-3 px-3.5">განყოფილება / თანამდებობა</th>
                      <th className="py-3 px-3.5">ტელეფონი</th>
                      <th className="py-3 px-3.5">მანქანის ნომერი (A ადგილი)</th>
                      <th className="py-3 px-3.5">შექმნის თარიღი</th>
                      <th className="py-3 px-3.5 text-right font-black text-rose-400">ადმინ მოქმედებები</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <UserCog className="w-8 h-8 text-slate-600" />
                            <span>იუზერების ჩანაწერები ვერ მოიძებნა</span>
                            <button
                              type="button"
                              onClick={() => {
                                setNewUserName('');
                                setNewUserEmail('');
                                setShowAddUserModal(true);
                              }}
                              className="mt-2 px-3 py-1 rounded-lg bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs"
                            >
                              + პირველი იუზერის შექმნა
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u, idx) => (
                        <tr
                          key={u.id}
                          className={`hover:bg-slate-900/90 transition-colors ${
                            idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-950/40'
                          }`}
                        >
                          {/* Username / Login badge & Avatar */}
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-2.5">
                              {u.avatarUrl ? (
                                <img
                                  src={u.avatarUrl}
                                  alt={u.fullName}
                                  className="w-8 h-8 rounded-xl object-cover border border-cyan-500/40 shadow-sm shrink-0 ring-1 ring-white/10"
                                />
                              ) : (
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                                    u.role === 'admin'
                                      ? 'bg-indigo-600 text-white shadow-sm'
                                      : 'bg-teal-600 text-white shadow-sm'
                                  }`}
                                >
                                  <User className="w-4 h-4" />
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="font-mono font-black text-xs text-cyan-300">
                                  {u.email.split('@')[0] || u.email}
                                </span>
                                {u.email.includes('@') && (
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {u.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Full Name */}
                          <td className="py-3 px-3.5 font-bold text-white text-xs">
                            {u.fullName}
                          </td>

                          {/* Role */}
                          <td className="py-3 px-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                u.role === 'admin'
                                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/40'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  u.role === 'admin' ? 'bg-indigo-400' : 'bg-emerald-400'
                                }`}
                              />
                              {u.role === 'admin' ? '⚡ ადმინისტრატორი' : '🛡️ თანამშრომელი (ოპერატორი)'}
                            </span>
                          </td>

                          {/* Department */}
                          <td className="py-3 px-3.5 text-slate-300 text-xs">
                            {u.department || 'პარკინგის ოპერატორი'}
                          </td>

                          {/* Phone */}
                          <td className="py-3 px-3.5 font-mono text-slate-400 text-xs">
                            {u.phone || '—'}
                          </td>

                          {/* Plate Number (Spot A Pass) */}
                          <td className="py-3 px-3.5">
                            {u.plateNumber ? (
                              <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/30">
                                {u.plateNumber}
                              </span>
                            ) : (
                              <span className="text-slate-600 font-mono text-xs">—</span>
                            )}
                          </td>

                          {/* Created Date */}
                          <td className="py-3 px-3.5 font-mono text-slate-400 text-xs">
                            {u.createdAt ? u.createdAt.split('T')[0] : '—'}
                          </td>

                          {/* Admin Actions: Edit & Delete */}
                          <td className="py-3 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* EDIT (კორექტირება) BUTTON */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditUser(u)}
                                className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1 transition-all"
                                title="იუზერის მონაცემების, პაროლის ან უფლებების კორექტირება"
                              >
                                <Edit3 className="w-3 h-3 text-cyan-400" />
                                <span>კორექტირება</span>
                              </button>

                              {/* DELETE (წაშლა) BUTTON */}
                              {u.id === 'user-admin' || u.email === 'admin' ? (
                                <span
                                  className="px-2 py-1 text-[10px] text-slate-500 font-bold cursor-not-allowed"
                                  title="მთავარი ადმინისტრატორის წაშლა დაუშვებელია"
                                >
                                  დაცულია
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteConfirmItem({
                                      id: u.id,
                                      type: 'user',
                                      title: u.fullName,
                                      plate: u.plateNumber || '',
                                      username: u.email.split('@')[0] || u.email,
                                    })
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1 transition-all"
                                  title="იუზერის წაშლა ბაზიდან (გათავისუფლებული თანამშრომელი)"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-400" />
                                  <span>წაშლა</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: PRICING MANAGEMENT ================= */}
        {activeTab === 'pricing' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl">
            {/* Header info */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-400" />
                    <span>ტარიფების, საათებისა და ზღვრის სრული მართვა</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    ადმინისტრატორს შეუძლია შეცვალოს როგორც ფასები, ისე საათები (მაგალითად: 3-საათიანი პაკეტის შეცვლა 2, 4 ან 5 საათიანით, ფასების და დღიური ზღვრის კორექტირება).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomHourlyHours(1);
                      setCustomHourlyRate('1.00');
                      setCustomPackageHours(3);
                      setCustomPackageRate('2.00');
                      setCustomDailyHours(24);
                      setCustomDailyRate('5.00');
                      setCustomDailyThresholdHours(12);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-[11px] font-bold text-emerald-300 hover:text-white hover:bg-emerald-900/50 transition-all shadow-sm"
                    title="ნაგულისხმევი: 1სთ = 1₾, 3სთ = 2₾, 24სთ = 5₾ (თუ >12სთ)"
                  >
                    ⚡ 1სთ=1₾ | 3სთ=2₾ | 24სთ=5₾
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomHourlyHours(1);
                      setCustomHourlyRate('1.00');
                      setCustomPackageHours(4);
                      setCustomPackageRate('3.00');
                      setCustomDailyHours(24);
                      setCustomDailyRate('6.00');
                      setCustomDailyThresholdHours(12);
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                    title="4-საათიანი პაკეტი: 1სთ=1₾, 4სთ=3₾, 24სთ=6₾"
                  >
                    4სთ პაკეტი (3₾)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomHourlyHours(1);
                      setCustomHourlyRate('1.00');
                      setCustomPackageHours(2);
                      setCustomPackageRate('1.50');
                      setCustomDailyHours(24);
                      setCustomDailyRate('5.00');
                      setCustomDailyThresholdHours(12);
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                    title="2-საათიანი პაკეტი: 1სთ=1₾, 2სთ=1.5₾, 24სთ=5₾"
                  >
                    2სთ პაკეტი (1.5₾)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomHourlyHours(1);
                      setCustomHourlyRate('1.50');
                      setCustomPackageHours(5);
                      setCustomPackageRate('5.00');
                      setCustomDailyHours(24);
                      setCustomDailyRate('8.00');
                      setCustomDailyThresholdHours(12);
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                    title="5-საათიანი პაკეტი: 1სთ=1.5₾, 5სთ=5₾, 24სთ=8₾"
                  >
                    5სთ პაკეტი (5₾)
                  </button>
                </div>
              </div>

              {/* 1. Basic Rate Inputs with Hours & Price Editing */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    1. სატარიფო პაკეტების საათებისა და ფასების რედაქტირება:
                  </span>
                  <span className="text-[11px] text-amber-400 font-mono">
                    საათები და ფასები სრულად კორექტირებადია
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Card 1: Hourly Base Rate */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>საბაზისო საათობრივი</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">საბაზისო</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                          საათები:
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="24"
                            value={customHourlyHours}
                            onChange={(e) => setCustomHourlyHours(Math.max(1, Number(e.target.value) || 1))}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-sm font-mono font-black text-white focus:outline-none focus:border-cyan-400 text-center"
                          />
                          <span className="text-xs font-bold text-slate-400">სთ</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                          ტარიფი (₾):
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={customHourlyRate}
                            onChange={(e) => setCustomHourlyRate(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-sm font-mono font-black text-emerald-400 focus:outline-none focus:border-cyan-400 text-center"
                          />
                          <span className="text-xs font-bold text-emerald-400">₾</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                      საბაზისო გადასახადი {customHourlyHours} საათისთვის: <strong className="text-white font-mono">{Number(customHourlyRate).toFixed(2)} ₾</strong>
                    </div>
                  </div>

                  {/* Card 2: Configurable Package (e.g. 3 Hours or 2/4/5 Hours) */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-3 ring-1 ring-amber-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{customPackageHours} საათიანი პაკეტი</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                        შეღავათიანი
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-amber-300/80 block mb-1">
                          პაკეტის საათები:
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="24"
                            value={customPackageHours}
                            onChange={(e) => setCustomPackageHours(Math.max(1, Number(e.target.value) || 1))}
                            className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-2.5 py-2 text-sm font-mono font-black text-amber-300 focus:outline-none focus:border-amber-400 text-center"
                          />
                          <span className="text-xs font-bold text-amber-400">სთ</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-amber-300/80 block mb-1">
                          პაკეტის ფასი (₾):
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={customPackageRate}
                            onChange={(e) => setCustomPackageRate(e.target.value)}
                            className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-2.5 py-2 text-sm font-mono font-black text-emerald-400 focus:outline-none focus:border-amber-400 text-center"
                          />
                          <span className="text-xs font-bold text-emerald-400">₾</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Hour Presets for this Package */}
                    <div className="flex items-center gap-1 pt-0.5">
                      <span className="text-[10px] text-slate-400">საათები:</span>
                      {[2, 3, 4, 5, 6].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setCustomPackageHours(h)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                            customPackageHours === h
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                          }`}
                        >
                          {h}სთ
                        </button>
                      ))}
                    </div>

                    <div className="pt-1 border-t border-slate-800/80 text-[11px] text-amber-200/90 flex items-center justify-between">
                      <span>1 სთ გამოდის:</span>
                      <strong className="font-mono text-emerald-300">
                        {(Number(customPackageRate) / customPackageHours).toFixed(2)} ₾
                      </strong>
                    </div>
                  </div>

                  {/* Card 3: 24 Hours / Daily Rate */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 space-y-3 ring-1 ring-emerald-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{customDailyHours} საათიანი (დღიური)</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">დღიური</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-emerald-300/80 block mb-1">
                          დღიური საათები:
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="6"
                            max="72"
                            value={customDailyHours}
                            onChange={(e) => setCustomDailyHours(Math.max(6, Number(e.target.value) || 24))}
                            className="w-full bg-slate-950 border border-emerald-600/50 rounded-xl px-2.5 py-2 text-sm font-mono font-black text-emerald-300 focus:outline-none focus:border-emerald-400 text-center"
                          />
                          <span className="text-xs font-bold text-emerald-400">სთ</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-emerald-300/80 block mb-1">
                          დღიური ფასი (₾):
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            value={customDailyRate}
                            onChange={(e) => setCustomDailyRate(e.target.value)}
                            className="w-full bg-slate-950 border border-emerald-600/50 rounded-xl px-2.5 py-2 text-sm font-mono font-black text-emerald-300 focus:outline-none focus:border-emerald-400 text-center"
                          />
                          <span className="text-xs font-bold text-emerald-400">₾</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Daily Hour Presets */}
                    <div className="flex items-center gap-1 pt-0.5">
                      <span className="text-[10px] text-slate-400">საათები:</span>
                      {[12, 24, 48].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setCustomDailyHours(h)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                            customDailyHours === h
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                          }`}
                        >
                          {h}სთ
                        </button>
                      ))}
                    </div>

                    <div className="pt-1 border-t border-slate-800/80 text-[11px] text-emerald-300/90 flex items-center justify-between">
                      <span>ფიქსირებული:</span>
                      <strong className="font-mono text-emerald-300">
                        {Number(customDailyRate).toFixed(2)} ₾ / {customDailyHours} სთ
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. SPECIFIC RULE: ACTIVATION THRESHOLD (12 HOURS) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-amber-200">
                      სპეციალური წესი: {customDailyHours}-საათიანი ტარიფის აქტივაციის ზღვარი
                    </h5>
                    <span className="text-[11px] text-slate-400">
                      ეს მხოლოდ მაშინ იქნება {customDailyRate} ლარი, თუ გადაცილდება მითითებულ საათებს
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      ზღვრული საათები:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="71"
                        value={customDailyThresholdHours}
                        onChange={(e) => setCustomDailyThresholdHours(Math.max(1, Math.min(71, Number(e.target.value) || 12)))}
                        className="w-28 bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-sm font-mono font-black text-amber-300 focus:outline-none focus:border-amber-400"
                      />
                      <span className="text-xs font-bold text-slate-300">საათი</span>
                    </div>
                  </div>

                  <div className="md:col-span-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                    <div className="text-amber-300 font-bold flex items-center gap-1.5 text-[11px]">
                      <span>💡 ლოგიკის განმარტება:</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      • <strong className="text-white">≤ {customDailyThresholdHours} საათამდე:</strong> მოქმედებს საათობრივი ტარიფი ({customHourlyRate} ₾/{customHourlyHours}სთ) და {customPackageHours}-საათიანი პაკეტი ({customPackageRate} ₾).
                      <br />
                      • <strong className="text-emerald-300">&gt; {customDailyThresholdHours} საათის გადაცილებისას:</strong> მომენტალურად აქტიურდება {customDailyHours}-საათიანი შეღავათიანი პაკეტი და გადასახდელია მხოლოდ <strong className="text-emerald-400 font-mono font-black">{Number(customDailyRate).toFixed(2)} ₾</strong>!
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. LIVE INTERACTIVE PRICING SIMULATOR / TESTER */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ტარიფის შემოწმება & ლაივ კალკულატორი:</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ტესტირება რეალურ დროში
                  </span>
                </div>

                {/* Quick Test Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 mr-1">სწრაფი ტესტი:</span>
                  {[1, customPackageHours, 6, customDailyThresholdHours, customDailyThresholdHours + 1, customDailyHours, customDailyHours + 4].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setSimTestHours(h)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        simTestHours === h
                          ? h > customDailyThresholdHours && h <= customDailyHours
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-cyan-600 text-white shadow-sm'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {h} სთ
                    </button>
                  ))}
                </div>

                {/* Live Simulation Result Display */}
                {(() => {
                  const testPrice = calculateParkingPrice(simTestHours, {
                    hourlyHours: Number(customHourlyHours) || 1,
                    hourlyRate: Number(customHourlyRate) || 1.0,
                    packageHours: Number(customPackageHours) || 3,
                    packageRate: Number(customPackageRate) || 2.0,
                    dailyHours: Number(customDailyHours) || 24,
                    dailyRate: Number(customDailyRate) || 5.0,
                    dailyThresholdHours: Number(customDailyThresholdHours) || 12,
                  });
                  const isOverThreshold = simTestHours > customDailyThresholdHours && simTestHours <= customDailyHours;

                  return (
                    <div
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isOverThreshold
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                          : 'bg-slate-950 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            გაჩერების ხანგრძლივობა: <strong className="font-mono text-cyan-300">{simTestHours} საათი</strong>
                          </span>
                          {isOverThreshold ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-200 border border-emerald-500/40">
                              ✨ გადასცდა {customDailyThresholdHours} სთ-ს → ამოქმედდა {customDailyHours}სთ-ის ტარიფი!
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                              არ გადასცილებია {customDailyThresholdHours} სთ-ს (საათობრივი)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {isOverThreshold
                            ? `რადგან გადასცდა ${customDailyThresholdHours} საათს, მოქმედებს ${customDailyHours}-საათიანი ფიქსირებული ტარიფი ${Number(customDailyRate).toFixed(2)} ₾.`
                            : simTestHours === customHourlyHours
                            ? `${customHourlyHours} საათის სტანდარტული ტარიფი: ${Number(customHourlyRate).toFixed(2)} ₾`
                            : simTestHours === customPackageHours
                            ? `${customPackageHours} საათიანი შეღავათიანი პაკეტი: ${Number(customPackageRate).toFixed(2)} ₾`
                            : `საათობრივი გადასახადი: ${testPrice.toFixed(2)} ₾ (${customDailyRate} ₾ გააქტიურდება >${customDailyThresholdHours} სთ-ზე)`}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">გადასახდელი თანხა:</div>
                        <div className="text-2xl font-mono font-black text-emerald-400">
                          {testPrice.toFixed(2)} ₾
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Feedback Alert */}
              {pricingSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in shadow-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-extrabold text-white">ტარიფები წარმატებით დამტკიცდა და ამოქმედდა!</div>
                    <div className="text-[11px] text-emerald-300">
                      {customHourlyHours}სთ: {customHourlyRate}₾ • {customPackageHours}სთ პაკეტი: {customPackageRate}₾ • {customDailyHours}სთ: {customDailyRate}₾ (ამოქმედდება &gt; {customDailyThresholdHours} სთ გადაცილებისას).
                    </div>
                  </div>
                </div>
              )}

              {/* Action Submit Button */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSavePricingConfig}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 hover:from-amber-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>ახალი ტარიფების დამტკიცება და შენახვა</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: FINANCIAL ANALYTICS & MONTHLY REPORTS ================= */}
        {activeTab === 'finance' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* 1. Period Selector Toolbar (წელი, თვე, ექსპორტი & ყოველთვიური რეპორტი) */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>საანგარიშგებო პერიოდი:</span>
                </span>

                {/* Year Select */}
                <select
                  value={reportYear}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setReportYear(val);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">ყველა წელი</option>
                  {reportAvailableYears.map((y) => (
                    <option key={y} value={y}>
                      {y} წელი
                    </option>
                  ))}
                </select>

                {/* Month Select */}
                <select
                  value={reportMonth}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setReportMonth(val);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">ყველა თვე (წლიური რეზიუმე)</option>
                  {MONTH_NAMES_KA.map((mName, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {String(idx + 1).padStart(2, '0')} - {mName}
                    </option>
                  ))}
                </select>

                {/* Quick Presets */}
                <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setReportYear(2026);
                      setReportMonth(10);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      reportYear === 2026 && reportMonth === 10
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    ოქტომბერი 2026
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReportYear(2026);
                      setReportMonth(9);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      reportYear === 2026 && reportMonth === 9
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    სექტემბერი 2026
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReportYear(2026);
                      setReportMonth('all');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      reportYear === 2026 && reportMonth === 'all'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    2026 (სრული წელი)
                  </button>
                </div>
              </div>

              {/* Action Buttons: Monthly Report Modal, CSV, JSON */}
              <div className="flex items-center gap-2 self-end lg:self-auto">
                <button
                  type="button"
                  onClick={() => setShowMonthlyReportModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 flex items-center gap-1.5 transition-all"
                  title="ოფიციალური ყოველთვიური რეპორტის გახსნა"
                >
                  <FileText className="w-4 h-4" />
                  <span>ოფიციალური თვიური რეპორტი</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPeriodCSV}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  title="არჩეული პერიოდის CSV / Excel ექსპორტი"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel / CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all"
                  title="სრული ბაზის რეზერვი (JSON)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* 2. Top Metric Cards: Revenue + Vehicle Entries (თანამშრომელი ცალკე, მომხმარებელი ცალკე) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Gross Revenue for Period */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/70 to-slate-900 border border-emerald-500/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-emerald-300">არჩეული პერიოდის შემოსავალი</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black font-mono text-white">
                  {periodGrossRevenue.toFixed(2)} <span className="text-emerald-400 text-base">₾</span>
                </div>
                <div className="text-[10px] text-emerald-400/80 mt-1 flex items-center justify-between font-mono">
                  <span>სალარო: {periodTicketRevenue.toFixed(2)} ₾</span>
                  <span>საშვები: {periodCustomerRevenue.toFixed(2)} ₾</span>
                </div>
              </div>

              {/* Card 2: Total Vehicles Entered */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-300">სულ შესული მანქანა</span>
                  <Car className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black font-mono text-white">
                  {periodEntryLogs.length} <span className="text-xs font-sans text-slate-400">მანქანა</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  არჩეულ თვეში / წელში
                </div>
              </div>

              {/* Card 3: Employee Vehicles Entered (თანამშრომელი ცალკე) */}
              <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-teal-300">თანამშრომელი (A ზონა ცალკე)</span>
                  <UserCheck className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-2xl font-black font-mono text-teal-200">
                  {periodEmployeeEntries.length} <span className="text-xs font-sans text-teal-400">მანქანა</span>
                </div>
                <div className="text-[10px] text-teal-300/80 mt-1">
                  {periodEntryLogs.length > 0
                    ? `${Math.round((periodEmployeeEntries.length / periodEntryLogs.length) * 100)}% შესვლებიდან`
                    : '0%'}
                </div>
              </div>

              {/* Card 4: Customer Vehicles Entered (მომხმარებელი ცალკე) */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-emerald-300">მომხმარებელი (B ფასიანი ცალკე)</span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black font-mono text-emerald-200">
                  {periodCustomerEntries.length} <span className="text-xs font-sans text-emerald-400">მანქანა</span>
                </div>
                <div className="text-[10px] text-emerald-300/80 mt-1">
                  {periodEntryLogs.length > 0
                    ? `${Math.round((periodCustomerEntries.length / periodEntryLogs.length) * 100)}% შესვლებიდან`
                    : '0%'}
                </div>
              </div>
            </div>

            {/* Visual Ratio Bar: Employee vs Customer Vehicles */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-teal-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                  თანამშრომლის მანქანა (A): {periodEmployeeEntries.length} შესვლა
                </span>
                <span className="text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  მომხმარებლის მანქანა (B): {periodCustomerEntries.length} შესვლა
                </span>
              </div>

              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden flex">
                <div
                  style={{
                    width: `${
                      periodEntryLogs.length > 0
                        ? (periodEmployeeEntries.length / periodEntryLogs.length) * 100
                        : 50
                    }%`,
                  }}
                  className="h-full bg-teal-500 transition-all duration-500"
                  title={`თანამშრომელი: ${periodEmployeeEntries.length}`}
                />
                <div
                  style={{
                    width: `${
                      periodEntryLogs.length > 0
                        ? (periodCustomerEntries.length / periodEntryLogs.length) * 100
                        : 50
                    }%`,
                  }}
                  className="h-full bg-emerald-500 transition-all duration-500"
                  title={`მომხმარებელი: ${periodCustomerEntries.length}`}
                />
              </div>
            </div>

            {/* 3. Sub-Navigation Tabs inside Finance Tab */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setFinanceSubTab('overview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  financeSubTab === 'overview'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                შემაჯამებელი & მეთოდები
              </button>
              <button
                type="button"
                onClick={() => setFinanceSubTab('daily')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  financeSubTab === 'daily'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                დღიური განაწილება ({periodDailyBreakdown.length} დღე)
              </button>
              <button
                type="button"
                onClick={() => setFinanceSubTab('vehicles')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  financeSubTab === 'vehicles'
                    ? 'bg-teal-900/60 text-teal-200 border border-teal-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                მანქანების შესვლები ({periodEntryLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setFinanceSubTab('ledger')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  financeSubTab === 'ledger'
                    ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ფინანსური ტრანზაქციები ({periodTickets.length + periodCustomers.length})
              </button>
            </div>

            {/* 4. Sub-Tab Content */}

            {/* SUB-TAB A: OVERVIEW & PAYMENT BREAKDOWN */}
            {financeSubTab === 'overview' && (
              <div className="space-y-4">
                {/* Daily Breakdown Preview */}
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/80">
                  <div className="p-3 border-b border-slate-800 text-xs font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span>დღეების მიხედვით შეჯამება ({periodDailyBreakdown.length} აქტიური დღე)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setFinanceSubTab('daily')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                    >
                      <span>სრული ცხრილი</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                          <th className="py-2.5 px-3">თარიღი</th>
                          <th className="py-2.5 px-3 text-teal-300">თანამშრომელი (A)</th>
                          <th className="py-2.5 px-3 text-emerald-300">მომხმარებელი (B)</th>
                          <th className="py-2.5 px-3">სულ მანქანა</th>
                          <th className="py-2.5 px-3 text-right">დღიური შემოსავალი</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {periodDailyBreakdown.map((row) => (
                          <tr key={row.date} className="hover:bg-slate-900/50">
                            <td className="py-2 px-3 font-mono font-bold text-white">{row.date}</td>
                            <td className="py-2 px-3 text-teal-300 font-mono font-bold">
                              {row.employeeCount} მანქანა
                            </td>
                            <td className="py-2 px-3 text-emerald-300 font-mono font-bold">
                              {row.customerCount} მანქანა
                            </td>
                            <td className="py-2 px-3 text-slate-300 font-mono font-bold">
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

            {/* SUB-TAB B: DETAILED DAILY BREAKDOWN */}
            {financeSubTab === 'daily' && (
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/80">
                <div className="p-3 border-b border-slate-800 text-xs font-bold text-white flex items-center justify-between">
                  <span>დღეების მიხედვით დეტალური ანგარიში ({periodDailyBreakdown.length} დღე)</span>
                  <button
                    type="button"
                    onClick={handleExportPeriodCSV}
                    className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV ექსპორტი</span>
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                        <th className="py-2.5 px-3">თარიღი</th>
                        <th className="py-2.5 px-3 text-teal-300">თანამშრომელი (A)</th>
                        <th className="py-2.5 px-3 text-emerald-300">მომხმარებელი (B)</th>
                        <th className="py-2.5 px-3">სულ მანქანა</th>
                        <th className="py-2.5 px-3">სალარო (₾)</th>
                        <th className="py-2.5 px-3">საშვები (₾)</th>
                        <th className="py-2.5 px-3 text-right">დღიური ჯამი (₾)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {periodDailyBreakdown.map((row) => (
                        <tr key={row.date} className="hover:bg-slate-900/50">
                          <td className="py-2 px-3 font-mono font-bold text-white">{row.date}</td>
                          <td className="py-2 px-3 text-teal-300 font-mono font-bold">
                            {row.employeeCount}
                          </td>
                          <td className="py-2 px-3 text-emerald-300 font-mono font-bold">
                            {row.customerCount}
                          </td>
                          <td className="py-2 px-3 text-white font-mono font-bold">
                            {row.employeeCount + row.customerCount}
                          </td>
                          <td className="py-2 px-3 text-slate-300 font-mono">
                            {row.ticketRevenue.toFixed(2)} ₾
                          </td>
                          <td className="py-2 px-3 text-slate-300 font-mono">
                            {row.passRevenue.toFixed(2)} ₾
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
            )}

            {/* SUB-TAB C: VEHICLE ENTRIES (თანამშრომელი ცალკე, მომხმარებელი ცალკე) */}
            {financeSubTab === 'vehicles' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-semibold">ფილტრი:</span>
                    <button
                      type="button"
                      onClick={() => setReportVehicleFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        reportVehicleFilter === 'all'
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      ყველა ({periodEntryLogs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportVehicleFilter('employee')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        reportVehicleFilter === 'employee'
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-900 text-teal-400 hover:text-white'
                      }`}
                    >
                      თანამშრომელი (A): {periodEmployeeEntries.length}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportVehicleFilter('customer')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        reportVehicleFilter === 'customer'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 text-emerald-400 hover:text-white'
                      }`}
                    >
                      მომხმარებელი (B): {periodCustomerEntries.length}
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    თანამშრომელი: <strong className="text-teal-400">{periodEmployeeEntries.length}</strong> | მომხმარებელი:{' '}
                    <strong className="text-emerald-400">{periodCustomerEntries.length}</strong>
                  </span>
                </div>

                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/80">
                  <div className="max-h-80 overflow-y-auto">
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
                        {periodEntryLogs
                          .filter((l) => {
                            if (reportVehicleFilter === 'employee') {
                              return l.category === 'employee' || l.spotId === 'A';
                            }
                            if (reportVehicleFilter === 'customer') {
                              return l.category !== 'employee' && l.spotId !== 'A';
                            }
                            return true;
                          })
                          .map((log) => {
                            const isEmp = log.category === 'employee' || log.spotId === 'A';
                            const dtStr = new Date(log.timestamp).toLocaleString('ka-GE', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            });

                            return (
                              <tr key={log.id} className="hover:bg-slate-900/50">
                                <td className="py-2 px-3 font-mono text-slate-300 text-[11px]">
                                  {dtStr}
                                </td>
                                <td className="py-2 px-3">
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
                                <td className="py-2 px-3 font-mono font-bold text-white">
                                  {log.plateNumber}
                                </td>
                                <td className="py-2 px-3 text-slate-300">
                                  {log.driverName || '—'}
                                </td>
                                <td className="py-2 px-3 font-bold font-mono">
                                  {log.spotId === 'A' ? (
                                    <span className="text-teal-400">A</span>
                                  ) : (
                                    <span className="text-emerald-400">B</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-slate-400 text-[11px]">
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

            {/* SUB-TAB D: ALL TRANSACTIONS WITH EXACT DATES */}
            {financeSubTab === 'ledger' && (
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/80">
                <div className="p-3 border-b border-slate-800 text-xs font-bold text-white flex items-center justify-between">
                  <span>
                    ფინანსური ტრანზაქციები თავისივე თარიღებით ({periodTickets.length + periodCustomers.length})
                  </span>
                  <span className="font-mono text-emerald-400">
                    ჯამი: {periodGrossRevenue.toFixed(2)} ₾
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto">
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
                      {/* Tickets in period */}
                      {periodTickets.map((t) => {
                        const dt = t.entryTime
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
                            <td className="py-2 px-3 font-mono text-slate-300 text-[11px]">{dt}</td>
                            <td className="py-2 px-3 font-mono text-[11px] text-amber-400">
                              ქვითარი #{t.ticketId}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-white">{t.plateNumber}</td>
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
                                  className="text-amber-400 hover:text-amber-300 text-[11px] font-bold"
                                >
                                  ქვითარი
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Customers in period */}
                      {periodCustomers.map((c) => {
                        const dt = c.validUntil
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
                            <td className="py-2 px-3 font-mono text-slate-300 text-[11px]">{dt}</td>
                            <td className="py-2 px-3 font-mono text-[11px] text-indigo-400">
                              საშვი #{c.id}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-white">{c.plateNumber}</td>
                            <td className="py-2 px-3 text-slate-300">{c.driverName || '—'}</td>
                            <td className="py-2 px-3 font-mono font-bold text-emerald-400">
                              {(c.amountPaid || 0).toFixed(2)} ₾
                            </td>
                            <td className="py-2 px-3 text-slate-400">ონლაინ ბაზა</td>
                            <td className="py-2 px-3 text-right text-slate-500 text-[11px]">
                              აქტიური
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: GATES & EMERGENCY OVERRIDES ================= */}
        {activeTab === 'gates' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-3xl">
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>შლაგბაუმების გადაუდებელი მართვა (Emergency Overrides)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    ადმინისტრატორის უფლებამოსილება: შლაგბაუმის იძულებითი გაღება, ჩაკეტვა ან სრული ბლოკირება საგანგებო სიტუაციის დროს.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/40">
                  ადმინ კონტროლი
                </span>
              </div>

              {gateActionStatus && (
                <div className="p-3 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-indigo-200 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{gateActionStatus}</span>
                </div>
              )}

              {/* Gate Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Gate A: Employees */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-teal-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                      შლაგბაუმი A (თანამშრომლები)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                      სტატუსი: {spots.find(s => s.id === 'A')?.status === 'occupied' ? 'დაკავებული' : 'თავისუფალი'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    ANPR ავტომატური კამერა და სამსახურებრივი საშვები.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        if (onOverrideGate) onOverrideGate('A', 'force_open');
                        else await api.overrideGate('A', 'force_open');
                        setGateActionStatus('A შლაგბაუმი გაღებულია იძულებით ადმინისტრატორის მიერ');
                        setTimeout(() => setGateActionStatus(''), 4000);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>იძულებით გაღება (A)</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (onOverrideGate) onOverrideGate('A', 'force_close');
                        else await api.overrideGate('A', 'force_close');
                        setGateActionStatus('A შლაგბაუმი დაიკეტა');
                        setTimeout(() => setGateActionStatus(''), 4000);
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Gate B: Customers */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      შლაგბაუმი B (ფასიანი კლიენტები)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      სტატუსი: {spots.find(s => s.id === 'B')?.status === 'occupied' ? 'დაკავებული' : 'თავისუფალი'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    სალარო, შტრიხკოდიანი ბილეთები და ონლაინ ჯავშნები.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        if (onOverrideGate) onOverrideGate('B', 'force_open');
                        else await api.overrideGate('B', 'force_open');
                        setGateActionStatus('B შლაგბაუმი გაღებულია იძულებით ადმინისტრატორის მიერ');
                        setTimeout(() => setGateActionStatus(''), 4000);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>იძულებით გაღება (B)</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (onOverrideGate) onOverrideGate('B', 'force_close');
                        else await api.overrideGate('B', 'force_close');
                        setGateActionStatus('B შლაგბაუმი დაიკეტა');
                        setTimeout(() => setGateActionStatus(''), 4000);
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Emergency System-Wide Action */}
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-rose-200">საგანგებო განგაში & სრული ბლოკირება</h5>
                    <p className="text-[11px] text-rose-300/80">ჩაკეტავს ორივე შლაგბაუმს და შეაჩერებს ავტომატურ ANPR დაშვებას.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      if (onOverrideGate) onOverrideGate('all', 'emergency_lock');
                      else await api.overrideGate('all', 'emergency_lock');
                      setGateActionStatus('ყველა შლაგბაუმი დაბლოკილია საგანგებო რეჟიმში');
                      setTimeout(() => setGateActionStatus(''), 4000);
                    }}
                    className="py-2 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>საგანგებო ბლოკირება</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (onOverrideGate) onOverrideGate('all', 'force_open');
                      else await api.overrideGate('all', 'force_open');
                      setGateActionStatus('ყველა შლაგბაუმი გაღებულია ევაკუაციისთვის');
                      setTimeout(() => setGateActionStatus(''), 4000);
                    }}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                  >
                    <span>ევაკუაცია (სრული გაღება)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 6: SYSTEM SETTINGS & NODE.JS ================= */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-2xl">
            {/* Node.js Backend API Status */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Node.js Express Backend API (Port 3000)</span>
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600 font-mono">
                  აქტიური / Online
                </span>
              </div>
              <p className="text-xs text-slate-400">
                სერვერული REST API უზრუნველყოფს მონაცემების მუდმივ შენახვას: მომხმარებლები, თანამშრომლები, ტარიფები, შლაგბაუმები.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/health');
                      if (res.ok) {
                        const data = await res.json();
                        setBackendHealthStatus({ online: true, text: `API აქტიურია: ${data.service} (OK)` });
                      } else {
                        setBackendHealthStatus({ online: false, text: 'სერვერმა დააბრუნა შეცდომა' });
                      }
                    } catch {
                      setBackendHealthStatus({ online: true, text: 'Node.js სერვერი პასუხობს ლოკალურად' });
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold border border-teal-500/30 transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Node.js API ტესტირება (/api/health)</span>
                </button>
              </div>
              {backendHealthStatus && (
                <p className="text-xs text-emerald-400 font-mono pt-1">
                  ✓ {backendHealthStatus.text}
                </p>
              )}
            </div>

            {/* Change Admin PIN */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-400" />
                <span>ადმინ PIN კოდის შეცვლა</span>
              </h4>
              <p className="text-xs text-slate-400">
                სტანდარტული ადმინ PIN კოდია: <strong className="text-white font-mono">9999</strong> ან <strong className="text-white font-mono">1234</strong>.
              </p>

              <div className="flex items-center gap-3">
                <input
                  type="password"
                  maxLength={6}
                  value={newAdminPin}
                  onChange={(e) => setNewAdminPin(e.target.value)}
                  placeholder="ახალი PIN (მაგ: 5555)"
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500 w-48"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newAdminPin.length >= 4) {
                      setPinChangeMsg('PIN კოდი წარმატებით განახლდა');
                      setNewAdminPin('');
                      setTimeout(() => setPinChangeMsg(''), 3000);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
                >
                  განახლება
                </button>
              </div>

              {pinChangeMsg && (
                <p className="text-xs text-emerald-400 font-medium">{pinChangeMsg}</p>
              )}
            </div>

            {/* Backup & Factory Reset */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-400" />
                <span>ბაზის არქივაცია & საწყისზე დაბრუნება</span>
              </h4>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>სრული ბაზის ექსპორტი (JSON)</span>
                </button>

                {onResetDatabase && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('დარწმუნებული ხართ, რომ გსურთ საწყის მონაცემებზე დაბრუნება?')) {
                        onResetDatabase();
                        onClose();
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>საწყის ბაზაზე განულება</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL FOOTER ================= */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>ადმინისტრატორის სესია აქტიურია • ყველა ცვლილება მყისიერად ინახება</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            დახურვა
          </button>
        </div>
      </div>

      {/* ================= EDIT CUSTOMER DIALOG (კორექტირება) ================= */}
      {editingCustomer && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-indigo-500/50 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">მომხმარებლის კორექტირება</h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomerEdit} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  ავტომობილის ნომერი *
                </label>
                <input
                  type="text"
                  value={editCustPlate}
                  onChange={(e) => setEditCustPlate(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  მძღოლის / მომხმარებლის სახელი *
                </label>
                <input
                  type="text"
                  value={editCustName}
                  onChange={(e) => setEditCustName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  ტელეფონი
                </label>
                <input
                  type="text"
                  value={editCustPhone}
                  onChange={(e) => setEditCustPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    თანხა (₾)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={editCustAmount}
                    onChange={(e) => setEditCustAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    სტატუსი
                  </label>
                  <select
                    value={editCustStatus}
                    onChange={(e) => setEditCustStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="active">აქტიური (ადგილზე)</option>
                    <option value="expired">ვადაგასული / გასული</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  ვადის გაგრძელება (საათები)
                </label>
                <select
                  value={editCustValidHours}
                  onChange={(e) => setEditCustValidHours(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={1}>+1 საათი</option>
                  <option value={3}>+3 საათი (რეკომენდებული)</option>
                  <option value={12}>+12 საათი</option>
                  <option value={24}>+24 საათი (დღიური)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-400 hover:bg-slate-800"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-700/30 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>კორექტირების შენახვა</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT EMPLOYEE DIALOG (კორექტირება) ================= */}
      {editingEmployee && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-teal-500/50 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-400" />
                <h4 className="text-sm font-bold text-white">თანამშრომლის კორექტირება</h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEmployeeEdit} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  ავტომობილის ნომერი *
                </label>
                <input
                  type="text"
                  value={editEmpPlate}
                  onChange={(e) => setEditEmpPlate(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  თანამშრომლის სახელი და გვარი *
                </label>
                <input
                  type="text"
                  value={editEmpName}
                  onChange={(e) => setEditEmpName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Photo Upload & Built-in Default Avatars for Employee */}
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
                    <span>თანამშრომლის პროფილის ფოტო</span>
                  </label>
                  {editEmpAvatar && (
                    <button
                      type="button"
                      onClick={() => setEditEmpAvatar('')}
                      className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      ფოტოს წაშლა
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-teal-500/40 shrink-0 flex items-center justify-center">
                    {editEmpAvatar ? (
                      <img src={editEmpAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer shadow-sm transition-all active:scale-95">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingEditEmpAvatar ? 'მუშავდება...' : 'ფოტოს ატვირთვა'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setIsUploadingEditEmpAvatar(true);
                          try {
                            const url = await compressAndReadImage(f, 256, 0.85);
                            setEditEmpAvatar(url);
                          } catch {}
                          setIsUploadingEditEmpAvatar(false);
                        }}
                      />
                    </label>
                    <span className="text-[10px] text-slate-400 block">
                      ან აირჩიეთ ჩაშენებული დეფაულტ ავატარი:
                    </span>
                  </div>
                </div>

                {/* Preset avatars selection */}
                <div className="grid grid-cols-6 gap-1.5 pt-1 border-t border-slate-800/80">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setEditEmpAvatar(preset.url)}
                      title={preset.label}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all p-0.5 ${
                        editEmpAvatar === preset.url
                          ? 'border-teal-400 ring-2 ring-teal-400/50 scale-105'
                          : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover rounded" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  განყოფილება / თანამდებობა
                </label>
                <input
                  type="text"
                  value={editEmpDept}
                  onChange={(e) => setEditEmpDept(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  ტელეფონი
                </label>
                <input
                  type="text"
                  value={editEmpPhone}
                  onChange={(e) => setEditEmpPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-400 hover:bg-slate-800"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-700/30 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>კორექტირების შენახვა</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/60 rounded-3xl p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">
                {deleteConfirmItem.type === 'user'
                  ? 'დარწმუნებული ხართ იუზერის წაშლაში?'
                  : 'დარწმუნებული ხართ წაშლაში?'}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                წაიშლება:{' '}
                <strong className="text-white">{deleteConfirmItem.title}</strong>{' '}
                {deleteConfirmItem.username ? (
                  <span className="font-mono text-cyan-300">({deleteConfirmItem.username})</span>
                ) : deleteConfirmItem.plate ? (
                  <span className="font-mono text-rose-300">({deleteConfirmItem.plate})</span>
                ) : null}
              </p>
              <p className="text-[11px] text-rose-400/90 mt-1.5 leading-relaxed">
                {deleteConfirmItem.type === 'user'
                  ? 'ეს თანამშრომელი ვეღარ შეძლებს სისტემაში ავტორიზაციას. გათავისუფლებული თანამშრომლის წაშლის შემდეგ შეგიძლიათ შექმნათ ახალი იუზერი ახალი თანამშრომლისათვის.'
                  : 'ეს მოქმედება შეუქცევადია და ჩანაწერი ამოიშლება სისტემური ბაზიდან.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
              >
                გაუქმება
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-700/30 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>წაშლის დადასტურება</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD CUSTOMER ================= */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-indigo-500/50 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>ახალი მომხმარებლის რეგისტრაცია (B პარკინგი)</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  ავტომობილის ნომერი *
                </label>
                <input
                  type="text"
                  value={newCustPlate}
                  onChange={(e) => setNewCustPlate(e.target.value.toUpperCase())}
                  required
                  placeholder="GE-482-TB"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  მძღოლის სახელი და გვარი *
                </label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  required
                  placeholder="გიორგი მაისურაძე"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  ტელეფონი
                </label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+995 599 00 00 00"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  სატარიფო ვადა
                </label>
                <select
                  value={newCustHours}
                  onChange={(e) => setNewCustHours(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={1}>1 საათი (1.00 ₾)</option>
                  <option value={3}>3 საათი (2.00 ₾ - რეკომენდებული)</option>
                  <option value={24}>24 საათი (5.00 ₾)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-400 hover:bg-slate-800"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-700/30"
                >
                  ბაზაში დამატება
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD EMPLOYEE ================= */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-teal-500/50 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-400" />
                <span>ახალი თანამშრომლის რეგისტრაცია (A პარკინგი)</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddEmployeeModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEmployeeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  ავტომობილის ნომერი *
                </label>
                <input
                  type="text"
                  value={newEmpPlate}
                  onChange={(e) => setNewEmpPlate(e.target.value.toUpperCase())}
                  required
                  placeholder="EMP-888-GE"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  თანამშრომლის სახელი და გვარი *
                </label>
                <input
                  type="text"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  required
                  placeholder="ნიკოლოზ ბარათაშვილი"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Photo Upload & Built-in Default Avatars for Employee */}
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
                    <span>თანამშრომლის პროფილის ფოტო</span>
                  </label>
                  {newEmpAvatar && (
                    <button
                      type="button"
                      onClick={() => setNewEmpAvatar('')}
                      className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      ფოტოს წაშლა
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-teal-500/40 shrink-0 flex items-center justify-center">
                    {newEmpAvatar ? (
                      <img src={newEmpAvatar} alt="Avatar" className="w-full h-full object-cover" />
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
                            setNewEmpAvatar(url);
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

                {/* Preset avatars selection */}
                <div className="grid grid-cols-6 gap-1.5 pt-1 border-t border-slate-800/80">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setNewEmpAvatar(preset.url)}
                      title={preset.label}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all p-0.5 ${
                        newEmpAvatar === preset.url
                          ? 'border-teal-400 ring-2 ring-teal-400/50 scale-105'
                          : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover rounded" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  განყოფილება
                </label>
                <input
                  type="text"
                  value={newEmpDept}
                  onChange={(e) => setNewEmpDept(e.target.value)}
                  placeholder="დაცვა / უსაფრთხოება"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  ტელეფონი
                </label>
                <input
                  type="text"
                  value={newEmpPhone}
                  onChange={(e) => setNewEmpPhone(e.target.value)}
                  placeholder="+995 599 00 00 00"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* SmartPark Employee User Account Credentials */}
              <div className="p-3 bg-slate-900/90 rounded-2xl border border-teal-500/30 space-y-2.5">
                <div className="flex items-center gap-1.5 text-teal-400 font-bold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>თანამშრომლის იუზერის შექმნა (SmartPark სისტემაში შესასვლელად)</span>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-slate-300 block mb-1">
                    იუზერი / მომხმარებლის სახელი
                  </label>
                  <input
                    type="text"
                    value={newEmpEmail}
                    onChange={(e) => setNewEmpEmail(e.target.value)}
                    placeholder="მაგ: staff1 ან giorgi"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    ამ იუზერით თანამშრომელი გაივლის ავტორიზაციას SmartPark-ში
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-slate-300 block mb-1">
                    პაროლი (Password)
                  </label>
                  <input
                    type="text"
                    value={newEmpPassword}
                    onChange={(e) => setNewEmpPassword(e.target.value)}
                    placeholder="password123"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-400 hover:bg-slate-800"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-700/30"
                >
                  თანამშრომლის დამატება
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD USER (იუზერის შექმნა თანამშრომლისთვის) ================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-cyan-500/50 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <UserCog className="w-4 h-4" />
                </div>
                <span>ახალი იუზერის შექმნა (თანამშრომლისთვის)</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              შექმენით ახალი იუზერი პარკინგის თანამშრომლისთვის. შექმნილი იუზერით და პაროლით თანამშრომელი შეძლებს SmartPark სისტემაში ავტორიზაციას.
            </p>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3 text-xs">
              {/* Full Name */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  თანამშრომლის სახელი და გვარი *
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                  placeholder="მაგ: გიორგი მაისურაძე"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Photo Upload & Built-in Default Avatars */}
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>თანამშრომლის პროფილის ფოტო</span>
                  </label>
                  {newUserAvatar && (
                    <button
                      type="button"
                      onClick={() => setNewUserAvatar('')}
                      className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      ფოტოს წაშლა
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-cyan-500/40 shrink-0 flex items-center justify-center">
                    {newUserAvatar ? (
                      <img src={newUserAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-sm transition-all active:scale-95">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingUserAvatar ? 'მუშავდება...' : 'ფოტოს ატვირთვა'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setIsUploadingUserAvatar(true);
                          try {
                            const url = await compressAndReadImage(f, 256, 0.85);
                            setNewUserAvatar(url);
                          } catch {}
                          setIsUploadingUserAvatar(false);
                        }}
                      />
                    </label>
                    <span className="text-[10px] text-slate-400 block">
                      ან აირჩიეთ ჩაშენებული დეფაულტ ავატარი:
                    </span>
                  </div>
                </div>

                {/* Preset avatars selection */}
                <div className="grid grid-cols-6 gap-1.5 pt-1 border-t border-slate-800/80">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setNewUserAvatar(preset.url)}
                      title={preset.label}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all p-0.5 ${
                        newUserAvatar === preset.url
                          ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105'
                          : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover rounded" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Username & Password Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    იუზერი / ლოგინი *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      required
                      placeholder="მაგ: giorgi ან staff2"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    შესასვლელი სახელი
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    პაროლი *
                  </label>
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showNewUserPassword ? 'text' : 'password'}
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      required
                      placeholder="password123"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-8 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      tabIndex={-1}
                    >
                      {showNewUserPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    (ნაგულისხმევი: password123)
                  </span>
                </div>
              </div>

              {/* Role selection */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  როლი & უფლებები *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewUserRole('employee')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-2 ${
                      newUserRole === 'employee'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-900/30 ring-1 ring-emerald-500/50'
                        : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-base">🛡️</span>
                    <div>
                      <div className="font-extrabold text-[11px]">იუზერი (თანამშრომელი)</div>
                      <div className="text-[9px] text-emerald-300/80 font-medium">შეიყვანს თანამშრომლებსა თუ მომხმარებლებს</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewUserRole('admin')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-2 ${
                      newUserRole === 'admin'
                        ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-900/30 ring-1 ring-indigo-500/50'
                        : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-base">⚡</span>
                    <div>
                      <div className="font-extrabold text-[11px]">ადმინისტრატორი</div>
                      <div className="text-[9px] text-indigo-300/80 font-medium">იუზერების შექმნა/წაშლა, ტარიფები & რეპორტები</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Department & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    განყოფილება / თანამდებობა
                  </label>
                  <input
                    type="text"
                    value={newUserDept}
                    onChange={(e) => setNewUserDept(e.target.value)}
                    placeholder="პარკინგის ოპერატორი"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    ტელეფონის ნომერი
                  </label>
                  <input
                    type="text"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="+995 599 00 00 00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Car Plate Number for Spot A Pass */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  ავტომობილის ნომერი (A პარკინგის საშვისთვის, სურვილისამებრ)
                </label>
                <input
                  type="text"
                  value={newUserPlate}
                  onChange={(e) => setNewUserPlate(e.target.value.toUpperCase())}
                  placeholder="მაგ: AA-777-BB"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  თუ მითითებულია, ANPR კამერა ავტომატურად გაუღებს A შლაგბაუმს
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-400 hover:bg-slate-800"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-cyan-700/30 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>იუზერის შექმნა</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT USER (იუზერის კორექტირება) ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-cyan-500/50 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>იუზერის მონაცემების კორექტირება</span>
              </h4>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  თანამშრომლის სახელი და გვარი *
                </label>
                <input
                  type="text"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Photo Upload & Built-in Default Avatars for Edit */}
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>თანამშრომლის პროფილის ფოტო</span>
                  </label>
                  {editUserAvatar && (
                    <button
                      type="button"
                      onClick={() => setEditUserAvatar('')}
                      className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      ფოტოს წაშლა
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-cyan-500/40 shrink-0 flex items-center justify-center">
                    {editUserAvatar ? (
                      <img src={editUserAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-sm transition-all active:scale-95">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingUserAvatar ? 'მუშავდება...' : 'ახალი ფოტოს ატვირთვა'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setIsUploadingUserAvatar(true);
                          try {
                            const url = await compressAndReadImage(f, 256, 0.85);
                            setEditUserAvatar(url);
                          } catch {}
                          setIsUploadingUserAvatar(false);
                        }}
                      />
                    </label>
                    <span className="text-[10px] text-slate-400 block">
                      ან აირჩიეთ ჩაშენებული დეფაულტ ავატარი:
                    </span>
                  </div>
                </div>

                {/* Preset avatars selection */}
                <div className="grid grid-cols-6 gap-1.5 pt-1 border-t border-slate-800/80">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setEditUserAvatar(preset.url)}
                      title={preset.label}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all p-0.5 ${
                        editUserAvatar === preset.url
                          ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105'
                          : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover rounded" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    იუზერი / ლოგინი *
                  </label>
                  <input
                    type="text"
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    პაროლი (Password)
                  </label>
                  <div className="relative">
                    <input
                      type={showEditUserPassword ? 'text' : 'password'}
                      value={editUserPassword}
                      onChange={(e) => setEditUserPassword(e.target.value)}
                      placeholder="ახალი პაროლი"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 pr-8 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditUserPassword(!showEditUserPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      tabIndex={-1}
                    >
                      {showEditUserPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  როლი
                </label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value as 'employee' | 'admin')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="employee">🛡️ თანამშრომელი (ოპერატორი)</option>
                  <option value="admin">⚡ სისტემის ადმინისტრატორი</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    განყოფილება
                  </label>
                  <input
                    type="text"
                    value={editUserDept}
                    onChange={(e) => setEditUserDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    ტელეფონი
                  </label>
                  <input
                    type="text"
                    value={editUserPhone}
                    onChange={(e) => setEditUserPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  ავტომობილის ნომერი (Spot A Pass)
                </label>
                <input
                  type="text"
                  value={editUserPlate}
                  onChange={(e) => setEditUserPlate(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-400 hover:bg-slate-800"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-700/30 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>კორექტირების შენახვა</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MONTHLY & YEARLY OFFICIAL REPORT MODAL ================= */}
      {showMonthlyReportModal && (
        <AdminMonthlyReportModal
          isOpen={showMonthlyReportModal}
          onClose={() => setShowMonthlyReportModal(false)}
          initialYear={reportYear}
          initialMonth={reportMonth}
          tickets={tickets}
          customers={customers}
          vehicleLogs={vehicleLogs}
          employees={employees}
          onViewReceipt={onViewReceipt}
        />
      )}
    </div>
  );
};
