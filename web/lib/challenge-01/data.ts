export interface Plan {
  name: string;
  monthly_premium: number;
  annual_limit: number;
  benefits: {
    outpatient: { limit_per_visit: number; visits_per_year: number };
    inpatient: { limit_per_day: number; days_per_year: number };
    dental: { limit_per_year: number } | null;
    maternity: { limit_per_pregnancy: number } | null;
  };
  copay_percentage: number;
  waiting_period_days: number;
  highlights: string[];
}

export const plans: Plan[] = [
  {
    name: "Bronze",
    monthly_premium: 150,
    annual_limit: 500_000,
    benefits: {
      outpatient: { limit_per_visit: 3_000, visits_per_year: 30 },
      inpatient: { limit_per_day: 10_000, days_per_year: 60 },
      dental: null,
      maternity: null,
    },
    copay_percentage: 20,
    waiting_period_days: 30,
    highlights: ["Basic coverage", "No dental or maternity"],
  },
  {
    name: "Silver",
    monthly_premium: 350,
    annual_limit: 1_500_000,
    benefits: {
      outpatient: { limit_per_visit: 5_000, visits_per_year: 60 },
      inpatient: { limit_per_day: 25_000, days_per_year: 120 },
      dental: { limit_per_year: 30_000 },
      maternity: null,
    },
    copay_percentage: 10,
    waiting_period_days: 15,
    highlights: ["Includes dental", "Lower copay", "Higher limits"],
  },
  {
    name: "Gold",
    monthly_premium: 700,
    annual_limit: 5_000_000,
    benefits: {
      outpatient: { limit_per_visit: 10_000, visits_per_year: -1 },
      inpatient: { limit_per_day: 50_000, days_per_year: -1 },
      dental: { limit_per_year: 100_000 },
      maternity: { limit_per_pregnancy: 200_000 },
    },
    copay_percentage: 0,
    waiting_period_days: 0,
    highlights: ["Full coverage", "No copay", "No waiting period", "Unlimited visits"],
  },
];

export const RECOMMENDED = "Silver";

export function getBestIndex(values: number[], direction: "min" | "max"): number {
  return values.reduce((best, val, i) =>
    direction === "max" ? (val > values[best] ? i : best) : (val < values[best] ? i : best),
    0
  );
}

export const fmt = (n: number) => n.toLocaleString("en-US");
