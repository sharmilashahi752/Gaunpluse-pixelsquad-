import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import DemoPage from './pages/DemoPage';
import IssuesPage from './pages/IssuesPage';
import NoticesPage from './pages/NoticesPage';
import InsightsPage from './pages/InsightsPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="demo" element={<DemoPage />} />
        <Route path="issues" element={<IssuesPage />} />
        <Route path="notices" element={<NoticesPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
