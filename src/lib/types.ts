export type DonationStatus =
  | 'DRAFT'
  | 'NEEDS_INFORMATION'
  | 'READY_FOR_REVIEW'
  | 'SEARCHING'
  | 'AWAITING_RECIPIENT_RESPONSE'
  | 'AWAITING_TRANSPORT'
  | 'AWAITING_APPROVAL'
  | 'RESERVED'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'ON_HOLD'
  | 'PARTIALLY_ALLOCATED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'FAILED';

export type MissionStatus =
  | 'PLANNING'
  | 'MATCHING'
  | 'AWAITING_CONFIRMATION'
  | 'AWAITING_TRANSPORT'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'CANCELLED';

export type StorageCondition = 'HOT' | 'COLD' | 'AMBIENT' | 'FROZEN';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface FoodItem {
  id: string;
  name: string;
  category: 'Cooked Meals' | 'Bakery' | 'Produce' | 'Dairy' | 'Packaged' | 'Mixed Buffet';
  quantity: number;
  unit: 'meals' | 'servings' | 'kg' | 'boxes';
  preparedAt?: string;
  expiryTime?: string;
  allergens: string[];
  storageReq: StorageCondition;
  temperatureCelsius?: number;
}

export interface SafetyReview {
  isCleared: boolean;
  requiresHumanReview: boolean;
  flags: string[];
  storageGuidelineCited?: string;
  citationId?: string;
  notes: string;
  reviewedAt: string;
}

export interface Donor {
  id: string;
  name: string;
  type: 'Restaurant' | 'Hotel' | 'Wedding Hall' | 'Corporate Cafeteria' | 'Event Venue';
  address: string;
  coordinates: Coordinates;
  phone: string;
  verified: boolean;
  demo: boolean;
}

export interface Donation {
  id: string;
  donorId: string;
  donorName: string;
  title: string;
  rawText?: string;
  foodItems: FoodItem[];
  totalQuantity: number;
  remainingQuantity: number;
  dietaryTags: string[]; // 'Halal', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Eggless', 'Non-Veg'
  allergenNotes: string;
  preparationTime: string;
  expiryTime: string;
  storageConditions: StorageCondition;
  currentTempCelsius?: number;
  pickupWindow: {
    start: string;
    end: string;
  };
  pickupAddress: string;
  coordinates: Coordinates;
  status: DonationStatus;
  safetyReview: SafetyReview;
  createdAt: string;
  updatedAt: string;
}

export interface RecipientOrganization {
  id: string;
  name: string;
  type: 'NGO' | 'Shelter' | 'Food Bank' | 'Community Kitchen' | 'Orphanage';
  address: string;
  coordinates: Coordinates;
  capacityMaxMeals: number;
  currentOccupancy: number;
  dietaryAcceptance: string[]; // Types accepted
  operatingHours: {
    open: string;
    close: string;
  };
  contactPerson: string;
  contactPhone: string;
  isVerifiedPartner: boolean;
  isPlacesLead: boolean;
  isAvailableNow: boolean;
  unavailableReason?: string;
  demo: boolean;
}

export interface RecipientNeed {
  id: string;
  recipientId: string;
  mealQuantityNeeded: number;
  dietaryPreferences: string[];
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  neededBy: string;
  status: 'OPEN' | 'MATCHED' | 'FULFILLED';
}

export type RecipientResponseStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'NO_RESPONSE' | 'PARTIAL';

export interface RecipientResponse {
  id: string;
  donationId: string;
  recipientId: string;
  recipientName: string;
  status: RecipientResponseStatus;
  acceptedQuantity: number;
  pickupAvailableFrom?: string;
  pickupAvailableTo?: string;
  rejectionReason?: string;
  notes?: string;
  respondedAt?: string;
}

export interface VehicleCapacity {
  meals: number;
  volumeLiters: number;
  hasColdStorage: boolean;
  maxDistanceKm: number;
}

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'Electric Two-Wheeler' | 'Auto' | 'Car' | 'Mini Van' | 'Refrigerated Van';
  capacityMeals: number;
  hasColdStorage: boolean;
  currentCoordinates: Coordinates;
  isAvailable: boolean;
  activeAssignmentId?: string;
  demo: boolean;
}

export type TransportAssignmentStatus = 'PROPOSED' | 'ACCEPTED' | 'DECLINED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export interface TransportAssignment {
  id: string;
  missionId: string;
  donationId: string;
  volunteerId: string;
  volunteerName: string;
  vehicleType: string;
  pickupTimeWindow: {
    start: string;
    end: string;
  };
  estimatedPickupTime?: string;
  estimatedDeliveryTime?: string;
  status: TransportAssignmentStatus;
  actualPickupTime?: string;
  actualDeliveryTime?: string;
  pickupVerifiedTemp?: number;
  deliveryReceivedQuantity?: number;
  cancellationReason?: string;
  cancelledByRole?: 'VOLUNTEER' | 'COORDINATOR' | 'SYSTEM';
}

export type AllocationStatus = 'PROPOSED' | 'APPROVED' | 'RESERVED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';

export interface Allocation {
  id: string;
  missionId: string;
  donationId: string;
  recipientId: string;
  recipientName: string;
  allocatedMeals: number;
  status: AllocationStatus;
  approvedAt?: string;
  approvedBy?: string;
}

export interface MissionEvent {
  id: string;
  missionId: string;
  timestamp: string;
  actorRole: 'DONOR' | 'NGO' | 'VOLUNTEER' | 'COORDINATOR' | 'AGENT' | 'SYSTEM';
  eventType: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface Mission {
  id: string;
  donationId: string;
  title: string;
  status: MissionStatus;
  allocations: Allocation[];
  transportAssignments: TransportAssignment[];
  recipientResponses: RecipientResponse[];
  reasoningSummary: string;
  agentRecommendations: string[];
  blockers: string[];
  events: MissionEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  source: string;
  authority: 'FSSAI' | 'WHO' | 'Good Samaritan Law' | 'City Health Directive';
  category: 'Storage' | 'Temperature' | 'Transport' | 'Liability' | 'Allergens';
  content: string;
  excerpt: string;
  rules: string[];
}

export interface AgentExecutionTrace {
  id: string;
  missionId?: string;
  timestamp: string;
  agentName: 'IntakeAgent' | 'DiscoveryAgent' | 'SafetyAgent' | 'MatchingAgent' | 'CoordinationAgent';
  toolCalled: string;
  inputParams: Record<string, unknown>;
  status: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  resultSummary: string;
  nextRecommendedAction: string;
  executionDurationMs: number;
  error?: string;
}

export interface DatabaseState {
  donors: Donor[];
  donations: Donation[];
  recipients: RecipientOrganization[];
  needs: RecipientNeed[];
  responses: RecipientResponse[];
  volunteers: Volunteer[];
  missions: Mission[];
  traces: AgentExecutionTrace[];
  events: MissionEvent[];
  knowledge: KnowledgeDocument[];
}
