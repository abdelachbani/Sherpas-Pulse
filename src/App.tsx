/**
 * src/App.tsx
 *
 * Sherpas Pulse - 100% Mobile-First Financial Diagnostic & Alignment Web App
 */

import { useState } from 'react';
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

  return (
    <div className="app-shell relative bg-slate-950 text-white" data-wrapped={isWrapped ? 'true' : undefined}>
      <a className="skip-link" href="#app-content">Skip to content</a>
      <header className="app-toolbar">
        <div className="app-toolbar-inner flex items-center justify-between">
          <Link className="app-wordmark" to="/" aria-label="Sherpas Pulse home">
            <img src="/brand/sherpas.svg" alt="Sherpas" width="104" height="30" />
            <span>Pulse</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowRationale(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-500 text-[11px] font-semibold text-slate-300 hover:text-white transition-all cursor-pointer mr-16 sm:mr-32"
            title="The Friday Decision Matrix: What we built vs what we ruled out"
          >
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Why Sherpas Pulse?</span>
            <span className="sm:hidden">Why Pulse?</span>
          </button>
        </div>
      </header>

      {/* Floating Demo Day Pitch HUD */}
      <DemoPitchHUD />

      {/* Friday Decision Matrix Rationale Modal */}
      <FridayDecisionMatrixModal
        isOpen={showRationale}
        onClose={() => setShowRationale(false)}
      />

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
          <Route path="/case/:caseId/advisor" element={<AdvisorDashboardPage />} />
        </Routes>
      </div>
      {!isWrapped && <CalibrationBanner />}
    </div>
  );
}
