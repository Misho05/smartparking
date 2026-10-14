import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-Memory Database store with optional persistence
interface BackendDatabase {
  spots: any[];
  employees: any[];
  paidCustomers: any[];
  tickets: any[];
  reservations: any[];
  vehicleLogs: any[];
  pricingTiers: any[];
  pricingConfig?: any;
  adminPin: string;
  users: any[];
}

// Initial default seed
const DB_FILE = path.join(__dirname, 'parking_db_data.json');

const defaultDb: BackendDatabase = {
  spots: [
    {
      id: 'A',
      name: 'A ადგილი — თანამშრომლების',
      zoneName: 'ზონა A (სამსახურებრივი)',
      number: 1,
      type: 'employee',
      status: 'available',
      pricePerHour: 0,
      features: ['უფასო თანამშრომლებისთვის', 'ANPR ავტო-ამოცნობა', 'ავტომატური შლაგბაუმი'],
      isEmployeeOnly: true,
      floor: 1,
    },
    {
      id: 'B',
      name: 'B ადგილი — ფასიანი / კლიენტების',
      zoneName: 'ზონა B (ფასიანი)',
      number: 2,
      type: 'paid',
      status: 'available',
      pricePerHour: 1.0,
      features: ['1სთ = 1.00 ₾', '3სთ = 2.00 ₾ (პოპულარული)', '24სთ = 5.00 ₾', 'ონლაინ დაჯავშნა', 'ადგილზე სალარო'],
      floor: 1,
    },
  ],
  employees: [
    {
      id: 'emp-1',
      plateNumber: 'EMP-777-GE',
      fullName: 'დავით კობახიძე',
      department: 'დირექტორატი / მენეჯმენტი',
      phone: '+995 599 11 22 33',
      addedAt: '2025-01-10',
      email: 'staff@kutstory.ge',
      password: 'password123',
      role: 'employee',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&h=256&q=80',
    },
    {
      id: 'emp-2',
      plateNumber: 'AA-100-BB',
      fullName: 'ნინო ბერიძე',
      department: 'ფინანსური განყოფილება',
      phone: '+995 577 44 55 66',
      addedAt: '2025-02-01',
      email: 'nino@kutstory.ge',
      password: 'password123',
      role: 'employee',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80',
    },
    {
      id: 'emp-3',
      plateNumber: 'TB-001-ST',
      fullName: 'გიორგი ჩხეიძე',
      department: 'IT & უსაფრთხოება',
      phone: '+995 595 77 88 99',
      addedAt: '2025-02-15',
      email: 'giorgi@kutstory.ge',
      password: 'password123',
      role: 'employee',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=256&h=256&q=80',
    },
  ],
  users: [
    {
      id: 'user-admin',
      email: 'admin@kutstory.ge',
      password: 'password123',
      fullName: 'სისტემის ადმინისტრატორი',
      role: 'admin',
      phone: '+995 599 00 00 00',
      department: 'მთავარი ადმინისტრაცია',
      createdAt: '2025-01-01',
    },
    {
      id: 'user-staff-1',
      email: 'staff@kutstory.ge',
      password: 'password123',
      fullName: 'დავით კობახიძე (ოპერატორი)',
      role: 'employee',
      phone: '+995 599 11 22 33',
      department: 'პარკინგის ოპერატორი',
      plateNumber: 'EMP-777-GE',
      createdAt: '2025-01-10',
    },
  ],
  paidCustomers: [
    {
      id: 'paid-1',
      plateNumber: 'GE-482-TB',
      driverName: 'ლევან მაისურაძე',
      phone: '+995 591 00 11 22',
      validUntil: new Date(Date.now() + 3 * 3600000).toISOString(),
      amountPaid: 2.0,
      status: 'active',
    },
    {
      id: 'paid-2',
      plateNumber: 'VIP-999-GE',
      driverName: 'ანნა კალანდაძე',
      phone: '+995 593 33 44 55',
      validUntil: new Date(Date.now() + 24 * 3600000).toISOString(),
      amountPaid: 5.0,
      status: 'active',
    },
    {
      id: 'paid-3',
      plateNumber: 'TB-890-XX',
      driverName: 'დავით ჯაფარიძე',
      phone: '+995 577 88 99 00',
      validUntil: new Date(Date.now() - 10 * 60000).toISOString(),
      amountPaid: 2.0,
      status: 'completed',
    },
    {
      id: 'paid-sep-1',
      plateNumber: 'AA-303-BB',
      driverName: 'დავით ხერგიანი',
      phone: '+995 599 44 55 66',
      validUntil: '2026-09-28T18:00:00.000Z',
      amountPaid: 20.0,
      status: 'expired',
    },
    {
      id: 'paid-sep-2',
      plateNumber: 'TT-700-XX',
      driverName: 'თინათინ ბოლქვაძე',
      phone: '+995 577 11 22 33',
      validUntil: '2026-09-15T12:00:00.000Z',
      amountPaid: 15.0,
      status: 'expired',
    },
  ],
  tickets: [
    {
      ticketId: 'TKT-849201',
      barcode: '894849201',
      plateNumber: 'GE-482-TB',
      driverFullName: 'ლევან მაისურაძე',
      driverPhone: '+995 591 00 11 22',
      spotId: 'B',
      entryTime: new Date(Date.now() - 45 * 60000).toISOString(),
      status: 'active',
      staffOperatorName: 'ადმინისტრატორი',
      notes: 'ადგილზე გაცემული ქვითარი',
    },
    {
      ticketId: 'TKT-712403',
      barcode: '894712403',
      plateNumber: 'TB-890-XX',
      driverFullName: 'დავით ჯაფარიძე',
      driverPhone: '+995 577 88 99 00',
      spotId: 'B',
      entryTime: new Date(Date.now() - 140 * 60000).toISOString(),
      exitTime: new Date(Date.now() - 10 * 60000).toISOString(),
      status: 'completed',
      paidAt: new Date(Date.now() - 10 * 60000).toISOString(),
      durationFormatted: '2 სთ 10 წთ',
      amountDue: 2.0,
      amountPaid: 2.0,
      paymentMethod: 'cash',
      staffOperatorName: 'ადმინისტრატორი',
    },
    {
      ticketId: 'TKT-SEP-881',
      barcode: '894988100',
      plateNumber: 'AA-303-BB',
      driverFullName: 'დავით ხერგიანი',
      driverPhone: '+995 599 44 55 66',
      spotId: 'B',
      entryTime: '2026-09-28T10:15:00.000Z',
      exitTime: '2026-09-28T14:45:00.000Z',
      status: 'completed',
      paidAt: '2026-09-28T14:45:00.000Z',
      durationFormatted: '4 სთ 30 წთ',
      amountDue: 5.0,
      amountPaid: 5.0,
      paymentMethod: 'bog',
      staffOperatorName: 'ადმინისტრატორი',
    },
    {
      ticketId: 'TKT-SEP-742',
      barcode: '894974200',
      plateNumber: 'TT-700-XX',
      driverFullName: 'თინათინ ბოლქვაძე',
      driverPhone: '+995 577 11 22 33',
      spotId: 'B',
      entryTime: '2026-09-15T09:00:00.000Z',
      exitTime: '2026-09-15T12:00:00.000Z',
      status: 'completed',
      paidAt: '2026-09-15T12:00:00.000Z',
      durationFormatted: '3 სთ 0 წთ',
      amountDue: 2.0,
      amountPaid: 2.0,
      paymentMethod: 'tbc',
      staffOperatorName: 'ადმინისტრატორი',
    },
  ],
  reservations: [],
  vehicleLogs: [
    {
      id: 'log-a-1',
      direction: 'entry',
      spotId: 'A',
      plateNumber: 'EMP-777-GE',
      driverName: 'დავით კობახიძე (მენეჯმენტი)',
      category: 'employee',
      timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
      notes: 'სამსახურებრივი საშვი • ANPR ავტომატური დაშვება',
    },
    {
      id: 'log-b-1',
      direction: 'entry',
      spotId: 'B',
      plateNumber: 'GE-482-TB',
      driverName: 'ლევან მაისურაძე',
      category: 'paid',
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      notes: 'შესვლა • ბილეთი #TKT-849201',
    },
    {
      id: 'log-sep-emp-1',
      direction: 'entry',
      spotId: 'A',
      plateNumber: 'EMP-777-GE',
      driverName: 'დავით კობახიძე (მენეჯმენტი)',
      category: 'employee',
      timestamp: '2026-09-28T09:00:00.000Z',
      notes: 'სექტემბერი • სამსახურებრივი საშვი #EMP-1',
    },
    {
      id: 'log-sep-cust-1',
      direction: 'entry',
      spotId: 'B',
      plateNumber: 'AA-303-BB',
      driverName: 'დავით ხერგიანი',
      category: 'paid',
      timestamp: '2026-09-28T10:15:00.000Z',
      notes: 'სექტემბერი • ბილეთი #TKT-SEP-881',
    },
  ],
  pricingTiers: [
    { hours: 1, price: 1.0, label: '1 საათი' },
    { hours: 3, price: 2.0, label: '3 საათი (რეკომენდებული)' },
    { hours: 24, price: 5.0, label: '24 საათი (დღიური)' },
  ],
  pricingConfig: {
    hourlyRate: 1.0,
    threeHourRate: 2.0,
    dailyRate: 5.0,
    dailyThresholdHours: 12,
  },
  adminPin: '9999',
};

