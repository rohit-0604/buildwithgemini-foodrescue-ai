import {
  Donor,
  RecipientOrganization,
  RecipientNeed,
  Volunteer,
  Donation,
  Mission,
  AgentExecutionTrace,
  MissionEvent,
  DatabaseState
} from './types';
import { KNOWLEDGE_BASE } from './rag';

export const INITIAL_DONORS: Donor[] = [
  {
    id: 'donor-paradise-sec',
    name: '[DEMO] Paradise Biryani & Banquets',
    type: 'Restaurant',
    address: 'SD Road, Secunderabad, Hyderabad, TS 500003',
    coordinates: { lat: 17.4411, lng: 78.4983 },
    phone: '+91 40 6666 7777',
    verified: true,
    demo: true
  },
  {
    id: 'donor-novotel-hicc',
    name: '[DEMO] Novotel HICC Cyberabad',
    type: 'Hotel',
    address: 'Near Hitec City, Madhapur, Hyderabad, TS 500081',
    coordinates: { lat: 17.4727, lng: 78.3728 },
    phone: '+91 40 6682 4422',
    verified: true,
    demo: true
  },
  {
    id: 'donor-kalyan-begumpet',
    name: '[DEMO] Kalyan Shadi Mandapam Begumpet',
    type: 'Wedding Hall',
    address: 'Begumpet Main Road, Hyderabad, TS 500016',
    coordinates: { lat: 17.4435, lng: 78.4682 },
    phone: '+91 40 2776 1122',
    verified: true,
    demo: true
  },
  {
    id: 'donor-techm-cafeteria',
    name: '[DEMO] TechMahindra Cafeteria Campus',
    type: 'Corporate Cafeteria',
    address: 'Hitec City Phase II, Madhapur, Hyderabad, TS 500081',
    coordinates: { lat: 17.4483, lng: 78.3789 },
    phone: '+91 40 6688 2000',
    verified: true,
    demo: true
  }
];

export const INITIAL_RECIPIENTS: RecipientOrganization[] = [
  {
    id: 'recip-akshaya-sec',
    name: '[DEMO] Akshaya Patra Mega Community Hub',
    type: 'NGO',
    address: 'Station Road, Secunderabad, Hyderabad, TS 500003',
    coordinates: { lat: 17.4365, lng: 78.5021 },
    capacityMaxMeals: 200,
    currentOccupancy: 80,
    dietaryAcceptance: ['Vegetarian', 'Non-Veg', 'Halal', 'Mixed Buffet'],
    operatingHours: { open: '08:00', close: '22:00' },
    contactPerson: 'Srinivas Rao (NGO Coordinator)',
    contactPhone: '+91 98490 12345',
    isVerifiedPartner: true,
    isPlacesLead: false,
    isAvailableNow: true,
    demo: true
  },
  {
    id: 'recip-robinhood-begumpet',
    name: '[DEMO] Robin Hood Army Shelter & Care Center',
    type: 'Shelter',
    address: 'Prakash Nagar, Begumpet, Hyderabad, TS 500016',
    coordinates: { lat: 17.4468, lng: 78.4619 },
    capacityMaxMeals: 60,
    currentOccupancy: 15,
    dietaryAcceptance: ['Vegetarian', 'Halal', 'Cooked Meals'],
    operatingHours: { open: '09:00', close: '21:30' },
    contactPerson: 'Kavita Nair (Distribution Lead)',
    contactPhone: '+91 98480 54321',
    isVerifiedPartner: true,
    isPlacesLead: false,
    isAvailableNow: true,
    demo: true
  },
  {
    id: 'recip-aman-vedika-nampally',
    name: '[DEMO] Aman Vedika Childrens Home',
    type: 'Orphanage',
    address: 'Station Road, Nampally, Hyderabad, TS 500001',
    coordinates: { lat: 17.3916, lng: 78.4688 },
    capacityMaxMeals: 40,
    currentOccupancy: 10,
    dietaryAcceptance: ['Vegetarian', 'Eggless'],
    operatingHours: { open: '08:00', close: '20:00' },
    contactPerson: 'Sister Mary Teresa',
    contactPhone: '+91 94401 98765',
    isVerifiedPartner: true,
    isPlacesLead: false,
    isAvailableNow: true,
    demo: true
  },
  {
    id: 'recip-hyd-city-mission-koti',
    name: '[DEMO] Hyderabad City Mission Night Shelter',
    type: 'Shelter',
    address: 'Bank Street, Koti, Hyderabad, TS 500095',
    coordinates: { lat: 17.3850, lng: 78.4867 },
    capacityMaxMeals: 80,
    currentOccupancy: 25,
    dietaryAcceptance: ['Vegetarian', 'Non-Veg', 'Halal', 'Cooked Meals'],
    operatingHours: { open: '16:00', close: '23:00' },
    contactPerson: 'Mohd. Farooq (Shelter Supervisor)',
    contactPhone: '+91 93910 88776',
    isVerifiedPartner: true,
    isPlacesLead: false,
    isAvailableNow: true,
    demo: true
  },
  {
    id: 'recip-prerana-charminar',
    name: '[DEMO] Prerana Community Kitchen (Renovation)',
    type: 'Community Kitchen',
    address: 'Near Mecca Masjid, Charminar, Hyderabad, TS 500002',
    coordinates: { lat: 17.3616, lng: 78.4747 },
    capacityMaxMeals: 120,
    currentOccupancy: 0,
    dietaryAcceptance: ['Vegetarian', 'Halal'],
    operatingHours: { open: '10:00', close: '18:00' },
    contactPerson: 'Abdul Rahman',
    contactPhone: '+91 98850 11223',
    isVerifiedPartner: true,
    isPlacesLead: false,
    isAvailableNow: false,
    unavailableReason: 'Kitchen and cold storage undergoing mandatory municipal maintenance until tomorrow.',
    demo: true
  }
];

