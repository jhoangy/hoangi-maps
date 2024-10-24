const HERE_API_KEY = 'lTpdzEX1ZzB_oJU6EmAsd7gO9jPMoDt_kyYjIO3b1Bw'; // HERE API Key for routing
const FOURSQUARE_CLIENT_ID = '2XT53YHRXGNQJO2KH20Z15UVA5J32HB45OHO4UXLIGSMSBM4'; // Replace with your Foursquare Client ID
const FOURSQUARE_CLIENT_SECRET = '5HLJUGM2JQY1P5QR34JZSNS4VOMCJWURRN2BK4TIJCMDVLKQ'; // Replace with your Foursquare Client Secret

// Function to get route between two points
export const getRoute = async (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
  const waypointStart = `${start.lat},${start.lng}`;
  const waypointEnd = `${end.lat},${end.lng}`;
  console.log(waypointStart);
  console.log(waypointEnd);
  
  const url = `https://router.hereapi.com/v8/routes?transportMode=car&origin=${waypointStart}&destination=${waypointEnd}&return=polyline&apiKey=${HERE_API_KEY}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(url);
    console.log(data);
    return data; // Adjust according to the data structure you receive
  } catch (error) {
    console.error('Error fetching route:', error);
    throw error; // Rethrow to handle it in the calling function if necessary
  }
};

// Function to search for locations based on user query using Foursquare
export const searchLocations = async (query: string) => {
  const url = `https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(query)}&limit=10`; // Limiting to top 10 results
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `fsq3Md+hZZ1hK2GOQ65W+o6sV+R9pFSiwAeH6w9HeNFJJXs=`, // Replace with your actual Foursquare API Key
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.results; // Returns an array of location results
  } catch (error) {
    console.error('Error searching locations:', error);
    throw error; // Rethrow to handle it in the calling function if necessary
  }
};

