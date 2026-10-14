/**
 * Driver & Customer Registry for License Plate Auto-Lookup
 * Automatically saves customer and employee names upon booking or entry
 * and matches plates when staff types or scans them.
 */

export interface DriverProfile {
  plateNumber: string;
  fullName: string;
  phone?: string;
  category: 'employee' | 'paid_customer' | 'online_booking' | 'on_site';
  lastSeen?: string;
  notes?: string;
}

const STORAGE_KEY = 'smartpark_driver_profiles_v1';

// Initial pre-registered drivers for demo & seamless experience
const DEFAULT_PROFILES: DriverProfile[] = [
  {
    plateNumber: 'GE-482-TB',
    fullName: 'ლევან მაისურაძე',
    phone: '+995 591 00 11 22',
    category: 'paid_customer',
    notes: 'რეგისტრირებული მომხმარებელი',
  },
  {
    plateNumber: 'VIP-999-GE',
    fullName: 'ანნა კალანდაძე',
    phone: '+995 593 33 44 55',
    category: 'paid_customer',
    notes: 'VIP მომხმარებელი',
  },
  {
    plateNumber: 'EMP-777-GE',
    fullName: 'დავით კობახიძე',
    phone: '+995 599 11 22 33',
    category: 'employee',
    notes: 'თანამშრომელი (მენეჯმენტი)',
  },
  {
    plateNumber: 'AA-100-BB',
    fullName: 'ნინო ბერიძე',
    phone: '+995 577 44 55 66',
    category: 'employee',
    notes: 'თანამშრომელი (ფინანსები)',
  },
  {
    plateNumber: 'TB-001-ST',
    fullName: 'გიორგი ჩხეიძე',
    phone: '+995 595 77 88 99',
    category: 'employee',
    notes: 'თანამშრომელი (IT უსაფრთხოება)',
  },
  {
    plateNumber: 'TB-890-XX',
    fullName: 'დავით ჯაფარიძე',
    phone: '+995 577 88 99 00',
    category: 'on_site',
    notes: 'ადგილზე ბილეთი #TKT-712403',
  },
  {
    plateNumber: 'KA-332-GE',
    fullName: 'გიორგი ცინცაძე',
    phone: '+995 598 44 55 66',
    category: 'on_site',
    notes: 'ადგილზე ბილეთი #TKT-551980',
  },
];

// Helper to normalize plate for matching: "ge-482-tb" -> "GE482TB"
export function normalizePlate(plate: string): string {
  return plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase().trim();
}

// Get all stored profiles
export function getAllDriverProfiles(): DriverProfile[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse driver profiles', e);
  }
  return DEFAULT_PROFILES;
}

// Save or update a driver profile
export function saveDriverProfile(profile: Omit<DriverProfile, 'lastSeen'> & { lastSeen?: string }): DriverProfile {
  const all = getAllDriverProfiles();
  const normalizedNew = normalizePlate(profile.plateNumber);

  const updatedProfile: DriverProfile = {
    ...profile,
    plateNumber: profile.plateNumber.toUpperCase().trim(),
    lastSeen: profile.lastSeen || new Date().toISOString(),
  };

  const existingIndex = all.findIndex((p) => normalizePlate(p.plateNumber) === normalizedNew);

  let updatedList: DriverProfile[];
  if (existingIndex >= 0) {
    updatedList = [...all];
    updatedList[existingIndex] = {
      ...updatedList[existingIndex],
      ...updatedProfile,
    };
  } else {
    updatedList = [updatedProfile, ...all];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (e) {
    // ignore
  }

  return updatedProfile;
}

// Lookup a driver by plate number (supports partial and exact matches)
export function lookupDriverByPlate(inputPlate: string): DriverProfile | null {
  const clean = normalizePlate(inputPlate);
  if (!clean || clean.length < 3) return null;

  const all = getAllDriverProfiles();

  // 1. Exact match first
  const exact = all.find((p) => normalizePlate(p.plateNumber) === clean);
  if (exact) return exact;

  // 2. Starts with / contains match if length >= 4
  if (clean.length >= 4) {
    const partial = all.find((p) => normalizePlate(p.plateNumber).includes(clean));
    if (partial) return partial;
  }

  return null;
}

// Search all matching drivers for autocomplete
export function searchDrivers(query: string): DriverProfile[] {
  const clean = normalizePlate(query);
  const rawClean = query.toLowerCase().trim();
  if (!clean && !rawClean) return [];

  const all = getAllDriverProfiles();
  return all.filter((p) => {
    const plateNorm = normalizePlate(p.plateNumber);
    const nameNorm = p.fullName.toLowerCase();
    const phoneNorm = (p.phone || '').replace(/\s/g, '');

    return (
      plateNorm.includes(clean) ||
      nameNorm.includes(rawClean) ||
      phoneNorm.includes(rawClean)
    );
  });
}
