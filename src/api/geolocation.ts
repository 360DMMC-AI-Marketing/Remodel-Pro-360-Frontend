import axios from "axios";

interface NominatimResponse {
  address: {
    street?: string;
    house_number?: string;
    road?: string;
    village?: string;
    city?: string;
    town?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
}

export interface AddressData {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

/**
 * Reverse geocode coordinates to address information using Nominatim API
 * @param lng - Longitude
 * @param lat - Latitude
 * @returns Address data or null if unable to geocode
 */
export const reverseGeocode = async (
  lng: number,
  lat: number
): Promise<AddressData | null> => {
  try {
    const response = await axios.get<NominatimResponse>(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: {
          lat,
          lon: lng,
          format: "json",
        },
        headers: {
          "Accept-Language": "en",
        },
      }
    );

    const { address } = response.data;

    if (!address) return null;

    // Extract street address
    const street = address.road
      ? `${address.house_number ? address.house_number + " " : ""}${address.road}`
      : "";

    // Extract city (prefer city > town > village)
    const city = address.city || address.town || address.village || "";

    // Extract state
    const state = address.state || address.county || "";

    // Extract zip code
    const zipCode = address.postcode || "";

    return {
      street: street.trim(),
      city,
      state,
      zipCode,
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
};

/**
 * Forward geocode address to coordinates using Nominatim API
 * @param address - Address string (e.g., "123 Main St, Springfield, IL 62701")
 * @returns Coordinates [lng, lat] or null if unable to geocode
 */
export const forwardGeocode = async (
  address: string
): Promise<[number, number] | null> => {
  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: address,
          format: "json",
          limit: 1,
        },
        headers: {
          "Accept-Language": "en",
        },
      }
    );

    if (!Array.isArray(response.data) || response.data.length === 0) {
      return null;
    }

    const { lon, lat } = response.data[0];
    return [parseFloat(lon), parseFloat(lat)];
  } catch (error) {
    console.error("Forward geocoding error:", error);
    return null;
  }
};
