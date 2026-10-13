import fs from 'fs';
import path from 'path';
import { DatabaseState, Donation, Mission, RecipientResponse, TransportAssignment, Allocation, AgentExecutionTrace, MissionEvent, RecipientOrganization, Volunteer } from './types';
import { getInitialDatabaseState } from './seed-data';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'foodrescue_db.json');

class DatabaseManager {
  private state: DatabaseState | null = null;
  private isSaving = false;

  constructor() {
    this.ensureDataDir();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  public getState(): DatabaseState {
    if (this.state) {
      return this.state;
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.state = JSON.parse(raw);
        return this.state!;
      } catch (err) {
        console.error('Failed to parse database file, resetting to initial state:', err);
      }
    }

    this.state = getInitialDatabaseState();
    this.saveState();
    return this.state;
  }

  public saveState(): void {
    if (!this.state) return;
    this.ensureDataDir();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(this.state, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public reset(): DatabaseState {
    this.state = getInitialDatabaseState();
    this.saveState();
    return this.state;
  }

  // Record Agent Traces
  public addTrace(trace: Omit<AgentExecutionTrace, 'id' | 'timestamp'>): AgentExecutionTrace {
    const fullTrace: AgentExecutionTrace = {
      ...trace,
      id: `trace-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    const s = this.getState();
    s.traces.unshift(fullTrace);
    // Keep max 100 traces
    if (s.traces.length > 100) s.traces.pop();
    this.saveState();
    return fullTrace;
  }

  // Record Mission Events
  public addEvent(missionId: string, event: Omit<MissionEvent, 'id' | 'missionId' | 'timestamp'>): MissionEvent {
    const fullEvent: MissionEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      missionId,
      timestamp: new Date().toISOString()
    };
    const s = this.getState();
    s.events.unshift(fullEvent);
    const mission = s.missions.find(m => m.id === missionId);
    if (mission) {
      mission.events.unshift(fullEvent);
      mission.updatedAt = new Date().toISOString();
    }
    this.saveState();
    return fullEvent;
  }

  public loadScenario(scenarioId: string): { success: boolean; scenarioName: string; description: string } {
    const s = this.reset();

    if (scenarioId === 'scenario-success') {
      return {
        success: true,
        scenarioName: 'Successful Distribution (Happy Path)',
        description: 'Paradise Biryani 60 hot meals ready for extraction, matching, approval, and live pickup/delivery.'
      };
    }

    if (scenarioId === 'scenario-no-ngo') {
      // Scenario 2: Remote location with strict dietary condition (e.g. 80 meals strictly Kosher/specialized in Medchal)
      const donation = s.donations[0];
      donation.id = 'donation-scenario-no-ngo';
      donation.title = '80 Portions Ultra-Niche Specialized Vegan Meals (Medchal Outskirts)';
      donation.coordinates = { lat: 17.6200, lng: 78.4800 }; // 25km north
      donation.pickupAddress = 'Medchal Industrial Corridor, Hyderabad North';
      donation.dietaryTags = ['Vegan', 'Kosher Certified', 'Nut-Free'];
      donation.status = 'ON_HOLD';

      const mission = s.missions[0];
      mission.id = 'mission-scenario-no-ngo';
      mission.donationId = donation.id;
      mission.status = 'BLOCKED';
      mission.blockers = [
        'Geographic search expanded to 25km: Zero verified partner shelters match both Vegan+Kosher dietary certification and open night intake.',
        'Prerana Kitchen is closed for renovation; nearby municipal shelters only accept standard Cooked Meals.'
      ];
      mission.agentRecommendations = [
        'Donation placed ON_HOLD. Recheck volunteer cold-chain transport for 40km cross-city transfer to central kitchen, or suggest local community pantry pickup.'
      ];
      mission.reasoningSummary = 'Discovery Agent searched 5 registered NGOs. 0 matches found within safe transit time. Blocker surfaced to coordinator without automatic false success.';

      this.addTrace({
        missionId: mission.id,
        agentName: 'DiscoveryAgent',
        toolCalled: 'findRegisteredRecipients',
        inputParams: { coords: donation.coordinates, dietaryTags: donation.dietaryTags, radiusKm: 25 },
        status: 'BLOCKED',
        resultSummary: '0 matching recipients found within 25km radius for Kosher/Vegan specialized constraints.',
        nextRecommendedAction: 'Place donation ON_HOLD and alert Human Coordinator for manual exception.',
        executionDurationMs: 310
      });

      this.saveState();
      return {
        success: true,
        scenarioName: 'No Suitable NGO Available',
        description: 'Simulates a donation in an expanded radius with dietary mismatch where agent reports blockers and holds without fake success.'
      };
    }

    if (scenarioId === 'scenario-ngo-rejected') {
      // Scenario 3: NGO Rejection
      const donation = s.donations[0];
      const mission = s.missions[0];
      donation.status = 'AWAITING_RECIPIENT_RESPONSE';
      mission.status = 'MATCHING';

      // Seed Robin Hood rejection
      const rejResponse: RecipientResponse = {
        id: 'resp-rej-01',
        donationId: donation.id,
        recipientId: 'recip-robinhood-begumpet',
        recipientName: '[DEMO] Robin Hood Army Shelter & Care Center',
        status: 'REJECTED',
        acceptedQuantity: 0,
        rejectionReason: 'Daily meal quota already fulfilled by afternoon wedding donation. Zero storage space remaining.',
        respondedAt: new Date().toISOString()
      };
      s.responses.push(rejResponse);
      mission.recipientResponses.push(rejResponse);
      mission.reasoningSummary = 'Robin Hood Army rejected request (storage full). Coordination Agent detected rejection and recomputed allocation to Akshaya Patra Hub.';
      mission.agentRecommendations = [
        'Reroute entire 60-meal allocation to Akshaya Patra Foundation Hub (Secunderabad), which has 120 meal open capacity.',
        'Request volunteer dispatch once Akshaya Patra confirms.'
      ];

      this.addEvent(mission.id, {
        actorRole: 'NGO',
        eventType: 'RECIPIENT_REJECTED',
        description: 'Robin Hood Army rejected the donation request: Daily meal quota already fulfilled.'
      });

      this.addTrace({
        missionId: mission.id,
        agentName: 'CoordinationAgent',
        toolCalled: 'replanMission',
        inputParams: { triggerReason: 'NGO_REJECTION', rejectedRecipientId: 'recip-robinhood-begumpet' },
        status: 'SUCCESS',
        resultSummary: 'Removed Robin Hood Army. Recomputed feasible recipient: Akshaya Patra Foundation Hub (capacity: 200).',
        nextRecommendedAction: 'Send requestRecipientAcceptance to Akshaya Patra Foundation Hub.',
        executionDurationMs: 240
      });

      this.saveState();
      return {
        success: true,
        scenarioName: 'Recipient Rejection & Replanning',
        description: 'Robin Hood Army rejected the request. Coordination Agent detected rejection, removed recipient, and recomputed alternative allocation.'
      };
    }

    if (scenarioId === 'scenario-volunteer-cancelled') {
      // Scenario 4: Volunteer cancellation
      const donation = s.donations[0];
      const mission = s.missions[0];
      donation.status = 'AWAITING_TRANSPORT';
      mission.status = 'AWAITING_CONFIRMATION';

      // Accepted allocation to Akshaya Patra
      const alloc: Allocation = {
        id: 'alloc-01',
        missionId: mission.id,
        donationId: donation.id,
        recipientId: 'recip-akshaya-sec',
        recipientName: '[DEMO] Akshaya Patra Mega Community Hub',
        allocatedMeals: 60,
        status: 'PROPOSED'
      };
      mission.allocations.push(alloc);

      // Cancelled assignment
      const cancelledAssignment: TransportAssignment = {
        id: 'trans-cancel-01',
        missionId: mission.id,
        donationId: donation.id,
        volunteerId: 'vol-snoor-minivan',
        volunteerName: '[DEMO] Snoor Jahan',
        vehicleType: 'Mini Van',
        pickupTimeWindow: { start: '15:00', end: '16:00' },
        status: 'CANCELLED',
        cancellationReason: 'Vehicle flat tire on Begumpet flyover. Unable to proceed with pickup.',
        cancelledByRole: 'VOLUNTEER'
      };
      mission.transportAssignments.push(cancelledAssignment);
      mission.blockers = [
        'Volunteer Snoor Jahan cancelled due to vehicle breakdown. Pickup assignment invalidated.'
      ];
      mission.agentRecommendations = [
        'Reassign transport to Vikram Reddy (Electric Two-Wheeler) for two quick split trips OR dispatch Ramesh Verma (Refrigerated Van).'
      ];
      mission.reasoningSummary = 'Transport plan invalidated due to volunteer cancellation. Coordination Agent flagged replacement need to avoid hot-holding breach.';

      this.addEvent(mission.id, {
        actorRole: 'VOLUNTEER',
        eventType: 'ASSIGNMENT_CANCELLED',
        description: 'Volunteer Snoor Jahan cancelled assignment: Vehicle flat tire on Begumpet flyover.'
      });

      this.addTrace({
        missionId: mission.id,
        agentName: 'CoordinationAgent',
        toolCalled: 'cancelAssignment',
        inputParams: { assignmentId: 'trans-cancel-01', reason: 'Flat tire' },
        status: 'SUCCESS',
        resultSummary: 'Assignment marked CANCELLED. Volunteer released. Mission placed in AWAITING_TRANSPORT.',
        nextRecommendedAction: 'Invoke findAvailableVolunteers to match alternative driver.',
        executionDurationMs: 190
      });

      this.saveState();
      return {
        success: true,
        scenarioName: 'Volunteer Cancellation & Recovery',
        description: 'Assigned driver cancelled. Mission transport invalidated and Coordination Agent proposes available replacement.'
      };
    }

    if (scenarioId === 'scenario-partial-allocation') {
      // Scenario 5: Partial allocation (100 meals offered, shelter only takes 65)
      const donation = s.donations[0];
      donation.title = '100 Portions Freshly Packed Meals from TechMahindra';
      donation.totalQuantity = 100;
      donation.remainingQuantity = 35; // 65 assigned, 35 remaining
      donation.status = 'PARTIALLY_ALLOCATED';

      const mission = s.missions[0];
      mission.status = 'AWAITING_APPROVAL';
      mission.allocations = [
        {
          id: 'alloc-partial-01',
          missionId: mission.id,
          donationId: donation.id,
          recipientId: 'recip-robinhood-begumpet',
          recipientName: '[DEMO] Robin Hood Army Shelter & Care Center',
          allocatedMeals: 65,
          status: 'PROPOSED'
        }
      ];
      mission.reasoningSummary = 'Recipient capacity capped at 65 meals. Allocated 65 meals. 35 meals remaining cleanly preserved in donor pool for secondary distribution.';
      mission.agentRecommendations = [
        'Approve 65 meals for Robin Hood Army.',
        'Secondary match underway for remaining 35 meals to Aman Vedika Childrens Home (needs 35 meals).'
      ];

      this.addTrace({
        missionId: mission.id,
        agentName: 'MatchingAgent',
        toolCalled: 'calculateAllocationPlan',
        inputParams: { totalMeals: 100, recipientCapacity: 65 },
        status: 'SUCCESS',
        resultSummary: 'Allocated 65 meals to Robin Hood Army. 35 meals unallocated. No over-allocation.',
        nextRecommendedAction: 'Seek coordinator approval for 65-meal split and match remaining 35 meals.',
        executionDurationMs: 220
      });

      this.saveState();
      return {
        success: true,
        scenarioName: 'Partial Allocation (65 / 35)',
        description: 'Demonstrates strict non-over-allocation: 65 meals allocated to shelter at capacity, 35 remaining explicitly tracked for secondary recipient.'
      };
    }

    if (scenarioId === 'scenario-safety-uncertain') {
      // Scenario 6: Missing handling data / >3.5 hrs ambient duration
      const donation = s.donations[0];
      donation.title = 'Unlabeled Banquet Leftovers (Ambient Storage)';
      donation.storageConditions = 'AMBIENT';
      delete donation.currentTempCelsius;
      donation.preparationTime = '11:00'; // 4 hours ago!
      donation.status = 'NEEDS_INFORMATION';
      donation.safetyReview = {
        isCleared: false,
        requiresHumanReview: true,
        flags: [
          'Preparation time indicates food held at ambient temperature for >3.5 hours in Hyderabad climate (>32°C).',
          'Current food temperature and allergen declarations missing.',
          'Approaching WHO 4-hour absolute danger zone limit.'
        ],
        storageGuidelineCited: 'HYD-SUMMER-CLIMATE-DIRECTIVE',
        citationId: 'GHMC & State Health Directorate Food Rescue Circular #11/2023',
        notes: 'Mandatory Coordinator Intervention Required: Inspect food smell/appearance and verify cooking temperature before dispatch.',
        reviewedAt: new Date().toISOString()
      };

      const mission = s.missions[0];
      mission.status = 'BLOCKED';
      mission.blockers = [
        'Food safety clearance withheld: Ambient holding duration exceeds 3 hours without recorded temperature log.',
        'System policy prevents automated NGO dispatch for unverified ambient cooked foods.'
      ];
      mission.agentRecommendations = [
        'Coordinator must contact donor to confirm whether food was chilled or continuously hot-held.',
        'If confirmed ambient for >4 hours, food must be responsibly composted per FSSAI regulations.'
      ];

      this.addTrace({
        missionId: mission.id,
        agentName: 'SafetyAgent',
        toolCalled: 'retrieveDonationGuidelines',
        inputParams: { storageCondition: 'AMBIENT', durationHours: 3.5 },
        status: 'BLOCKED',
        resultSummary: 'Flagged safety hazard: Ambient storage in Hyderabad heat approaching 4-hour threshold. Human review mandatory.',
        nextRecommendedAction: 'Halt automated allocation until human coordinator verifies safety.',
        executionDurationMs: 270
      });

      this.saveState();
      return {
        success: true,
        scenarioName: 'Food Safety Uncertainty & Human Review',
        description: 'Demonstrates safety guardrails: Ambient food near danger zone cannot be auto-dispatched without human coordinator signoff and temperature verification.'
      };
    }

    this.saveState();
    return {
      success: true,
      scenarioName: 'Default State',
      description: 'Reset to default clean state.'
    };
  }
}

export const db = new DatabaseManager();
