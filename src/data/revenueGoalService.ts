import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getSystemCurrency,
  formatCurrencyAmount,
  formatCompactAmount,
  formatMoney,
} from './currencyService';

export interface RevenueGoal {
  annualGoal: number; // e.g. 1000000
  currentAmount: number; // e.g. 215420
  todayAmount: number; // e.g. 7540
  daysPassed: number; // e.g. 20
  totalDays: number; // e.g. 365
}

export const DEFAULT_GOAL: RevenueGoal = {
  annualGoal: 1000000,
  currentAmount: 215420,
  todayAmount: 7540,
  daysPassed: 20,
  totalDays: 365,
};

const STORAGE_KEY = 'ozostack_revenue_goal_v1';
const EVENT_NAME = 'ozostack-revenue-goal-changed';

export function formatCurrency(val: number, customSymbol?: string): string {
  return formatCurrencyAmount(val, customSymbol);
}

export function formatCompact(val: number, customSymbol?: string): string {
  return formatCompactAmount(val, customSymbol);
}

export { formatMoney };

export function loadRevenueGoal(): RevenueGoal {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.annualGoal === 'number' && parsed.annualGoal > 0) {
        return {
          ...DEFAULT_GOAL,
          ...parsed,
        };
      }
    }
  } catch {
    /* fallback */
  }
  return DEFAULT_GOAL;
}

export function saveRevenueGoal(annualGoal: number): RevenueGoal {
  const current = loadRevenueGoal();
  const validGoal = Math.max(1000, Math.round(annualGoal));
  const updated: RevenueGoal = {
    ...current,
    annualGoal: validGoal,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));
  } catch {
    /* storage quota fallback */
  }
  return updated;
}

/**
 * Reactive React hook to consume and update ARR & MRR goals across the entire application.
 */
export function useRevenueGoal() {
  const [goal, setGoal] = useState<RevenueGoal>(() => loadRevenueGoal());

  const refresh = useCallback(() => {
    setGoal(loadRevenueGoal());
  }, []);

  useEffect(() => {
    refresh();
    const handleCustomChange = () => refresh();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh();
    };

    window.addEventListener(EVENT_NAME, handleCustomChange);
    window.addEventListener('ozostack-currency-changed', handleCustomChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(EVENT_NAME, handleCustomChange);
      window.removeEventListener('ozostack-currency-changed', handleCustomChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refresh]);

  const updateGoal = useCallback((newAnnualGoal: number) => {
    const saved = saveRevenueGoal(newAnnualGoal);
    setGoal(saved);
  }, []);

  const updateMrrGoal = useCallback((newMrrGoal: number) => {
    const saved = saveRevenueGoal(newMrrGoal * 12);
    setGoal(saved);
  }, []);

  const computed = useMemo(() => {
    const annualGoal = goal.annualGoal;
    const mrrGoal = Math.round(annualGoal / 12);
    const dailyGoal = Math.round(annualGoal / goal.totalDays);
    const current = goal.currentAmount;
    const remaining = Math.max(0, annualGoal - current);
    const percentage = Math.min(100, Math.round((current / annualGoal) * 10000) / 100);

    return {
      annualGoal,
      mrrGoal,
      dailyGoal,
      current,
      remaining,
      percentage,
      formattedAnnualGoal: formatCurrency(annualGoal),
      compactAnnualGoal: formatCompact(annualGoal),
      formattedMrrGoal: formatCurrency(mrrGoal),
      compactMrrGoal: formatCompact(mrrGoal),
      formattedRemaining: formatCurrency(remaining),
      formattedCurrent: formatCurrency(current),
      formattedDailyGoal: formatCurrency(dailyGoal),
      thisMonthAchieved: `${formatCurrency(current)} / ${formatCurrency(mrrGoal)}`,
      todayAchieved: `${formatCurrency(goal.todayAmount)} / ${formatCurrency(dailyGoal)}`,
      daysPassed: `${goal.daysPassed} / ${goal.totalDays}`,
    };
  }, [goal]);

  return {
    goal,
    ...computed,
    updateGoal,
    updateMrrGoal,
    formatCurrency,
    formatCompact,
  };
}

