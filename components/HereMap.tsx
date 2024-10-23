import { useEffect, useRef, useState } from 'react';
import { getRoute } from '../utils/hereRouting';

const HereMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<H.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Get the user's location using the Geolocation API
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
          },
          (error) => {
            console.error('Error getting user location', error);
            // Fallback to a default location (Tokyo)
            setUserLocation({ lat: 35.6895, lng: 139.6917 }); // Tokyo
          }
        );
      } else {
        console.error('Geolocation is not supported by this browser.');
        // Fallback to a default location (Tokyo)
        setUserLocation({ lat: 35.6895, lng: 139.6917 }); // Tokyo
      }
    };

    const loadHereMaps = () => {
      const H = (window as any).H; // Use 'any' to avoid TypeScript issues with the HERE namespace

      const platform = new H.service.Platform({
        apikey: process.env.NEXT_PUBLIC_HERE_API_KEY as string,
      });

      const defaultLayers = platform.createDefaultLayers();
      const mapInstance = new H.Map(mapRef.current!, defaultLayers.vector.normal.map, {
        zoom: 12,
        center: userLocation || { lat: 35.6895, lng: 139.6917 }, // Center on user's location or default to Tokyo
      });

      // Enable map events
      const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(mapInstance));
      H.ui.UI.createDefault(mapInstance, defaultLayers);

      setMap(mapInstance);
    };

    const scriptUrls = [
      'https://js.api.here.com/v3/3.1/mapsjs-core.js',
      'https://js.api.here.com/v3/3.1/mapsjs-service.js',
      'https://js.api.here.com/v3/3.1/mapsjs-ui.js',
      'https://js.api.here.com/v3/3.1/mapsjs-mapevents.js',
    ];

    const loadScripts = async (urls: string[]) => {
      for (const url of urls) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = url;
          script.onload = () => {
            resolve();
          };
          document.body.appendChild(script);
        });
      }
      loadHereMaps(); // Load the HERE Maps after scripts are loaded
    };

    loadScripts(scriptUrls);
    getUserLocation(); // Call to get user's location
  }, []);

  useEffect(() => {
    if (map && userLocation) {
      map.setCenter(userLocation); // Center the map on user's location
    }
  }, [map, userLocation]);

  const displayRoute = async () => {
    const start = userLocation || { lat: 35.6895, lng: 139.6917 }; // Use user's location or default to Tokyo
    const end = { lat: 35.682839, lng: 139.759455 }; // Another location in Tokyo

    const route = await getRoute(start, end);

    if (route && map) {
      const lineString = new H.geo.LineString();
      route.sections.forEach((section: any) => {
        section.polyline.forEach((point: string) => {
          const parts = point.split(',');
          lineString.pushLatLngAlt(parseFloat(parts[0]), parseFloat(parts[1]));
        });
      });

      const routeLine = new H.map.Polyline(lineString, {
        style: { strokeColor: '#0000FF', lineWidth: 4 },
      });

      map.addObject(routeLine);
      map.getViewModel().setLookAtData({ bounds: routeLine.getBoundingBox() });
    }
  };

  return (
    <div>
      <div ref={mapRef} style={{ width: '100%', height: '500px' }} />
      <button onClick={displayRoute}>Get Route</button>
    </div>
  );
};

export default HereMap;
