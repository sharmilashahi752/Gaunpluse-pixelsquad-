import { useEffect, useState } from 'react';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import {
  ActionPlansPage,
  AIAgentPage,
  CommunityVoicesPage,
  IssuesAlertsPage,
  ReportsInsightsPage,
  SimulationsPage,
  VillageDataPage,
  VillageMapPage,
} from './pages/ModulePages';
import { navigationItems } from './data/demoData';

const pages = {
  dashboard: DashboardPage,
  'village-map': VillageMapPage,
  'issues-alerts': IssuesAlertsPage,
  simulations: SimulationsPage,
  'action-plans': ActionPlansPage,
  'community-voices': CommunityVoicesPage,
  'reports-insights': ReportsInsightsPage,
  'ai-agent': AIAgentPage,
  'village-data': VillageDataPage,
};

const validPages = new Set(navigationItems.map(({ id }) => id));
const getPageFromHash = () => {
  const value = window.location.hash.replace('#/', '');
  return validPages.has(value) ? value : 'dashboard';
};

export default function App() {
  const [activePage, setActivePage] = useState(getPageFromHash);

  useEffect(() => {
    const handleHashChange = () => setActivePage(getPageFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (page) => {
    if (!validPages.has(page)) return;
    window.location.hash = `/${page}`;
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ActivePage = pages[activePage] || DashboardPage;

  return (
    <AppLayout activePage={activePage} onNavigate={navigate}>
      <ActivePage onNavigate={navigate} />
    </AppLayout>
  );
}
