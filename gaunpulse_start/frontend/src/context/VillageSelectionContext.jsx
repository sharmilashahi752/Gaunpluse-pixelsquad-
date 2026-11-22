import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cachedFetchJson, invalidateApiCache } from '../utils/apiCache';

const STORAGE_KEY = 'gaunpulse.selectedVillageId';
const VillageSelectionContext = createContext(null);
const API_BASE = import.meta.env.VITE_API_URL !== undefined ? `${import.meta.env.VITE_API_URL}/api` : '/api';

function readPersistedVillageId() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return null;
    if (value === 'demo-sundar-gaun') return value;
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
      const data = await cachedFetchJson(`${API_BASE}/villages`, {}, {
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
    if (selectedVillageId === 'demo-sundar-gaun') {
      return {
        id: 'demo-sundar-gaun',
        name: 'Sundar Gaun (सुन्दर गाउँ)',
        municipality: 'Mid-Hills Demonstration Valley',
        ward_no: '3 & 4',
        district: 'Bagmati Demonstration Area',
        province: 'Bagmati Province',
        center_lat: 27.8852,
        center_lng: 85.3448,
        is_demo: true,
      };
    }
    if (!villages || villages.length === 0) return null;
    const found = villages.find((v) => Number(v.id) === Number(selectedVillageId));
    return found || villages[0];
  }, [villages, selectedVillageId]);

  // Ensure selectedVillageId defaults to first valid village if unselected or invalid
  useEffect(() => {
    if (villages.length > 0 && selectedVillageId !== 'demo-sundar-gaun') {
      const exists = villages.some((v) => Number(v.id) === Number(selectedVillageId));
      if (!exists) {
        setSelectedVillageIdState(villages[0].id);
      }
    }
  }, [villages, selectedVillageId]);

  const setSelectedVillageId = useCallback((value) => {
    if (value === 'demo-sundar-gaun') {
      setSelectedVillageIdState('demo-sundar-gaun');
      try {
        window.localStorage.setItem(STORAGE_KEY, 'demo-sundar-gaun');
      } catch {
        // Persistence optional
      }
      return;
    }
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
