import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'gaunpulse.selectedVillageId';
const VillageSelectionContext = createContext(null);

function readPersistedVillageId() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    const villageId = Number(value);
    return Number.isInteger(villageId) && villageId > 0 ? villageId : null;
  } catch {
    return null;
  }
}

export function VillageSelectionProvider({ children }) {
  const [selectedVillageId, setSelectedVillageIdState] = useState(readPersistedVillageId);

  const setSelectedVillageId = useCallback((value) => {
    const villageId = Number(value);
    const nextValue = Number.isInteger(villageId) && villageId > 0 ? villageId : null;
    setSelectedVillageIdState(nextValue);
    try {
      if (nextValue === null) {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, String(nextValue));
      }
    } catch {
      // Persistence is optional when storage is unavailable or blocked.
    }
  }, []);

  const value = useMemo(() => ({ selectedVillageId, setSelectedVillageId }), [selectedVillageId, setSelectedVillageId]);

  return <VillageSelectionContext.Provider value={value}>{children}</VillageSelectionContext.Provider>;
}

export function useVillageSelection() {
  const context = useContext(VillageSelectionContext);
  if (!context) {
    throw new Error('useVillageSelection must be used inside VillageSelectionProvider.');
  }
  return context;
}
