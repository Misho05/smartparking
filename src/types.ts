export type SpotType = 'paid' | 'employee' | 'standard' | 'ev' | 'accessible' | 'vip';
export type SpotStatus = 'available' | 'occupied' | 'reserved';

export interface UserAccount {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  role: 'admin' | 'employee';
  phone?: string;
  department?: string;
  plateNumber?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface EmployeeRecord {
  id: string;
  plateNumber: string;
  fullName: string;
  department: string;
  phone: string;
  addedAt: string;
  email?: string;
  password?: string;
  avatarUrl?: string;
  role?: 'admin' | 'employee';
}

export interface PaidCustomerRecord {
  id: string;
  plateNumber: string;
  driverName: string;
  phone: string;
  validUntil: string;
  amountPaid: number;
  status: 'active' | 'expired';
}

export interface ANPRScanEvent {
  id: string;
  timestamp: string;
  plateNumber: string;
  classification: 'employee' | 'paid' | 'unregistered';
  allocatedSpot: 'A' | 'B' | null;
  gateAction: 'opened' | 'denied';
  matchedName?: string;
  notes: string;
}

export interface ParkingSpot {
  id: string; // 'A' or 'B'
  name: string;
  zoneName: string;
  number: number;
  type: SpotType;
  status: SpotStatus;
  pricePerHour: number; // 0 for employee spot
  features: string[];
  isEmployeeOnly?: boolean;
  powerKw?: number;
  floor?: number;
  occupiedBy?: {
    plateNumber?: string;
    vehicleType?: string;
    driverName?: string;
    expiresAt?: string;
    isUserBooking?: boolean;
    bookingId?: string;
    isEmployee?: boolean;
    matchedRecordId?: string;
  };
}

export type VehicleType = 'sedan' | 'suv' | 'ev' | 'van' | 'motorcycle';

export interface Reservation {
  id: string;
  spotId: string;
  floor?: number;
  zone: string;
  spotType: SpotType;
  pricePerHour: number;
  vehiclePlate: string;
  driverName: string;
  driverPhone: string;
  vehicleType: VehicleType;
  startTime: string; // ISO string
  durationHours: number;
  endTime: string; // ISO string
  hourlySubtotal: number;
  evChargingAddon: number;
  serviceFee: number;
  totalAmount: number;
  paymentMethod: 'card' | 'applepay' | 'googlepay' | 'bog' | 'tbc';
  paymentCardLast4?: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  qrCodeData: string;
}

export interface ParkingFilter {
  type: 'all' | SpotType;
  status: 'all' | SpotStatus;
  searchQuery: string;
}

export interface ParkingTicket {
  ticketId: string; // e.g. "TKT-849201"
  barcode: string; // e.g. "9842104591"
  plateNumber: string;
  driverFullName?: string; // სახელი და გვარი (კონფიდენციალური, მხოლოდ თანამშრომლისთვის)
  driverPhone?: string; // ტელეფონის ნომერი (კონფიდენციალური, მხოლოდ თანამშრომლისთვის)
  spotId: 'A' | 'B';
  entryTime: string; // ISO string
  status: 'active' | 'paid' | 'completed';
  paidAt?: string;
  exitTime?: string;
  durationMinutes?: number;
  durationFormatted?: string;
  amountDue?: number;
  amountPaid?: number;
  paymentMethod?: 'cash' | 'card' | 'pos' | 'bog' | 'tbc';
  staffOperatorName?: string;
  notes?: string;
  isConfidentialStaffEntry?: boolean;
}

export type Language = 'ka' | 'en';

export interface VehicleActivityLog {
  id: string;
  direction: 'entry' | 'exit'; // 'entry' = შემოსული (მწვანე), 'exit' = გასული (წითელი/ნარინჯისფერი)
  spotId: 'A' | 'B';
  plateNumber: string;
  driverName?: string;
  category: 'employee' | 'paid' | 'guest';
  timestamp: string; // ISO
  durationFormatted?: string; // e.g. "1 სთ 30 წთ" (for exit)
  amountPaid?: number; // (for exit if paid)
  paymentMethod?: string;
  notes?: string;
}
