import { useEffect, useRef, useState } from 'react';
import { getRoute, searchLocations } from '../utils/hereRouting';
import { getTomTomRoute } from '../utils/tomtomRouting';

const HereMap: React.FC = () => {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const [map, setMap] = useState<H.Map | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [destination, setDestination] = useState<string>('');
    const [locations, setLocations] = useState<any[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [travelTime, setTravelTime] = useState<string>(''); // To hold travel time info
    const [userMarker, setUserMarker] = useState<H.map.Marker | null>(null); // Marker for user location
    const [destinationMarker, setDestinationMarker] = useState<H.map.Marker | null>(null); // Marker for destination
    const [routeLine, setRouteLine] = useState<H.map.Polyline | null>(null); // Line for the current route
    const [heading, setHeading] = useState<number>(0); // Store heading for the marker

    useEffect(() => {
        const getUserLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        setUserLocation({ lat: latitude, lng: longitude });
                    },
                    (error) => {
                        console.error('Error getting user location', error);
                        setUserLocation({ lat: 43.6577, lng: -79.3788 }); // Default to a fixed location
                    }
                );
            } else {
                console.error('Geolocation is not supported by this browser.');
                setUserLocation({ lat: 43.6577, lng: -79.3788 }); // Default to a fixed location
            }
        };

        const loadHereMaps = () => {
            const H = (window as any).H;
            const platform = new H.service.Platform({
                apikey: process.env.NEXT_PUBLIC_HERE_API_KEY as string,
            });

            const defaultLayers = platform.createDefaultLayers();
            const mapInstance = new H.Map(mapRef.current!, defaultLayers.vector.normal.map, {
                zoom: 12,
                center: userLocation || { lat: 43.6577, lng: -79.3788 },
            });

            // Add traffic layer
            mapInstance.addLayer(defaultLayers.vector.normal.traffic);
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
            loadHereMaps();
        };

        loadScripts(scriptUrls);
        getUserLocation();
    }, []);

    useEffect(() => {
        if (map && userLocation) {
            map.setCenter(userLocation); // Center the map on the user's location

            const H = window.H;

            // Create a simple marker for the user's current location
            const iconUrl = 'https://www.svgrepo.com/show/24646/black-pointer.svg'; // URL for the marker icon
            const iconSize = { w: 32, h: 32 }; // Size of the icon
            const anchor = { x: iconSize.w / 2, y: iconSize.h }; // Anchor point

            // Create or update the marker for the user's current location
            if (!userMarker) {
                const marker = new H.map.Marker(userLocation, {
                    icon: new H.map.Icon(iconUrl, { size: iconSize, anchor }),
                });
                map.addObject(marker);
                setUserMarker(marker); // Store the marker in state
            } else {
                // Update the user's marker position
                userMarker.setGeometry(new H.geo.Point(userLocation.lng, userLocation.lat));
            }
        }
    }, [map, userLocation]);

    // Function to update user location every few seconds
    useEffect(() => {
        const intervalId = setInterval(() => {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });
            });
        }, 5000); // Update every 5 seconds

        return () => clearInterval(intervalId); // Clean up on unmount
    }, []);

    // Get heading using device orientation
    useEffect(() => {
        const handleOrientation = (event: DeviceOrientationEvent) => {
            if (event.alpha !== null) {
                setHeading(event.alpha); // Set the heading (in degrees)
            }
        };

        const requestPermission = async () => {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    await DeviceOrientationEvent.requestPermission();
                } catch (error) {
                    console.error('Permission denied', error);
                }
            }
        };

        requestPermission();

        window.addEventListener('deviceorientation', handleOrientation);

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, []);
    
    const handleSelectLocation = async (location: any) => {
      const lat = location.geocodes?.main?.latitude || location.location?.lat;
      const lng = location.geocodes?.main?.longitude || location.location?.lng;
  
      if (lat !== undefined && lng !== undefined) {
          setSelectedLocation({ lat, lng });
          setDestination(location.name);
          setLocations([]); // Clear search results
  
          // Call displayRoute to show the route to the selected location
          await displayRoute(); // Ensure route is displayed after selection
      } else {
          console.error('Coordinates not found for the selected location.');
      }
  };
  
    // Update displayRoute to manage the destination marker correctly
    const displayRoute = async () => {
      if (!userLocation || !selectedLocation) {
          console.error('User location or selected location not available');
          return;
      }
  
      const start = userLocation;
      const end = selectedLocation;
  
      try {
          const routeData = await getTomTomRoute(start, end); // Use TomTom API for route
  
          if (routeData && routeData.routes && routeData.routes.length > 0) {
              const H = window.H;
  
              // Clear previous route if it exists
              if (routeLine) {
                  map.removeObject(routeLine);
              }
  
              const lineString = new H.geo.LineString();
  
              routeData.routes[0].legs[0].points.forEach((point: any) => {
                  lineString.pushLatLngAlt(point.latitude, point.longitude, 0);
              });
  
              const newRouteLine = new H.map.Polyline(lineString, {
                  style: { strokeColor: 'blue', lineWidth: 4 },
              });
  
              map.addObject(newRouteLine);
              setRouteLine(newRouteLine); // Store the new route line in state
              map.getViewModel().setLookAtData({ bounds: newRouteLine.getBoundingBox() });
  
              // Get estimated time of arrival
              const duration = routeData.routes[0].summary.travelTime; // Duration in seconds
              const travelTimeFormatted = `${Math.floor(duration / 60)} minutes`; // Convert to minutes
              setTravelTime(travelTimeFormatted);
  
              // Remove previous destination marker if it exists
              if (destinationMarker) {
                  map.removeObject(destinationMarker); // Remove the existing marker from the map
              }
  
              // Add marker for the selected location
              const marker = new H.map.Marker(selectedLocation);
              map.addObject(marker);
              setDestinationMarker(marker); // Store the marker in state
          } else {
              console.error("Couldn't find the route.");
          }
      } catch (error) {
          console.error('Error displaying route:', error);
      }
  };
  

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setDestination(query);

        if (query.length > 2) {
            try {
                const results = await searchLocations(query);
                setLocations(results);
            } catch (error) {
                console.error('Error searching locations:', error);
            }
        } else {
            setLocations([]); // Clear results if query is too short
        }
    };

    return (
        <div>
            <input
                type="text"
                placeholder="Enter your destination"
                value={destination}
                onChange={handleSearch}
                style={{ width: '300px', marginBottom: '10px' }}
            />
            {locations.length > 0 && (
                <ul>
                    {locations.map((location, index) => (
                        <li key={index} onClick={() => handleSelectLocation(location)}>
                            {location.name} {location.location && (
                                <>
                                    <span>({location.location.lat}, {location.location.lng})</span>
                                    {location.location.zip && <span> - {location.location.zip}</span>}
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            <button onClick={displayRoute}>Get Route</button>
            <div ref={mapRef} style={{ width: '100%', height: '400px' }}></div>
            {travelTime && <div>Estimated Travel Time: {travelTime}</div>}
        </div>
    );
};

export default HereMap;
