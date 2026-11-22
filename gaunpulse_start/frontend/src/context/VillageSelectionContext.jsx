import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cachedFetchJson, invalidateApiCache } from '../utils/apiCache';

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
  const [villages, setVillages] = useState([]);
  const [loadingVillages, setLoadingVillages] = useState(true);

  const fetchVillages = useCallback(async (force = false) => {
    try {
      if (force) invalidateApiCache('api/villages');
      const data = await cachedFetchJson('http://127.0.0.1:8000/api/villages', {}, {
        force,
        ttlMs: 120000,
        onBackgroundUpdate: (fresh) => {
          if (Array.isArray(fresh)) setVillages(fresh);
        },
      });
      if (Array.isArray(data)) {
        setVillages(data);
      }
    } catch (err) {
      console.error('Failed to load global villages list:', err);
    } finally {
      setLoadingVillages(false);
    }
  }, []);

  useEffect(() => {
    fetchVillages();
  }, [fetchVillages]);

  const selectedVillage = useMemo(() => {
    if (!villages || villages.length === 0) return null;
    const found = villages.find((v) => Number(v.id) === Number(selectedVillageId));
    return found || villages[0];
  }, [villages, selectedVillageId]);

  // Ensure selectedVillageId defaults to first valid village if unselected or invalid
  useEffect(() => {
    if (villages.length > 0) {
      const exists = villages.some((v) => Number(v.id) === Number(selectedVillageId));
      if (!exists) {
        setSelectedVillageIdState(villages[0].id);
      }
    }
  }, [villages, selectedVillageId]);

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

  const refreshVillages = useCallback(async () => {
    return fetchVillages(true);
  }, [fetchVillages]);

  const value = useMemo(
    () => ({
      selectedVillageId: selectedVillage?.id ?? selectedVillageId,
      selectedVillage,
      setSelectedVillageId,
      villages,
      setVillages,
      loadingVillages,
      refreshVillages,
    }),
    [selectedVillage, selectedVillageId, setSelectedVillageId, villages, loadingVillages, refreshVillages]
  );

  return <VillageSelectionContext.Provider value={value}>{children}</VillageSelectionContext.Provider>;
}

export function useVillageSelection() {
  const context = useContext(VillageSelectionContext);
  if (!context) {
    throw new Error('useVillageSelection must be used inside VillageSelectionProvider.');
  }
  return context;
}
