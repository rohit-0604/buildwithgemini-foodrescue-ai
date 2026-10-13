'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Thermometer, 
  ShieldAlert, 
  Clock, 
  Building2, 
  MapPin, 
  Info,
  Loader2,
  PackageCheck,
  ChevronRight
} from 'lucide-react';
import { Donation, StorageCondition } from '@/lib/types';

interface DonorViewProps {
  donations: Donation[];
  onDonationCreated: () => void;
}

export function DonorView({ donations, onDonationCreated }: DonorViewProps) {
  const [inputText, setInputText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const samplePrompts = [
    {
      label: 'Paradise Biryani (60 Hot Meals)',
      text: 'We have 60 portions of hot chicken biryani and vegetable pulao left from our lunch banquet at Paradise Secunderabad. Prepared fresh at 13:30, kept in warmers at 64°C. Allergens: contains dairy and peanut salan. Pickup window from 14:00 to 17:00 at SD Road, Secunderabad. Ready for immediate redistribution.'
    },
    {
      label: 'Novotel Banquet (120 Mixed Buffet)',
      text: 'Novotel Hitec City has 120 servings of mixed dinner buffet (paneer butter masala, dal makhani, naan, and vegetable biryani). Kept hot in chafing dishes at 62°C. Allergens: dairy (ghee/cream), gluten. Pickup available until 23:00 at service dock 2.'
    },
    {
      label: 'Corporate Cafeteria (45 Chilled Sandwiches)',
      text: 'Cyber Towers Tech Cafeteria has 45 boxed gourmet vegetarian sandwiches and cold salads. Kept refrigerated at 4°C in display coolers. Contains dairy and gluten. Prepared at 11:00 AM, safe until 19:00.'
    },
    {
      label: 'High Ambient Temp Warning (Danger Zone)',
      text: 'Wedding reception food: 80 portions of mixed rice and sambar kept at room temperature for 3.5 hours on an open lawn in Secunderabad (34°C). Current temperature not recorded. Allergens unknown.'
    }
  ];

  const handleExtract = async (textToUse?: string) => {
    const text = textToUse || inputText;
    if (!text.trim()) return;

    setIsExtracting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/donation/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.success) {
        setExtractedData(data.data);
      } else {
        setErrorMsg(data.error || 'Failed to extract donation details.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error extracting details.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmitDonation = async () => {
    if (!extractedData) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/donation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...extractedData,
          rawText: inputText,
          donorId: 'donor-paradise-sec',
          donorName: '[DEMO] Paradise Biryani & Banquets'
        })
      });
      const data = await res.json();
      if (data.success) {
        setExtractedData(null);
        setInputText('');
        onDonationCreated();
      } else {
        setErrorMsg(data.error || 'Failed to submit donation.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error submitting donation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-semibold mb-3 border border-emerald-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Assisted Surplus Intake</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Register Surplus Food in Natural Language
          </h1>
          <p className="text-emerald-100 text-sm mt-2 leading-relaxed">
            Describe surplus food just like speaking to a logistics dispatcher. Gemini 2.5 Flash extracts portions, temperatures, allergens, and checks regulatory safety standards (FSSAI 2019 / WHO 2-hr rule) in real time.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Natural Language Input & Analysis */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between">
              <label htmlFor="donation-description" className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Surplus Description</span>
                <span className="text-xs text-slate-500 font-normal">(Freeform text)</span>
              </label>
              <span className="text-xs text-emerald-700 font-medium">Automatic FSSAI Validation</span>
            </div>

            {/* Quick Sample Prompts */}
            <div className="space-y-1.5">
              <p className="text-xs text-slate-500 font-medium">Click to test instant demo scenarios:</p>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputText(p.text);
                      handleExtract(p.text);
                    }}
                    className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-all font-medium text-left"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <textarea
              id="donation-description"
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. We have 60 portions of hot biryani kept in warmers at 64°C at Paradise Secunderabad. Prepared at 1:30 PM. Contains dairy. Pickup between 2:00 PM and 5:00 PM..."
              className="w-full text-sm rounded-xl border border-slate-300 p-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 placeholder:text-slate-400 font-normal leading-relaxed"
            />

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Extract Action Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => handleExtract()}
                disabled={isExtracting || !inputText.trim()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing with Gemini 2.5 Flash...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>Extract Details with Gemini</span>
                  </>
                )}
              </button>

              {extractedData && (
                <button
                  type="button"
                  onClick={() => setExtractedData(null)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Clear Analysis
                </button>
              )}
            </div>
          </div>

          {/* Structured Extraction Card */}
          {extractedData && (
            <div className="bg-white rounded-2xl p-6 border-2 border-emerald-500/40 shadow-md space-y-4 animate-in fade-in duration-300">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-base">{extractedData.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800">
                    {extractedData.totalQuantity} Total Servings
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    extractedData.storageConditions === 'HOT' ? 'bg-orange-100 text-orange-800' :
                    extractedData.storageConditions === 'COLD' ? 'bg-blue-100 text-blue-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {extractedData.storageConditions}
                  </span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Item Details & Holding Temp</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {extractedData.foodItems?.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{item.name}</span>
                        <span className="text-emerald-700">{item.quantity} {item.unit}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span>Category: {item.category}</span>
                        {item.temperatureCelsius !== undefined && (
                          <span className="inline-flex items-center gap-1 font-semibold text-orange-700">
                            <Thermometer className="w-3 h-3" />
                            {item.temperatureCelsius}°C
                          </span>
                        )}
                      </div>
                      {item.allergens?.length > 0 && (
                        <p className="text-amber-800 font-medium">Allergens: {item.allergens.join(', ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Timing & Pickup Window */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                    Holding & Window
                  </span>
                  <p className="text-slate-900 font-semibold">
                    Prep: {extractedData.preparationTime || '13:00'} | Window: {extractedData.pickupWindow?.start || '14:00'} - {extractedData.pickupWindow?.end || '17:00'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-600" />
                    Pickup Location
                  </span>
                  <p className="text-slate-900 font-semibold truncate">
                    {extractedData.pickupAddress || 'Secunderabad / Hyderabad Central'}
                  </p>
                </div>
              </div>

              {/* Safety Review / Compliance Alert */}
              <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                extractedData.safetyReview?.requiresHumanReview
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {extractedData.safetyReview?.requiresHumanReview ? (
                    <>
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Regulatory Warning / Human Review Required</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>FSSAI Safety Parameters Cleared</span>
                    </>
                  )}
                </div>

                {extractedData.safetyReview?.storageGuidelineCited && (
                  <p className="font-semibold text-slate-700">
                    Citing: <span className="underline">{extractedData.safetyReview.storageGuidelineCited}</span>
                  </p>
                )}

                {extractedData.safetyReview?.flags?.length > 0 && (
                  <ul className="list-disc list-inside space-y-0.5 text-amber-800 font-medium">
                    {extractedData.safetyReview.flags.map((f: string, i: number) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                )}

                {extractedData.missingFields?.length > 0 && (
                  <p className="text-slate-600">
                    <span className="font-semibold">Missing fields to clarify:</span> {extractedData.missingFields.join(', ')}
                  </p>
                )}
              </div>

              {/* Submit to Network Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSubmitDonation}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Broadcasting to Agents & Matching Hubs...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-emerald-400" />
                      <span>Submit Donation to FoodRescue Network</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Right Column: Active Donations & Network Live Status */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-emerald-600" />
                <span>Donation Registry ({donations.length})</span>
              </h2>
              <span className="text-xs text-slate-500">Live Status</span>
            </div>

            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {donations.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-slate-50/50 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">{d.title}</h4>
                      <p className="text-xs text-slate-500">{d.donorName}</p>
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      d.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                      d.status === 'PICKED_UP' ? 'bg-blue-100 text-blue-800' :
                      d.status === 'RESERVED' || d.status === 'AWAITING_APPROVAL' ? 'bg-purple-100 text-purple-800' :
                      d.status === 'ON_HOLD' ? 'bg-rose-100 text-rose-800' :
                      d.status === 'NEEDS_INFORMATION' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-200 text-slate-800'
                    }`}>
                      {d.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Quantity metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Donated</span>
                      <span className="font-bold text-slate-900">{d.totalQuantity} meals</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Remaining Open</span>
                      <span className={`font-bold ${d.remainingQuantity > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                        {d.remainingQuantity} meals
                      </span>
                    </div>
                  </div>

                  {/* Safety Note or Allergen Summary */}
                  <div className="text-[11px] text-slate-600 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-orange-600" />
                      {d.currentTempCelsius ? `${d.currentTempCelsius}°C` : 'Temp Logged'}
                    </span>
                    <span className="text-slate-400">
                      {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
