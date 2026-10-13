'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { DonorView } from '@/components/DonorView';
import { NgoView } from '@/components/NgoView';
import { VolunteerView } from '@/components/VolunteerView';
import { CoordinatorView } from '@/components/CoordinatorView';
import { AgentTraceViewer } from '@/components/AgentTraceViewer';
import { RegulatoryKnowledgeModal } from '@/components/RegulatoryKnowledgeModal';
import { DatabaseState } from '@/lib/types';
import { 
  Bot, 
  BookOpen, 
  Terminal, 
  RotateCcw, 
  Info, 
  CheckCircle, 
  AlertTriangle,
  Sparkles,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

export default function Home() {
  const [state, setState] = useState<DatabaseState | null>(null);
  const [currentRole, setCurrentRole] = useState<'DONOR' | 'NGO' | 'VOLUNTEER' | 'COORDINATOR'>('DONOR');
  const [isResetting, setIsResetting] = useState(false);
  const [activeScenarioName, setActiveScenarioName] = useState<string | null>(null);
  const [activeScenarioDesc, setActiveScenarioDesc] = useState<string | null>(null);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [isTraceViewerExpanded, setIsTraceViewerExpanded] = useState(true);

  // Fetch application state
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      const json = await res.json();
      if (json.success) {
        setState(json.data);
      }
    } catch (err) {
      console.error('Failed to load application state:', err);
    }
  }, []);

  useEffect(() => {
    fetchState();
    // Real-time polling every 3 seconds for multi-role sync
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, [fetchState]);

  // Reset Demo handler
  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setState(json.data);
        setActiveScenarioName(null);
        setActiveScenarioDesc(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  // Load Scenario handler
  const handleLoadScenario = async (scenarioId: string) => {
    try {
      const res = await fetch('/api/demo/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId })
      });
      const json = await res.json();
      if (json.success) {
        setState(json.state);
        setActiveScenarioName(json.scenario.name);
        setActiveScenarioDesc(json.scenario.description);
        // Auto-switch to coordinator or volunteer view depending on scenario
        if (scenarioId === 'scenario-volunteer-cancelled') {
          setCurrentRole('VOLUNTEER');
        } else if (scenarioId === 'scenario-ngo-rejected') {
          setCurrentRole('NGO');
        } else {
          setCurrentRole('COORDINATOR');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Initializing FoodRescue AI Mesh...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      
      {/* Universal Header with Role Switcher & Reset */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        onReset={handleReset}
        onLoadScenario={handleLoadScenario}
        activeScenarioName={activeScenarioName || undefined}
        isResetting={isResetting}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Active Demo Scenario Banner (if loaded) */}
        {activeScenarioName && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                DEMO
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">{activeScenarioName}</h4>
                <p className="text-xs text-slate-600">{activeScenarioDesc}</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg border border-amber-300 transition-all shrink-0"
            >
              Reset to Base State
            </button>
          </div>
        )}

        {/* Floating Quick Action: Regulatory Knowledge Base */}
        <div className="flex items-center justify-end gap-2 text-xs">
          <button
            onClick={() => setIsKnowledgeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-700 shadow-sm font-semibold transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>View Regulatory Knowledge & RAG Rules</span>
          </button>
        </div>

        {/* Dynamic View rendering based on Current Role */}
        <div className="transition-all duration-300">
          {currentRole === 'DONOR' && (
            <DonorView
              donations={state.donations}
              onDonationCreated={fetchState}
            />
          )}

          {currentRole === 'NGO' && (
            <NgoView
              recipients={state.recipients}
              missions={state.missions}
              donations={state.donations}
              onActionComplete={fetchState}
            />
          )}

          {currentRole === 'VOLUNTEER' && (
            <VolunteerView
              volunteers={state.volunteers}
              missions={state.missions}
              donations={state.donations}
              onActionComplete={fetchState}
            />
          )}

          {currentRole === 'COORDINATOR' && (
            <CoordinatorView
              state={state}
              onActionComplete={fetchState}
            />
          )}
        </div>

        {/* Persistent Agent Execution Trace Section (Evaluator Observability) */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-600" />
              <span>Multi-Agent System Observability (19 Tools)</span>
            </span>
            <button
              onClick={() => setIsTraceViewerExpanded(!isTraceViewerExpanded)}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
            >
              <span>{isTraceViewerExpanded ? 'Collapse Traces' : 'Expand Traces'}</span>
              {isTraceViewerExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {isTraceViewerExpanded && (
            <AgentTraceViewer traces={state.traces} />
          )}
        </div>

      </main>

      {/* RAG Knowledge Modal */}
      <RegulatoryKnowledgeModal
        isOpen={isKnowledgeModalOpen}
        onClose={() => setIsKnowledgeModalOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FoodRescue AI — Built with Google Gemini 2.5 Flash on Vertex AI</span>
          <div className="flex items-center gap-4">
            <span className="text-emerald-700 font-medium">Atomic File Persistence Active</span>
            <span>•</span>
            <span>FSSAI 2019 Compliant</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
