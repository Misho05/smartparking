/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ParkingSpot, Reservation, EmployeeRecord, PaidCustomerRecord, ParkingTicket, Language } from './types';
import { generateInitialSpots } from './data/initialSpots';
import { initialEmployees, initialPaidCustomers, initialTickets } from './data/initialDatabase';
import { translations } from './utils/translations';
import { Navbar } from './components/Navbar';
import { StatsBar } from './components/StatsBar';
import { ParkingMap } from './components/ParkingMap';
import { SpotDetailDrawer } from './components/SpotDetailDrawer';
import { ReservationModal } from './components/ReservationModal';
import { MyBookingsDrawer } from './components/MyBookingsDrawer';
import { GateSimulatorModal } from './components/GateSimulatorModal';
import { ManualDatabaseModal } from './components/ManualDatabaseModal';
import { StaffTerminalModal } from './components/StaffTerminalModal';
import { ReceiptTicketModal } from './components/ReceiptTicketModal';
import { LiveNotificationToast, ToastMessage } from './components/LiveNotificationToast';
import { ShieldCheck, RefreshCw, Car, Sparkles, UserCheck, CreditCard, Database, Receipt } from 'lucide-react';
import { calculateParkingPrice } from './utils/pricing';

const SPOTS_STORAGE_KEY = 'smartpark_spots_data_v3_2spots';
const RESERVATIONS_STORAGE_KEY = 'smartpark_user_reservations_v3';
const EMPLOYEES_STORAGE_KEY = 'smartpark_employees_db_v1';
const PAID_CUSTOMERS_STORAGE_KEY = 'smartpark_paid_customers_db_v1';
const TICKETS_STORAGE_KEY = 'smartpark_tickets_db_v1';

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

  // Modals & Drawers
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [bookingSpot, setBookingSpot] = useState<ParkingSpot | null>(null);
  const [bookingPrefilledPlate, setBookingPrefilledPlate] = useState<string>('');
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);
  const [isGateSimulatorOpen, setIsGateSimulatorOpen] = useState(false);
  const [isManualDbOpen, setIsManualDbOpen] = useState(false);
  const [isStaffTerminalOpen, setIsStaffTerminalOpen] = useState(false);
  const [receiptTicketToView, setReceiptTicketToView] = useState<ParkingTicket | null>(null);

  // Live simulation ticker & notifications
  const [isSimulating, setIsSimulating] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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

  const handleAddPaidCustomer = (custData: Omit<PaidCustomerRecord, 'id'>) => {
    const newCust: PaidCustomerRecord = {
      ...custData,
      id: `paid-${Date.now()}`,
    };
    setPaidCustomers((prev) => [newCust, ...prev]);
    addToast({
      type: 'success',
      title: 'ფასიანი საშვი დაემატა ბაზაში',
      subtitle: `${newCust.driverName} (${newCust.plateNumber}) • ${newCust.amountPaid.toFixed(2)} ₾ • B პარკინგი`,
    });
  };

  const handleDeletePaidCustomer = (id: string) => {
    setPaidCustomers((prev) => prev.filter((c) => c.id !== id));
    addToast({
      type: 'info',
      title: 'საშვი წაიშალა',
      subtitle: 'ფასიანი საშვი ამოიშალა ბაზიდან.',
    });
  };

  // Toggle Spot A (Employee spot) status directly
  const handleToggleEmployeeStatus = useCallback(() => {
    setSpots((prev) =>
      prev.map((s) => {
        if (s.id === 'A' || s.type === 'employee') {
          const isCurrentlyOccupied = s.status === 'occupied';
          if (isCurrentlyOccupied) {
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
  }, [addToast, employees]);

  // Handle successful online reservation for Spot B
  const handleBookingSuccess = (reservation: Reservation) => {
    setReservations((prev) => [reservation, ...prev]);

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
      subtitle: `თანხა: ${amount.toFixed(2)} ₾ • ტალონი: #${ticketId} • შლაგბაუმი მზადაა მანუალური გახსნისთვის.`,
    });
  };

  const handleManualOpenBarrierAndFreeSpot = (ticketId: string, spotId: 'A' | 'B') => {
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

  // Reset demo data to fresh initial state
  const handleResetData = () => {
    if (window.confirm('ნამდვილად გსურთ სატესტო მონაცემების საწყის მდგომარეობაში დაბრუნება?')) {
      const fresh = generateInitialSpots();
      setSpots(fresh);
      setReservations([]);
      setEmployees(initialEmployees);
      setPaidCustomers(initialPaidCustomers);
      setTickets(initialTickets);
      localStorage.removeItem(SPOTS_STORAGE_KEY);
      localStorage.removeItem(RESERVATIONS_STORAGE_KEY);
      localStorage.removeItem(EMPLOYEES_STORAGE_KEY);
      localStorage.removeItem(PAID_CUSTOMERS_STORAGE_KEY);
      localStorage.removeItem(TICKETS_STORAGE_KEY);
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
        activeBookingsCount={reservations.length}
        activeTicketsCount={tickets.filter((t) => t.status === 'active').length}
        onOpenMyBookings={() => setIsMyBookingsOpen(true)}
        onOpenGateSimulator={() => setIsGateSimulatorOpen(true)}
        onOpenManualDatabase={() => setIsManualDbOpen(true)}
        onOpenStaffTerminal={() => setIsStaffTerminalOpen(true)}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
      />

      {/* Main Container */}
      <main className="flex-1 pb-16">
        {/* Real-time Statistics Header Bar */}
        <StatsBar
          spots={spots}
          employeesCount={employees.length}
          paidCustomersCount={paidCustomers.length}
          onOpenManualDatabase={() => setIsManualDbOpen(true)}
          lang={lang}
        />

        {/* Dedicated 2-Spot Parking Area: A (Employee) & B (Paid) */}
        <ParkingMap
          spots={spots}
          selectedSpotId={selectedSpot?.id || null}
          onSelectSpot={(spot) => setSelectedSpot(spot)}
          onStartBooking={(spot) => {
            setBookingPrefilledPlate('');
            setBookingSpot(spot);
          }}
          onToggleEmployeeStatus={handleToggleEmployeeStatus}
          onOpenGateSimulator={() => setIsGateSimulatorOpen(true)}
          onOpenManualDatabase={() => setIsManualDbOpen(true)}
          onOpenStaffTerminal={() => setIsStaffTerminalOpen(true)}
          lang={lang}
        />

        {/* Helpful User Information Banner */}
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
                  კამერა ავტომატურად ამოიცნობს ნომერს და მანუალური ბაზის მიხედვით დაახარისხებს მანქანას შესასვლელთან.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsManualDbOpen(true)}
                className="text-xs text-teal-300 hover:text-teal-200 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                <Database className="w-3.5 h-3.5 text-teal-400" />
                <span>მანუალური ბაზა</span>
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
      </main>

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
        onClose={() => setIsGateSimulatorOpen(false)}
        activeReservations={reservations}
        employees={employees}
        paidCustomers={paidCustomers}
        onOpenManualDatabase={() => {
          setIsGateSimulatorOpen(false);
          setIsManualDbOpen(true);
        }}
        onOpenStaffTerminal={(plate) => {
          setIsGateSimulatorOpen(false);
          setIsStaffTerminalOpen(true);
        }}
        onSimulateCarArrival={handleSimulateCarArrival}
        onStartBookingForPlate={handleStartBookingForPlate}
        lang={lang}
      />

      {/* Manual Database Modal (Employees & Paid Customers) */}
      <ManualDatabaseModal
        isOpen={isManualDbOpen}
        onClose={() => setIsManualDbOpen(false)}
        employees={employees}
        onAddEmployee={handleAddEmployee}
        onDeleteEmployee={handleDeleteEmployee}
        paidCustomers={paidCustomers}
        onAddPaidCustomer={handleAddPaidCustomer}
        onDeletePaidCustomer={handleDeletePaidCustomer}
        onTestPlateInCamera={handleTestPlateInCamera}
        lang={lang}
      />

      {/* On-Site Staff Terminal (ადგილზე მანქანის დამატება, ქვითარი/შტრიხკოდი, გადახდა & შლაგბაუმის მანუალური გახსნა) */}
      <StaffTerminalModal
        isOpen={isStaffTerminalOpen}
        onClose={() => setIsStaffTerminalOpen(false)}
        spots={spots}
        tickets={tickets}
        onIssueTicket={handleIssueTicket}
        onRecordPayment={handleRecordPayment}
        onManualOpenBarrierAndFreeSpot={handleManualOpenBarrierAndFreeSpot}
        onViewPrintReceipt={handleViewPrintReceipt}
        onDeleteTicket={handleDeleteTicket}
        lang={lang}
      />

      {/* Printable Receipt / Barcode Modal */}
      <ReceiptTicketModal
        isOpen={!!receiptTicketToView}
        ticket={receiptTicketToView}
        onClose={() => setReceiptTicketToView(null)}
        onGoToCheckout={(tkt) => {
          setReceiptTicketToView(null);
          setIsStaffTerminalOpen(true);
        }}
        lang={lang}
      />

      {/* Toast Notification Container */}
      <LiveNotificationToast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
