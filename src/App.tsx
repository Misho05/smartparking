/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ParkingSpot, Reservation, EmployeeRecord, PaidCustomerRecord, ParkingTicket, Language, VehicleActivityLog, UserAccount } from './types';
import { generateInitialSpots } from './data/initialSpots';
import { initialEmployees, initialPaidCustomers, initialTickets, initialVehicleLogs, initialUserAccounts } from './data/initialDatabase';
import { translations } from './utils/translations';
import { Navbar } from './components/Navbar';
import { StatsBar } from './components/StatsBar';
import { ParkingMap } from './components/ParkingMap';
import { SpotDetailDrawer } from './components/SpotDetailDrawer';
import { ReservationModal } from './components/ReservationModal';
import { MyBookingsDrawer } from './components/MyBookingsDrawer';
import { GateSimulatorModal } from './components/GateSimulatorModal';
import { ManualDatabaseModal } from './components/ManualDatabaseModal';
import { CustomerDatabaseModal } from './components/CustomerDatabaseModal';
import { AdminPanel } from './components/AdminPanel';
import { api } from './utils/api';
import { StaffTerminalModal } from './components/StaffTerminalModal';
import { ReceiptTicketModal } from './components/ReceiptTicketModal';
import { LiveNotificationToast, ToastMessage } from './components/LiveNotificationToast';
import { CustomerPortal } from './components/CustomerPortal';
import { StaffAuthModal } from './components/StaffAuthModal';
import { KutStoryAuthModal } from './components/KutStoryAuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { VehicleActivityLogTable } from './components/VehicleActivityLogTable';
import { StaffPlateAutoLookupWidget } from './components/StaffPlateAutoLookupWidget';
import { ReceiptScannerModal } from './components/ReceiptScannerModal';
import { QuickAddVehicleModal, QuickAddSubmitData, QuickAddDbOnlyData } from './components/QuickAddVehicleModal';
import { saveDriverProfile } from './utils/driverDirectory';
import { ShieldCheck, RefreshCw, Car, Sparkles, UserCheck, CreditCard, Database, Receipt, Users, User, Camera } from 'lucide-react';
import { calculateParkingPrice } from './utils/pricing';

const SPOTS_STORAGE_KEY = 'smartpark_spots_data_v3_2spots';
const RESERVATIONS_STORAGE_KEY = 'smartpark_user_reservations_v3';
const EMPLOYEES_STORAGE_KEY = 'smartpark_employees_db_v1';
const PAID_CUSTOMERS_STORAGE_KEY = 'smartpark_paid_customers_db_v1';
const TICKETS_STORAGE_KEY = 'smartpark_tickets_db_v1';
const VEHICLE_LOGS_STORAGE_KEY = 'smartpark_vehicle_logs_v1';
const USERS_STORAGE_KEY = 'smartpark_users_accounts_v1';

