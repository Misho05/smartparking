import { useState, useEffect } from 'react';

export interface PricingConfig {
  hourlyRate: number; // e.g. 1.0 GEL (საბაზისო საათობრივი ტარიფი)
  hourlyHours: number; // e.g. 1 hour
  packageHours: number; // e.g. 3 hours (შეღავათიანი პაკეტის საათები — ადმინი ცვლის: 2, 3, 4, 5, 6 სთ და ა.შ.)
  packageRate: number; // e.g. 2.0 GEL (შეღავათიანი პაკეტის ფასი)
  dailyHours: number; // e.g. 24 hours (დღიური ტარიფის საათები)
  dailyRate: number; // e.g. 5.0 GEL (დღიური ტარიფის ფასი)
  dailyThresholdHours: number; // e.g. 12 hours (ზღვარი, რომლის გადაცილებისას ამოქმედდება დღიური ტარიფი)
  threeHourRate: number; // Backwards compatibility: always equals packageRate
  threeHourHours?: number;
}

export const PRICING_STORAGE_KEY = 'smartpark_pricing_config_v2';

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  hourlyRate: 1.0,
  hourlyHours: 1,
  packageHours: 3,
  packageRate: 2.0,
  dailyHours: 24,
  dailyRate: 5.0,
  dailyThresholdHours: 12,
  threeHourRate: 2.0,
  threeHourHours: 3,
};

/**
 * React hook to listen to real-time pricing changes configured by Admin
 */
export function usePricingConfig(): {
  config: PricingConfig;
  tiers: PricingTier[];
} {
  const [config, setConfig] = useState<PricingConfig>(() => getPricingConfig());

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<PricingConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
      } else {
        setConfig(getPricingConfig());
      }
    };
    window.addEventListener('smartpark:pricing-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('smartpark:pricing-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return {
    config,
    tiers: getPricingTiers(config),
  };
}

/**
 * Loads currently active pricing configuration from localStorage or defaults
 */
export function getPricingConfig(): PricingConfig {
  try {
    const saved = localStorage.getItem(PRICING_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const pkgHours =
        typeof parsed.packageHours === 'number' && parsed.packageHours > 0
          ? parsed.packageHours
          : typeof parsed.threeHourHours === 'number' && parsed.threeHourHours > 0
          ? parsed.threeHourHours
          : 3;
      const pkgRate =
        typeof parsed.packageRate === 'number' && parsed.packageRate > 0
          ? parsed.packageRate
          : typeof parsed.threeHourRate === 'number' && parsed.threeHourRate > 0
          ? parsed.threeHourRate
          : 2.0;

      return {
        hourlyRate: typeof parsed.hourlyRate === 'number' ? parsed.hourlyRate : 1.0,
        hourlyHours: typeof parsed.hourlyHours === 'number' && parsed.hourlyHours > 0 ? parsed.hourlyHours : 1,
        packageHours: pkgHours,
        packageRate: pkgRate,
        dailyHours: typeof parsed.dailyHours === 'number' && parsed.dailyHours > 0 ? parsed.dailyHours : 24,
        dailyRate: typeof parsed.dailyRate === 'number' ? parsed.dailyRate : 5.0,
        dailyThresholdHours: typeof parsed.dailyThresholdHours === 'number' ? parsed.dailyThresholdHours : 12,
        threeHourRate: pkgRate,
        threeHourHours: pkgHours,
      };
    }
  } catch {}
  return DEFAULT_PRICING_CONFIG;
}

/**
 * Saves pricing configuration and dispatches an update event
 */
export function savePricingConfig(config: PricingConfig): void {
  try {
    const enriched = {
      ...config,
      threeHourRate: config.packageRate,
      threeHourHours: config.packageHours,
    };
    localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(enriched));
    window.dispatchEvent(new CustomEvent('smartpark:pricing-updated', { detail: enriched }));
  } catch {}
}

/**
 * Formats short summary string of current tariffs (e.g. "1.00₾/1სთ • 2.00₾/3სთ • 5.00₾/24სთ")
 */
export function formatPricingSummary(config?: Partial<PricingConfig>): string {
  const cfg = { ...getPricingConfig(), ...config };
  const pkgHours = cfg.packageHours ?? cfg.threeHourHours ?? 3;
  const pkgRate = cfg.packageRate ?? cfg.threeHourRate ?? 2.0;
  const hHours = cfg.hourlyHours ?? 1;
  const dHours = cfg.dailyHours ?? 24;
  return `${cfg.hourlyRate}₾/${hHours}სთ • ${pkgRate}₾/${pkgHours}სთ • ${cfg.dailyRate}₾/${dHours}სთ`;
}

export interface PricingTier {
  hours: number;
  label: string;
  price: number;
  badge?: string;
  isPopular?: boolean;
}

/**
 * Returns dynamic pricing tiers based on active configuration
 */
export function getPricingTiers(customConfig?: Partial<PricingConfig>): PricingTier[] {
  const cfg = { ...getPricingConfig(), ...customConfig };
  const pkgHours = cfg.packageHours ?? cfg.threeHourHours ?? 3;
  const pkgRate = cfg.packageRate ?? cfg.threeHourRate ?? 2.0;
  const hHours = cfg.hourlyHours ?? 1;
  const dHours = cfg.dailyHours ?? 24;

  const normalCost = pkgHours * cfg.hourlyRate;
  const discountPercent =
    normalCost > pkgRate ? Math.round(((normalCost - pkgRate) / normalCost) * 100) : 0;

  return [
    {
      hours: hHours,
      label: `${hHours} საათი`,
      price: cfg.hourlyRate,
      badge: 'საბაზისო ტარიფი',
    },
    {
      hours: pkgHours,
      label: `${pkgHours} საათი`,
      price: pkgRate,
      badge: discountPercent > 0 ? `შეღავათიანი (-${discountPercent}%)` : 'პოპულარული პაკეტი',
      isPopular: true,
    },
    {
      hours: dHours,
      label: `${dHours} საათი (დღიური)`,
      price: cfg.dailyRate,
      badge: `მოქმედებს >${cfg.dailyThresholdHours} სთ-ის გადაცილებისას`,
    },
  ];
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
    label: '24 საათი (დღიური)',
    price: 5.0,
    badge: 'მოქმედებს >12 სთ-ის გადაცილებისას',
  },
];

