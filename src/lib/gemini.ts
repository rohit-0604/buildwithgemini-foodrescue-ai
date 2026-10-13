import { GoogleGenAI, Type } from '@google/genai';
import { FoodItem, StorageCondition } from './types';

export function getGeminiClient(): GoogleGenAI {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const googleCloudProject = process.env.GOOGLE_CLOUD_PROJECT || 'qwiklabs-gcp-04-c7006b48561f';
  const googleCloudLocation = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
  const useVertex = process.env.GOOGLE_GENAI_USE_VERTEXAI === 'true' || !geminiApiKey;

  if (geminiApiKey && !useVertex) {
    return new GoogleGenAI({
      vertexai: false,
      apiKey: geminiApiKey,
    });
  }

  return new GoogleGenAI({
    vertexai: true,
    project: googleCloudProject,
    location: googleCloudLocation,
  });
}

export interface ExtractedDonationData {
  title: string;
  foodItems: Array<{
    name: string;
    category: 'Cooked Meals' | 'Bakery' | 'Produce' | 'Dairy' | 'Packaged' | 'Mixed Buffet';
    quantity: number;
    unit: 'meals' | 'servings' | 'kg' | 'boxes';
    allergens: string[];
    storageReq: StorageCondition;
    temperatureCelsius?: number;
  }>;
  totalQuantity: number;
  dietaryTags: string[];
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
  missingFields: string[];
  safetyFlags: string[];
}

