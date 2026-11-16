/**
 * src/App.tsx
 *
 * Sherpas Pulse - 100% Mobile-First Financial Diagnostic & Alignment Web App
 * Includes optional Split-Screen projector mode for live stage demos.
 */

import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import CaseSelectPage from './pages/CaseSelectPage';
import HouseholdEntryPage from './pages/HouseholdEntryPage';
import StoriesPage from './pages/StoriesPage';
import AllocationPage from './pages/AllocationPage';
import TradeoffPage from './pages/TradeoffPage';
import FamilySyncPage from './pages/FamilySyncPage';
import ActionPage from './pages/ActionPage';
import { SplitScreenToggle, type SplitMode, type SplitTarget } from './components/shared/SplitScreenToggle';

export default function App() {
  const [splitMode, setSplitMode] = useState<SplitMode>('single');
  const [splitTarget, setSplitTarget] = useState<SplitTarget>('advisor');

  return (
    <BrowserRouter>
      <div className="relative min-h-dvh bg-slate-950 text-white">
        {/* Live Projector Split Screen Toggle */}
        <div className="fixed top-3 right-3 z-50">
          <SplitScreenToggle
            mode={splitMode}
            onModeChange={setSplitMode}
            target={splitTarget}
            onTargetChange={setSplitTarget}
            partner1Name="Timothy"
            partner2Name="Melanie"
          />
        </div>

        {splitMode === 'split' ? (
          /* Split Screen Projector Mode for Live Demo */
          <div className="flex flex-col lg:flex-row items-center justify-center gap-6 min-h-dvh p-4 pt-16 bg-slate-950 overflow-x-auto">
            {/* Left Screen: Primary Partner / Stories */}
            <div className="w-[390px] h-[844px] rounded-[44px] border-[10px] border-slate-800 shadow-2xl overflow-hidden relative bg-slate-950">
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
            <div className="w-[390px] h-[844px] rounded-[44px] border-[10px] border-slate-800 shadow-2xl overflow-hidden relative bg-slate-950">
              <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 z-50 flex items-center justify-center">
                <div className="w-24 h-4 bg-slate-950 rounded-b-xl" />
              </div>
              <div className="h-full pt-4 overflow-y-auto">
                {splitTarget === 'advisor' ? (
                  <ActionPage />
                ) : (
                  <FamilySyncPage />
                )}
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
    </BrowserRouter>
  );
}
