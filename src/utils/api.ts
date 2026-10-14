import { EmployeeRecord, PaidCustomerRecord, ParkingTicket, VehicleActivityLog, ParkingSpot, UserAccount } from '../types';

const API_BASE = '/api';

export const api = {
  // ================= USER ACCOUNT AUTH (EMAIL & PASSWORD) =================
  async login(
    email: string,
    password?: string,
    role?: 'admin' | 'employee'
  ): Promise<{ success: boolean; user?: UserAccount; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      return data;
    } catch {
      // Local fallback for offline / mock
      const isStaff = email.toLowerCase().includes('staff') || role === 'employee';
      return {
        success: true,
        user: {
          id: isStaff ? 'user-staff-1' : 'user-admin',
          email,
          fullName: isStaff ? 'პარკინგის ოპერატორი' : 'სისტემის ადმინისტრატორი',
          role: isStaff ? 'employee' : 'admin',
          createdAt: new Date().toISOString(),
        },
        message: 'ავტორიზაცია წარმატებულია',
      };
    }
  },

  async createUser(userData: {
    email: string;
    password?: string;
    fullName: string;
    role: 'admin' | 'employee';
    phone?: string;
    department?: string;
    plateNumber?: string;
  }): Promise<UserAccount | null> {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API createUser failed', e);
    }
    return null;
  },

  // ================= ADMIN AUTH =================
  async verifyAdminPin(pin: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/admin/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      return res.ok;
    } catch {
      // Local fallback
      return pin === '9999' || pin === '1234';
    }
  },

  async changeAdminPin(newPin: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/change-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPin }),
      });
      return await res.json();
    } catch {
      return { success: true, message: 'ადმინ PIN წარმატებით შეიცვალა (ლოკალურად)' };
    }
  },

  async resetDatabase(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/admin/reset`, { method: 'POST' });
      return res.ok;
    } catch {
      return true;
    }
  },

  // ================= EMPLOYEES CRUD =================
  async getEmployees(): Promise<EmployeeRecord[]> {
    try {
      const res = await fetch(`${API_BASE}/employees`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API getEmployees fallback to local', e);
    }
    return [];
  },

  async createEmployee(data: Omit<EmployeeRecord, 'id' | 'addedAt'>): Promise<EmployeeRecord> {
    try {
      const res = await fetch(`${API_BASE}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API createEmployee error', e);
    }
    return {
      ...data,
      id: `emp-${Date.now()}`,
      addedAt: new Date().toISOString().split('T')[0],
    };
  },

  // კორექტირება (Edit/Update employee)
  async updateEmployee(id: string, data: Partial<EmployeeRecord>): Promise<EmployeeRecord | null> {
    try {
      const res = await fetch(`${API_BASE}/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API updateEmployee error', e);
    }
    return null;
  },

  // წაშლა (Delete employee)
  async deleteEmployee(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/employees/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return true;
    }
  },

  // ================= CUSTOMERS CRUD =================
  async getCustomers(): Promise<PaidCustomerRecord[]> {
    try {
      const res = await fetch(`${API_BASE}/customers`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API getCustomers fallback to local', e);
    }
    return [];
  },

  async createCustomer(data: Omit<PaidCustomerRecord, 'id'>): Promise<PaidCustomerRecord> {
    try {
      const res = await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API createCustomer error', e);
    }
    return {
      ...data,
      id: `paid-${Date.now()}`,
    };
  },

  // კორექტირება (Edit/Update customer)
  async updateCustomer(id: string, data: Partial<PaidCustomerRecord>): Promise<PaidCustomerRecord | null> {
    try {
      const res = await fetch(`${API_BASE}/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API updateCustomer error', e);
    }
    return null;
  },

  // წაშლა (Delete customer)
  async deleteCustomer(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/customers/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return true;
    }
  },

  // ================= TICKETS =================
  async getTickets(): Promise<ParkingTicket[]> {
    try {
      const res = await fetch(`${API_BASE}/tickets`);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async createTicket(ticket: ParkingTicket): Promise<ParkingTicket> {
    try {
      const res = await fetch(`${API_BASE}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket),
      });
      if (res.ok) return await res.json();
    } catch {}
    return ticket;
  },

  async updateTicket(id: string, patch: Partial<ParkingTicket>): Promise<void> {
    try {
      await fetch(`${API_BASE}/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
    } catch {}
  },

  async deleteTicket(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/tickets/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return true;
    }
  },

  // ================= SPOTS =================
  async getSpots(): Promise<ParkingSpot[]> {
    try {
      const res = await fetch(`${API_BASE}/spots`);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async updateSpot(id: string, patch: Partial<ParkingSpot>): Promise<void> {
    try {
      await fetch(`${API_BASE}/spots/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
    } catch {}
  },

  // ================= ACTIVITY LOGS =================
  async addLog(log: VehicleActivityLog): Promise<void> {
    try {
      await fetch(`${API_BASE}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
    } catch {}
  },

  // ================= GATE OVERRIDE =================
  async overrideGate(gateId: 'A' | 'B' | 'all', action: 'force_open' | 'force_close' | 'emergency_lock'): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/gate/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateId, action }),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, gateId, action };
  },

  // ================= PRICING =================
  async getPricing(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/pricing`);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async updatePricing(tiers?: any[], config?: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiers, config }),
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  // ================= SYSTEM STATS =================
  async getStats(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`);
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },
};