export const INITIAL_NEEDS: RecipientNeed[] = [
  {
    id: 'need-akshaya-01',
    recipientId: 'recip-akshaya-sec',
    mealQuantityNeeded: 120,
    dietaryPreferences: ['Cooked Meals', 'Halal', 'Vegetarian'],
    urgency: 'HIGH',
    neededBy: '20:30',
    status: 'OPEN'
  },
  {
    id: 'need-robinhood-01',
    recipientId: 'recip-robinhood-begumpet',
    mealQuantityNeeded: 45,
    dietaryPreferences: ['Vegetarian', 'Cooked Meals'],
    urgency: 'CRITICAL',
    neededBy: '19:00',
    status: 'OPEN'
  },
  {
    id: 'need-aman-01',
    recipientId: 'recip-aman-vedika-nampally',
    mealQuantityNeeded: 35,
    dietaryPreferences: ['Vegetarian'],
    urgency: 'MEDIUM',
    neededBy: '19:30',
    status: 'OPEN'
  },
  {
    id: 'need-koti-01',
    recipientId: 'recip-hyd-city-mission-koti',
    mealQuantityNeeded: 60,
    dietaryPreferences: ['Non-Veg', 'Halal', 'Vegetarian'],
    urgency: 'HIGH',
    neededBy: '21:00',
    status: 'OPEN'
  },
  {
    id: 'need-akshaya-02',
    recipientId: 'recip-akshaya-sec',
    mealQuantityNeeded: 80,
    dietaryPreferences: ['Bakery', 'Packaged'],
    urgency: 'LOW',
    neededBy: '22:00',
    status: 'OPEN'
  },
  {
    id: 'need-robinhood-02',
    recipientId: 'recip-robinhood-begumpet',
    mealQuantityNeeded: 25,
    dietaryPreferences: ['Cooked Meals'],
    urgency: 'MEDIUM',
    neededBy: '20:00',
    status: 'OPEN'
  }
];

export const INITIAL_VOLUNTEERS: Volunteer[] = [
  {
    id: 'vol-vikram-bike',
    name: '[DEMO] Vikram Reddy',
    phone: '+91 99890 44332',
    vehicleType: 'Electric Two-Wheeler',
    capacityMeals: 30,
    hasColdStorage: false,
    currentCoordinates: { lat: 17.4420, lng: 78.4950 },
    isAvailable: true,
    demo: true
  },
  {
    id: 'vol-snoor-minivan',
    name: '[DEMO] Snoor Jahan',
    phone: '+91 98499 77889',
    vehicleType: 'Mini Van',
    capacityMeals: 150,
    hasColdStorage: false,
    currentCoordinates: { lat: 17.4475, lng: 78.4710 },
    isAvailable: true,
    demo: true
  },
  {
    id: 'vol-ramesh-coldvan',
    name: '[DEMO] Ramesh Verma',
    phone: '+91 98765 43210',
    vehicleType: 'Refrigerated Van',
    capacityMeals: 250,
    hasColdStorage: true,
    currentCoordinates: { lat: 17.4600, lng: 78.3800 },
    isAvailable: true,
    demo: true
  }
];

