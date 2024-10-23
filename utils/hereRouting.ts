import axios from 'axios';

interface Coordinates {
  lat: number;
  lng: number;
}

interface RouteSection {
  polyline: string[];
}

interface Route {
  sections: RouteSection[];
}

export const getRoute = async (start: Coordinates, end: Coordinates): Promise<Route | undefined> => {
  const apiKey = process.env.NEXT_PUBLIC_HERE_API_KEY as string;
  const routeUrl = `https://router.hereapi.com/v8/routes?apikey=${apiKey}&transportMode=car&origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&return=polyline,summary,actions&traffic=true`;

  try {
    const response = await axios.get(routeUrl);
    const route = response.data.routes[0];
    return route;
  } catch (error) {
    console.error('Error fetching route', error);
  }
};
