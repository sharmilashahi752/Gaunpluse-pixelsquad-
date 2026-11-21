import { useEffect, useState } from 'react';
import AppLayout from './layouts/AppLayout';
import ActionPlansPage from './pages/ActionPlansPage';
import AIAgentPage from './pages/AIAgentPage';
import CommunityVoicesPage from './pages/CommunityVoicesPage';
import DashboardPage from './pages/DashboardPage';
import IssuesPage from './pages/IssuesPage';
import SimulationsPage from './pages/SimulationsPage';
import VillageMapPage from './pages/VillageMapPage';
import {
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
  const raw = window.location.hash.replace('#/', '').replace('#', '');
  const page = raw.split('?')[0].split('/')[0];
  return validPages.has(page) ? page : 'dashboard';
};

export default function App() {
  const [activePage, setActivePage] = useState(getPageFromHash);

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

  const ActivePage = pages[activePage] || DashboardPage;

  return (
    <AppLayout activePage={activePage} onNavigate={navigate}>
      <ActivePage onNavigate={navigate} />
    </AppLayout>
  );
}
