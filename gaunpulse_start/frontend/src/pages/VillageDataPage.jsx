import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Building,
  CheckCircle2,
  Database,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { useVillageSelection } from '../context/VillageSelectionContext';
import VillageManagerHome from '../components/village-manager/VillageManagerHome';
import VillageDetailView from '../components/village-manager/VillageDetailView';
import AddVillageWizardModal from '../components/village-manager/AddVillageWizardModal';
import MapDataImportModal from '../components/village-manager/MapDataImportModal';
import { cachedFetchJson } from '../utils/apiCache';

const API_BASE = '/api';

export default function VillageDataPage() {
  const { selectedVillageId, setSelectedVillageId, villages: contextVillages, refreshVillages } = useVillageSelection();
  const [villages, setVillages] = useState(contextVillages || []);
  const [loading, setLoading] = useState(!contextVillages || contextVillages.length === 0);
  const [view, setView] = useState('home'); // 'home' | 'detail'
  const [activeVillage, setActiveVillage] = useState(null);
  const [alert, setAlert] = useState(null);

  // Sync context villages immediately if loaded
  useEffect(() => {
    if (contextVillages && contextVillages.length > 0) {
      setVillages(contextVillages);
      setLoading(false);
    }
  }, [contextVillages]);

  // Modals
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [draftToResume, setDraftToResume] = useState(null);
  const [targetImportVillage, setTargetImportVillage] = useState(null);

  // Load list of villages with caching
  const loadVillages = async (force = false) => {
    if (villages.length === 0) setLoading(true);
    try {
      const data = await cachedFetchJson(`${API_BASE}/villages`, {}, {
        force,
        ttlMs: 60000,
        onBackgroundUpdate: (fresh) => {
          if (Array.isArray(fresh)) {
            setVillages(fresh);
            if (activeVillage) {
              const freshActive = fresh.find((v) => v.id === activeVillage.id);
              if (freshActive) setActiveVillage(freshActive);
            }
          }
        },
      });
      const list = Array.isArray(data) ? data : [];
      setVillages(list);

      // If activeVillage exists, update it with fresh counts
      if (activeVillage) {
        const fresh = list.find((v) => v.id === activeVillage.id);
        if (fresh) setActiveVillage(fresh);
      }
    } catch (err) {
      console.error('Failed to load villages:', err);
      setAlert({ type: 'error', message: 'Could not load villages from database.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVillages();
  }, []);

  // Check URL hash params on mount (e.g. #/village-data?villageId=1)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('villageId=')) {
      const params = new URLSearchParams(hash.split('?')[1]);
      const vId = Number(params.get('villageId'));
      if (vId && villages.length > 0) {
        const match = villages.find((v) => v.id === vId);
        if (match) {
          handleOpenVillage(match);
        }
      }
    }
  }, [villages]);

  // Handle Opening a Village (from card or action)
  const handleOpenVillage = (village, initialTab = 'overview') => {
    if (village.status === 'draft') {
      // Resume Draft in Wizard
      setDraftToResume(village);
      setShowWizardModal(true);
      return;
    }
    setActiveVillage(village);
    setSelectedVillageId(village.id);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Returning to Directory Home
  const handleBackToHome = () => {
    setView('home');
    setActiveVillage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle New Village Created from Wizard
  const handleVillageCreated = async (newVillage) => {
    await loadVillages();
    setAlert({
      type: 'success',
      message: `🎉 Village "${newVillage.name}" successfully registered and activated!`,
    });
    if (newVillage.status !== 'draft') {
      setActiveVillage(newVillage);
      setSelectedVillageId(newVillage.id);
      setView('detail');
    }
  };

  return (
    <div className="page-stack">
      {/* Alert Banner */}
      {alert && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: alert.type === 'success' ? '#eaf8ef' : '#fdf2f2',
            border: `1px solid ${alert.type === 'success' ? '#176342' : '#b42318'}`,
            color: alert.type === 'success' ? '#092d22' : '#912018',
            fontSize: '13.5px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {alert.type === 'success' ? <CheckCircle2 size={18} color="#176342" /> : <AlertTriangle size={18} color="#b42318" />}
            <span>{alert.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlert(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main View: Home vs Detail */}
      {view === 'home' || !activeVillage ? (
        <VillageManagerHome
          villages={villages}
          loading={loading}
          onOpenAddWizard={() => {
            setDraftToResume(null);
            setShowWizardModal(true);
          }}
          onOpenVillage={handleOpenVillage}
          onOpenImportModal={(v) => {
            setTargetImportVillage(v || activeVillage || villages[0]);
            setShowImportModal(true);
          }}
          onRefresh={loadVillages}
        />
      ) : (
        <VillageDetailView
          village={activeVillage}
          onBack={handleBackToHome}
          onOpenImportModal={(v) => {
            setTargetImportVillage(v || activeVillage);
            setShowImportModal(true);
          }}
          onVillageUpdated={loadVillages}
        />
      )}

      {/* 4-Step Add Village Wizard Modal */}
      {showWizardModal && (
        <AddVillageWizardModal
          isOpen={showWizardModal}
          onClose={() => {
            setShowWizardModal(false);
            setDraftToResume(null);
          }}
          onVillageCreated={handleVillageCreated}
          initialDraft={draftToResume}
        />
      )}

      {/* Map Data Import Modal */}
      {showImportModal && (
        <MapDataImportModal
          isOpen={showImportModal}
          onClose={() => {
            setShowImportModal(false);
            setTargetImportVillage(null);
          }}
          villages={villages}
          activeVillage={targetImportVillage || activeVillage || villages[0]}
          onImportComplete={async () => {
            await loadVillages();
          }}
        />
      )}
    </div>
  );
}
