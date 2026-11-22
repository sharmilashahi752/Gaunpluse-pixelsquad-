import { useEffect, useState } from 'react';
import AppLayout from './layouts/AppLayout';
import ActionPlansPage from './pages/ActionPlansPage';
import AIAgentPage from './pages/AIAgentPage';
import CommunityVoicesPage from './pages/CommunityVoicesPage';
import DashboardPage from './pages/DashboardPage';
import IssuesPage from './pages/IssuesPage';
import SimulationsPage from './pages/SimulationsPage';
import VillageMapPage from './pages/VillageMapPage';
import VillageDataPage from './pages/VillageDataPage';
import ReportsInsightsPage from './pages/ReportsInsightsPage';
import UserManagementPage from './pages/UserManagementPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import CitizenPortal from './citizen/CitizenPortal';
import { navigationItems } from './data/demoData';
import { VillageSelectionProvider } from './context/VillageSelectionContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const pages = {
  dashboard: DashboardPage,
  'village-map': VillageMapPage,
  'issues-alerts': IssuesPage,
  simulations: SimulationsPage,
  'action-plans': ActionPlansPage,
  'community-voices': CommunityVoicesPage,
  'reports-insights': ReportsInsightsPage,
  'ai-agent': AIAgentPage,
  'village-data': VillageDataPage,
  'user-management': UserManagementPage,
  'profile-settings': ProfileSettingsPage,
  'audit-logs': AuditLogsPage,
  citizen: CitizenPortal,
};

const validPages = new Set(navigationItems.map(({ id }) => id));
const getPageFromHash = () => {
  const raw = window.location.hash.replace('#/', '').replace('#', '');
  const page = raw.split('?')[0].split('/')[0];
  return validPages.has(page) ? page : 'dashboard';
};

function AppContent() {
  const [activePage, setActivePage] = useState(getPageFromHash);
  const { user, isCitizen, isAdmin, loading } = useAuth();

  useEffect(() => {
    const handleHashChange = () => setActivePage(getPageFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (target) => {
    const page = target.replace('#/', '').replace('#', '').split('?')[0].split('/')[0];
    if (!validPages.has(page)) return;
    const cleanTarget = target.startsWith('#/') ? target.slice(2) : (target.startsWith('/') ? target.slice(1) : target);
    window.location.hash = `/${cleanTarget}`;
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route Guard: enforce role-based access restrictions on route changes
  useEffect(() => {
    if (loading) return;

    // 1. Citizen accounts MUST stay in Citizen Portal; prevent URL manipulation to official pages
    if (user && isCitizen && activePage !== 'citizen') {
      console.warn(`[RouteGuard] Citizen accounts cannot access official workspace: ${activePage}. Redirecting to citizen portal.`);
      navigate('citizen');
      return;
    }

    // 2. Ward officers and unauthenticated visitors cannot access admin-only pages
    if (!isAdmin && (activePage === 'user-management' || activePage === 'audit-logs')) {
      console.warn(`[RouteGuard] Access to ${activePage} restricted to system/municipality administrators. Redirecting.`);
      navigate('dashboard');
    }
  }, [activePage, user, isCitizen, isAdmin, loading]);

  const handleSwitchToAdmin = () => {
    if (user && isCitizen) {
      alert('Your current account is a Citizen account. Official municipal administration workspaces require municipal official credentials.');
      return;
    }
    navigate('dashboard');
  };

  if (activePage === 'citizen') {
    return <CitizenPortal onSwitchToAdmin={handleSwitchToAdmin} />;
  }

  const ActivePage = pages[activePage] || DashboardPage;

  return (
    <VillageSelectionProvider>
      <AppLayout activePage={activePage} onNavigate={navigate}>
        <ActivePage onNavigate={navigate} />
      </AppLayout>
    </VillageSelectionProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
