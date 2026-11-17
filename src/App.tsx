/**
 * src/App.tsx
 *
 * Sherpas Pulse - 100% Mobile-First Financial Diagnostic & Alignment Web App
 * Includes optional Split-Screen projector mode for live stage demos.
 */

import { useState } from 'react';
import { useAppStore } from './stores/appStore';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import CaseSelectPage from './pages/CaseSelectPage';
import HouseholdEntryPage from './pages/HouseholdEntryPage';
import StoriesPage from './pages/StoriesPage';
import AllocationPage from './pages/AllocationPage';
import TradeoffPage from './pages/TradeoffPage';
import FamilySyncPage from './pages/FamilySyncPage';
import ActionPage from './pages/ActionPage';
import { SplitScreenToggle, type SplitMode, type SplitTarget } from './components/shared/SplitScreenToggle';
import { useDesktopLayout } from './components/shared/useDesktopLayout';
import { CalibrationBanner } from './components/shared/CalibrationBanner';

export default function App() {
  return <BrowserRouter><ApplicationShell /></BrowserRouter>;
}

function ApplicationShell() {
  const { pathname } = useLocation();
  const isWrapped = /\/case\/[^/]+\/stories\/?$/.test(pathname);
  const desktop = useDesktopLayout();
  const household = useAppStore((state) => state.currentCase?.financialHealth.case.household);
  const adults = household?.filter((member) => member.role === 'client' || member.role === 'co-client') ?? [];
  const [splitMode, setSplitMode] = useState<SplitMode>('single');
  const [splitTarget, setSplitTarget] = useState<SplitTarget>('advisor');

  return (
      <div className="app-shell relative bg-slate-950 text-white" data-wrapped={isWrapped ? 'true' : undefined}>
        {/* Live Projector Split Screen Toggle */}
        <a className="skip-link" href="#app-content">Skip to content</a>
        <header className="app-toolbar">
          <div className="app-toolbar-inner">
            <Link className="app-wordmark" to="/" aria-label="Sherpas Pulse home">
              <img src="/brand/sherpas.svg" alt="Sherpas" width="104" height="30" />
              <span>Pulse</span>
            </Link>
          <SplitScreenToggle
            mode={splitMode}
            onModeChange={setSplitMode}
            target={splitTarget}
            onTargetChange={setSplitTarget}
            partner1Name={adults[0]?.first_name || 'Client'}
            partner2Name={adults[1]?.first_name || 'Partner'}
          />
          </div>
        </header>

        <div id="app-content" className="app-content" tabIndex={-1}>
        {desktop && splitMode === 'split' ? (
          /* Split Screen Projector Mode for Live Demo */
          <div className="flex flex-col lg:flex-row items-start justify-center gap-6 min-h-full p-4 sm:p-8 bg-slate-950">
            {/* Left Screen: Primary Partner / Stories */}
            <div className="w-full max-w-[420px] h-[844px] rounded-2xl border border-slate-700 overflow-hidden relative bg-slate-950">
              <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 z-50 flex items-center justify-center">
                <div className="w-24 h-4 bg-slate-950 rounded-b-xl" />
              </div>
              <div className="h-full pt-4 overflow-y-auto">
                <Routes>
                  <Route path="/" element={<CaseSelectPage />} />
                  <Route path="/case/:caseId" element={<HouseholdEntryPage />} />
                  <Route path="/case/:caseId/stories" element={<StoriesPage />} />
                  <Route path="/case/:caseId/allocate" element={<AllocationPage />} />
                  <Route path="/case/:caseId/tradeoff" element={<TradeoffPage />} />
                  <Route path="/case/:caseId/sync" element={<FamilySyncPage />} />
                  <Route path="/case/:caseId/action" element={<ActionPage />} />
                </Routes>
              </div>
            </div>

            {/* Right Screen: Secondary Partner / Family Consensus / Advisor View */}
            <div className="w-full max-w-[420px] h-[844px] rounded-2xl border border-slate-700 overflow-hidden relative bg-slate-950">
              <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 z-50 flex items-center justify-center">
                <div className="w-24 h-4 bg-slate-950 rounded-b-xl" />
              </div>
              <div className="h-full pt-4 overflow-y-auto">
                <Routes>
                  <Route path="/case/:caseId/*" element={splitTarget === 'advisor' ? <ActionPage /> : <FamilySyncPage />} />
                  <Route path="/" element={<p className="p-6 text-sm text-slate-300">Choose a household to preview its session.</p>} />
                </Routes>
              </div>
            </div>
          </div>
        ) : (
          /* Normal Single Mobile Viewport */
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
        )}
        </div>
        {!isWrapped && <CalibrationBanner />}
      </div>
  );
}