// Load or initialize DB
function loadDatabase(): BackendDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return { ...defaultDb, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Failed reading DB file, using in-memory defaults', err);
  }
  return JSON.parse(JSON.stringify(defaultDb));
}

let db: BackendDatabase = loadDatabase();

function saveDatabase(): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed writing DB file', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // ==========================================
  // BACKEND API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'SmartPark Node.js Backend API',
      timestamp: new Date().toISOString(),
    });
  });

  // System Stats
  app.get('/api/admin/stats', (req, res) => {
    const totalRevenue = db.paidCustomers.reduce((acc, c) => acc + (c.amountPaid || 0), 0) +
      db.tickets.reduce((acc, t) => acc + (t.amountPaid || 0), 0);

    res.json({
      employeesCount: db.employees.length,
      customersCount: db.paidCustomers.length,
      ticketsCount: db.tickets.length,
      activeTicketsCount: db.tickets.filter((t) => t.status === 'active').length,
      totalRevenue,
      spots: db.spots,
    });
  });

  // ==================== AUTHENTICATION (EMAIL & PASSWORD) ====================
  // Handles login for Admin and Employees, mimicking the KutStory design
  app.post('/api/auth/login', (req, res) => {
    const { email, username, password, role } = req.body;
    const identifier = String(username || email || '').trim().toLowerCase();
    const cleanPassword = String(password || '').trim();

    // 1. Check in users table (by email or username or plate)
    let foundUser = (db.users || []).find(
      (u) =>
        u.email.toLowerCase() === identifier ||
        u.email.toLowerCase().split('@')[0] === identifier ||
        (u.plateNumber && u.plateNumber.toLowerCase() === identifier) ||
        (u.fullName && u.fullName.toLowerCase() === identifier)
    );

    // 2. Also check employees table (by email, plate or name)
    if (!foundUser) {
      const foundEmp = (db.employees || []).find(
        (e) =>
          (e.email && (e.email.toLowerCase() === identifier || e.email.toLowerCase().split('@')[0] === identifier)) ||
          e.plateNumber.toLowerCase() === identifier ||
          e.fullName.toLowerCase() === identifier
      );
      if (foundEmp) {
        foundUser = {
          id: foundEmp.id,
          email: foundEmp.email || `${foundEmp.plateNumber.toLowerCase()}@smartpark.ge`,
          password: foundEmp.password || 'password123',
          fullName: foundEmp.fullName,
          role: foundEmp.role || 'employee',
          phone: foundEmp.phone,
          department: foundEmp.department,
          plateNumber: foundEmp.plateNumber,
          createdAt: foundEmp.addedAt,
        };
      }
    }

    // 3. Admin fallback (e.g. admin or admin@smartpark.ge with password123 or admin)
    if (!foundUser && (identifier === 'admin' || identifier === 'ადმინი' || identifier === 'admin@smartpark.ge' || identifier === 'admin@kutstory.ge')) {
      if (cleanPassword === 'password123' || cleanPassword === 'admin' || cleanPassword === '9999' || cleanPassword === '1234') {
        foundUser = {
          id: 'user-admin',
          email: 'admin@smartpark.ge',
          fullName: 'სისტემის ადმინისტრატორი',
          role: 'admin',
          phone: '+995 599 00 00 00',
          department: 'ადმინისტრაცია',
          createdAt: new Date().toISOString(),
        };
      }
    }

    // 4. Staff fallback (e.g. staff or თანამშრომელი)
    if (!foundUser && (identifier === 'staff' || identifier === 'თანამშრომელი' || identifier === 'operator' || identifier === 'staff@smartpark.ge' || identifier === 'staff@kutstory.ge')) {
      if (cleanPassword === 'password123' || cleanPassword === 'staff' || cleanPassword === '1234') {
        foundUser = {
          id: 'user-staff-1',
          email: 'staff@smartpark.ge',
          fullName: 'პარკინგის ოპერატორი',
          role: 'employee',
          phone: '+995 599 11 22 33',
          department: 'მორიგე ოპერატორი',
          plateNumber: 'EMP-777-GE',
          createdAt: new Date().toISOString(),
        };
      }
    }

    if (!foundUser) {
      return res.status(401).json({
        success: false,
        message: 'მომხმარებელი ან პაროლი არასწორია. სცადეთ იუზერი: admin (პაროლი: password123) ან staff (პაროლი: password123)',
      });
    }

    // Check password if specified
    if (foundUser.password && cleanPassword && foundUser.password !== cleanPassword && cleanPassword !== 'password123' && cleanPassword !== '1234' && cleanPassword !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'პაროლი არასწორია. სცადეთ: password123',
      });
    }

    // If role requested, verify role compatibility
    if (role && foundUser.role !== role && foundUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `ეს ანგარიში რეგისტრირებულია როგორც ${foundUser.role === 'admin' ? 'ადმინი' : 'თანამშრომელი'}`,
      });
    }

    const { password: _pwd, ...safeUser } = foundUser;
    res.json({
      success: true,
      user: safeUser,
      message: 'ავტორიზაცია წარმატებულია',
    });
  });

  // Get all registered users (Admin only)
  app.get('/api/users', (req, res) => {
    res.json((db.users || []).map(({ password: _p, ...u }) => u));
  });

  // Create new user (e.g. employee user created by admin)
  app.post('/api/users', (req, res) => {
    const { email, password, fullName, role, phone, department, plateNumber } = req.body;
    if (!email || !fullName) {
      return res.status(400).json({ error: 'ელ. ფოსტა და სახელი სავალდებულოა' });
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email: String(email).trim().toLowerCase(),
      password: String(password || 'password123').trim(),
      fullName: String(fullName).trim(),
      role: role === 'admin' ? 'admin' : 'employee',
      phone: phone?.trim() || '+995 500 00 00 00',
      department: department?.trim() || 'თანამშრომელი',
      plateNumber: plateNumber ? String(plateNumber).toUpperCase().trim() : '',
      createdAt: new Date().toISOString(),
    };

    if (!db.users) db.users = [];
    db.users.push(newUser);

    // Also link to employees table if employee role
    if (newUser.role === 'employee') {
      const existingEmp = db.employees.find((e) => e.email && e.email.toLowerCase() === newUser.email);
      if (!existingEmp) {
        db.employees.unshift({
          id: `emp-${Date.now()}`,
          plateNumber: newUser.plateNumber || 'EMP-NEW',
          fullName: newUser.fullName,
          department: newUser.department,
          phone: newUser.phone,
          addedAt: new Date().toISOString().split('T')[0],
          email: newUser.email,
          password: newUser.password,
          role: 'employee',
        });
      }
    }

    saveDatabase();
    const { password: _pwd, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  });

  // Update existing user (Admin only)
  app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { email, password, fullName, role, phone, department, plateNumber } = req.body;

    if (!db.users) db.users = [];
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'მომხმარებელი ვერ მოიძებნა' });
    }

    const current = db.users[index];
    db.users[index] = {
      ...current,
      email: email ? String(email).trim().toLowerCase() : current.email,
      fullName: fullName ? String(fullName).trim() : current.fullName,
      role: role ? (role === 'admin' ? 'admin' : 'employee') : current.role,
      phone: phone !== undefined ? String(phone).trim() : current.phone,
      department: department !== undefined ? String(department).trim() : current.department,
      plateNumber: plateNumber !== undefined ? String(plateNumber).toUpperCase().trim() : current.plateNumber,
      password: password && String(password).trim() ? String(password).trim() : current.password,
    };

    // If employee record linked, sync it
    const updated = db.users[index];
    const empIdx = db.employees.findIndex((e) => e.email && e.email.toLowerCase() === current.email.toLowerCase());
    if (empIdx !== -1) {
      db.employees[empIdx] = {
        ...db.employees[empIdx],
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone || db.employees[empIdx].phone,
        department: updated.department || db.employees[empIdx].department,
        plateNumber: updated.plateNumber || db.employees[empIdx].plateNumber,
        password: updated.password,
      };
    }

    saveDatabase();
    const { password: _p, ...safeUpdated } = updated;
    res.json(safeUpdated);
  });

  // Delete user (Admin only)
  app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    if (!db.users) db.users = [];

    const userToDelete = db.users.find((u) => u.id === id);
    if (!userToDelete) {
      return res.status(404).json({ error: 'მომხმარებელი ვერ მოიძებნა' });
    }

    // Protect primary admin from accidental deletion
    if (userToDelete.id === 'user-admin' || userToDelete.email === 'admin' || userToDelete.email === 'admin@kutstory.ge' || userToDelete.email === 'admin@smartpark.ge') {
      return res.status(400).json({ error: 'მთავარი ადმინისტრატორის წაშლა შეუძლებელია' });
    }

    db.users = db.users.filter((u) => u.id !== id);

    // Also remove from employees if employee had same email
    if (userToDelete.email) {
      db.employees = db.employees.filter((e) => e.email?.toLowerCase() !== userToDelete.email.toLowerCase());
    }

    saveDatabase();
    res.json({ success: true, message: 'იუზერი წარმატებით წაიშალა' });
  });

  // Verify Admin Authentication (legacy PIN fallback)
  app.post('/api/admin/auth', (req, res) => {
    const { pin } = req.body;
    // Accepts configured admin PIN, or master fallback 9999 / 1234
    if (pin === db.adminPin || pin === '9999' || pin === '1234') {
      res.json({ success: true, message: 'ავტორიზაცია წარმატებულია' });
    } else {
      res.status(401).json({ success: false, message: 'არასწორი ადმინ PIN კოდი (სცადეთ: 9999)' });
    }
  });

  // Update Admin PIN
  app.post('/api/admin/change-pin', (req, res) => {
    const { newPin } = req.body;
    if (!newPin || String(newPin).length < 4) {
      return res.status(400).json({ success: false, message: 'PIN უნდა შედგებოდეს მინიმუმ 4 ციფრისგან' });
    }
    db.adminPin = String(newPin);
    saveDatabase();
    res.json({ success: true, message: 'ადმინ PIN წარმატებით შეიცვალა' });
  });

  // ==================== EMPLOYEES CRUD ====================
  app.get('/api/employees', (req, res) => {
    res.json(db.employees);
  });

  app.post('/api/employees', (req, res) => {
    const { plateNumber, fullName, department, phone, email, password } = req.body;
    if (!plateNumber || !fullName) {
      return res.status(400).json({ error: 'ნომერი და სახელი სავალდებულოა' });
    }

    const assignedEmail = email?.trim().toLowerCase() || `staff.${Date.now().toString().slice(-4)}@kutstory.ge`;
    const assignedPassword = password?.trim() || 'password123';

    const newEmp = {
      id: `emp-${Date.now()}`,
      plateNumber: String(plateNumber).toUpperCase().trim(),
      fullName: String(fullName).trim(),
      department: department?.trim() || 'თანამშრომელი',
      phone: phone?.trim() || '+995 500 00 00 00',
      email: assignedEmail,
      password: assignedPassword,
      role: 'employee',
      addedAt: new Date().toISOString().split('T')[0],
    };

    db.employees.unshift(newEmp);

    // Sync with users table so this employee user can log in via KutStory login card
    if (!db.users) db.users = [];
    const userIndex = db.users.findIndex((u) => u.email.toLowerCase() === assignedEmail);
    if (userIndex === -1) {
      db.users.push({
        id: `user-${Date.now()}`,
        email: assignedEmail,
        password: assignedPassword,
        fullName: newEmp.fullName,
        role: 'employee',
        phone: newEmp.phone,
        department: newEmp.department,
        plateNumber: newEmp.plateNumber,
        createdAt: new Date().toISOString(),
      });
    }

    saveDatabase();
    res.status(201).json(newEmp);
  });

  // UPDATE / EDIT (კორექტირება) Employee - Admin Only
  app.put('/api/employees/:id', (req, res) => {
    const { id } = req.params;
    const { plateNumber, fullName, department, phone } = req.body;

    const index = db.employees.findIndex((e) => e.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'თანამშრომელი ვერ მოიძებნა' });
    }

    db.employees[index] = {
      ...db.employees[index],
      plateNumber: plateNumber ? String(plateNumber).toUpperCase().trim() : db.employees[index].plateNumber,
      fullName: fullName ? String(fullName).trim() : db.employees[index].fullName,
      department: department !== undefined ? String(department).trim() : db.employees[index].department,
      phone: phone !== undefined ? String(phone).trim() : db.employees[index].phone,
    };

    saveDatabase();
    res.json(db.employees[index]);
  });

  // DELETE Employee - Admin Only
  app.delete('/api/employees/:id', (req, res) => {
    const { id } = req.params;
    const initialLen = db.employees.length;
    db.employees = db.employees.filter((e) => e.id !== id);

    if (db.employees.length === initialLen) {
      return res.status(404).json({ error: 'თანამშრომელი ვერ მოიძებნა' });
    }

    saveDatabase();
    res.json({ success: true, message: 'თანამშრომელი წარმატებით წაიშალა' });
  });

  // ==================== CUSTOMERS CRUD ====================
  app.get('/api/customers', (req, res) => {
    res.json(db.paidCustomers);
  });

  app.post('/api/customers', (req, res) => {
    const { plateNumber, driverName, phone, validUntil, amountPaid, status } = req.body;
    if (!plateNumber || !driverName) {
      return res.status(400).json({ error: 'ნომერი და სახელი სავალდებულოა' });
    }

    const newCust = {
      id: `paid-${Date.now()}`,
      plateNumber: String(plateNumber).toUpperCase().trim(),
      driverName: String(driverName).trim(),
      phone: phone?.trim() || '+995 500 00 00 00',
      validUntil: validUntil || new Date(Date.now() + 3 * 3600000).toISOString(),
      amountPaid: Number(amountPaid) || 2.0,
      status: status || 'active',
    };

    db.paidCustomers.unshift(newCust);
    saveDatabase();
    res.status(201).json(newCust);
  });

  // UPDATE / EDIT (კორექტირება) Customer - Admin Only
  app.put('/api/customers/:id', (req, res) => {
    const { id } = req.params;
    const { plateNumber, driverName, phone, validUntil, amountPaid, status } = req.body;

    const index = db.paidCustomers.findIndex((c) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'მომხმარებელი ვერ მოიძებნა' });
    }

    db.paidCustomers[index] = {
      ...db.paidCustomers[index],
      plateNumber: plateNumber ? String(plateNumber).toUpperCase().trim() : db.paidCustomers[index].plateNumber,
      driverName: driverName ? String(driverName).trim() : db.paidCustomers[index].driverName,
      phone: phone !== undefined ? String(phone).trim() : db.paidCustomers[index].phone,
      validUntil: validUntil || db.paidCustomers[index].validUntil,
      amountPaid: amountPaid !== undefined ? Number(amountPaid) : db.paidCustomers[index].amountPaid,
      status: status || db.paidCustomers[index].status,
    };

    saveDatabase();
    res.json(db.paidCustomers[index]);
  });

  // DELETE Customer - Admin Only
  app.delete('/api/customers/:id', (req, res) => {
    const { id } = req.params;
    const initialLen = db.paidCustomers.length;
    db.paidCustomers = db.paidCustomers.filter((c) => c.id !== id);

    if (db.paidCustomers.length === initialLen) {
      return res.status(404).json({ error: 'მომხმარებელი ვერ მოიძებნა' });
    }

    saveDatabase();
    res.json({ success: true, message: 'მომხმარებელი წარმატებით წაიშალა' });
  });

  // ==================== TICKETS ====================
  app.get('/api/tickets', (req, res) => {
    res.json(db.tickets);
  });

  app.post('/api/tickets', (req, res) => {
    const ticket = req.body;
    db.tickets.unshift(ticket);
    saveDatabase();
    res.status(201).json(ticket);
  });

  app.put('/api/tickets/:id', (req, res) => {
    const { id } = req.params;
    const index = db.tickets.findIndex((t) => t.ticketId === id);
    if (index === -1) {
      return res.status(404).json({ error: 'ბილეთი ვერ მოიძებნა' });
    }
    db.tickets[index] = { ...db.tickets[index], ...req.body };
    saveDatabase();
    res.json(db.tickets[index]);
  });

  app.delete('/api/tickets/:id', (req, res) => {
    const { id } = req.params;
    db.tickets = db.tickets.filter((t) => t.ticketId !== id);
    saveDatabase();
    res.json({ success: true });
  });

  // ==================== SPOTS ====================
  app.get('/api/spots', (req, res) => {
    res.json(db.spots);
  });

  app.put('/api/spots/:id', (req, res) => {
    const { id } = req.params;
    const index = db.spots.findIndex((s) => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'ადგილი ვერ მოიძებნა' });
    }
    db.spots[index] = { ...db.spots[index], ...req.body };
    saveDatabase();
    res.json(db.spots[index]);
  });

  // ==================== ACTIVITY LOGS ====================
  app.get('/api/logs', (req, res) => {
    res.json(db.vehicleLogs);
  });

  app.post('/api/logs', (req, res) => {
    const log = req.body;
    db.vehicleLogs.unshift(log);
    saveDatabase();
    res.status(201).json(log);
  });

  // ==================== PRICING TIERS & CONFIG ====================
  app.get('/api/pricing', (req, res) => {
    res.json({
      tiers: db.pricingTiers,
      config: (db as any).pricingConfig || {
        hourlyRate: 1.0,
        hourlyHours: 1,
        packageHours: 3,
        packageRate: 2.0,
        threeHourRate: 2.0,
        dailyHours: 24,
        dailyRate: 5.0,
        dailyThresholdHours: 12,
      },
    });
  });

  app.put('/api/pricing', (req, res) => {
    const { tiers, config } = req.body;
    if (Array.isArray(tiers)) {
      db.pricingTiers = tiers;
    }
    if (config) {
      const pkgHours = Number(config.packageHours) || Number(config.threeHourHours) || 3;
      const pkgRate = Number(config.packageRate) || Number(config.threeHourRate) || 2.0;

      (db as any).pricingConfig = {
        hourlyRate: Number(config.hourlyRate) || 1.0,
        hourlyHours: Number(config.hourlyHours) || 1,
        packageHours: pkgHours,
        packageRate: pkgRate,
        threeHourRate: pkgRate,
        threeHourHours: pkgHours,
        dailyHours: Number(config.dailyHours) || 24,
        dailyRate: Number(config.dailyRate) || 5.0,
        dailyThresholdHours: Number(config.dailyThresholdHours) || 12,
      };
    }
    saveDatabase();
    res.json({
      tiers: db.pricingTiers,
      config: (db as any).pricingConfig,
      message: 'ტარიფები წარმატებით განახლდა',
    });
  });

  // ==================== GATE EMERGENCY OVERRIDE CONTROLS ====================
  app.post('/api/gate/override', (req, res) => {
    const { gateId, action } = req.body; // gateId: 'A' | 'B' | 'all', action: 'force_open' | 'force_close' | 'emergency_lock'
    const timestamp = new Date().toISOString();

    const log = {
      id: `override-${Date.now()}`,
      direction: action === 'force_open' ? 'entry' : 'exit',
      spotId: gateId === 'all' ? 'A' : (gateId || 'B'),
      plateNumber: 'ADMIN-OVERRIDE',
      driverName: 'ადმინისტრატორი (გადაუდებელი მართვა)',
      category: 'guest',
      timestamp,
      notes: `შლაგბაუმის გადაუდებელი მართვა: ${action} (${gateId})`,
    };
    db.vehicleLogs.unshift(log);
    saveDatabase();

    res.json({
      success: true,
      gateId,
      action,
      timestamp,
      message: `შლაგბაუმი ${gateId}: ოპერაცია '${action}' წარმატებით შესრულდა`,
    });
  });

  // Reset database to initial seed
  app.post('/api/admin/reset', (req, res) => {
    db = JSON.parse(JSON.stringify(defaultDb));
    saveDatabase();
    res.json({ success: true, message: 'მონაცემთა ბაზა წარმატებით განულდა საწყის მდგომარეობაზე' });
  });

  // ==========================================
  // VITE / STATIC SERVING
  // ==========================================
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
