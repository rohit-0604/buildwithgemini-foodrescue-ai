'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  MapPin, 
  AlertCircle, 
  Check, 
  Sliders,
  ExternalLink,
  ShieldCheck,
  Search,
  Loader2
} from 'lucide-react';
import { RecipientOrganization, Mission, Donation } from '@/lib/types';

interface NgoViewProps {
  recipients: RecipientOrganization[];
  missions: Mission[];
  donations: Donation[];
  onActionComplete: () => void;
}

export function NgoView({
  recipients,
  missions,
  donations,
  onActionComplete
}: NgoViewProps) {
  const [selectedRecipientId, setSelectedRecipientId] = useState(recipients[0]?.id || 'recip-akshaya-sec');
  const [partialQtys, setPartialQtys] = useState<Record<string, number>>({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const selectedRecipient = recipients.find(r => r.id === selectedRecipientId) || recipients[0];

  // Incoming pending requests for this recipient
  const incomingRequests: Array<{
    mission: Mission;
    donation: Donation | undefined;
    responseId: string;
    proposedQty: number;
    responseStatus: string;
  }> = [];

  missions.forEach(m => {
    m.recipientResponses.forEach(r => {
      if (r.recipientId === selectedRecipientId) {
        const donation = donations.find(d => d.id === m.donationId);
        incomingRequests.push({
          mission: m,
          donation,
          responseId: r.id,
          proposedQty: r.acceptedQuantity,
          responseStatus: r.status
        });
      }
    });
  });

  const handleRespond = async (responseId: string, status: 'ACCEPTED' | 'REJECTED', defaultQty: number) => {
    setIsProcessing(responseId);
    try {
      const acceptedQuantity = partialQtys[responseId] !== undefined ? partialQtys[responseId] : defaultQty;
      const notes = rejectionReasons[responseId] || (status === 'ACCEPTED' ? 'Shelter accepted allocation.' : 'Capacity exceeded.');

      await fetch('/api/ngo/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId,
          status,
          acceptedQuantity: status === 'ACCEPTED' ? acceptedQuantity : 0,
          notes
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
      
      {/* Top NGO Profile Selector Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-800/80 text-blue-200 text-xs font-semibold mb-2 border border-blue-700">
            <Building2 className="w-3.5 h-3.5" />
            <span>NGO Recipient Network Portal</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {selectedRecipient?.name}
          </h1>
          <p className="text-blue-100 text-xs mt-1 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-blue-300" />
            <span>{selectedRecipient?.address}</span>
            <span className="text-blue-400">•</span>
            <span className="text-blue-200">Capacity: {selectedRecipient?.capacityMaxMeals} meals (Occupancy: {selectedRecipient?.currentOccupancy})</span>
          </p>
        </div>

        {/* Recipient Selector */}
        <div className="w-full md:w-auto">
          <label htmlFor="ngo-select" className="text-[11px] uppercase tracking-wider text-blue-200 font-bold block mb-1">
            Switch Organization View
          </label>
          <select
            id="ngo-select"
            value={selectedRecipientId}
            onChange={(e) => setSelectedRecipientId(e.target.value)}
            className="w-full md:w-72 bg-blue-950 border border-blue-700 text-white text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
          >
            {recipients.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} {!r.isAvailableNow ? '(Renovating / Unavailable)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Incoming Donation Proposals */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Incoming Redistribution Requests ({incomingRequests.length})</span>
              </h2>
              <span className="text-xs text-slate-500">Autonomous Agent Proposals</span>
            </div>

            {incomingRequests.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No active incoming requests</p>
                <p className="text-xs text-slate-500 mt-1">
                  When donors submit surplus food, the Matching Agent routes proposals here according to dietary and capacity criteria.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {incomingRequests.map((req, idx) => {
                  const isActionable = req.responseStatus === 'PENDING';
                  const currentPartial = partialQtys[req.responseId] ?? req.proposedQty;

                  return (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border-2 border-slate-200 hover:border-blue-300 transition-all bg-white shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                              {req.donation?.title || req.mission.title}
                            </h3>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              req.responseStatus === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                              req.responseStatus === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800 animate-pulse'
                            }`}>
                              {req.responseStatus}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Donor: <span className="font-semibold text-slate-700">{req.donation?.donorName || 'Registered Partner'}</span>
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-black text-blue-700">{req.proposedQty}</span>
                          <span className="text-xs text-slate-500 block">meals proposed</span>
                        </div>
                      </div>

                      {/* Details Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Storage</span>
                          <span className="font-semibold text-slate-800">{req.donation?.storageConditions || 'HOT'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Holding Temp</span>
                          <span className="font-semibold text-orange-700">{req.donation?.currentTempCelsius ? `${req.donation.currentTempCelsius}°C` : 'Logged'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Pickup Window</span>
                          <span className="font-semibold text-slate-800">{req.donation?.pickupWindow?.start || '14:00'} - {req.donation?.pickupWindow?.end || '17:00'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Dietary</span>
                          <span className="font-semibold text-slate-800">{req.donation?.dietaryTags?.join(', ') || 'Cooked Meals'}</span>
                        </div>
                      </div>

                      {/* Quantity Modifier & Action Controls */}
                      {isActionable && (
                        <div className="pt-2 space-y-3 border-t border-slate-100">
                          {/* Quantity adjustments */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700 flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5 text-slate-500" />
                              <span>Accepted Quantity (Partial or Full):</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min={10}
                                max={req.proposedQty}
                                step={5}
                                value={currentPartial}
                                onChange={(e) => setPartialQtys({
                                  ...partialQtys,
                                  [req.responseId]: parseInt(e.target.value, 10)
                                })}
                                className="w-28 accent-blue-600"
                              />
                              <span className="font-bold text-blue-900 w-16 text-right">
                                {currentPartial} meals
                              </span>
                            </div>
                          </div>

                          {/* Rejection reason option */}
                          <div className="flex items-center gap-2">
                            <select
                              aria-label="Rejection Reason"
                              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 focus:outline-none w-full sm:w-auto"
                              value={rejectionReasons[req.responseId] || ''}
                              onChange={(e) => setRejectionReasons({
                                ...rejectionReasons,
                                [req.responseId]: e.target.value
                              })}
                            >
                              <option value="">Optional rejection reason...</option>
                              <option value="Daily recipient meal quota already reached">Quota reached for lunch</option>
                              <option value="Refrigerator cold-storage capacity full">Storage full</option>
                              <option value="Dietary restriction mismatch (require strict vegetarian)">Strict veg only</option>
                              <option value="Facility undergoing scheduled maintenance">Maintenance in progress</option>
                            </select>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleRespond(req.responseId, 'ACCEPTED', req.proposedQty)}
                              disabled={isProcessing === req.responseId}
                              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                              {isProcessing === req.responseId ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Accept {currentPartial} Meals</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRespond(req.responseId, 'REJECTED', req.proposedQty)}
                              disabled={isProcessing === req.responseId}
                              className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Decline (Trigger Replan)</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Organization Details & Verified Partner Status */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Partner Verification Status</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 text-emerald-800 font-medium">
                <span>Verified Status:</span>
                <span className="font-bold">Verified Partner</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 text-slate-700">
                <span>Dietary Certification:</span>
                <span className="font-semibold">{selectedRecipient.dietaryAcceptance.join(', ')}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 text-slate-700">
                <span>Operational Status:</span>
                <span className={`font-bold ${selectedRecipient.isAvailableNow ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {selectedRecipient.isAvailableNow ? 'Active / Open' : 'Under Renovation'}
                </span>
              </div>
            </div>

            {/* Note about Places Leads separation */}
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-blue-700" />
                <span>Places API Separation</span>
              </p>
              <p className="text-blue-800 text-[11px] leading-relaxed">
                Discovered leads via Google Places API (New) require manual outreach verification before automated allocation dispatches can occur.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
