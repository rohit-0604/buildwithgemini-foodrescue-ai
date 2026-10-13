import { Coordinates, RecipientOrganization } from './types';
import { db } from './db';

export interface PlacesDiscoveryResult {
  isLivePlaces: boolean;
  statusNote: string;
  results: RecipientOrganization[];
}

export async function searchNearbyOrganizations(
  coords: Coordinates,
  radiusMeters: number = 10000,
  queryText: string = 'food bank shelter NGO community kitchen'
): Promise<PlacesDiscoveryResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    // Return explicit status note and fallback to registered directory
    const state = db.getState();
    const directoryPartners = state.recipients.map(r => ({
      ...r,
      isPlacesLead: false,
      isVerifiedPartner: r.isVerifiedPartner
    }));

    return {
      isLivePlaces: false,
      statusNote: 'GOOGLE_MAPS_API_KEY not provided. Safely retrieved verified partner organizations from local directory.',
      results: directoryPartners
    };
  }

  try {
    const url = 'https://places.googleapis.com/v1/places:searchText';
    const requestBody = {
      textQuery: `${queryText} near Hyderabad`,
      locationBias: {
        circle: {
          center: {
            latitude: coords.lat,
            longitude: coords.lng
          },
          radius: radiusMeters
        }
      },
      maxResultCount: 6
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Places API responded with status ${response.status}`);
    }

    const data = await response.json();
    const places = data.places || [];

    const discoveredLeads: RecipientOrganization[] = places.map((p: any, idx: number) => ({
      id: `places-lead-${p.id || idx}`,
      name: `[Places Lead] ${p.displayName?.text || 'Local Organization'}`,
      type: 'NGO',
      address: p.formattedAddress || 'Hyderabad, Telangana',
      coordinates: {
        lat: p.location?.latitude || coords.lat,
        lng: p.location?.longitude || coords.lng
      },
      capacityMaxMeals: 50, // default estimation
      currentOccupancy: 0,
      dietaryAcceptance: ['Cooked Meals', 'Vegetarian'],
      operatingHours: { open: '09:00', close: '20:00' },
      contactPerson: 'Lead Discovery Contact (Unverified)',
      contactPhone: 'Contact via Google Maps listing',
      isVerifiedPartner: false,
      isPlacesLead: true, // Clearly marked as unverified lead
      isAvailableNow: false, // Cannot dispatch automatically without coordinator outreach
      demo: true
    }));

    return {
      isLivePlaces: true,
      statusNote: `Successfully discovered ${discoveredLeads.length} potential leads via Google Places API (New). Marked as UNVERIFIED LEADS — requires coordinator outreach.`,
      results: discoveredLeads
    };
  } catch (err: any) {
    const state = db.getState();
    return {
      isLivePlaces: false,
      statusNote: `Live Places API search encountered error (${err.message}). Safely defaulted to verified partner directory.`,
      results: state.recipients
    };
  }
}
