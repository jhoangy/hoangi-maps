import { useEffect, useRef, useState } from 'react';
import { getRoute, searchLocations } from '../utils/hereRouting'; // Keep your existing HERE functions
import { getTomTomRoute } from '../utils/tomtomRouting'; // Import TomTom function

const HereMap: React.FC = () => {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const [map, setMap] = useState<H.Map | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [destination, setDestination] = useState<string>('');
    const [locations, setLocations] = useState<any[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [travelTime, setTravelTime] = useState<string>(''); // To hold travel time info

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
            map.setCenter(userLocation);
        }
    }, [map, userLocation]);

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
                const lineString = new H.geo.LineString();

                routeData.routes[0].legs[0].points.forEach((point: any) => {
                    lineString.pushLatLngAlt(point.latitude, point.longitude, 0);
                });

                const routeLine = new H.map.Polyline(lineString, {
                    style: { strokeColor: 'blue', lineWidth: 4 },
                });

                map.addObject(routeLine);
                map.getViewModel().setLookAtData({ bounds: routeLine.getBoundingBox() });

                // Get estimated time of arrival
                const duration = routeData.routes[0].summary.travelTime; // Duration in seconds
                const travelTimeFormatted = `${Math.floor(duration / 60)} minutes`; // Convert to minutes
                setTravelTime(travelTimeFormatted);
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
                const results = await searchLocations(query); // Use searchLocations instead of searchFoursquarePlaces
                setLocations(results);
            } catch (error) {
                console.error('Error searching locations:', error);
            }
        } else {
            setLocations([]); // Clear results if query is too short
        }
    };

    const handleSelectLocation = (location: any) => {
        const lat = location.geocodes?.main?.latitude || location.location?.lat;
        const lng = location.geocodes?.main?.longitude || location.location?.lng;

        if (lat !== undefined && lng !== undefined) {
            setSelectedLocation({ lat, lng });
            setDestination(location.name); // Set the destination input to the selected location
            setLocations([]); // Clear search results
        } else {
            console.error('Coordinates not found for the selected location.');
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
                    {locations.map((location) => (
                        <li key={location.id} onClick={() => handleSelectLocation(location)}>
                            <strong>{location.name}</strong>
                            <br />
                            {location.location && (
                                <>
                                    {location.location.address && <span>{location.location.address}, </span>}
                                    {location.location.city && <span>{location.location.city}, </span>}
                                    {location.location.state && <span>{location.location.state}, </span>}
                                    {location.location.zip && <span>{location.location.zip} </span>}
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            <div ref={mapRef} style={{ width: '100%', height: '500px' }} />
            <button onClick={displayRoute}>Get Route</button>
            {travelTime && <div>Estimated Travel Time: {travelTime}</div>} {/* Show estimated travel time */}
        </div>
    );
};

export default HereMap;
