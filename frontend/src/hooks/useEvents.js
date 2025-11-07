import { useState, useEffect } from 'react';
import { eventService } from '../services/eventService';
import { toast } from 'react-toastify';

export const useEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const data = await eventService.getAllEvents();
            setEvents(data);
            setError(null);
        } catch (err) {
            setError(err.message);
            toast.error('Failed to fetch events');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    return { events, loading, error, refetch: fetchEvents };
};
