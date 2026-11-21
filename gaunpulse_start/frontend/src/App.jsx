import { useEffect, useState } from 'react';
import AppLayout from './layouts/AppLayout';
import ActionPlansPage from './pages/ActionPlansPage';
import CommunityVoicesPage from './pages/CommunityVoicesPage';
import DashboardPage from './pages/DashboardPage';
import IssuesPage from './pages/IssuesPage';
import SimulationsPage from './pages/SimulationsPage';
import VillageMapPage from './pages/VillageMapPage';
import {
  AIAgentPage,
  ReportsInsightsPage,
  VillageDataPage,
} from './pages/ModulePages';
import { navigationItems } from './data/demoData';

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
