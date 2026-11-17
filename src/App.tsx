/**
 * src/App.tsx
 *
 * Sherpas Pulse - 100% Mobile-First Financial Diagnostic & Alignment Web App
 */

import { useLayoutEffect, useRef, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { Scale } from 'lucide-react';
import CaseSelectPage from './pages/CaseSelectPage';
import HouseholdEntryPage from './pages/HouseholdEntryPage';
import StoriesPage from './pages/StoriesPage';
import AllocationPage from './pages/AllocationPage';
import TradeoffPage from './pages/TradeoffPage';
import FamilySyncPage from './pages/FamilySyncPage';
import ActionPage from './pages/ActionPage';
import AdvisorDashboardPage from './pages/AdvisorDashboardPage';
import { CalibrationBanner } from './components/shared/CalibrationBanner';
import { DemoPitchHUD } from './components/shared/DemoPitchHUD';
import { FridayDecisionMatrixModal } from './components/shared/FridayDecisionMatrixModal';

export default function App() {
  return <BrowserRouter><ApplicationShell /></BrowserRouter>;
}

function ApplicationShell() {
  const { pathname } = useLocation();
  const isWrapped = /\/case\/[^/]+\/stories\/?$/.test(pathname);
  const [showRationale, setShowRationale] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="app-shell relative bg-slate-950 text-white" data-wrapped={isWrapped ? 'true' : undefined}>
      <a className="skip-link" href="#app-content">Skip to content</a>
      <header className="app-toolbar">
        <div className="app-toolbar-inner">
          <Link className="app-wordmark" to="/" aria-label="Sherpas Pulse home">
            <img src="/brand/sherpas.svg" alt="Sherpas" width="104" height="30" />
            <span>Pulse</span>
          </Link>

          {!isWrapped && <div className="app-toolbar-actions">
            <button type="button" className="app-rationale" onClick={() => setShowRationale(true)} aria-label="Why Sherpas Pulse?" aria-haspopup="dialog">
              <Scale size={17} aria-hidden="true" />
              <span className="hidden sm:inline">Why Sherpas Pulse?</span>
            </button>
            <DemoPitchHUD />
          </div>}
        </div>
      </header>

      {/* Friday Decision Matrix Rationale Modal */}
      <FridayDecisionMatrixModal
        isOpen={showRationale}
        onClose={() => setShowRationale(false)}
      />

      <div id="app-content" className="app-content" tabIndex={-1} ref={contentRef}>
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
          <Route path="/case/:caseId/advisor" element={<AdvisorDashboardPage />} />
        </Routes>
      </div>
      {!isWrapped && <CalibrationBanner />}
    </div>
  );
}
