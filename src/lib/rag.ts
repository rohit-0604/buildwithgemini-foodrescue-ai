import { KnowledgeDocument, SafetyReview, StorageCondition } from './types';

export const KNOWLEDGE_BASE: KnowledgeDocument[] = [
  {
    id: 'FSSAI-SURPLUS-2019-HOT',
    title: 'FSSAI Surplus Food Recovery Regulations (Hot Holding Standards)',
    source: 'Food Safety and Standards (Recovery & Distribution of Surplus Food) Regulations, 2019, Section 4.2',
    authority: 'FSSAI',
    category: 'Temperature',
    excerpt: 'Hot cooked food must be maintained at or above 60°C (140°F) throughout holding and collection. If temperature drops below 60°C, food must be consumed within 2 hours or safely reheated to 74°C once.',
    content: 'Under FSSAI 2019 regulations, surplus hot food from caterers, banquets, and restaurants must be held in thermally insulated containers maintaining minimum 60°C. Total time elapsed from cooking to consumption should not exceed 4 hours when thermal holding is verified.',
    rules: [
      'Maintain hot holding at ≥ 60°C',
      'Maximum ambient holding time: 2 hours without active reheating',
      'Discard food held between 5°C and 60°C for more than 4 hours (The Danger Zone)'
    ]
  },
  {
    id: 'FSSAI-SURPLUS-2019-COLD',
    title: 'FSSAI Surplus Food Recovery Regulations (Cold Chain & Chilling)',
    source: 'FSSAI Guidelines for Food Donation Partners, Section 5.1',
    authority: 'FSSAI',
    category: 'Storage',
    excerpt: 'Perishable cold food items (dairy, desserts, cut salads) must be chilled to 5°C or below within 2 hours of preparation and transported in insulated cold-chain vehicles.',
    content: 'Perishables, milk products, and cooked items intended for refrigerated redistribution must enter cold storage (<5°C) within 2 hours. If cold chain cannot be guaranteed during transit, distribution radius must not exceed 45 minutes.',
    rules: [
      'Cold holding at ≤ 5°C',
      'Refrigerated or insulated carrier required for journeys over 45 minutes',
      'No refreezing of thawed food'
    ]
  },
  {
    id: 'WHO-DANGER-ZONE-SAFETY',
    title: 'WHO 5 Keys to Safer Food — Temperature Danger Zone Guidelines',
    source: 'World Health Organization Food Safety Standards, Core Rule 4',
    authority: 'WHO',
    category: 'Temperature',
    excerpt: 'Microorganisms multiply rapidly between 5°C and 60°C. Food must not sit in the temperature danger zone for more than 2 hours in tropical and warm climates.',
    content: 'The 2-Hour / 4-Hour Rule: Food kept in the danger zone (5°C to 60°C) for up to 2 hours can be safely redistributed immediately. Between 2 and 4 hours, it must be consumed immediately. Beyond 4 hours, pathogen proliferation renders the food hazardous.',
    rules: [
      'Temperature Danger Zone: 5°C to 60°C',
      '0–2 hours in danger zone: Safe for immediate redistribution or reheating',
      '2–4 hours in danger zone: Immediate consumption only, no further holding',
      '>4 hours in danger zone: Mandatory discard'
    ]
  },
  {
    id: 'HYD-SUMMER-CLIMATE-DIRECTIVE',
    title: 'Hyderabad Municipal Public Health — Ambient Food Spoilage Protocol',
    source: 'GHMC & State Health Directorate Food Rescue Circular #11/2023',
    authority: 'City Health Directive',
    category: 'Storage',
    excerpt: 'In Telangana ambient temperatures exceeding 32°C, bacterial spore germination in cooked rice and gravies accelerates by 300%. Transit windows must be restricted to 90 minutes maximum unless temperature controls are logged.',
    content: 'Due to local environmental heat and humidity in the Deccan plateau, cooked rice preparations (biryani, pulao, dal) undergo rapid Bacillus cereus toxin production if left at ambient temperatures. Volunteer pickups must record temperature at collection and drop-off.',
    rules: [
      'Ambient transit restricted to maximum 90 minutes',
      'Volunteer must record pickup temperature and delivery temperature',
      'Visual inspection and olfactory check required before dispatch'
    ]
  },
  {
    id: 'ALLERGEN-DECLARATION-MANDATE',
    title: 'FSSAI Mandatory Allergen Labeling and Segregation Standard',
    source: 'FSSAI Food Safety & Standards (Packaging and Labelling) Amendment',
    authority: 'FSSAI',
    category: 'Allergens',
    excerpt: 'All redistributed food packages must clearly declare major allergens: Peanuts, Tree Nuts, Milk/Dairy, Soy, Gluten, and Shellfish. Mixed buffet donations must not be mixed with pure vegetarian or allergen-free batches.',
    content: 'Donors are legally mandated to declare whether food contains nuts, dairy, egg, or gluten. Shelters housing children or elderly beneficiaries must be informed prior to dispatch to prevent anaphylactic incidents.',
    rules: [
      'Mandatory declaration of top 6 allergens',
      'Strict separation between vegetarian and non-vegetarian food packages',
      'Beneficiary NGOs must confirm dietary suitability before dispatch'
    ]
  },
  {
    id: 'GOOD-SAMARITAN-LIABILITY',
    title: 'Indian Good Samaritan Food Donation Protections',
    source: 'National Food Surplus Policy & Good Faith Donor Protections Act',
    authority: 'Good Samaritan Law',
    category: 'Liability',
    excerpt: 'Food donors, food recovery agencies, and volunteer transporters acting in good faith without gross negligence are shielded from civil liability when donating surplus food meeting reasonable handling standards.',
    content: 'The law provides liability exemption for food donors and coordinators who follow standard hygiene protocols and donate surplus sustenance in good faith. The law encourages timely rescue rather than discard.',
    rules: [
      'Good faith donors protected from civil liability',
      'Requires transparency regarding preparation time and storage conditions',
      'Record-keeping of donation handover required for audit trail'
    ]
  }
];