/**
 * Calculates parking fee according to user-configured rates and hours:
 * - hourlyRate (e.g. 1 GEL / 1 hr)
 * - packageRate & packageHours (e.g. 2 GEL for 3 hrs, or 4 hrs, etc.)
 * - dailyRate & dailyHours (e.g. 5 GEL for 24 hrs) — triggered when hours > dailyThresholdHours
 */
export function calculateParkingPrice(
  hours: number,
  customConfig?: Partial<PricingConfig>
): number {
  if (hours <= 0) return 0;

  const config = { ...getPricingConfig(), ...customConfig };
  const { hourlyRate, dailyRate, dailyThresholdHours } = config;
  const pkgHours = config.packageHours ?? config.threeHourHours ?? 3;
  const pkgRate = config.packageRate ?? config.threeHourRate ?? 2.0;
  const dailyHours = config.dailyHours ?? 24;

  // Single day / period (up to dailyHours):
  if (hours <= dailyHours) {
    // თუ გადასცდა დაწესებულ ზღვარს (მაგ. > 12 საათი): მოქმედებს დღიური ტარიფი
    if (hours > dailyThresholdHours) {
      return dailyRate;
    }

    // თუ ზუსტად პაკეტის საათებია:
    if (hours === pkgHours) {
      return pkgRate;
    }

    // თუ პაკეტის საათებზე ნაკლებია:
    if (hours < pkgHours) {
      if (hours === 1) return hourlyRate;
      return Math.min(hours * hourlyRate, pkgRate);
    }

    // თუ პაკეტის საათებს აღემატება, მაგრამ ზღვარს არ გადასცილებია:
    const extraHours = hours - pkgHours;
    const combinedPrice = pkgRate + extraHours * hourlyRate;
    return Math.min(hours * hourlyRate, combinedPrice);
  }

  // dailyHours-ზე მეტი (მრავალდღიური დაყოვნება):
  const fullDays = Math.floor(hours / dailyHours);
  const remainingHours = hours % dailyHours;
  let remainingPrice = 0;

  if (remainingHours > 0) {
    if (remainingHours > dailyThresholdHours) {
      remainingPrice = dailyRate;
    } else if (remainingHours === pkgHours) {
      remainingPrice = pkgRate;
    } else if (remainingHours < pkgHours) {
      remainingPrice = Math.min(remainingHours * hourlyRate, pkgRate);
    } else {
      const extraHours = remainingHours - pkgHours;
      const combinedPrice = pkgRate + extraHours * hourlyRate;
      remainingPrice = Math.min(remainingHours * hourlyRate, combinedPrice);
    }
  }

  return fullDays * dailyRate + remainingPrice;
}

export interface StayFeeCalculation {
  totalMinutes: number;
  hours: number;
  minutes: number;
  formattedDuration: string;
  amountDue: number;
  tierDescription: string;
  isDailyCapApplied: boolean;
}

export function calculateStayDurationAndFee(
  entryDate: string | Date,
  exitDate: string | Date = new Date(),
  customConfig?: Partial<PricingConfig>
): StayFeeCalculation {
  const config = { ...getPricingConfig(), ...customConfig };
  const pkgHours = config.packageHours ?? config.threeHourHours ?? 3;
  const pkgRate = config.packageRate ?? config.threeHourRate ?? 2.0;
  const dailyHours = config.dailyHours ?? 24;
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

  const billingHours = Math.ceil(totalMinutes / 60);
  const amountDue = calculateParkingPrice(billingHours, config);
  const isDailyCapApplied = billingHours > config.dailyThresholdHours && billingHours <= dailyHours;

  let tierDescription = '';
  if (billingHours <= (config.hourlyHours || 1)) {
    tierDescription = `${config.hourlyHours || 1} სთ ტარიფი (${config.hourlyRate.toFixed(2)} ₾)`;
  } else if (billingHours <= pkgHours) {
    tierDescription = `${pkgHours} სთ შეღავათიანი პაკეტი (${amountDue.toFixed(2)} ₾)`;
  } else if (billingHours <= config.dailyThresholdHours) {
    tierDescription = `${billingHours} სთ საათობრივი ტარიფი (${amountDue.toFixed(2)} ₾ — ${dailyHours}სთ-ის ${config.dailyRate}₾ ამოქმედდება >${config.dailyThresholdHours}სთ-ზე)`;
  } else if (billingHours <= dailyHours) {
    tierDescription = `${dailyHours} სთ დღიური ტარიფი (${config.dailyRate.toFixed(2)} ₾ — გაცდა ${config.dailyThresholdHours} საათს)`;
  } else {
    tierDescription = `${billingHours} სთ კომბინირებული ტარიფი (${amountDue.toFixed(2)} ₾)`;
  }

  return {
    totalMinutes,
    hours,
    minutes,
    formattedDuration,
    amountDue,
    tierDescription,
    isDailyCapApplied,
  };
}
