export interface GeoCoordinates {
  lat: number;
  lng: number;
}

/**
 * Extracts latitude and longitude from various Google Maps URLs or direct coordinate strings.
 * Supported formats:
 * - https://www.google.com/maps/@-5.7311232,105.5979851,13z...
 * - https://maps.google.com/?q=-5.7311232,105.5979851
 * - https://www.google.com/maps/place/.../@-5.7311232,105.5979851,17z/...
 * - https://www.google.com/maps/search/?api=1&query=-5.7311232,105.5979851
 * - !3d-5.7311232!4d105.5979851
 * - "-5.7311232, 105.5979851" or "-5.7311232,105.5979851"
 */
export const extractCoordinatesFromUrl = (urlOrString?: string | null): GeoCoordinates | null => {
  if (!urlOrString) return null;
  const raw = urlOrString.trim();

  // Pattern 1: @lat,lng
  const atMatch = raw.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // Pattern 2: q=lat,lng or query=lat,lng or ll=lat,lng or destination=lat,lng
  const paramMatch = raw.match(/[?&](?:q|query|ll|destination)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
  if (paramMatch) {
    const lat = parseFloat(paramMatch[1]);
    const lng = parseFloat(paramMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // Pattern 3: !3d<lat>!4d<lng>
  const dataMatch = raw.match(/!3d(-?\d+(?:\.\d+)?).*?!4d(-?\d+(?:\.\d+)?)/);
  if (dataMatch) {
    const lat = parseFloat(dataMatch[1]);
    const lng = parseFloat(dataMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // Pattern 4: direct string "lat, lng" or "lat,lng"
  const directMatch = raw.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (directMatch) {
    const lat = parseFloat(directMatch[1]);
    const lng = parseFloat(directMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  return null;
};

/**
 * Returns Google Maps Direction/Navigation URL for field technician routing.
 */
export const getGoogleMapsDirectionUrl = (lat: number, lng: number): string => {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
};

/**
 * Returns Google Maps Search / Pin URL.
 */
export const getGoogleMapsPinUrl = (lat: number, lng: number): string => {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
};

/**
 * Returns OpenStreetMap interactive embed URL for iframe preview.
 */
export const getMapEmbedUrl = (lat: number, lng: number, delta = 0.008): string => {
  const minLng = (lng - delta).toFixed(6);
  const minLat = (lat - delta).toFixed(6);
  const maxLng = (lng + delta).toFixed(6);
  const maxLat = (lat + delta).toFixed(6);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${lat}%2C${lng}`;
};