export function retrieveGuidelines(query: {
  foodCategory?: string;
  storageCondition?: StorageCondition;
  temperatureCelsius?: number;
  durationHours?: number;
  hasAllergens?: boolean;
}): {
  documents: KnowledgeDocument[];
  matchedRules: string[];
  safetyAssessment: {
    isCleared: boolean;
    requiresHumanReview: boolean;
    flags: string[];
    recommendations: string[];
  };
} {
  const flags: string[] = [];
  const recommendations: string[] = [];
  let isCleared = true;
  let requiresHumanReview = false;
  const matchedRules: string[] = [];
  const matchedDocs: KnowledgeDocument[] = [];

  const temp = query.temperatureCelsius;
  const storage = query.storageCondition;
  const duration = query.durationHours ?? 1;

  if (storage === 'HOT') {
    const hotDoc = KNOWLEDGE_BASE.find(d => d.id === 'FSSAI-SURPLUS-2019-HOT')!;
    matchedDocs.push(hotDoc);
    matchedRules.push(...hotDoc.rules);

    if (temp !== undefined) {
      if (temp < 60) {
        flags.push(`Temperature ${temp}°C is below minimum safe hot-holding threshold (60°C).`);
        requiresHumanReview = true;
        isCleared = false;
        recommendations.push('Verify if food can be safely reheated to 74°C or consumed within 2-hour window per FSSAI regulations.');
      } else {
        recommendations.push(`Hot-holding verified at ${temp}°C (≥60°C standard compliant).`);
      }
    } else {
      flags.push('Current food temperature not provided for hot-holding donation.');
      requiresHumanReview = true;
      recommendations.push('Request immediate temperature verification from donor upon volunteer arrival.');
    }
  }

  if (storage === 'COLD') {
    const coldDoc = KNOWLEDGE_BASE.find(d => d.id === 'FSSAI-SURPLUS-2019-COLD')!;
    matchedDocs.push(coldDoc);
    matchedRules.push(...coldDoc.rules);

    if (temp !== undefined && temp > 5) {
      flags.push(`Cold item temperature ${temp}°C exceeds 5°C threshold.`);
      requiresHumanReview = true;
      isCleared = false;
      recommendations.push('Immediate cold-pack transport needed; consume within 90 minutes.');
    }
  }

  if (storage === 'AMBIENT') {
    const whoDoc = KNOWLEDGE_BASE.find(d => d.id === 'WHO-DANGER-ZONE-SAFETY')!;
    const hydDoc = KNOWLEDGE_BASE.find(d => d.id === 'HYD-SUMMER-CLIMATE-DIRECTIVE')!;
    matchedDocs.push(whoDoc, hydDoc);
    matchedRules.push(...whoDoc.rules, ...hydDoc.rules);

    if (duration > 4) {
      flags.push(`Food held at ambient temperature for ${duration} hours exceeds 4-hour absolute safety limit.`);
      isCleared = false;
      requiresHumanReview = true;
      recommendations.push('DO NOT REDISTRIBUTE: Discard per WHO and FSSAI 4-hour danger zone directive.');
    } else if (duration > 2) {
      flags.push(`Food has been at ambient temperature for ${duration} hours (entering 2-4 hour danger window).`);
      requiresHumanReview = true;
      recommendations.push('Expedited pickup required: Must be consumed immediately within 90 minutes.');
    }
  }

  // General Hyderabad directive
  if (!matchedDocs.some(d => d.id === 'HYD-SUMMER-CLIMATE-DIRECTIVE')) {
    const hydDoc = KNOWLEDGE_BASE.find(d => d.id === 'HYD-SUMMER-CLIMATE-DIRECTIVE')!;
    matchedDocs.push(hydDoc);
  }

  // Allergen document
  const allergenDoc = KNOWLEDGE_BASE.find(d => d.id === 'ALLERGEN-DECLARATION-MANDATE')!;
  matchedDocs.push(allergenDoc);

  return {
    documents: Array.from(new Set(matchedDocs)),
    matchedRules,
    safetyAssessment: {
      isCleared,
      requiresHumanReview,
      flags,
      recommendations
    }
  };
}
