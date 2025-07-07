import React from 'react';
import { Calendar, Clock, MapPin, Users, Crown, Zap } from 'lucide-react';
import { Event } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface EventCardProps {
  event: Event;
  onBuyTicket: (event: Event) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onBuyTicket }) => {
  const { user } = useAuth();
  const isSoldOut = event.soldTickets >= event.maxTickets;
  const isLive = event.isLive && new Date() >= event.dropTime;
  const memberPrice = user?.isMember ? event.memberPrice : event.publicPrice;
  const ticketsLeft = event.maxTickets - event.soldTickets;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className={`event-card card-neon-hover ticket-glow relative ${user?.isMember ? 'member-only' : ''}`}>
      <div className="relative">
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-48 object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-lg" />
        
        {/* Status badges */}
        <div className="absolute top-4 left-4 flex space-x-2">
          {user?.isMember && (
            <div className="badge-gold">
              <Crown className="w-3 h-3 mr-1" />
              Member Price
            </div>
          )}
          {!isLive && (
            <div className="status-coming-soon px-3 py-1 rounded-full text-xs font-medium">
              <Clock className="w-3 h-3 mr-1 inline" />
              Coming Soon
            </div>
          )}
          {isSoldOut && (
            <div className="status-sold-out px-3 py-1 rounded-full text-xs font-medium">
              Sold Out
            </div>
          )}
          {isLive && !isSoldOut && (
            <div className="status-live px-3 py-1 rounded-full text-xs font-medium pulse">
              <Zap className="w-3 h-3 mr-1 inline" />
              Live Now
            </div>
          )}
        </div>

        {/* Price */}
        <div className="absolute top-4 right-4">
          <div className="bg-black/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-purple-500/30">
            <div className="text-right">
              <div className="text-2xl font-bold text-neon-purple">£{memberPrice}</div>
              {user?.isMember && event.memberPrice !== event.publicPrice && (
                <div className="text-sm text-gray-400 line-through">£{event.publicPrice}</div>
              )}
            </div>
          </div>
        </div>

        {/* Tickets left indicator */}
        {isLive && !isSoldOut && ticketsLeft <= 50 && (
          <div className="absolute bottom-4 left-4">
            <div className="flex items-center space-x-2 bg-orange-500/90 px-3 py-1 rounded-full backdrop-blur-sm pulse">
              <Zap className="w-4 h-4 text-white" />
              <span className="text-xs font-medium text-white">
                Only {ticketsLeft} left!
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-neon-cyan mb-2">{event.title}</h3>
          <p className="text-gray-300 text-sm leading-relaxed">{event.description}</p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3 text-gray-300">
            <Calendar className="w-5 h-5 text-neon-purple" />
            <span>{formatDate(event.date)} at {event.time}</span>
          </div>
          
          <div className="flex items-center space-x-3 text-gray-300">
            <MapPin className="w-5 h-5 text-neon-purple" />
            <span>{event.venue}</span>
          </div>
          
          <div className="flex items-center space-x-3 text-gray-300">
            <Users className="w-5 h-5 text-neon-purple" />
            <span>{event.soldTickets}/{event.maxTickets} tickets sold</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {user?.isMember ? (
              <span>Max {event.memberMaxPerUser} per member</span>
            ) : (
              <span>Max {event.maxPerUser} per person</span>
            )}
          </div>
          
          <button
            onClick={() => onBuyTicket(event)}
            disabled={isSoldOut || !isLive}
            className={`button-neon ${
              isSoldOut || !isLive
                ? 'opacity-50 cursor-not-allowed'
                : isLive && ticketsLeft <= 10 ? 'pulse' : ''
            }`}
          >
            {isSoldOut ? 'Sold Out' : !isLive ? 'Coming Soon' : 'Buy Ticket 🎟️'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;