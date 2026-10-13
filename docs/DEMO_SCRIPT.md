# FoodRescue AI — Hackathon Live Demonstration Script (5-Minute Walkthrough)

## Overview & Demo Checklist
- **App URL**: `http://localhost:8080`
- **Target Audience**: Hackathon judges, logistics coordinators, public health officials
- **Key Message**: Autonomous multi-agent coordination transforms messy surplus food intake into rapid, safe, regulatory-compliant redistribution in under 5 minutes.

---

## ⏱ Minute 0:00 - 1:00 | The Surplus Intake Crisis & Gemini Extraction

### Script / Action:
1. **Open the browser at `http://localhost:8080`**.
2. Point out the top bar:
   - Universal Role Switcher: **[Donor]**, **[NGO / Recipient]**, **[Volunteer]**, **[Coordinator]**
   - Active Mesh: **Hyderabad Metro Mesh**
   - Model badge: **Powered by Gemini 2.5 Flash on Vertex AI**
3. Select the **Donor View**.
4. Click the quick sample pill:
   > *"Paradise Biryani: 60 portions of hot chicken biryani and vegetable pulao left from our lunch banquet. Kept in warmers at 64°C. Contains dairy and peanut salan. Pickup window 14:00 to 17:00 at SD Road, Secunderabad."*
5. Click **"Extract Details with Gemini"**.
6. **Show Judges**:
   - In ~300ms, Gemini 2.5 Flash extracts:
     - 60 servings
     - Categorization: Hot Cooked Meals
     - Holding temperature: **64°C**
     - Allergen breakdown: Dairy, Peanuts
     - Statutory RAG citation: **FSSAI Surplus Food Recovery Regulations, 2019, Section 4.2**
   - Highlight the regulatory check: Temperature is verified ≥60°C (compliant!).

---

## ⏱ Minute 1:00 - 2:00 | Multi-Agent Matching & Safety RAG Verification

### Script / Action:
1. Click **"Submit Donation to FoodRescue Network"**.
2. Notice the live notification and trace viewer at the bottom:
   - `IntakeAgent`: validates readiness
   - `SafetyAgent`: cross-checks WHO 2-hour rule and Telangana ambient heat guidelines
   - `DiscoveryAgent`: evaluates verified partners within delivery radius
   - `MatchingAgent`: calculates optimal meal distribution (e.g. 60 meals routed to Akshaya Patra Secunderabad Hub)
   - `CoordinationAgent`: broadcasts acceptance proposal to the shelter
3. Scroll down to the **Multi-Agent System Observability (19 Tools)** panel:
   - Expand the latest trace: show judges the exact tool called (`calculateAllocationPlan`), JSON input params, latency in ms, and next recommended action.

---

## ⏱ Minute 2:00 - 3:00 | Multi-Role Handoff (NGO & Volunteer)

### Script / Action:
1. Click the top role switcher tab: **[NGO / Recipient]**.
2. Notice the incoming proposal card for **Akshaya Patra Mega Community Hub**:
   - Proposed: 60 meals
   - Shows storage condition: HOT (64°C)
   - Explain: *"Shelters can accept full allocations, or use the quantity slider for partial acceptance if storage is tight."*
3. Click **"Accept 60 Meals"**.
4. Switch immediately to **[Volunteer]** view:
   - Volunteer **Vikram Reddy** (Two-Wheeler, capacity 30) or **Snoor Jahan** (Mini Van, capacity 150) receives the dispatch!
   - Snoor has insulated thermal containers matching the hot biryani requirement.
5. Click **"Accept Pickup Job"**.

---

## ⏱ Minute 3:00 - 4:00 | Physical Verification, Transit, and Resilience (Scenarios 3 & 4)

### Script / Action:
1. In the **Volunteer View**:
   - Show the physical pickup form: **Verified Temp: 64°C**.
   - Click **"Confirm Pickup (Start Transit)"**.
   - Notice status changes to `IN_TRANSIT`.
2. Demonstrate **Failure Recovery**:
   - Select **"Scenario 4: Volunteer Cancellation"** from the top Demo Scenario dropdown.
   - Explain: *"What happens if a volunteer gets a flat tire mid-route?"*
   - Show how the system marks the assignment `CANCELLED`, prevents ghost deliveries, updates the mission state to `AWAITING_TRANSPORT`, and triggers the Coordination Agent to re-route a replacement driver without losing the donation record!

---

## ⏱ Minute 4:00 - 5:00 | Coordinator Command Center & Reset

### Script / Action:
1. Switch to **[Coordinator]** view:
   - Show the central dispatch dashboard:
     - Total Rescued Meals counter
     - Active Missions
     - Pending Approvals & Blockers
     - Gemini synthesized situation summary: *"All FSSAI temperature and vehicle specs confirmed compliant. Dispatch authorized."*
     - Live immutable audit event stream with timestamped actor tags (`DONOR`, `AGENT`, `NGO`, `VOLUNTEER`, `COORDINATOR`).
2. Click **"View Regulatory Knowledge & RAG Rules"** at the top right:
   - Show judges the embedded statutory database: FSSAI 2019, WHO Danger Zone rules, and Good Samaritan legal protections.
3. Click **"Reset Demo"**:
   - Database instantly returns to its clean initial state in under 50ms.

---

## Summary Wrap-Up for Judges:
> *"FoodRescue AI bridges the gap between commercial surplus and community hunger by combining Gemini 2.5 Flash's real-time multimodal intelligence with rigorous logistics constraints and legal safety standards."*
