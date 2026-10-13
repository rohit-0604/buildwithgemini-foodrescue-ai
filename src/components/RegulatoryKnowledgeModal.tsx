'use client';

import React from 'react';
import { BookOpen, X, ShieldCheck, CheckCircle2, FileText, ExternalLink } from 'lucide-react';
import { KNOWLEDGE_BASE } from '@/lib/rag';

interface RegulatoryKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegulatoryKnowledgeModal({ isOpen, onClose }: RegulatoryKnowledgeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Regulatory Knowledge Base & RAG Engine</h2>
              <p className="text-xs text-slate-500">Official statutory safety benchmarks powering FoodRescue AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {KNOWLEDGE_BASE.map((doc) => (
            <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 px-2 py-0.5 rounded bg-emerald-100">
                    {doc.authority}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 mt-1">{doc.title}</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{doc.id}</span>
              </div>

              <p className="text-slate-700 font-medium leading-relaxed bg-white p-3 rounded-lg border border-slate-200 italic">
                "{doc.excerpt}"
              </p>

              <div className="space-y-1 pt-1">
                <span className="font-bold text-[10px] uppercase text-slate-500">Enforced Algorithmic Rules:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                  {doc.rules.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>

              <p className="text-[10px] text-slate-400 pt-1">
                Source: <span className="underline">{doc.source}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Integrated via src/lib/rag.ts with direct legal citations</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all"
          >
            Close Knowledge Base
          </button>
        </div>

      </div>
    </div>
  );
}
