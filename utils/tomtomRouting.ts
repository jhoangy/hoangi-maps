import axios from 'axios';

const TOMTOM_API_KEY = '2QHIBfN3AHFwT4QAaGMclv3Ahd5nn3RU'; // Replace with your TomTom API key

// Function to get traffic-based route
export const getTomTomRoute = async (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${start.lng},${start.lat}:${end.lng},${end.lat}/json?key=${TOMTOM_API_KEY}&traffic=true`;

    try {
        const response = await axios.get(url);
        return response.data; // Adjust according to the data structure you receive
    } catch (error) {
        console.error('Error fetching route from TomTom:', error);
        throw error;
    }
};
