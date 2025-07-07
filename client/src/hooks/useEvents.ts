import { useState, useEffect } from 'react';
import { Event } from '../types';

// API helper function
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsData = await apiRequest('/api/events');
        // Convert date strings to Date objects
        const processedEvents = eventsData.map((event: any) => ({
          ...event,
          date: new Date(event.date),
          dropTime: new Date(event.dropTime),
          publicPrice: parseFloat(event.publicPrice),
          memberPrice: parseFloat(event.memberPrice),
        }));
        setEvents(processedEvents);
      } catch (error) {
        console.error('Failed to fetch events:', error);
        // Fallback to empty array on error
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, loading };
};