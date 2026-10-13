'use client';

import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Thermometer, 
  Clock, 
  PackageCheck, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Check,
  Loader2,
  Navigation
} from 'lucide-react';
import { Volunteer, Mission, Donation } from '@/lib/types';

interface VolunteerViewProps {
  volunteers: Volunteer[];
  missions: Mission[];
  donations: Donation[];
  onActionComplete: () => void;
}

export function VolunteerView({
  volunteers,
  missions,
  donations,
  onActionComplete
}: VolunteerViewProps) {
  const [selectedVolId, setSelectedVolId] = useState(volunteers[0]?.id || 'vol-vikram');
  const [pickupTemp, setPickupTemp] = useState<number>(64);
  const [pickupNotes, setPickupNotes] = useState('Collected hot in insulated thermal transport bag.');
  const [deliveryQty, setDeliveryQty] = useState<number>(60);
  const [deliveryNotes, setDeliveryNotes] = useState('Delivered to kitchen coordinator. Handover verified.');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const selectedVolunteer = volunteers.find(v => v.id === selectedVolId) || volunteers[0];

  // Find assignments for this volunteer
  const assignments: Array<{
    mission: Mission;
    donation: Donation | undefined;
    assignment: any;
  }> = [];

  missions.forEach(m => {
    m.transportAssignments.forEach(t => {
      if (t.volunteerId === selectedVolId) {
        const donation = donations.find(d => d.id === m.donationId);
        assignments.push({
          mission: m,
          donation,
          assignment: t
        });
      }
    });
  });

  const handleAction = async (action: string, assignmentId: string, extraBody: any = {}) => {
    setIsProcessing(assignmentId + action);
    try {
      await fetch('/api/volunteer/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          assignmentId,
          ...extraBody
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
      
      {/* Top Banner with Volunteer Profile Switcher */}
      <div className="bg-gradient-to-r from-amber-900 to-orange-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-800/80 text-amber-200 text-xs font-semibold mb-2 border border-amber-700">
            <Truck className="w-3.5 h-3.5" />
            <span>Volunteer Fleet Dispatch</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {selectedVolunteer?.name}
          </h1>
          <p className="text-amber-100 text-xs mt-1 flex items-center gap-2">
            <span>Vehicle: <strong className="text-white">{selectedVolunteer?.vehicleType}</strong></span>
            <span className="text-amber-400">•</span>
            <span>Capacity: <strong className="text-white">{selectedVolunteer?.capacityMeals} meals</strong></span>
            <span className="text-amber-400">•</span>
            <span>{selectedVolunteer?.hasColdStorage ? '❄️ Active Cold Storage' : '♨️ Thermal Insulated'}</span>
          </p>
        </div>

        {/* Volunteer Selector */}
        <div className="w-full md:w-auto">
          <label htmlFor="volunteer-select" className="text-[11px] uppercase tracking-wider text-amber-200 font-bold block mb-1">
            Switch Volunteer Driver
          </label>
          <select
            id="volunteer-select"
            value={selectedVolId}
            onChange={(e) => setSelectedVolId(e.target.value)}
            className="w-full md:w-72 bg-amber-950 border border-amber-700 text-white text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
          >
            {volunteers.map(v => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.vehicleType} — {v.capacityMeals} meals)
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Assigned Missions */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-amber-600" />
                <span>Assigned Deliveries & Routes ({assignments.length})</span>
              </h2>
              <span className="text-xs text-slate-500">Live Vehicle Dispatch</span>
            </div>

            {assignments.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50">
                <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No active transport assignments</p>
                <p className="text-xs text-slate-500 mt-1">
                  When allocations are confirmed, the Matching Agent assigns optimal volunteer vehicles according to route, thermal specs, and meal count.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((item, idx) => {
                  const { mission, donation, assignment } = item;
                  const isProposed = assignment.status === 'PROPOSED';
                  const isAccepted = assignment.status === 'ACCEPTED';
                  const isInTransit = assignment.status === 'IN_TRANSIT';
                  const isCompleted = assignment.status === 'COMPLETED';
                  const isCancelled = assignment.status === 'CANCELLED';

                  return (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border-2 border-slate-200 hover:border-amber-300 transition-all bg-white shadow-sm space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                              {donation?.title || mission.title}
                            </h3>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              isCompleted ? 'bg-emerald-100 text-emerald-800' :
                              isInTransit ? 'bg-blue-100 text-blue-800 animate-pulse' :
                              isAccepted ? 'bg-purple-100 text-purple-800' :
                              isCancelled ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {assignment.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Mission: <span className="font-medium text-slate-700">{mission.id}</span>
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-bold text-amber-700">{donation?.totalQuantity || 60} meals</span>
                          <span className="text-xs text-slate-400 block">{donation?.storageConditions || 'HOT'}</span>
                        </div>
                      </div>

                      {/* Route Waypoints */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                          <span className="text-slate-500">Pickup:</span>
                          <span className="font-semibold text-slate-900 truncate">
                            {donation?.pickupAddress || 'Paradise Secunderabad'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pl-4">
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-400 text-[11px]">Direct Transit (~3.5 km)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                          <span className="text-slate-500">Dropoff:</span>
                          <span className="font-semibold text-slate-900 truncate">
                            {mission.allocations[0]?.recipientName || 'Verified Partner Shelter'}
                          </span>
                        </div>
                      </div>

                      {/* State 1: PROPOSED (Accept or Decline) */}
                      {isProposed && (
                        <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleAction('respond', assignment.id, { status: 'ACCEPTED' })}
                            disabled={isProcessing === assignment.id + 'respond'}
                            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                          >
                            {isProcessing === assignment.id + 'respond' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Accept Pickup Job</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAction('respond', assignment.id, { 
                              status: 'DECLINED',
                              reason: 'Volunteer schedule conflict'
                            })}
                            disabled={isProcessing === assignment.id + 'respond'}
                            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      )}

                      {/* State 2: ACCEPTED / AWAITING APPROVAL (Ready to Pickup) */}
                      {isAccepted && (
                        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 text-xs space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Thermometer className="w-4 h-4 text-orange-600" />
                              <span>Step 1: Record Physical Pickup & Temperature</span>
                            </span>
                            <span className="text-[11px] text-amber-800 font-medium">FSSAI Verification</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label htmlFor="temp-input" className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                                Verified Temp (°C)
                              </label>
                              <input
                                id="temp-input"
                                type="number"
                                value={pickupTemp}
                                onChange={(e) => setPickupTemp(parseInt(e.target.value, 10))}
                                className="w-full text-xs p-2 rounded-lg border border-slate-300 font-bold text-slate-900"
                              />
                            </div>
                            <div>
                              <label htmlFor="notes-input" className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                                Packaging Notes
                              </label>
                              <input
                                id="notes-input"
                                type="text"
                                value={pickupNotes}
                                onChange={(e) => setPickupNotes(e.target.value)}
                                className="w-full text-xs p-2 rounded-lg border border-slate-300 text-slate-900"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleAction('pickup', assignment.id, {
                                verifiedTemp: pickupTemp,
                                notes: pickupNotes
                              })}
                              disabled={isProcessing === assignment.id + 'pickup'}
                              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                              {isProcessing === assignment.id + 'pickup' ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <PackageCheck className="w-3.5 h-3.5" />
                              )}
                              <span>Confirm Pickup (Start Transit)</span>
                            </button>

                            {/* Breakdown simulation button */}
                            <button
                              type="button"
                              onClick={() => handleAction('cancel', assignment.id, {
                                reason: 'Simulated flat tire / mechanical breakdown'
                              })}
                              disabled={isProcessing === assignment.id + 'cancel'}
                              className="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold"
                              title="Simulate cancellation to test replan"
                            >
                              Simulate Breakdown
                            </button>
                          </div>
                        </div>
                      )}

                      {/* State 3: IN_TRANSIT (Ready to Deliver) */}
                      {isInTransit && (
                        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 text-xs space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Step 2: Record Delivery & Recipient Handoff</span>
                            </span>
                            <span className="text-[11px] text-blue-800 font-medium">In Transit</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label htmlFor="delivery-meals" className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                                Verified Meals Delivered
                              </label>
                              <input
                                id="delivery-meals"
                                type="number"
                                value={deliveryQty}
                                onChange={(e) => setDeliveryQty(parseInt(e.target.value, 10))}
                                className="w-full text-xs p-2 rounded-lg border border-slate-300 font-bold text-slate-900"
                              />
                            </div>
                            <div>
                              <label htmlFor="delivery-notes" className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                                Recipient Confirmation Notes
                              </label>
                              <input
                                id="delivery-notes"
                                type="text"
                                value={deliveryNotes}
                                onChange={(e) => setDeliveryNotes(e.target.value)}
                                className="w-full text-xs p-2 rounded-lg border border-slate-300 text-slate-900"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAction('delivery', assignment.id, {
                              verifiedQuantity: deliveryQty,
                              notes: deliveryNotes
                            })}
                            disabled={isProcessing === assignment.id + 'delivery'}
                            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                          >
                            {isProcessing === assignment.id + 'delivery' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>Confirm Delivery & Conclude Mission</span>
                          </button>
                        </div>
                      )}

                      {/* State 4: COMPLETED */}
                      {isCompleted && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Delivery successfully completed and verified in permanent audit trail.</span>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Driver Stats & Vehicle Profile */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Truck className="w-5 h-5 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Vehicle Specs & Readiness</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 text-slate-700">
                <span>Vehicle Type:</span>
                <span className="font-bold text-slate-900">{selectedVolunteer.vehicleType}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 text-slate-700">
                <span>Capacity:</span>
                <span className="font-bold text-amber-700">{selectedVolunteer.capacityMeals} Meals Max</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 text-slate-700">
                <span>Cold-Chain System:</span>
                <span className="font-bold text-slate-900">
                  {selectedVolunteer.hasColdStorage ? '✅ Active Refrigeration' : '❌ Insulated Thermal Only'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 text-emerald-800">
                <span>Driver Status:</span>
                <span className="font-bold">Available / On-Call</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <p className="font-bold">Good Samaritan Protection</p>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Volunteers delivering food in good faith under verified FSSAI surplus recovery guidelines are legally indemnified from civil or criminal liability.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
