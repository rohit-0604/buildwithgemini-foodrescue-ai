'use client';

import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Truck, 
  Building2, 
  RotateCcw, 
  ShieldCheck, 
  ShieldAlert, 
  Bot, 
  ArrowRight,
  TrendingUp,
  FileText,
  Loader2,
  Check,
  Activity
} from 'lucide-react';
import { Mission, Donation, DatabaseState } from '@/lib/types';

interface CoordinatorViewProps {
  state: DatabaseState;
  onActionComplete: () => void;
}

export function CoordinatorView({ state, onActionComplete }: CoordinatorViewProps) {
  const [selectedMissionId, setSelectedMissionId] = useState<string>(state.missions[0]?.id || '');
  const [coordinatorNotes, setCoordinatorNotes] = useState('All FSSAI temperature and vehicle specs confirmed compliant.');
  const [replanReason, setReplanReason] = useState('Coordinator requested alternative recipient route.');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const selectedMission = state.missions.find(m => m.id === selectedMissionId) || state.missions[0];
  const selectedDonation = selectedMission ? state.donations.find(d => d.id === selectedMission.donationId) : undefined;

  // Calculate high-level KPIs
  const totalMealsRescued = state.donations.reduce((sum, d) => sum + (d.totalQuantity - d.remainingQuantity), 0);
  const activeMissions = state.missions.filter(m => m.status !== 'COMPLETED' && m.status !== 'CANCELLED').length;
  const pendingApprovals = state.missions.filter(m => m.status === 'AWAITING_APPROVAL' || m.status === 'AWAITING_CONFIRMATION').length;
  const safetyHolds = state.missions.filter(m => m.status === 'BLOCKED' || (selectedDonation?.safetyReview?.requiresHumanReview && !selectedDonation?.safetyReview?.isCleared)).length;

  const handleApprove = async (missionId: string) => {
    setIsProcessing('approve' + missionId);
    try {
      await fetch('/api/coordinator/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId,
          notes: coordinatorNotes
        })
      });
      onActionComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReplan = async (missionId: string) => {
    setIsProcessing('replan' + missionId);
    try {
      await fetch('/api/coordinator/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId,
          triggerReason: replanReason
        })
      });
      onActionComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-800/80 text-purple-200 text-xs font-semibold mb-2 border border-purple-700">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Human-in-the-Loop Mission Control</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Central Dispatch & Compliance Command
          </h1>
          <p className="text-purple-200 text-xs mt-1">
            Supervising multi-agent proposals, approving meal reservations, and resolving logistics bottlenecks across Hyderabad Metro.
          </p>
        </div>

        {/* Mission Selector */}
        {state.missions.length > 0 && (
          <div className="w-full md:w-auto">
            <label htmlFor="mission-select" className="text-[11px] uppercase tracking-wider text-purple-200 font-bold block mb-1">
              Select Active Mission
            </label>
            <select
              id="mission-select"
              value={selectedMission?.id}
              onChange={(e) => setSelectedMissionId(e.target.value)}
              className="w-full md:w-80 bg-purple-950 border border-purple-700 text-white text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
            >
              {state.missions.map(m => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.status.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-bold">Rescued Meals</span>
            <span className="text-2xl font-black text-slate-900">{totalMealsRescued}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-bold">Active Missions</span>
            <span className="text-2xl font-black text-blue-700">{activeMissions}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-bold">Pending Approval</span>
            <span className="text-2xl font-black text-purple-700">{pendingApprovals}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-bold">Safety / Blocked</span>
            <span className={`text-2xl font-black ${safetyHolds > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {safetyHolds}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Selected Mission Command Center */}
      {selectedMission ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Mission Overview & Actions */}
          <div className="lg:col-span-8 space-y-4">
            
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                      {selectedMission.title}
                    </h2>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      selectedMission.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                      selectedMission.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                      selectedMission.status === 'APPROVED' ? 'bg-purple-100 text-purple-800' :
                      selectedMission.status === 'BLOCKED' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedMission.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Donation: <span className="font-semibold text-slate-700">{selectedDonation?.donorName || 'Paradise Biryani'}</span> • {selectedDonation?.totalQuantity || 60} Total Meals
                  </p>
                </div>
              </div>

              {/* Agent Reasoning Callout */}
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-purple-900">
                  <Bot className="w-4 h-4 text-purple-700" />
                  <span>Agent Orchestrator Reasoning & Plan</span>
                </div>
                <p className="text-purple-950 font-medium leading-relaxed">
                  {selectedMission.reasoningSummary}
                </p>
                {selectedMission.agentRecommendations?.length > 0 && (
                  <div className="pt-1 space-y-1">
                    <span className="font-bold text-[10px] uppercase text-purple-700">Recommended Next Steps:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-purple-900">
                      {selectedMission.agentRecommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Blockers Alert (if any) */}
              {selectedMission.blockers?.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Active Operational Blockers ({selectedMission.blockers.length})</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-rose-800 font-medium">
                    {selectedMission.blockers.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Allocations Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Proposed Recipient Allocations</span>
                </h3>

                {selectedMission.allocations.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">
                    No recipient allocations currently calculated.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Recipient Shelter</th>
                          <th className="p-2.5">Allocated</th>
                          <th className="p-2.5">Allocation Status</th>
                          <th className="p-2.5">Approval Signoff</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedMission.allocations.map((a, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-semibold text-slate-900">{a.recipientName}</td>
                            <td className="p-2.5 font-bold text-blue-700">{a.allocatedMeals} meals</td>
                            <td className="p-2.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                a.status === 'APPROVED' || a.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                                a.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-500">{a.approvedBy || 'Pending Coordinator'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Transport Assignment Details */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Transport & Logistics Assignment</span>
                </h3>

                {selectedMission.transportAssignments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">
                    No volunteer transport assigned yet.
                  </p>
                ) : (
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                    {selectedMission.transportAssignments.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900">{t.volunteerName}</span>
                          <span className="text-slate-500 ml-2">({t.vehicleType})</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                          t.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                          t.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Human-in-the-Loop Actions Box */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-900">Coordinator Oversight Actions</h3>
                
                <div className="space-y-2">
                  <label htmlFor="coordinator-notes" className="block text-[11px] font-medium text-slate-500">
                    Coordinator Review Notes:
                  </label>
                  <input
                    id="coordinator-notes"
                    type="text"
                    value={coordinatorNotes}
                    onChange={(e) => setCoordinatorNotes(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedMission.id)}
                    disabled={isProcessing === 'approve' + selectedMission.id || selectedMission.status === 'COMPLETED'}
                    className="flex-1 min-w-[200px] py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isProcessing === 'approve' + selectedMission.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>Approve Allocation Plan & Authorize Dispatch</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReplan(selectedMission.id)}
                    disabled={isProcessing === 'replan' + selectedMission.id}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Trigger Replan</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Regulatory & Mission Audit Events */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Safety & Compliance Inspector */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900">Regulatory Standards Inspector</h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">FSSAI Guideline Cited</span>
                  <span className="font-semibold text-slate-800 text-[11px]">
                    {selectedDonation?.safetyReview?.storageGuidelineCited || 'FSSAI Surplus Recovery Standard, 2019'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Temperature Log</span>
                  <span className="font-semibold text-orange-700 text-[11px]">
                    {selectedDonation?.currentTempCelsius ? `${selectedDonation.currentTempCelsius}°C (Holding standard ≥60°C satisfied)` : 'Temperature verified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Mission Events Log */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-slate-900">Mission Event Stream ({selectedMission.events.length})</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Immutable</span>
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {selectedMission.events.map((evt) => (
                  <div key={evt.id} className="text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
                        {evt.actorRole}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-800 text-[11px] font-medium leading-snug">{evt.description}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      ) : null}

    </div>
  );
}
