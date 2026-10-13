'use client';

import React from 'react';
import { 
  HeartHandshake, 
  RotateCcw, 
  Sparkles, 
  Layers, 
  Building2, 
  Truck, 
  SlidersHorizontal,
  MapPin,
  Bot
} from 'lucide-react';

interface HeaderProps {
  currentRole: 'DONOR' | 'NGO' | 'VOLUNTEER' | 'COORDINATOR';
  onRoleChange: (role: 'DONOR' | 'NGO' | 'VOLUNTEER' | 'COORDINATOR') => void;
  onReset: () => void;
  onLoadScenario: (scenarioId: string) => void;
  activeScenarioName?: string;
  isResetting?: boolean;
}

export function Header({
  currentRole,
  onRoleChange,
  onReset,
  onLoadScenario,
  activeScenarioName,
  isResetting = false,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Vision */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">FoodRescue AI</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Gemini 2.5 Flash
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Intelligent Food Redistribution Network</p>
            </div>
          </div>

          {/* Role Switcher */}
          <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              onClick={() => onRoleChange('DONOR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentRole === 'DONOR'
                  ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Donor</span>
            </button>

            <button
              onClick={() => onRoleChange('NGO')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentRole === 'NGO'
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>NGO / Shelter</span>
            </button>

            <button
              onClick={() => onRoleChange('VOLUNTEER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentRole === 'VOLUNTEER'
                  ? 'bg-white text-amber-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Volunteer</span>
            </button>

            <button
              onClick={() => onRoleChange('COORDINATOR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentRole === 'COORDINATOR'
                  ? 'bg-white text-purple-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Coordinator</span>
            </button>
          </nav>

          {/* Scenarios & Reset Actions */}
          <div className="flex items-center gap-2">
            {/* Scenario dropdown */}
            <div className="relative hidden md:block">
              <select
                aria-label="Preset Scenarios"
                className="appearance-none bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                onChange={(e) => {
                  if (e.target.value) onLoadScenario(e.target.value);
                }}
                defaultValue=""
              >
                <option value="" disabled>Load Demo Scenario...</option>
                <option value="scenario-happy-path">Scenario 1: Happy Path (60 Meals)</option>
                <option value="scenario-no-ngo">Scenario 2: No Nearby Shelter (Hold)</option>
                <option value="scenario-ngo-rejected">Scenario 3: Shelter Rejection & Replan</option>
                <option value="scenario-volunteer-cancelled">Scenario 4: Volunteer Cancellation</option>
                <option value="scenario-partial-allocation">Scenario 5: Partial Allocation (100 Meals)</option>
                <option value="scenario-safety-uncertain">Scenario 6: Safety Hold & Human Review</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <Layers className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={onReset}
              disabled={isResetting}
              title="Reset database to initial demo state"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 active:scale-95 transition-all shadow-sm"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>

            {/* Mesh Status */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-600 font-medium">
              <MapPin className="w-3 h-3 text-emerald-600" />
              <span>Hyderabad Metro</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
