import { useState, useEffect } from 'react';
import { Event } from '../types';

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Warehouse Rave',
    venue: 'Ministry of Sound',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    time: '22:00',
    publicPrice: 15,
    memberPrice: 12,
    maxTickets: 500,
    soldTickets: 342,
    maxPerUser: 4,
    memberMaxPerUser: 1,
    dropTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
    isLive: true,
    imageUrl: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'The biggest underground event of the term. Harry\'s bringing the heat!'
  },
  {
    id: '2',
    title: 'Freshers Finale',
    venue: 'Fabric',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    time: '23:00',
    publicPrice: 20,
    memberPrice: 16,
    maxTickets: 800,
    soldTickets: 156,
    maxPerUser: 4,
    memberMaxPerUser: 2,
    dropTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
    isLive: false,
    imageUrl: 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'End your Freshers week with a bang. This is THE event everyone\'s talking about.'
  },
  {
    id: '3',
    title: 'Techno Thursday',
    venue: 'XOYO',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    time: '21:30',
    publicPrice: 12,
    memberPrice: 9,
    maxTickets: 300,
    soldTickets: 300,
    maxPerUser: 2,
    memberMaxPerUser: 1,
    dropTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isLive: true,
    imageUrl: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
    description: 'Sold out! But don\'t worry, Harry\'s got more coming...'
  }
];

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setEvents(mockEvents);
      setLoading(false);
    }, 800);
  }, []);

  return { events, loading };
};