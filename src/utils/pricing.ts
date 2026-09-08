/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PricingTier {
  hours: number;
  label: string;
  price: number;
  badge?: string;
  isPopular?: boolean;
}

export const OFFICIAL_PRICING_TIERS: PricingTier[] = [
  {
    hours: 1,
    label: '1 საათი',
    price: 1.0,
    badge: 'საბაზისო ტარიფი',
  },
  {
    hours: 3,
    label: '3 საათი',
    price: 2.0,
    badge: 'საუკეთესო ფასი (-33%)',
    isPopular: true,
  },
  {
    hours: 24,
    label: '24 საათი (სრული დღე-ღამე)',
    price: 5.0,
    badge: 'დღიური პაკეტი (-79%)',
  },
];

/**
 * Calculates parking fee according to user specifications:
 * - 1 hour = 1 GEL
 * - 3 hours = 2 GEL
 * - 24 hours (full day) = 5 GEL
 */
export function calculateParkingPrice(hours: number): number {
  if (hours <= 0) return 0;

  // Exact tier matches
  if (hours === 1) return 1.0;
  if (hours === 2) return 1.5;
  if (hours === 3) return 2.0;
  if (hours > 3 && hours <= 6) return 3.0;
  if (hours > 6 && hours <= 12) return 4.0;
  if (hours >= 24) {
    const fullDays = Math.floor(hours / 24);
    const rem = hours % 24;
    let remPrice = 0;
    if (rem > 0) {
      if (rem <= 1) remPrice = 1.0;
      else if (rem <= 3) remPrice = 2.0;
      else if (rem <= 12) remPrice = 4.0;
      else remPrice = 5.0;
    }
    return fullDays * 5.0 + remPrice;
  }
  return 5.0;
}

export interface StayFeeCalculation {
  totalMinutes: number;
  hours: number;
  minutes: number;
  formattedDuration: string;
  amountDue: number;
  tierDescription: string;
}

export function calculateStayDurationAndFee(
  entryDate: string | Date,
  exitDate: string | Date = new Date()
): StayFeeCalculation {
  const start = new Date(entryDate).getTime();
  const end = new Date(exitDate).getTime();
  const diffMs = Math.max(60000, end - start); // minimum 1 minute

  const totalMinutes = Math.ceil(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let formattedDuration = '';
  if (hours > 0) {
    formattedDuration = `${hours} სთ ${minutes} წთ`;
  } else {
    formattedDuration = `${minutes} წუთი`;
  }

  let amountDue = 1.0;
  let tierDescription = '1 საათის ტარიფი (1.00 ₾)';

  if (totalMinutes <= 60) {
    amountDue = 1.0;
    tierDescription = '1 სთ ტარიფი (1.00 ₾)';
  } else if (totalMinutes <= 180) {
    amountDue = 2.0;
    tierDescription = '3 სთ შეღავათიანი ტარიფი (2.00 ₾)';
  } else if (totalMinutes <= 1440) {
    amountDue = 5.0;
    tierDescription = '24 სთ სრული დღიური ტარიფი (5.00 ₾)';
  } else {
    const billingHours = Math.ceil(totalMinutes / 60);
    amountDue = calculateParkingPrice(billingHours);
    tierDescription = `${billingHours} სთ კომბინირებული ტარიფი (${amountDue.toFixed(2)} ₾)`;
  }

  return {
    totalMinutes,
    hours,
    minutes,
    formattedDuration,
    amountDue,
    tierDescription,
  };
}