export async function extractDonationFromText(rawText: string): Promise<ExtractedDonationData> {
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const systemPrompt = `You are the FoodRescue AI Intake Specialist. 
Analyze natural language food donation offers from restaurants, hotels, banquet halls, weddings, and cafeterias.
Extract structured details into clean JSON.
Be precise with quantities, temperatures, storage requirements, allergens, and timing.

Rules:
1. If the temperature is explicitly mentioned (e.g. "64°C", "65C", "4C"), extract it as a number in currentTempCelsius.
2. If storage condition is mentioned (warmers, hot, chilled, fridge, ambient, room temp), map to HOT, COLD, AMBIENT, or FROZEN.
3. Identify all dietary tags (Vegetarian, Non-Veg, Halal, Vegan, Eggless).
4. Identify allergens (Peanuts, Tree nuts, Dairy/Ghee, Gluten, Soy, Shellfish).
5. If critical safety information is missing (such as current temperature for hot cooked food, preparation time, or allergens), list them in missingFields.
6. If food has been sitting at ambient temperature for >2 hours or temperature is below 60°C for hot food, add an entry to safetyFlags.

Output JSON with this exact structure:
{
  "title": "short descriptive title",
  "foodItems": [
    {
      "name": "item name",
      "category": "Cooked Meals" | "Bakery" | "Produce" | "Dairy" | "Packaged" | "Mixed Buffet",
      "quantity": number,
      "unit": "meals" | "servings" | "kg" | "boxes",
      "allergens": ["allergen names"],
      "storageReq": "HOT" | "COLD" | "AMBIENT" | "FROZEN",
      "temperatureCelsius": number or null
    }
  ],
  "totalQuantity": number,
  "dietaryTags": ["tags"],
  "allergenNotes": "summary of allergens or 'None declared'",
  "preparationTime": "time or HH:MM",
  "expiryTime": "time or HH:MM",
  "storageConditions": "HOT" | "COLD" | "AMBIENT" | "FROZEN",
  "currentTempCelsius": number or null,
  "pickupWindow": {
    "start": "HH:MM",
    "end": "HH:MM"
  },
  "pickupAddress": "address mentioned or 'On-site pickup'",
  "missingFields": ["any missing items"],
  "safetyFlags": ["any warnings"]
}`;

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nDonation text to analyze:\n"${rawText}"` }]
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Validate and clean
    return {
      title: parsed.title || 'Surplus Food Donation',
      foodItems: Array.isArray(parsed.foodItems) ? parsed.foodItems : [],
      totalQuantity: Number(parsed.totalQuantity) || (parsed.foodItems ? parsed.foodItems.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 0), 0) : 50),
      dietaryTags: Array.isArray(parsed.dietaryTags) ? parsed.dietaryTags : ['Cooked Meals'],
      allergenNotes: parsed.allergenNotes || 'No allergens specified',
      preparationTime: parsed.preparationTime || '13:00',
      expiryTime: parsed.expiryTime || '18:00',
      storageConditions: (['HOT', 'COLD', 'AMBIENT', 'FROZEN'].includes(parsed.storageConditions) ? parsed.storageConditions : 'HOT') as StorageCondition,
      currentTempCelsius: typeof parsed.currentTempCelsius === 'number' ? parsed.currentTempCelsius : undefined,
      pickupWindow: {
        start: parsed.pickupWindow?.start || '14:00',
        end: parsed.pickupWindow?.end || '17:00'
      },
      pickupAddress: parsed.pickupAddress || 'Hyderabad, Telangana',
      missingFields: Array.isArray(parsed.missingFields) ? parsed.missingFields : [],
      safetyFlags: Array.isArray(parsed.safetyFlags) ? parsed.safetyFlags : []
    };
  } catch (err: any) {
    console.warn('Gemini extraction fallback engaged due to:', err.message);
    // Deterministic fallback parser
    return fallbackExtraction(rawText);
  }
}

function fallbackExtraction(rawText: string): ExtractedDonationData {
  const lower = rawText.toLowerCase();

  // Extract meal quantity
  const qtyMatch = rawText.match(/(\d+)\s*(portions|meals|servings|plates|boxes|kg)/i) || rawText.match(/(\d+)/);
  const totalQuantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 60;

  // Extract temperature
  const tempMatch = rawText.match(/(\d+)\s*(°?C|celsius|degrees)/i);
  const temp = tempMatch ? parseInt(tempMatch[1], 10) : undefined;

  // Determine storage condition
  let storage: StorageCondition = 'HOT';
  if (lower.includes('fridge') || lower.includes('chilled') || lower.includes('cold') || lower.includes('salad') || lower.includes('dairy')) {
    storage = 'COLD';
  } else if (lower.includes('ambient') || lower.includes('room temp') || lower.includes('bakery')) {
    storage = 'AMBIENT';
  } else if (lower.includes('frozen')) {
    storage = 'FROZEN';
  }

  // Dietary tags
  const dietaryTags: string[] = [];
  if (lower.includes('biryani') || lower.includes('chicken') || lower.includes('meat') || lower.includes('non-veg')) {
    dietaryTags.push('Non-Veg', 'Halal');
  }
  if (lower.includes('veg') || lower.includes('pulao') || lower.includes('paneer') || lower.includes('dal')) {
    dietaryTags.push('Vegetarian');
  }
  if (dietaryTags.length === 0) dietaryTags.push('Cooked Meals');

  // Allergens
  const allergens: string[] = [];
  if (lower.includes('ghee') || lower.includes('dairy') || lower.includes('paneer') || lower.includes('curd')) allergens.push('Dairy (Ghee/Milk)');
  if (lower.includes('peanut') || lower.includes('salan') || lower.includes('nuts')) allergens.push('Peanuts / Tree Nuts');
  if (lower.includes('gluten') || lower.includes('roti') || lower.includes('bread') || lower.includes('naan')) allergens.push('Gluten');

  // Missing fields
  const missingFields: string[] = [];
  if (temp === undefined && storage === 'HOT') missingFields.push('Food Holding Temperature');
  if (!lower.includes('prepared') && !lower.includes('am') && !lower.includes('pm')) missingFields.push('Exact Preparation Time');
  if (allergens.length === 0 && !lower.includes('allergen')) missingFields.push('Allergen Declaration Confirmation');

  const safetyFlags: string[] = [];
  if (temp !== undefined && temp < 60 && storage === 'HOT') {
    safetyFlags.push(`Holding temperature ${temp}°C is below FSSAI standard (60°C).`);
  }

  return {
    title: `${totalQuantity} Portions Surplus Food Donation`,
    foodItems: [
      {
        name: lower.includes('biryani') ? 'Biryani & Accompaniments' : 'Cooked Meals',
        category: 'Cooked Meals',
        quantity: totalQuantity,
        unit: 'meals',
        allergens,
        storageReq: storage,
        temperatureCelsius: temp
      }
    ],
    totalQuantity,
    dietaryTags,
    allergenNotes: allergens.length > 0 ? `Contains: ${allergens.join(', ')}` : 'None declared',
    preparationTime: '13:00',
    expiryTime: '17:00',
    storageConditions: storage,
    currentTempCelsius: temp,
    pickupWindow: {
      start: '14:00',
      end: '16:30'
    },
    pickupAddress: 'Secunderabad / Hyderabad central pickup',
    missingFields,
    safetyFlags
  };
}

export async function generateAgentCoordinationSummary(params: {
  missionTitle: string;
  totalMeals: number;
  remainingMeals: number;
  allocatedMeals: number;
  recipientResponses: Array<{ recipientName: string; status: string; acceptedQuantity: number }>;
  transportStatus: string;
  safetyFlags: string[];
}): Promise<{ reasoning: string; recommendations: string[]; blockers: string[] }> {
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const prompt = `You are the FoodRescue AI Coordinator Agent.
Summarize the current redistribution mission status and propose safe, deterministic next actions.

Context:
Mission: "${params.missionTitle}"
Total Meals: ${params.totalMeals}
Allocated: ${params.allocatedMeals}
Remaining Unallocated: ${params.remainingMeals}
Recipient Responses: ${JSON.stringify(params.recipientResponses)}
Transport Status: ${params.transportStatus}
Safety Flags: ${JSON.stringify(params.safetyFlags)}

Provide JSON response:
{
  "reasoning": "1-2 sentence assessment of operational feasibility and safety constraints",
  "recommendations": ["actionable recommendations for coordinator or next agent tool"],
  "blockers": ["any unresolved constraints or pending confirmations"]
}`;

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });

    const parsed = JSON.parse(response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}');
    return {
      reasoning: parsed.reasoning || `Mission actively managing ${params.totalMeals} meals across verified partners.`,
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : ['Review pending recipient responses', 'Verify volunteer vehicle capacity'],
      blockers: Array.isArray(parsed.blockers) ? parsed.blockers : []
    };
  } catch {
    // Fallback reasoning
    const blockers: string[] = [];
    if (params.safetyFlags.length > 0) blockers.push(...params.safetyFlags);
    if (params.remainingMeals > 0 && params.allocatedMeals === 0) blockers.push('Awaiting recipient acceptance or matching confirmation.');

    return {
      reasoning: `Orchestrating redistribution for ${params.totalMeals} meals. ${params.allocatedMeals} meals proposed/allocated; ${params.remainingMeals} remaining.`,
      recommendations: [
        params.remainingMeals > 0 ? `Identify secondary recipient for remaining ${params.remainingMeals} meals` : 'Proceed to transport assignment',
        'Request volunteer vehicle confirmation once recipients accept'
      ],
      blockers
    };
  }
}
