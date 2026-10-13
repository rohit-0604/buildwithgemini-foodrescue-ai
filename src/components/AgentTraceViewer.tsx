'use client';

import React, { useState } from 'react';
import { 
  Bot, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronDown, 
  ChevronRight, 
  Filter,
  ArrowRight,
  Code2
} from 'lucide-react';
import { AgentExecutionTrace } from '@/lib/types';

interface AgentTraceViewerProps {
  traces: AgentExecutionTrace[];
}

export function AgentTraceViewer({ traces }: AgentTraceViewerProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>('ALL');
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  const agents = ['ALL', 'IntakeAgent', 'DiscoveryAgent', 'SafetyAgent', 'MatchingAgent', 'CoordinationAgent'];

  const filteredTraces = selectedAgent === 'ALL' 
    ? traces 
    : traces.filter(t => t.agentName === selectedAgent);

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
              <span>Agent Execution Traces</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                {traces.length} tool events
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Live multi-agent observability and tool invocations</p>
          </div>
        </div>

        {/* Agent Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-500 hidden sm:block shrink-0" />
          {agents.map((ag) => (
            <button
              key={ag}
              type="button"
              onClick={() => setSelectedAgent(ag)}
              className={`text-[11px] font-mono px-2.5 py-1 rounded-lg transition-all shrink-0 ${
                selectedAgent === ag
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {ag}
            </button>
          ))}
        </div>
      </div>

      {/* Traces List */}
      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 font-mono text-xs">
        {filteredTraces.length === 0 ? (
          <p className="text-slate-500 text-center py-8 italic font-sans text-xs">
            No traces recorded for this filter.
          </p>
        ) : (
          filteredTraces.map((tr) => {
            const isExpanded = expandedTraceId === tr.id;
            const isSuccess = tr.status === 'SUCCESS';
            const isBlocked = tr.status === 'BLOCKED';

            return (
              <div
                key={tr.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all overflow-hidden"
              >
                {/* Header row */}
                <button
                  type="button"
                  onClick={() => setExpandedTraceId(isExpanded ? null : tr.id)}
                  className="w-full text-left p-3 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}

                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      tr.agentName === 'IntakeAgent' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      tr.agentName === 'SafetyAgent' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      tr.agentName === 'DiscoveryAgent' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                      tr.agentName === 'MatchingAgent' ? 'bg-purple-950 text-purple-400 border border-purple-800' :
                      'bg-indigo-950 text-indigo-400 border border-indigo-800'
                    }`}>
                      {tr.agentName}
                    </span>

                    <span className="font-bold text-white text-xs truncate">
                      {tr.toolCalled}()
                    </span>

                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      isSuccess ? 'text-emerald-400' : isBlocked ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      [{tr.status}]
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-[11px] shrink-0">
                    {tr.executionDurationMs !== undefined && (
                      <span className="text-slate-500">{tr.executionDurationMs}ms</span>
                    )}
                    <span>
                      {new Date(tr.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </button>

                {/* Summary teaser */}
                <div className="px-3 pb-2.5 text-slate-300 text-[11px] font-sans flex items-start gap-1.5">
                  <span className="text-slate-500 shrink-0">Output:</span>
                  <p className="truncate">{tr.resultSummary}</p>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-3 bg-black/40 border-t border-slate-800 space-y-2.5 text-[11px]">
                    
                    {/* Input params */}
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px] uppercase mb-1">Input Parameters:</span>
                      <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 overflow-x-auto">
                        {JSON.stringify(tr.inputParams, null, 2)}
                      </pre>
                    </div>

                    {/* Next recommended action */}
                    {tr.nextRecommendedAction && (
                      <div className="p-2 rounded bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 flex items-center gap-2">
                        <ArrowRight className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                        <span><strong>Next Recommended Action:</strong> {tr.nextRecommendedAction}</span>
                      </div>
                    )}

                    {tr.error && (
                      <div className="p-2 rounded bg-rose-950/40 border border-rose-900 text-rose-300">
                        <strong>Error:</strong> {tr.error}
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
