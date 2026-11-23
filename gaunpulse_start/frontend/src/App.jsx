import { lazy, Suspense, useEffect, useState } from 'react';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import { navigationItems } from './data/demoData';
import { VillageSelectionProvider } from './context/VillageSelectionContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingSkeleton } from './components/ui';

const ActionPlansPage = lazy(() => import('./pages/ActionPlansPage'));
const AIAgentPage = lazy(() => import('./pages/AIAgentPage'));
const CommunityVoicesPage = lazy(() => import('./pages/CommunityVoicesPage'));
const IssuesPage = lazy(() => import('./pages/IssuesPage'));
const SimulationsPage = lazy(() => import('./pages/SimulationsPage'));
const VillageMapPage = lazy(() => import('./pages/VillageMapPage'));
const VillageDataPage = lazy(() => import('./pages/VillageDataPage'));
const ReportsInsightsPage = lazy(() => import('./pages/ReportsInsightsPage'));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const ProfileSettingsPage = lazy(() => import('./pages/ProfileSettingsPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const CitizenPortal = lazy(() => import('./citizen/CitizenPortal'));

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

  if (activePage === 'citizen') {
    return (
      <Suspense fallback={<div style={{ padding: '32px' }}><LoadingSkeleton rows={6} height="52px" /></div>}>
        <CitizenPortal />
      </Suspense>
    );
  }

  const ActivePage = pages[activePage] || DashboardPage;

  return (
    <VillageSelectionProvider>
      <AppLayout activePage={activePage} onNavigate={navigate}>
        <Suspense fallback={<div style={{ padding: '24px' }}><LoadingSkeleton rows={6} height="52px" /></div>}>
          <ActivePage onNavigate={navigate} />
        </Suspense>
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