export default function App() {
  const [lang, setLang] = useState<Language>('ka');
  const t = translations[lang];

  // 1. Initialize spots (Spot A: Employee, Spot B: Paid)
  const [spots, setSpots] = useState<ParkingSpot[]>(() => {
    try {
      const saved = localStorage.getItem(SPOTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 2) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load spots from storage', e);
    }
    return generateInitialSpots();
  });

  // 2. Initialize reservations
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    try {
      const saved = localStorage.getItem(RESERVATIONS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load reservations', e);
    }
    return [];
  });

  // 3. Manual Database: Employees (for Spot A)
  const [employees, setEmployees] = useState<EmployeeRecord[]>(() => {
    try {
      const saved = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load employees', e);
    }
    return initialEmployees;
  });

  // 4. Manual Database: Paid Customers (for Spot B)
  const [paidCustomers, setPaidCustomers] = useState<PaidCustomerRecord[]>(() => {
    try {
      const saved = localStorage.getItem(PAID_CUSTOMERS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load paid customers', e);
    }
    return initialPaidCustomers;
  });

  // 5. On-Site Tickets & Cashier Database (for On-Site Staff Workflow)
  const [tickets, setTickets] = useState<ParkingTicket[]>(() => {
    try {
      const saved = localStorage.getItem(TICKETS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load tickets', e);
    }
    return initialTickets;
  });

  // 6. Real-Time Vehicle Entries & Exits Activity Logs for Spot A & B
  const [vehicleLogs, setVehicleLogs] = useState<VehicleActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(VEHICLE_LOGS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load vehicle logs', e);
    }
    return initialVehicleLogs;
  });

  // 7. System User Accounts (Admin and Employees login accounts)
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load users from storage', e);
    }
    return initialUserAccounts;
  });

  // Sync users to storage
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users', e);
    }
  }, [users]);

  // Modals & Drawers
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [bookingSpot, setBookingSpot] = useState<ParkingSpot | null>(null);
  const [bookingPrefilledPlate, setBookingPrefilledPlate] = useState<string>('');
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);
  const [isGateSimulatorOpen, setIsGateSimulatorOpen] = useState(false);
  const [isManualDbOpen, setIsManualDbOpen] = useState(false);
  const [isCustomerDbOpen, setIsCustomerDbOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isStaffTerminalOpen, setIsStaffTerminalOpen] = useState(false);
  const [staffTerminalPrefilledPlate, setStaffTerminalPrefilledPlate] = useState<string>('');
  const [staffTerminalInitialTab, setStaffTerminalInitialTab] = useState<'confidential_db' | 'issue' | 'checkout' | 'history'>('confidential_db');
  const [gateSimulatorPrefilledPlate, setGateSimulatorPrefilledPlate] = useState<string>('');
  const [isReceiptScannerOpen, setIsReceiptScannerOpen] = useState(false);
  const [scannerPrefilledCode, setScannerPrefilledCode] = useState<string>('');
  const [receiptTicketToView, setReceiptTicketToView] = useState<ParkingTicket | null>(null);

  // Quick Add Vehicle Modal (+დამატება: A ან B პარკინგი)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddDefaultSpot, setQuickAddDefaultSpot] = useState<'A' | 'B'>('A');
  const [quickAddPrefilledPlate, setQuickAddPrefilledPlate] = useState<string>('');

  // Portal Mode: 'customer' (Online booking & pass) vs 'staff' (Employee management) vs 'admin' (Admin Panel)
  const [portalMode, setPortalMode] = useState<'customer' | 'staff' | 'admin'>('customer');
  const [isStaffAuthOpen, setIsStaffAuthOpen] = useState(false);
  const [authModalInitialRole, setAuthModalInitialRole] = useState<'admin' | 'employee'>('admin');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('smartpark_current_user_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load user', e);
    }
    return null;
  });

  const handleUpdateProfile = (updated: Partial<UserAccount>) => {
    if (!currentUser) return;
    const newProfile = { ...currentUser, ...updated };
    setCurrentUser(newProfile);
    try {
      localStorage.setItem('smartpark_current_user_v1', JSON.stringify(newProfile));
    } catch {}

    // Synchronize to users list
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase()
          ? { ...u, ...updated }
          : u
      )
    );

    // Synchronize to employees list (if employee has matching email or name)
    setEmployees((prev) =>
      prev.map((emp) => {
        const matchEmail = emp.email && emp.email.toLowerCase() === currentUser.email.toLowerCase();
        const matchName = emp.fullName.toLowerCase() === currentUser.fullName.toLowerCase();
        if (matchEmail || matchName) {
          const empUpdates: Partial<EmployeeRecord> = {};
          if (updated.avatarUrl !== undefined) empUpdates.avatarUrl = updated.avatarUrl;
          if (updated.fullName) empUpdates.fullName = updated.fullName;
          if (updated.phone) empUpdates.phone = updated.phone;
          if (updated.department) empUpdates.department = updated.department;
          return { ...emp, ...empUpdates };
        }
        return emp;
      })
    );

    // Persist to backend
    fetch(`/api/users/${currentUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(() => {});

    addToast({
      type: 'success',
      title: 'პროფილი განახლდა',
      subtitle: `${newProfile.fullName} — ფოტო და მონაცემები წარმატებით შეინახა`,
    });
  };

  const handleOpenLogin = (role: 'admin' | 'employee' = 'admin') => {
    setAuthModalInitialRole(role);
    setIsStaffAuthOpen(true);
  };

  const handleRequestAdminPanel = () => {
    if (currentUser && currentUser.role === 'admin') {
      setPortalMode('admin');
      setIsAdminPanelOpen(true);
    } else {
      setAuthModalInitialRole('admin');
      setIsStaffAuthOpen(true);
    }
  };

  const handleLoginSuccess = (user: UserAccount, targetPortal: 'admin' | 'staff') => {
    const isRealAdmin = user.role === 'admin';
    // If user is employee or non-admin, targetPortal is forced to 'staff' and admin panel is closed!
    const effectivePortal: 'admin' | 'staff' = isRealAdmin && targetPortal === 'admin' ? 'admin' : 'staff';

    setCurrentUser(user);
    try {
      localStorage.setItem('smartpark_current_user_v1', JSON.stringify(user));
    } catch {}

    setPortalMode(effectivePortal);
    if (effectivePortal === 'admin') {
      setIsAdminPanelOpen(true);
    } else {
      setIsAdminPanelOpen(false);
    }

    addToast({
      type: 'success',
      title: `მოგესალმებით, ${user.fullName}!`,
      subtitle: isRealAdmin && effectivePortal === 'admin' ? 'ადმინ პანელი გააქტიურებულია' : 'თანამშრომლის რეჟიმი გააქტიურებულია',
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('smartpark_current_user_v1');
    } catch {}
    setPortalMode('customer');
    addToast({
      type: 'info',
      title: 'გამოსვლა შესრულებულია',
      subtitle: 'დაბრუნდით მომხმარებლის საჯარო ხედში',
    });
  };

  // Dedicated Spot A and Spot B View Filter for Staff ('all' | 'A' | 'B')
  const [activeSpotView, setActiveSpotView] = useState<'all' | 'A' | 'B'>('all');

  // Live simulation ticker & notifications
  const [isSimulating, setIsSimulating] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Fetch initial data from Node.js Express backend API
  useEffect(() => {
    async function loadBackendData() {
      try {
        const [backendEmployees, backendCustomers, backendTickets, backendSpots] = await Promise.all([
          api.getEmployees(),
          api.getCustomers(),
          api.getTickets(),
          api.getSpots(),
        ]);
        if (backendEmployees && backendEmployees.length > 0) {
          setEmployees(backendEmployees);
        }
        if (backendCustomers && backendCustomers.length > 0) {
          setPaidCustomers(backendCustomers);
        }
        if (backendTickets && backendTickets.length > 0) {
          setTickets(backendTickets);
        }
        if (backendSpots && backendSpots.length > 0) {
          setSpots(backendSpots);
        }
      } catch (e) {
        console.warn('Backend API initial fetch skipped or failed', e);
      }
    }
    loadBackendData();
  }, []);

  // Persist states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SPOTS_STORAGE_KEY, JSON.stringify(spots));
    } catch (e) {
      // ignore
    }
  }, [spots]);

  useEffect(() => {
    try {
      localStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(reservations));
    } catch (e) {
      // ignore
    }
  }, [reservations]);

  useEffect(() => {
    try {
      localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
    } catch (e) {
      // ignore
    }
  }, [employees]);

  useEffect(() => {
    try {
      localStorage.setItem(PAID_CUSTOMERS_STORAGE_KEY, JSON.stringify(paidCustomers));
    } catch (e) {
      // ignore
    }
  }, [paidCustomers]);

  useEffect(() => {
    try {
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
    } catch (e) {
      // ignore
    }
  }, [tickets]);

  useEffect(() => {
    try {
      localStorage.setItem(VEHICLE_LOGS_STORAGE_KEY, JSON.stringify(vehicleLogs));
    } catch (e) {
      // ignore
    }
  }, [vehicleLogs]);

  // Helper to add activity log for Entry or Exit
  const addVehicleLog = useCallback((logData: Omit<VehicleActivityLog, 'id' | 'timestamp'>) => {
    const newLog: VehicleActivityLog = {
      ...logData,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };
    setVehicleLogs((prev) => [newLog, ...prev]);
  }, []);

  // Helper to add toast notification
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto dismiss after 4.5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  // Manual Database Handlers
  const handleAddEmployee = (empData: Omit<EmployeeRecord, 'id' | 'addedAt'>) => {
    const newEmp: EmployeeRecord = {
      ...empData,
      id: `emp-${Date.now()}`,
      addedAt: new Date().toISOString().split('T')[0],
    };
    setEmployees((prev) => [newEmp, ...prev]);

    // Automatically save profile into driver directory for instant plate lookup
    saveDriverProfile({
      plateNumber: newEmp.plateNumber,
      fullName: newEmp.fullName,
      phone: newEmp.phone,
      category: 'employee',
      notes: `${newEmp.department} • A პარკინგის საშვი`,
    });

    addToast({
      type: 'success',
      title: 'თანამშრომელი დაემატა ბაზაში',
      subtitle: `${newEmp.fullName} (${newEmp.plateNumber}) • A პარკინგის საშვი გააქტიურებულია`,
    });
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    addToast({
      type: 'info',
      title: 'ჩანაწერი წაიშალა',
      subtitle: 'თანამშრომლის საშვი ამოიშალა ბაზიდან.',
    });
  };

  // ==================== USER ACCOUNTS MANAGEMENT (ADMIN FUNCTION) ====================
  // ადმინის იუზერით თანამშრომლის იუზერის შექმნა, წაშლა და რედაქტირება
  const handleAddUser = (userData: Omit<UserAccount, 'id' | 'createdAt'>) => {
    const newUser: UserAccount = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [newUser, ...prev]);

    // If role is employee or has a plate, also register in employee database for Spot A
    if (newUser.role === 'employee' || newUser.plateNumber) {
      setEmployees((prev) => {
        const exists = prev.some(
          (e) =>
            e.email?.toLowerCase() === newUser.email.toLowerCase() ||
            (newUser.plateNumber && e.plateNumber.toUpperCase() === newUser.plateNumber.toUpperCase())
        );
        if (exists) return prev;
        return [
          {
            id: `emp-${Date.now()}`,
            fullName: newUser.fullName,
            department: newUser.department || 'პარკინგის ოპერატორი',
            phone: newUser.phone || '+995 500 00 00 00',
            plateNumber: newUser.plateNumber || 'EMP-NEW',
            addedAt: new Date().toISOString().split('T')[0],
            email: newUser.email,
            password: newUser.password,
            role: 'employee',
          },
          ...prev,
        ];
      });

      if (newUser.plateNumber) {
        saveDriverProfile({
          plateNumber: newUser.plateNumber,
          fullName: newUser.fullName,
          phone: newUser.phone,
          category: 'employee',
          notes: `${newUser.department || 'ოპერატორი'} • A პარკინგის საშვი`,
        });
      }
    }

    // Persist to server if available
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    }).catch(() => {});

    addToast({
      type: 'success',
      title: 'ახალი იუზერი შეიქმნა!',
      subtitle: `${newUser.fullName} (იუზერი: ${newUser.email}) — თანამშრომელს უკვე შეუძლია შესვლა!`,
    });
  };

  const handleUpdateUser = (id: string, updatedData: Partial<UserAccount>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updatedData } : u)));

    fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    }).catch(() => {});

    addToast({
      type: 'success',
      title: 'იუზერის მონაცემები განახლდა',
      subtitle: `${updatedData.fullName || 'მომხმარებელი'} — პარამეტრები წარმატებით შეინახა`,
    });
  };

  const handleDeleteUser = (id: string) => {
    const targetUser = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));

    fetch(`/api/users/${id}`, { method: 'DELETE' }).catch(() => {});

    addToast({
      type: 'info',
      title: 'იუზერი წაიშალა',
      subtitle: targetUser
        ? `${targetUser.fullName} (${targetUser.email}) — ანგარიში წაშლილია. შეგიძლიათ შექმნათ ახალი იუზერი ახალი თანამშრომლისთვის.`
        : 'თანამშრომლის ანგარიში წაშლილია ბაზიდან.',
    });
  };

  // Record employee entry / arrival (მოსვლა)
  const handleRecordEmployeeArrival = (emp: EmployeeRecord) => {
    // 1. Mark Spot A as occupied by this employee
    setSpots((prev) =>
      prev.map((s) => {
        if (s.id === 'A' || s.type === 'employee') {
          return {
            ...s,
            status: 'occupied',
            occupiedBy: {
              plateNumber: emp.plateNumber,
              driverName: emp.fullName,
              vehicleType: 'sedan',
              isEmployee: true,
              matchedRecordId: emp.id,
            },
          };
        }
        return s;
      })
    );

    // 2. Add activity log
    const newLog: VehicleActivityLog = {
      id: `log-emp-entry-${Date.now()}`,
      direction: 'entry',
      spotId: 'A',
      plateNumber: emp.plateNumber,
      driverName: `${emp.fullName} (${emp.department})`,
      category: 'employee',
      timestamp: new Date().toISOString(),
      notes: 'სამსახურებრივი საშვი • ANPR ავტომატური დაშვება • შლაგბაუმი გაიღო',
    };
    setVehicleLogs((prev) => [newLog, ...prev]);

    addToast({
      type: 'success',
      title: 'თანამშრომელი შევიდა (მოსვლა)',
      subtitle: `${emp.fullName} (${emp.plateNumber}) • A პარკინგის ადგილი დაკავდა`,
    });
  };

  // Record employee departure / exit (გასვლა)
  const handleRecordEmployeeExit = (emp: EmployeeRecord) => {
    // 1. Mark Spot A as available if this employee was parked
    setSpots((prev) =>
      prev.map((s) => {
        if (s.id === 'A' || s.type === 'employee') {
          return {
            ...s,
            status: 'available',
            occupiedBy: undefined,
          };
        }
        return s;
      })
    );

    // 2. Add activity log
    const newLog: VehicleActivityLog = {
      id: `log-emp-exit-${Date.now()}`,
      direction: 'exit',
      spotId: 'A',
      plateNumber: emp.plateNumber,
      driverName: `${emp.fullName} (${emp.department})`,
      category: 'employee',
      timestamp: new Date().toISOString(),
      durationFormatted: 'სამუშაო ცვლა',
      notes: 'სამსახურებრივი გასვლა • შლაგბაუმი გაიღო',
    };
    setVehicleLogs((prev) => [newLog, ...prev]);

    addToast({
      type: 'info',
      title: 'თანამშრომელი გავიდა (გასვლა)',
      subtitle: `${emp.fullName} (${emp.plateNumber}) • A პარკინგის ადგილი განთავისუფლდა`,
    });
  };

  const handleAddPaidCustomer = (custData: Omit<PaidCustomerRecord, 'id'>) => {
    const newCust: PaidCustomerRecord = {
      ...custData,
      id: `paid-${Date.now()}`,
    };
    setPaidCustomers((prev) => [newCust, ...prev]);

    // Automatically save profile into driver directory for instant plate lookup
    saveDriverProfile({
      plateNumber: newCust.plateNumber,
      fullName: newCust.driverName,
      phone: newCust.phone,
      category: 'paid_customer',
      notes: `ფასიანი საშვი • ${newCust.amountPaid.toFixed(2)} ₾ • B პარკინგი`,
    });

    addToast({
      type: 'success',
      title: 'ფასიანი საშვი დაემატა ბაზაში',
      subtitle: `${newCust.driverName} (${newCust.plateNumber}) • ${newCust.amountPaid.toFixed(2)} ₾ • B პარკინგი`,
    });
  };

  // UPDATE / EDIT (კორექტირება) Customer - Admin Function
  const handleUpdateCustomer = (id: string, updatedData: Partial<PaidCustomerRecord>) => {
    setPaidCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c))
    );
    api.updateCustomer(id, updatedData);

    // If spot B was occupied by this customer, sync the occupancy details
    if (updatedData.plateNumber || updatedData.driverName) {
      setSpots((prev) =>
        prev.map((s) => {
          if (s.id === 'B' && s.occupiedBy?.matchedRecordId === id) {
            return {
              ...s,
              occupiedBy: {
                ...s.occupiedBy,
                plateNumber: updatedData.plateNumber || s.occupiedBy.plateNumber,
                driverName: updatedData.driverName || s.occupiedBy.driverName,
              },
            };
          }
          return s;
        })
      );
    }

    addToast({
      type: 'success',
      title: 'მომხმარებელი დაკორექტირდა',
      subtitle: `მონაცემები წარმატებით განახლდა (${updatedData.plateNumber || ''})`,
    });
  };

  const handleDeletePaidCustomer = (id: string) => {
    setPaidCustomers((prev) => prev.filter((c) => c.id !== id));
    api.deleteCustomer(id);
    addToast({
      type: 'info',
      title: 'მომხმარებელი წაიშალა',
      subtitle: 'ჩანაწერი ამოიშალა ბაზიდან.',
    });
  };

  const handleUpdatePaidCustomer = handleUpdateCustomer;

  // Gate Emergency Override
  const handleOverrideGate = async (
    gateId: 'A' | 'B' | 'all',
    action: 'force_open' | 'force_close' | 'emergency_lock'
  ) => {
    await api.overrideGate(gateId, action);
    addToast({
      type: action === 'emergency_lock' ? 'info' : 'success',
      title: 'შლაგბაუმის გადაუდებელი მართვა',
      subtitle: `შლაგბაუმი ${gateId}: ${
        action === 'force_open' ? 'გაღებულია' : action === 'force_close' ? 'დაკეტილია' : 'დაბლოკილია'
      } ადმინისტრატორის მიერ`,
    });
  };

  // Factory Database Reset
  const handleResetDatabase = async () => {
    await api.resetDatabase();
    localStorage.removeItem(SPOTS_STORAGE_KEY);
    localStorage.removeItem(RESERVATIONS_STORAGE_KEY);
    localStorage.removeItem(TICKETS_STORAGE_KEY);
    localStorage.removeItem(EMPLOYEES_STORAGE_KEY);
    localStorage.removeItem(PAID_CUSTOMERS_STORAGE_KEY);
    localStorage.removeItem(VEHICLE_LOGS_STORAGE_KEY);
    localStorage.removeItem(USERS_STORAGE_KEY);
    window.location.reload();
  };

  // UPDATE / EDIT (კორექტირება) Employee - Admin Function
  const handleUpdateEmployee = (id: string, updatedData: Partial<EmployeeRecord>) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updatedData } : e))
    );
    api.updateEmployee(id, updatedData);

    // If spot A was occupied by this employee, sync the occupancy details
    if (updatedData.plateNumber || updatedData.fullName) {
      setSpots((prev) =>
        prev.map((s) => {
          if (s.id === 'A' && s.occupiedBy?.matchedRecordId === id) {
            return {
              ...s,
              occupiedBy: {
                ...s.occupiedBy,
                plateNumber: updatedData.plateNumber || s.occupiedBy.plateNumber,
                driverName: updatedData.fullName || s.occupiedBy.driverName,
              },
            };
          }
          return s;
        })
      );
    }

    addToast({
      type: 'success',
      title: 'თანამშრომელი დაკორექტირდა',
      subtitle: `მონაცემები წარმატებით განახლდა (${updatedData.fullName || ''})`,
    });
  };

  // Toggle Spot A (Employee spot) status directly
  const handleToggleEmployeeStatus = useCallback(() => {
    setSpots((prev) =>
      prev.map((s) => {
        if (s.id === 'A' || s.type === 'employee') {
          const isCurrentlyOccupied = s.status === 'occupied';
          if (isCurrentlyOccupied) {
            const plate = s.occupiedBy?.plateNumber || 'EMP-777-GE';
            const name = s.occupiedBy?.driverName || 'თანამშრომელი';

            addVehicleLog({
              direction: 'exit',
              spotId: 'A',
              plateNumber: plate,
              driverName: name,
              category: 'employee',
              durationFormatted: 'სამუშაო ცვლა',
              notes: 'თანამშრომელმა დატოვა A პარკინგი • შლაგბაუმი გაიღო',
            });

            addToast({
              type: 'freed',
              title: 'A ადგილი განთავისუფლდა',
              subtitle: 'თანამშრომელმა დატოვა ადგილი. ადგილი თავისუფალია სხვა თანამშრომლისთვის.',
            });
            return {
              ...s,
              status: 'available',
              occupiedBy: undefined,
            };
          } else {
            const firstEmp = employees[0];
            const plate = firstEmp?.plateNumber || 'EMP-777-GE';
            const name = firstEmp?.fullName || 'თანამშრომელი';

            addVehicleLog({
              direction: 'entry',
              spotId: 'A',
              plateNumber: plate,
              driverName: name,
              category: 'employee',
              notes: 'თანამშრომელი შევიდა A პარკინგზე • სამსახურებრივი საშვი',
            });

            addToast({
              type: 'occupied',
              title: 'A ადგილი დაკავებულია',
              subtitle: `თანამშრომლის ავტომობილი (${plate}) გაჩერდა A ადგილზე.`,
            });
            return {
              ...s,
              status: 'occupied',
              occupiedBy: {
                plateNumber: plate,
                vehicleType: 'sedan',
                driverName: name,
                expiresAt: new Date(Date.now() + 8 * 3600000).toISOString(),
                isEmployee: true,
              },
            };
          }
        }
        return s;
      })
    );
  }, [addToast, addVehicleLog, employees]);

  // Handle successful online reservation for Spot B
  const handleBookingSuccess = (reservation: Reservation) => {
    setReservations((prev) => [reservation, ...prev]);

    // Add entry log for Spot B
    addVehicleLog({
      direction: 'entry',
      spotId: 'B',
      plateNumber: reservation.vehiclePlate,
      driverName: reservation.driverName,
      category: 'paid',
      notes: `ონლაინ დაჯავშნა #${reservation.id} (${reservation.durationHours} სთ) • ${reservation.totalAmount.toFixed(2)} ₾`,
    });

    // Also sync into paid customers list so ANPR recognizes it
    const newPaidRecord: PaidCustomerRecord = {
      id: reservation.id,
      plateNumber: reservation.vehiclePlate,
      driverName: reservation.driverName,
      phone: reservation.driverPhone,
      validUntil: reservation.endTime,
      amountPaid: reservation.totalAmount,
      status: 'active',
    };
    setPaidCustomers((prev) => [newPaidRecord, ...prev]);

    // Automatically save into driver directory for staff auto-lookup
    saveDriverProfile({
      plateNumber: reservation.vehiclePlate,
      fullName: reservation.driverName,
      phone: reservation.driverPhone,
      category: 'online_booking',
      notes: `ონლაინ დაჯავშნა #${reservation.id} • ${reservation.durationHours} სთ • B პარკინგი`,
    });

    // Mark Spot B as occupied by user
    setSpots((prev) =>
      prev.map((s) => {
        if (s.id === 'B' || s.id === reservation.spotId) {
          return {
            ...s,
            status: 'occupied',
            occupiedBy: {
              plateNumber: reservation.vehiclePlate,
              vehicleType: reservation.vehicleType,
              expiresAt: reservation.endTime,
              isUserBooking: true,
              bookingId: reservation.id,
              driverName: reservation.driverName,
            },
          };
        }
        return s;
      })
    );

    addToast({
      type: 'success',
      title: 'B პარკინგი წარმატებით დაიჯავშნა!',
      subtitle: `საშვი: #${reservation.id} • ${reservation.vehiclePlate} (${reservation.durationHours} სთ • ${reservation.totalAmount.toFixed(2)} ₾)`,
    });
  };

  // Handle booking cancellation
  const handleCancelBooking = (bookingId: string) => {
    const res = reservations.find((r) => r.id === bookingId);
    if (!res) return;

    addVehicleLog({
      direction: 'exit',
      spotId: 'B',
      plateNumber: res.vehiclePlate,
      driverName: res.driverName,
      category: 'paid',
      notes: `ჯავშანი გაუქმდა • B ადგილი განთავისუფლდა (#${res.id})`,
    });

    setReservations((prev) => prev.filter((r) => r.id !== bookingId));
    setPaidCustomers((prev) => prev.filter((p) => p.id !== bookingId));

    setSpots((prev) =>
      prev.map((s) => {
        if (s.id === 'B' || s.id === res.spotId) {
          return {
            ...s,
            status: 'available',
            occupiedBy: undefined,
          };
        }
        return s;
      })
    );

    addToast({
      type: 'info',
      title: t.toast.bookingCancelled,
      subtitle: `B პარკინგი განთავისუფლდა. დაბრუნდა თანხა: ${res.totalAmount.toFixed(2)} ₾`,
    });
  };

  // Handle booking extension
  const handleExtendBooking = (bookingId: string, additionalHours: number) => {
    setReservations((prev) =>
      prev.map((r) => {
        if (r.id === bookingId) {
          const newHours = r.durationHours + additionalHours;
          const newTotal = calculateParkingPrice(newHours);
          const currentEnd = new Date(r.endTime).getTime();
          const newEnd = new Date(currentEnd + additionalHours * 3600000).toISOString();

          return {
            ...r,
            durationHours: newHours,
            endTime: newEnd,
            totalAmount: newTotal,
          };
        }
        return r;
      })
    );

    addToast({
      type: 'success',
      title: 'ჯავშნის დრო გახანგრძლივდა',
      subtitle: `დაემატა +${additionalHours} საათი B პარკინგზე`,
    });
  };

  // Automatic Car Arrival & Spot Allocation via Gate ANPR
  const handleSimulateCarArrival = (
    plateNumber: string,
    classification: 'employee' | 'paid',
    details: { driverName?: string; expiresAt?: string; bookingId?: string }
  ): boolean => {
    const targetSpotId = classification === 'employee' ? 'A' : 'B';

    addVehicleLog({
      direction: 'entry',
      spotId: targetSpotId,
      plateNumber,
      driverName: details.driverName || (classification === 'employee' ? 'თანამშრომელი' : 'კლიენტი'),
      category: classification === 'employee' ? 'employee' : 'paid',
      notes: `ANPR კამერის ავტო-დაშვება • ${targetSpotId} პარკინგი`,
    });

    setSpots((prev) =>
      prev.map((s) => {
        if (s.id === targetSpotId) {
          return {
            ...s,
            status: 'occupied',
            occupiedBy: {
              plateNumber,
              vehicleType: 'sedan',
              driverName: details.driverName || (classification === 'employee' ? 'თანამშრომელი' : 'კლიენტი'),
              expiresAt: details.expiresAt || new Date(Date.now() + 4 * 3600000).toISOString(),
              isEmployee: classification === 'employee',
              isUserBooking: classification === 'paid',
              bookingId: details.bookingId,
            },
          };
        }
        return s;
      })
    );

    addToast({
      type: 'occupied',
      title: `ავტომობილი შევიდა: ${targetSpotId} პარკინგი`,
      subtitle: `${plateNumber} • ${classification === 'employee' ? 'თანამშრომელი (A პარკინგი)' : 'ფასიანი პარკინგი (B პარკინგი)'}`,
    });

    return true;
  };

  // Open booking modal for a specific plate (e.g. from camera)
  const handleStartBookingForPlate = (plate: string) => {
    const paidSpot = spots.find((s) => s.id === 'B') || spots[1];
    setBookingPrefilledPlate(plate);
    setBookingSpot(paidSpot);
  };

  // Test plate directly in the camera simulator
  const handleTestPlateInCamera = (plate: string) => {
    setIsGateSimulatorOpen(true);
  };

  // Staff Handlers for On-Site Registration, Receipt Generation, Payment & Barrier Control
  const handleIssueTicket = (ticket: ParkingTicket) => {
    setTickets((prev) => [ticket, ...prev]);

    addVehicleLog({
      direction: 'entry',
      spotId: ticket.spotId,
      plateNumber: ticket.plateNumber,
      driverName: ticket.driverFullName || 'ადგილზე მომხმარებელი',
      category: ticket.spotId === 'A' ? 'employee' : 'paid',
      notes: `ადგილზე გაცემული ბილეთი #${ticket.ticketId}`,
    });

    // Ensure driver profile is indexed in directory
    if (ticket.driverFullName) {
      saveDriverProfile({
        plateNumber: ticket.plateNumber,
        fullName: ticket.driverFullName,
        phone: ticket.driverPhone,
        category: 'on_site',
        notes: `ადგილზე ბილეთი #${ticket.ticketId}`,
      });
    }

    // Occupy the chosen spot
    setSpots((prev) =>
      prev.map((s) => {
        if (s.id === ticket.spotId) {
          return {
            ...s,
            status: 'occupied',
            occupiedBy: {
              plateNumber: ticket.plateNumber,
              vehicleType: 'sedan',
              driverName: ticket.staffOperatorName || 'ადგილზე მომხმარებელი',
              bookingId: ticket.ticketId,
              isUserBooking: false,
              isEmployee: ticket.spotId === 'A',
            },
          };
        }
        return s;
      })
    );

    addToast({
      type: 'success',
      title: `ქვითარი #${ticket.ticketId} გაცემულია!`,
      subtitle: `შლაგბაუმი გაიღო • ${ticket.plateNumber} შევიდა ${ticket.spotId} პარკინგზე.`,
    });
  };

  const handleRecordPayment = (
    ticketId: string,
    amount: number,
    method: 'cash' | 'card' | 'pos' | 'bog' | 'tbc'
  ) => {
    const methodNames: Record<string, string> = {
      cash: 'ნაღდი ფული (ქეში)',
      bog: 'საქართველოს ბანკი (საქ / BOG)',
      tbc: 'თიბისი ბანკი (თიბისი / TBC)',
      card: 'საბანკო ბარათი (POS)',
      pos: 'საბანკო ბარათი (POS)',
    };
    const methodNameGeorgian = methodNames[method] || method;

    setTickets((prev) =>
      prev.map((t) => {
        if (t.ticketId === ticketId) {
          return {
            ...t,
            status: 'paid',
            paidAt: new Date().toISOString(),
            amountDue: amount,
            amountPaid: amount,
            paymentMethod: method,
          };
        }
        return t;
      })
    );

    addToast({
      type: 'success',
      title: 'გადახდა დაფიქსირდა ბაზაში!',
      subtitle: `თანხა: ${amount.toFixed(2)} ₾ • მეთოდი: ${methodNameGeorgian} • ტალონი: #${ticketId}`,
    });
  };

  const handleManualOpenBarrierAndFreeSpot = (ticketId: string, spotId: 'A' | 'B') => {
    const targetTicket = tickets.find((t) => t.ticketId === ticketId);
    const targetSpot = spots.find((s) => s.id === spotId);

    const methodNames: Record<string, string> = {
      cash: 'ნაღდი (ქეში)',
      bog: 'საქართველოს ბანკი (საქ)',
      tbc: 'თიბისი ბანკი',
      card: 'საბანკო ბარათი',
      pos: 'POS ბარათი',
    };
    const methodStr = targetTicket?.paymentMethod
      ? methodNames[targetTicket.paymentMethod] || targetTicket.paymentMethod
      : undefined;

    addVehicleLog({
      direction: 'exit',
      spotId: spotId,
      plateNumber: targetTicket?.plateNumber || targetSpot?.occupiedBy?.plateNumber || 'ავტომობილი',
      driverName: targetTicket?.driverFullName || targetSpot?.occupiedBy?.driverName,
      category: spotId === 'A' ? 'employee' : 'paid',
      durationFormatted: targetTicket?.durationFormatted || '1 სთ 30 წთ',
      amountPaid: targetTicket?.amountPaid,
      paymentMethod: methodStr,
      notes: `შლაგბაუმი გაიღო მანუალით • ${spotId} პარკინგი თავისუფალია`,
    });

    setTickets((prev) =>
      prev.map((t) => {
        if (t.ticketId === ticketId) {
          return {
            ...t,
            status: 'completed',
            exitTime: new Date().toISOString(),
          };
        }
        return t;
      })
    );

    // Free the spot
    setSpots((prev) =>
      prev.map((s) => {
        if (s.id === spotId) {
          return {
            ...s,
            status: 'available',
            occupiedBy: undefined,
          };
        }
        return s;
      })
    );

    addToast({
      type: 'freed',
      title: 'შლაგბაუმი გაიღო მანუალით!',
      subtitle: `ავტომობილმა დატოვა ტერიტორია. ${spotId} პარკინგი თავისუფალია!`,
    });
  };

  const handleDeleteTicket = (ticketId: string) => {
    setTickets((prev) => prev.filter((t) => t.ticketId !== ticketId));
    addToast({
      type: 'info',
      title: 'ჩანაწერი წაიშალა',
      subtitle: `ტალონი #${ticketId} წაიშალა თანამშრომლის ბაზიდან.`,
    });
  };

  const handleViewPrintReceipt = (ticket: ParkingTicket) => {
    setReceiptTicketToView(ticket);
  };

  const handleOpenPastReceipts = (plate?: string) => {
    if (plate) {
      setStaffTerminalPrefilledPlate(plate);
    }
    setStaffTerminalInitialTab('history');
    setIsStaffTerminalOpen(true);
  };

  const handleViewReceiptForPlate = (plate: string) => {
    const cleanPlate = plate.toUpperCase().replace(/\s|-/g, '');
    const matchingTickets = tickets.filter(
      (t) => t.plateNumber.toUpperCase().replace(/\s|-/g, '') === cleanPlate
    );
    if (matchingTickets.length > 0) {
      // Pick most recent ticket
      const latest = matchingTickets[matchingTickets.length - 1];
      handleViewPrintReceipt(latest);
    } else {
      handleOpenPastReceipts(plate);
    }
  };

  // Open Quick Add Modal (+დამატება: A ან B პარკინგი)
  const handleOpenQuickAdd = (spotId?: 'A' | 'B', plate?: string) => {
    setQuickAddDefaultSpot(spotId || 'A');
    setQuickAddPrefilledPlate(plate || '');
    setIsQuickAddOpen(true);
  };

  // Handler for Quick Add Vehicle (+დამატება)
  const handleQuickAddParkVehicle = (data: QuickAddSubmitData) => {
    const targetSpotId = data.spotId;
    const now = new Date();
    const durationMs = (data.durationHours || 3) * 3600000;
    const expiresAt = new Date(now.getTime() + durationMs).toISOString();

    // 1. If spot is currently occupied and replacing, log departure for previous vehicle
    const currentSpot = spots.find((s) => s.id === targetSpotId);
    if (currentSpot && currentSpot.status === 'occupied' && currentSpot.occupiedBy?.plateNumber) {
      addVehicleLog({
        direction: 'exit',
        spotId: targetSpotId,
        plateNumber: currentSpot.occupiedBy.plateNumber,
        driverName: currentSpot.occupiedBy.driverName || 'წინა მძღოლი',
        category: targetSpotId === 'A' ? 'employee' : 'paid',
        durationFormatted: 'ჩანაცვლდა ახალი ავტომობილით',
        notes: `ავტომობილი გაყვანილია ახალი მანქანის (${data.plateNumber}) დასაყენებლად`,
      });
    }

    // 2. Generate authentic ticket and barcodes
    const randomTicketNum = Math.floor(100000 + Math.random() * 900000);
    const ticketId = targetSpotId === 'A' ? `EMP-${randomTicketNum}` : `TKT-${randomTicketNum}`;
    const barcode = `${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const newTicket: ParkingTicket = {
      ticketId,
      barcode,
      plateNumber: data.plateNumber,
      driverFullName: data.driverName,
      driverPhone: data.driverPhone,
      spotId: targetSpotId,
      entryTime: now.toISOString(),
      status: data.isPaidImmediately ? 'paid' : 'active',
      amountDue: targetSpotId === 'A' ? 0 : (data.amountPaid || calculateParkingPrice(data.durationHours)),
      amountPaid: data.isPaidImmediately ? data.amountPaid : undefined,
      paymentMethod: data.isPaidImmediately ? (data.paymentMethod as any) : undefined,
      paidAt: data.isPaidImmediately ? now.toISOString() : undefined,
      staffOperatorName: targetSpotId === 'A' ? `სამსახურებრივი: ${data.department || 'ადმინისტრაცია'}` : 'ოპერატორი',
      notes: targetSpotId === 'A' ? `სამსახურებრივი საშვი • ${data.department}` : `სწრაფი დამატება (+დამატება)`,
    };

    setTickets((prev) => [newTicket, ...prev]);

    // 3. Update Target Parking Spot
    setSpots((prev) =>
      prev.map((s) => {
        if (s.id === targetSpotId) {
          return {
            ...s,
            status: 'occupied',
            occupiedBy: {
              plateNumber: data.plateNumber,
              vehicleType: data.vehicleType || 'sedan',
              driverName: data.driverName,
              expiresAt,
              isEmployee: targetSpotId === 'A',
              isUserBooking: false,
              bookingId: ticketId,
            },
          };
        }
        return s;
      })
    );

    // 4. Activity Log (Manual Gate Opening by Staff)
    addVehicleLog({
      direction: 'entry',
      spotId: targetSpotId,
      plateNumber: data.plateNumber,
      driverName: data.driverName,
      category: targetSpotId === 'A' ? 'employee' : 'paid',
      notes: `მანუალით გაღება (თანამშრომელმა შლაგბაუმი ხელით გააღო) • ${targetSpotId} პარკინგი (${targetSpotId === 'A' ? data.department || 'სამსახურებრივი' : data.isPaidImmediately ? 'გადახდილი' : 'გადახდა გასვლისას'})`,
    });

    // 5. Index in driver directory
    saveDriverProfile({
      plateNumber: data.plateNumber,
      fullName: data.driverName,
      phone: data.driverPhone,
      category: targetSpotId === 'A' ? 'employee' : 'on_site',
      notes: targetSpotId === 'A' ? `დეპარტამენტი: ${data.department}` : `ბილეთი #${ticketId}`,
    });

    // 6. Save to DB if requested
    if (data.saveToDb) {
      if (targetSpotId === 'A') {
        const exists = employees.some((e) => e.plateNumber.toUpperCase() === data.plateNumber.toUpperCase());
        if (!exists) {
          setEmployees((prev) => [
            {
              id: `emp_${Date.now()}`,
              plateNumber: data.plateNumber,
              fullName: data.driverName,
              department: data.department || 'ადმინისტრაცია',
              phone: data.driverPhone || '599 00 00 00',
              addedAt: new Date().toLocaleDateString('ka-GE'),
            },
            ...prev,
          ]);
        }
      } else {
        const exists = paidCustomers.some((c) => c.plateNumber.toUpperCase() === data.plateNumber.toUpperCase());
        if (!exists) {
          setPaidCustomers((prev) => [
            {
              id: `cust_${Date.now()}`,
              plateNumber: data.plateNumber,
              driverName: data.driverName,
              phone: data.driverPhone || '599 00 00 00',
              validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
              amountPaid: data.amountPaid || 5,
              status: 'active',
            },
            ...prev,
          ]);
        }
      }
    }

    // 7. Toast notification
    addToast({
      type: 'success',
      title: `${targetSpotId} პარკინგი: შლაგბაუმი ხელით (მანუალურად) გაიღო!`,
      subtitle: `${data.plateNumber} (${data.driverName}) შევიდა • თანამშრომელმა ხელით გააღო • ბილეთი #${ticketId}`,
    });

    // 8. Open receipt ticket modal if requested
    if (data.openReceiptAfter && targetSpotId === 'B') {
      setReceiptTicketToView(newTicket);
    }
  };

  // Handler for saving to DB only (without immediate parking)
  const handleQuickAddSaveToDbOnly = (data: QuickAddDbOnlyData) => {
    if (data.spotId === 'A') {
      const exists = employees.some((e) => e.plateNumber.toUpperCase() === data.plateNumber.toUpperCase());
      if (!exists) {
        setEmployees((prev) => [
          {
            id: `emp_${Date.now()}`,
            plateNumber: data.plateNumber,
            fullName: data.driverName,
            department: data.department || 'ადმინისტრაცია',
            phone: data.driverPhone || '599 00 00 00',
            addedAt: new Date().toLocaleDateString('ka-GE'),
          },
          ...prev,
        ]);
      }
      saveDriverProfile({
        plateNumber: data.plateNumber,
        fullName: data.driverName,
        phone: data.driverPhone,
        category: 'employee',
        notes: `დეპარტამენტი: ${data.department || 'ადმინისტრაცია'}`,
      });
      addToast({
        type: 'success',
        title: 'თანამშრომელი დაემატა ბაზაში!',
        subtitle: `${data.plateNumber} (${data.driverName}) • ANPR კამერა ავტომატურად გაუღებს შლაგბაუმს A ადგილზე.`,
      });
    } else {
      const exists = paidCustomers.some((c) => c.plateNumber.toUpperCase() === data.plateNumber.toUpperCase());
      if (!exists) {
        setPaidCustomers((prev) => [
          {
            id: `cust_${Date.now()}`,
            plateNumber: data.plateNumber,
            driverName: data.driverName,
            phone: data.driverPhone || '599 00 00 00',
            validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
            amountPaid: 5,
            status: 'active',
          },
          ...prev,
        ]);
      }
      saveDriverProfile({
        plateNumber: data.plateNumber,
        fullName: data.driverName,
        phone: data.driverPhone,
        category: 'on_site',
        notes: 'კლიენტთა ბაზა',
      });
      addToast({
        type: 'success',
        title: 'კლიენტი დაემატა ბაზაში!',
        subtitle: `${data.plateNumber} (${data.driverName}) რეგისტრირებულია B პარკინგისთვის.`,
      });
    }
  };

  // Reset demo data to fresh initial state
  const handleResetData = () => {
    if (window.confirm('ნამდვილად გსურთ სატესტო მონაცემების საწყის მდგომარეობაში დაბრუნება?')) {
      const fresh = generateInitialSpots();
      setSpots(fresh);
      setReservations([]);
      setEmployees(initialEmployees);
      setPaidCustomers(initialPaidCustomers);
      setTickets(initialTickets);
      setVehicleLogs(initialVehicleLogs);
      localStorage.removeItem(SPOTS_STORAGE_KEY);
      localStorage.removeItem(RESERVATIONS_STORAGE_KEY);
      localStorage.removeItem(EMPLOYEES_STORAGE_KEY);
      localStorage.removeItem(PAID_CUSTOMERS_STORAGE_KEY);
      localStorage.removeItem(TICKETS_STORAGE_KEY);
      localStorage.removeItem(VEHICLE_LOGS_STORAGE_KEY);
      addToast({
        type: 'info',
        title: 'მონაცემები განახლდა',
        subtitle: 'სისტემა დაუბრუნდა საწყის რეჟიმს (A: თანამშრომლების, B: ფასიანი).',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        lang={lang}
        onLanguageChange={setLang}
        portalMode={portalMode}
        onSwitchPortal={(mode) => {
          if (mode === 'admin') {
            handleRequestAdminPanel();
          } else if (mode === 'staff') {
            if (currentUser) {
              setPortalMode('staff');
            } else {
              handleOpenLogin('employee');
            }
          } else {
            setPortalMode('customer');
          }
        }}
        onOpenStaffAuth={() => handleOpenLogin(portalMode === 'admin' ? 'admin' : 'employee')}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        activeBookingsCount={reservations.length}
        activeTicketsCount={tickets.filter((t) => t.status === 'active').length}
        spots={spots}
        activeView={activeSpotView}
        onSelectView={setActiveSpotView}
        onStartBooking={() => {
          const s = spots.find((spot) => spot.id === 'B');
          if (s) {
            setBookingPrefilledPlate('');
            setBookingSpot(s);
          }
        }}
        onOpenMyBookings={() => setIsMyBookingsOpen(true)}
        onOpenGateSimulator={() => setIsGateSimulatorOpen(true)}
        onOpenManualDatabase={() => setIsManualDbOpen(true)}
        onOpenCustomerDatabase={() => setIsCustomerDbOpen(true)}
        onOpenAdminPanel={handleRequestAdminPanel}
        onOpenStaffTerminal={() => {
          setStaffTerminalInitialTab('confidential_db');
          setIsStaffTerminalOpen(true);
        }}
        onOpenReceiptScanner={() => {
          setScannerPrefilledCode('');
          setIsReceiptScannerOpen(true);
        }}
        onOpenPastReceipts={() => {
          handleOpenPastReceipts();
        }}
        onOpenQuickAdd={() => handleOpenQuickAdd()}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
      />

      {/* Main Container */}
      <main className="flex-1 pb-16">
        {portalMode === 'customer' ? (
          /* ================= 1. PUBLIC CUSTOMER PORTAL ================= */
          <CustomerPortal
            spotB={spots.find((s) => s.id === 'B')}
            activeReservations={reservations}
            onStartBooking={() => {
              const s = spots.find((spot) => spot.id === 'B');
              if (s) {
                setBookingPrefilledPlate('');
                setBookingSpot(s);
              }
            }}
            onOpenMyBookings={() => setIsMyBookingsOpen(true)}
            onOpenStaffLogin={() => setIsStaffAuthOpen(true)}
            lang={lang}
          />
        ) : (
          /* ================= 2. INTERNAL STAFF & OPERATOR PORTAL ================= */
          <>
            {/* Operator / Admin Warning Banner */}
            {portalMode === 'admin' ? (
              <div className="bg-indigo-950/80 border-b border-indigo-500/40 px-4 py-2.5 shadow-md">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2 text-indigo-200 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                    <span>⚡ ადმინ პანელი — სრული ადმინისტრირება (მომხმარებელთა კორექტირება, წაშლა, ტარიფები, შლაგბაუმები)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      id="admin-banner-manage-btn"
                      onClick={() => setIsAdminPanelOpen(true)}
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-sm"
                    >
                      მართვის პანელი
                    </button>
                    <button
                      onClick={() => setPortalMode('staff')}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-white border border-amber-500/30 font-semibold transition-colors"
                    >
                      თანამშრომლის რეჟიმი
                    </button>
                    <button
                      onClick={() => setPortalMode('customer')}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-semibold transition-colors"
                    >
                      ⬅️ მომხმარებლის ხედი
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-teal-950/90 via-slate-900 to-emerald-950/80 border-b border-teal-500/30 px-4 py-3 shadow-lg">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditProfileOpen(true)}
                      title="დააჭირეთ: პროფილის რედაქტირება და ფოტოს ატვირთვა"
                      className="relative group shrink-0"
                    >
                      {currentUser?.avatarUrl ? (
                        <img
                          src={currentUser.avatarUrl}
                          alt={currentUser.fullName}
                          className="w-10 h-10 rounded-xl object-cover border border-teal-500/50 shadow-md ring-1 ring-white/10 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-bold group-hover:scale-105 transition-transform shadow-inner">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-900 border border-teal-500 text-teal-300 group-hover:bg-teal-600 group-hover:text-white transition-colors shadow-sm">
                        <Camera className="w-2.5 h-2.5" />
                      </div>
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm">
                          👤 იუზერი: {currentUser ? currentUser.fullName : 'პარკინგის ოპერატორი'}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-500/40 uppercase tracking-wider">
                          იუზერის რეჟიმი
                        </span>
                      </div>
                      <p className="text-[11px] text-teal-300/80 mt-0.5">
                        უფლებამოსილება: შეიყვანს თანამშრომლებს (A პარკინგი) და მომხმარებლებს (B პარკინგი)
                      </p>
                    </div>
                  </div>

                  {/* Primary Actions for User: Enter Employee or Enter Customer, and Edit Profile Photo */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditProfileOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 hover:text-white border border-teal-500/40 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                      title="თანამშრომლის პროფილის ფოტოს ატვირთვა ან არჩევა"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>📸 ჩემი ფოტო / პროფილი</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenQuickAdd('A')}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md shadow-teal-700/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      title="თანამშრომლის ავტომობილის შეყვანა (A პარკინგი)"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>+ თანამშრომლის შეყვანა (A)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenQuickAdd('B')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-700/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      title="ფასიანი მომხმარებლის შეყვანა (B პარკინგი)"
                    >
                      <Users className="w-4 h-4" />
                      <span>+ მომხმარებლის შეყვანა (B)</span>
                    </button>

                    <button
                      onClick={() => setPortalMode('customer')}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-semibold transition-colors"
                      title="მომხმარებლის საჯარო ხედზე გადასვლა"
                    >
                      ⬅️ კლიენტის ხედი
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Real-time Statistics Header Bar */}
            <StatsBar
              spots={spots}
              employeesCount={employees.length}
              paidCustomersCount={paidCustomers.length}
              onOpenManualDatabase={() => setIsManualDbOpen(true)}
              onOpenCustomerDatabase={() => setIsCustomerDbOpen(true)}
              lang={lang}
            />

            {/* AUTOMATIC DRIVER IDENTIFIER & LICENSE PLATE LOOKUP WIDGET */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-6">
              <StaffPlateAutoLookupWidget
                onOpenStaffTerminal={(plate) => {
                  setStaffTerminalPrefilledPlate(plate || '');
                  setStaffTerminalInitialTab('confidential_db');
                  setIsStaffTerminalOpen(true);
                }}
                onOpenGateSimulator={(plate) => {
                  setGateSimulatorPrefilledPlate(plate || '');
                  setIsGateSimulatorOpen(true);
                }}
                onOpenReceiptScanner={(code) => {
                  setScannerPrefilledCode(code || '');
                  setIsReceiptScannerOpen(true);
                }}
                onOpenPastReceipts={() => {
                  handleOpenPastReceipts();
                }}
                onOpenQuickAdd={(plate) => handleOpenQuickAdd('A', plate)}
                lang={lang}
              />
            </div>

            {/* Dedicated 2-Spot Parking Area: A (Employee) & B (Paid) */}
            <ParkingMap
              spots={spots}
              selectedSpotId={selectedSpot?.id || null}
              activeView={activeSpotView}
              onSelectView={setActiveSpotView}
              onSelectSpot={(spot) => setSelectedSpot(spot)}
              onStartBooking={(spot) => {
                setBookingPrefilledPlate('');
                setBookingSpot(spot);
              }}
              onToggleEmployeeStatus={handleToggleEmployeeStatus}
              onOpenGateSimulator={() => {
                setGateSimulatorPrefilledPlate('');
                setIsGateSimulatorOpen(true);
              }}
              onOpenManualDatabase={() => setIsManualDbOpen(true)}
              onOpenCustomerDatabase={() => setIsCustomerDbOpen(true)}
              onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
              onOpenStaffTerminal={() => {
                setStaffTerminalPrefilledPlate('');
                setStaffTerminalInitialTab('confidential_db');
                setIsStaffTerminalOpen(true);
              }}
              onOpenQuickAdd={(spotId) => handleOpenQuickAdd(spotId || 'A')}
              vehicleLogs={vehicleLogs}
              lang={lang}
            />

            {/* Comprehensive Vehicle Entries & Exits Activity Registry */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-6">
              <VehicleActivityLogTable
                logs={vehicleLogs}
                activeSpotFilter={activeSpotView}
                onFilterSpotChange={setActiveSpotView}
                onViewReceiptForPlate={handleViewReceiptForPlate}
                lang={lang}
              />
            </div>

            {/* Helpful Staff Information Banner */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-6">
              <div className="bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-white font-semibold block">
                      A პარკინგი (თანამშრომლების) & B პარკინგი (ფასიანი: 1₾/სთ, 2₾/3სთ, 5₾/24სთ)
                    </span>
                    <span>
                      კამერა ავტომატურად ამოიცნობს ნომერს და თანამშრომელთა/მომხმარებელთა ბაზის მიხედვით დაახარისხებს მანქანას შესასვლელთან.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsManualDbOpen(true)}
                    className="text-xs text-teal-300 hover:text-teal-200 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-950/60 hover:bg-teal-900/60 border border-teal-500/30 transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                    <span>თანამშრომელთა ბაზა</span>
                  </button>

                  <button
                    onClick={() => setIsCustomerDbOpen(true)}
                    className="text-xs text-emerald-300 hover:text-emerald-200 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>მომხმარებელთა ბაზა</span>
                  </button>

                  <button
                    onClick={handleResetData}
                    className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 shrink-0 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                    title="საწყისი მონაცემების აღდგენა"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>საწყისზე დაბრუნება</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* SmartPark User Login & Admin/Staff Authentication Modal */}
      <KutStoryAuthModal
        isOpen={isStaffAuthOpen}
        onClose={() => setIsStaffAuthOpen(false)}
        initialRole={authModalInitialRole}
        users={users}
        onLoginSuccess={handleLoginSuccess}
        lang={lang}
      />

      {/* User Profile Edit Modal (პროფილის რედაქტირება) */}
      {currentUser && (
        <UserProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          currentUser={currentUser}
          onUpdateProfile={handleUpdateProfile}
          lang={lang}
        />
      )}

      {/* Spot Detail Preview Drawer */}
      <SpotDetailDrawer
        spot={selectedSpot}
        onClose={() => setSelectedSpot(null)}
        onStartBooking={(spot) => {
          setSelectedSpot(null);
          setBookingPrefilledPlate('');
          setBookingSpot(spot);
        }}
        onOpenMyBookings={() => {
          setSelectedSpot(null);
          setIsMyBookingsOpen(true);
        }}
        onToggleEmployeeStatus={handleToggleEmployeeStatus}
        lang={lang}
      />

      {/* Reservation & Pre-Payment Modal for Spot B */}
      {bookingSpot && (
        <ReservationModal
          spot={bookingSpot}
          onClose={() => {
            setBookingSpot(null);
            setBookingPrefilledPlate('');
          }}
          onSuccess={handleBookingSuccess}
          onOpenGateSimulator={() => setIsGateSimulatorOpen(true)}
          initialPlate={bookingPrefilledPlate}
          lang={lang}
        />
      )}

      {/* My Bookings Drawer */}
      <MyBookingsDrawer
        isOpen={isMyBookingsOpen}
        onClose={() => setIsMyBookingsOpen(false)}
        reservations={reservations}
        onCancelBooking={handleCancelBooking}
        onExtendBooking={handleExtendBooking}
        onSelectSpotToView={(spotId) => {
          const s = spots.find((item) => item.id === spotId);
          if (s) setSelectedSpot(s);
        }}
        lang={lang}
      />

      {/* ANPR Camera & Gate Simulator with Auto-Input and Classification */}
      <GateSimulatorModal
        isOpen={isGateSimulatorOpen}
        onClose={() => {
          setIsGateSimulatorOpen(false);
          setGateSimulatorPrefilledPlate('');
        }}
        activeReservations={reservations}
        employees={employees}
        paidCustomers={paidCustomers}
        onOpenManualDatabase={() => {
          setIsGateSimulatorOpen(false);
          setIsManualDbOpen(true);
        }}
        onOpenStaffTerminal={(plate) => {
          setStaffTerminalPrefilledPlate(plate || '');
          setIsGateSimulatorOpen(false);
          setIsStaffTerminalOpen(true);
        }}
        onSimulateCarArrival={handleSimulateCarArrival}
        onStartBookingForPlate={handleStartBookingForPlate}
        initialPlate={gateSimulatorPrefilledPlate}
        lang={lang}
      />

      {/* Employee Database Modal (თანამშრომელთა ბაზა: Employees & Arrivals/Departures) */}
      <ManualDatabaseModal
        isOpen={isManualDbOpen}
        onClose={() => setIsManualDbOpen(false)}
        employees={employees}
        onAddEmployee={handleAddEmployee}
        onDeleteEmployee={handleDeleteEmployee}
        vehicleLogs={vehicleLogs}
        spotA={spots.find((s) => s.id === 'A')}
        onRecordEmployeeArrival={handleRecordEmployeeArrival}
        onRecordEmployeeExit={handleRecordEmployeeExit}
        onSwitchToCustomerDb={() => {
          setIsManualDbOpen(false);
          setIsCustomerDbOpen(true);
        }}
        onOpenAdminPanel={handleRequestAdminPanel}
        isAdmin={currentUser?.role === 'admin'}
        onTestPlateInCamera={handleTestPlateInCamera}
        lang={lang}
      />

      {/* Customer Database Modal (მომხმარებელთა ბაზა: Entered Customers, Tickets & Dense High-Capacity View) */}
      <CustomerDatabaseModal
        isOpen={isCustomerDbOpen}
        onClose={() => setIsCustomerDbOpen(false)}
        paidCustomers={paidCustomers}
        tickets={tickets}
        reservations={reservations}
        vehicleLogs={vehicleLogs}
        spotB={spots.find((s) => s.id === 'B')}
        onAddPaidCustomer={handleAddPaidCustomer}
        onUpdatePaidCustomer={handleUpdatePaidCustomer}
        onDeletePaidCustomer={handleDeletePaidCustomer}
        onViewReceipt={(tkt) => handleViewPrintReceipt(tkt)}
        onManualCheckoutAndExit={(tkt) => handleManualOpenBarrierAndFreeSpot(tkt.ticketId, tkt.spotId)}
        onTestPlateInCamera={handleTestPlateInCamera}
        onSwitchToEmployeeDb={() => {
          setIsCustomerDbOpen(false);
          setIsManualDbOpen(true);
        }}
        onOpenAdminPanel={handleRequestAdminPanel}
        isAdmin={currentUser?.role === 'admin'}
        lang={lang}
      />

      {/* Dedicated Admin Panel Modal (ადმინ პანელი: მომხმარებელთა კორექტირება & წაშლა, ტარიფები, შლაგბაუმები) */}
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        customers={paidCustomers}
        onAddCustomer={handleAddPaidCustomer}
        onUpdateCustomer={handleUpdatePaidCustomer}
        onDeleteCustomer={handleDeletePaidCustomer}
        employees={employees}
        onAddEmployee={handleAddEmployee}
        onUpdateEmployee={handleUpdateEmployee}
        onDeleteEmployee={handleDeleteEmployee}
        tickets={tickets}
        spots={spots}
        vehicleLogs={vehicleLogs}
        users={users}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
        onOverrideGate={handleOverrideGate}
        onRecordEmployeeArrival={handleRecordEmployeeArrival}
        onRecordEmployeeExit={handleRecordEmployeeExit}
        onViewReceipt={(tkt) => handleViewPrintReceipt(tkt)}
        onTestPlateInCamera={handleTestPlateInCamera}
        onResetDatabase={handleResetDatabase}
        onOpenQuickAdd={() => handleOpenQuickAdd()}
        currentUser={currentUser}
        onAdminAuthenticated={(adminUser) => handleLoginSuccess(adminUser, 'admin')}
        lang={lang}
      />

      {/* On-Site Staff Terminal (ადგილზე მანქანის დამატება, ქვითარი/შტრიხკოდი, გადახდა & შლაგბაუმის მანუალური გახსნა) */}
      <StaffTerminalModal
        isOpen={isStaffTerminalOpen}
        onClose={() => {
          setIsStaffTerminalOpen(false);
          setStaffTerminalPrefilledPlate('');
        }}
        spots={spots}
        tickets={tickets}
        onIssueTicket={handleIssueTicket}
        onRecordPayment={handleRecordPayment}
        onManualOpenBarrierAndFreeSpot={handleManualOpenBarrierAndFreeSpot}
        onViewPrintReceipt={handleViewPrintReceipt}
        onDeleteTicket={handleDeleteTicket}
        initialPlate={staffTerminalPrefilledPlate}
        initialTab={staffTerminalInitialTab}
        onOpenScannerModal={() => {
          setIsReceiptScannerOpen(true);
        }}
        lang={lang}
      />

      {/* Instant Receipt QR / Barcode / Code Scanner & Cashier Modal */}
      <ReceiptScannerModal
        isOpen={isReceiptScannerOpen}
        onClose={() => {
          setIsReceiptScannerOpen(false);
          setScannerPrefilledCode('');
        }}
        tickets={tickets}
        spots={spots}
        initialCode={scannerPrefilledCode}
        onRecordPayment={handleRecordPayment}
        onManualOpenBarrierAndFreeSpot={handleManualOpenBarrierAndFreeSpot}
        onViewPrintReceipt={handleViewPrintReceipt}
        lang={lang}
      />

      {/* Printable Receipt / Barcode Modal */}
      <ReceiptTicketModal
        isOpen={!!receiptTicketToView}
        ticket={receiptTicketToView}
        onClose={() => setReceiptTicketToView(null)}
        onGoToCheckout={(tkt) => {
          setReceiptTicketToView(null);
          setScannerPrefilledCode(tkt.ticketId);
          setIsReceiptScannerOpen(true);
        }}
        lang={lang}
      />

      {/* Quick Add Vehicle Modal (+დამატება: A ან B პარკინგი) */}
      <QuickAddVehicleModal
        isOpen={isQuickAddOpen}
        onClose={() => {
          setIsQuickAddOpen(false);
          setQuickAddPrefilledPlate('');
        }}
        spots={spots}
        employees={employees}
        paidCustomers={paidCustomers}
        onParkVehicle={handleQuickAddParkVehicle}
        onSaveToDbOnly={handleQuickAddSaveToDbOnly}
        defaultSpotId={quickAddDefaultSpot}
        prefilledPlate={quickAddPrefilledPlate}
        lang={lang}
      />

      {/* User & Employee Profile / Photo Editing Modal */}
      {isEditProfileOpen && currentUser && (
        <UserProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          currentUser={currentUser}
          onUpdateProfile={handleUpdateProfile}
          lang={lang}
        />
      )}

      {/* Toast Notification Container */}
      <LiveNotificationToast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
