import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Lazy-load route components for optimized code-splitting and fast initial load
const MapPage = lazy(() => import('./pages/MapPage'));
const DemoPage = lazy(() => import('./pages/DemoPage'));
const IssuesPage = lazy(() => import('./pages/IssuesPage'));
const NoticesPage = lazy(() => import('./pages/NoticesPage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Core homepage loaded eagerly */}
        <Route index element={<HomePage />} />

        {/* Dynamic route modules with accessible suspense fallback */}
        <Route
          path="map"
          element={
            <Suspense fallback={<LoadingSpinner message="Loading Interactive Village Map..." />}>
              <MapPage />
            </Suspense>
          }
        />
        <Route
          path="demo"
          element={
            <Suspense fallback={<LoadingSpinner message="Loading Failure Simulator..." />}>
              <DemoPage />
            </Suspense>
          }
        />
        <Route
          path="issues"
          element={
            <Suspense fallback={<LoadingSpinner message="Loading Community Issues..." />}>
              <IssuesPage />
            </Suspense>
          }
        />
        <Route
          path="notices"
          element={
            <Suspense fallback={<LoadingSpinner message="Loading Public Notices..." />}>
              <NoticesPage />
            </Suspense>
          }
        />
        <Route
          path="insights"
          element={
            <Suspense fallback={<LoadingSpinner message="Loading Infrastructure Insights..." />}>
              <InsightsPage />
            </Suspense>
          }
        />
        <Route
          path="about"
          element={
            <Suspense fallback={<LoadingSpinner message="Loading Project Mission..." />}>
              <AboutPage />
            </Suspense>
          }
        />
        <Route
          path="privacy"
          element={
            <Suspense fallback={<LoadingSpinner message="Loading Privacy Policy..." />}>
              <PrivacyPage />
            </Suspense>
          }
        />
        <Route
          path="terms"
          element={
            <Suspense fallback={<LoadingSpinner message="Loading Terms of Use..." />}>
              <TermsPage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<LoadingSpinner message="Page Not Found..." />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