export const INITIAL_DONATIONS: Donation[] = [
  {
    id: 'donation-seed-01',
    donorId: 'donor-paradise-sec',
    donorName: '[DEMO] Paradise Biryani & Banquets',
    title: '60 Portions Hot Dum Biryani & Mirchi Ka Salan',
    rawText: 'We have 60 portions of hot chicken biryani and vegetable pulao left from our corporate lunch banquet. Prepared at 1:30 PM, kept in warmers at 64°C. Need pickup by 4:30 PM at SD Road kitchen.',
    foodItems: [
      {
        id: 'fi-01',
        name: 'Hyderabadi Chicken Dum Biryani',
        category: 'Cooked Meals',
        quantity: 40,
        unit: 'meals',
        allergens: ['Dairy (Ghee)'],
        storageReq: 'HOT',
        temperatureCelsius: 64
      },
      {
        id: 'fi-02',
        name: 'Vegetable Pulao & Salan',
        category: 'Cooked Meals',
        quantity: 20,
        unit: 'meals',
        allergens: ['Peanuts (in Salan gravy)'],
        storageReq: 'HOT',
        temperatureCelsius: 63
      }
    ],
    totalQuantity: 60,
    remainingQuantity: 60,
    dietaryTags: ['Halal', 'Non-Veg', 'Vegetarian'],
    allergenNotes: 'Contains dairy (clarified butter) and peanuts in traditional salan gravy.',
    preparationTime: '13:30',
    expiryTime: '17:30',
    storageConditions: 'HOT',
    currentTempCelsius: 64,
    pickupWindow: {
      start: '14:30',
      end: '16:30'
    },
    pickupAddress: 'SD Road, Secunderabad, Hyderabad, TS 500003',
    coordinates: { lat: 17.4411, lng: 78.4983 },
    status: 'READY_FOR_REVIEW',
    safetyReview: {
      isCleared: true,
      requiresHumanReview: false,
      flags: [],
      storageGuidelineCited: 'FSSAI-SURPLUS-2019-HOT',
      citationId: 'FSSAI Surplus Food Recovery Regulations (Hot Holding Standards)',
      notes: 'Temperature 64°C complies with FSSAI ≥60°C hot-holding threshold. Distribution window within 3 hours.',
      reviewedAt: new Date().toISOString()
    },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'mission-seed-01',
    donationId: 'donation-seed-01',
    title: 'Redistribution of 60 Hot Meals from Paradise Biryani',
    status: 'MATCHING',
    allocations: [],
    transportAssignments: [],
    recipientResponses: [],
    reasoningSummary: 'Gemini Intake Specialist processed 60 hot meals. Verified FSSAI hot-holding compliance at 64°C. Ready to query nearby verified partners within Secunderabad radius.',
    agentRecommendations: [
      'Propose 45 meals to Robin Hood Army Begumpet (urgent demand) and 15 meals to Akshaya Patra Secunderabad',
      'Assign Snoor Jahan (Mini Van, capacity 150) for single-trip combined pickup'
    ],
    blockers: [],
    events: [
      {
        id: 'me-01',
        missionId: 'mission-seed-01',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        actorRole: 'DONOR',
        eventType: 'DONATION_CREATED',
        description: 'Paradise Biryani created donation of 60 meals via natural language intake.'
      },
      {
        id: 'me-02',
        missionId: 'mission-seed-01',
        timestamp: new Date(Date.now() - 3500000).toISOString(),
        actorRole: 'AGENT',
        eventType: 'INTAKE_EXTRACTED',
        description: 'Gemini extracted structured meal details, temperatures, and allergen warnings.'
      },
      {
        id: 'me-03',
        missionId: 'mission-seed-01',
        timestamp: new Date(Date.now() - 3400000).toISOString(),
        actorRole: 'AGENT',
        eventType: 'SAFETY_REVIEW_PASSED',
        description: 'Safety Agent verified 64°C hot holding against FSSAI 2019 standards.'
      }
    ],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_TRACES: AgentExecutionTrace[] = [
  {
    id: 'trace-01',
    missionId: 'mission-seed-01',
    timestamp: new Date(Date.now() - 3500000).toISOString(),
    agentName: 'IntakeAgent',
    toolCalled: 'extractDonationDetails',
    inputParams: {
      rawText: 'We have 60 portions of hot chicken biryani and vegetable pulao left from our corporate lunch banquet...'
    },
    status: 'SUCCESS',
    resultSummary: 'Extracted 2 food items, totalQuantity: 60, storage: HOT, temp: 64°C, allergens: Dairy, Peanuts',
    nextRecommendedAction: 'Invoke checkDonationReadiness and retrieveDonationGuidelines',
    executionDurationMs: 420
  },
  {
    id: 'trace-02',
    missionId: 'mission-seed-01',
    timestamp: new Date(Date.now() - 3400000).toISOString(),
    agentName: 'SafetyAgent',
    toolCalled: 'retrieveDonationGuidelines',
    inputParams: {
      foodCategory: 'Cooked Meals',
      storageCondition: 'HOT',
      temperatureCelsius: 64
    },
    status: 'SUCCESS',
    resultSummary: 'Matched FSSAI-SURPLUS-2019-HOT. Temperature compliant (≥60°C). Cleared for immediate distribution.',
    nextRecommendedAction: 'Invoke findRegisteredRecipients within 10km radius of Secunderabad',
    executionDurationMs: 180
  }
];

export function getInitialDatabaseState(): DatabaseState {
  return {
    donors: JSON.parse(JSON.stringify(INITIAL_DONORS)),
    donations: JSON.parse(JSON.stringify(INITIAL_DONATIONS)),
    recipients: JSON.parse(JSON.stringify(INITIAL_RECIPIENTS)),
    needs: JSON.parse(JSON.stringify(INITIAL_NEEDS)),
    responses: [],
    volunteers: JSON.parse(JSON.stringify(INITIAL_VOLUNTEERS)),
    missions: JSON.parse(JSON.stringify(INITIAL_MISSIONS)),
    traces: JSON.parse(JSON.stringify(INITIAL_TRACES)),
    events: JSON.parse(JSON.stringify(INITIAL_MISSIONS[0].events)),
    knowledge: JSON.parse(JSON.stringify(KNOWLEDGE_BASE))
  };
}
