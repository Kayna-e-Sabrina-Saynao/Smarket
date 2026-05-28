import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  useCallback,
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { auth } from "../../firebaseConfig";
import { useSubscription } from "@/src/context/subscription-context";
import { updateUserAppPreferences } from "@/src/services/subscriptionService";

const STORAGE_KEY_PREFIX = "smarket:selected-cycle";
const MESES = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

type CycleContextValue = {
  currentMonth: number;
  currentYear: number;
  cycleLoading: boolean;
  cycleUpdating: boolean;
  setCurrentMonth: (month: number) => Promise<void>;
  setCurrentYear: (year: number) => Promise<void>;
  getCurrentCycle: () => {
    month: number;
    year: number;
    monthLabel: string;
    fullLabel: string;
  };
};

const CycleContext = createContext<CycleContextValue | undefined>(undefined);

const getStorageKey = (uid?: string | null) => `${STORAGE_KEY_PREFIX}:${uid ?? "guest"}`;

const clampMonth = (month: number) => {
  if (month < 0) {
    return 0;
  }

  if (month > 11) {
    return 11;
  }

  return month;
};

const normalizeYear = (year: number) => {
  if (!Number.isInteger(year) || year < 2020) {
    return new Date().getFullYear();
  }

  return year;
};

export function CycleProvider({ children }: { children: ReactNode }) {
  const { subscription } = useSubscription();
  const initialMonth = new Date().getMonth();
  const initialYear = new Date().getFullYear();
  const [currentMonth, setCurrentMonthState] = useState(initialMonth);
  const [currentYear, setCurrentYearState] = useState(initialYear);
  const [cycleLoading, setCycleLoading] = useState(true);
  const [cycleUpdating, setCycleUpdating] = useState(false);

  useEffect(() => {
    let ativo = true;

    const loadCycle = async () => {
      setCycleLoading(true);
      const uid = auth.currentUser?.uid ?? null;

      try {
        const local = await AsyncStorage.getItem(getStorageKey(uid));

        if (local) {
          const parsed = JSON.parse(local) as { month?: number; year?: number };

          if (!ativo) {
            return;
          }

          setCurrentMonthState(clampMonth(parsed.month ?? initialMonth));
          setCurrentYearState(normalizeYear(parsed.year ?? initialYear));
          setCycleLoading(false);
          return;
        }

        if (!ativo) {
          return;
        }

        setCurrentMonthState(clampMonth(subscription?.selectedCycleMonth ?? initialMonth));
        setCurrentYearState(normalizeYear(subscription?.selectedCycleYear ?? initialYear));
      } catch {
        if (!ativo) {
          return;
        }

        setCurrentMonthState(clampMonth(subscription?.selectedCycleMonth ?? initialMonth));
        setCurrentYearState(normalizeYear(subscription?.selectedCycleYear ?? initialYear));
      } finally {
        if (ativo) {
          setCycleLoading(false);
        }
      }
    };

    loadCycle();

    return () => {
      ativo = false;
    };
  }, [initialMonth, initialYear, subscription?.selectedCycleMonth, subscription?.selectedCycleYear]);

  const persistCycle = useCallback(async (month: number, year: number) => {
    const uid = auth.currentUser?.uid ?? null;
    const normalizedMonth = clampMonth(month);
    const normalizedYearValue = normalizeYear(year);

    await AsyncStorage.setItem(
      getStorageKey(uid),
      JSON.stringify({
        month: normalizedMonth,
        year: normalizedYearValue,
      })
    );

    if (uid) {
      await updateUserAppPreferences(uid, {
        selectedCycleMonth: normalizedMonth,
        selectedCycleYear: normalizedYearValue,
      });
    }
  }, []);

  const setCurrentMonth = useCallback(async (month: number) => {
    const normalizedMonth = clampMonth(month);

    if (normalizedMonth === currentMonth) {
      return;
    }

    setCycleUpdating(true);
    setCurrentMonthState(normalizedMonth);

    try {
      await persistCycle(normalizedMonth, currentYear);
    } finally {
      setCycleUpdating(false);
    }
  }, [currentMonth, currentYear, persistCycle]);

  const setCurrentYear = useCallback(async (year: number) => {
    const normalizedYearValue = normalizeYear(year);

    if (normalizedYearValue === currentYear) {
      return;
    }

    setCycleUpdating(true);
    setCurrentYearState(normalizedYearValue);

    try {
      await persistCycle(currentMonth, normalizedYearValue);
    } finally {
      setCycleUpdating(false);
    }
  }, [currentMonth, currentYear, persistCycle]);

  const value = useMemo<CycleContextValue>(
    () => ({
      currentMonth,
      currentYear,
      cycleLoading,
      cycleUpdating,
      setCurrentMonth,
      setCurrentYear,
      getCurrentCycle: () => ({
        month: currentMonth,
        year: currentYear,
        monthLabel: MESES[currentMonth],
        fullLabel: `${MESES[currentMonth]} ${currentYear}`,
      }),
    }),
    [currentMonth, currentYear, cycleLoading, cycleUpdating, setCurrentMonth, setCurrentYear]
  );

  return <CycleContext.Provider value={value}>{children}</CycleContext.Provider>;
}

export function useCycle() {
  const context = useContext(CycleContext);

  if (!context) {
    throw new Error("useCycle must be used within CycleProvider");
  }

  return context;
}
