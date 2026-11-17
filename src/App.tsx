/**
 * src/App.tsx
 *
 * Sherpas Pulse - 100% Mobile-First Financial Diagnostic & Alignment Web App
 */

import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import CaseSelectPage from './pages/CaseSelectPage';
import HouseholdEntryPage from './pages/HouseholdEntryPage';
import StoriesPage from './pages/StoriesPage';
import AllocationPage from './pages/AllocationPage';
import TradeoffPage from './pages/TradeoffPage';
import FamilySyncPage from './pages/FamilySyncPage';
import ActionPage from './pages/ActionPage';
import { CalibrationBanner } from './components/shared/CalibrationBanner';

export default function App() {
  return <BrowserRouter><ApplicationShell /></BrowserRouter>;
}

function ApplicationShell() {
  const { pathname } = useLocation();
  const isWrapped = /\/case\/[^/]+\/stories\/?$/.test(pathname);

  return (
    <div className="app-shell relative bg-slate-950 text-white" data-wrapped={isWrapped ? 'true' : undefined}>
      <a className="skip-link" href="#app-content">Skip to content</a>
      <header className="app-toolbar">
        <div className="app-toolbar-inner">
          <Link className="app-wordmark" to="/" aria-label="Sherpas Pulse home">
            <img src="/brand/sherpas.svg" alt="Sherpas" width="104" height="30" />
            <span>Pulse</span>
          </Link>
        </div>
      </header>

      <div id="app-content" className="app-content" tabIndex={-1}>
        <Routes>
          {/* Case Selection */}
          <Route path="/" element={<CaseSelectPage />} />

          {/* Household Entry (Partner selection for couples, intro for singles) */}
          <Route path="/case/:caseId" element={<HouseholdEntryPage />} />

          {/* The 6-Story Financial Wrapped */}
          <Route path="/case/:caseId/stories" element={<StoriesPage />} />

          {/* Tactile Cash Allocator (Couples) & Tradeoff Simulator (Singles) */}
          <Route path="/case/:caseId/allocate" element={<AllocationPage />} />
          <Route path="/case/:caseId/tradeoff" element={<TradeoffPage />} />

          {/* Family Sync Consensus (Agreements & Tie-Breakers) */}
          <Route path="/case/:caseId/sync" element={<FamilySyncPage />} />

          {/* 5-Minute Win & Advisor Pre-Meeting Telemetry */}
          <Route path="/case/:caseId/action" element={<ActionPage />} />
        </Routes>
      </div>
      {!isWrapped && <CalibrationBanner />}
    </div>
  );
}
