import React, { useState } from 'react';
import { Star, Crown, Zap, ArrowRight, Users, Calendar, MapPin } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../hooks/useEvents';
import EventCard from '../components/EventCard';
import TicketPurchaseModal from '../components/TicketPurchaseModal';
import { Event } from '../types';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { events, loading } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBuyTicket = (event: Event) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handlePurchaseComplete = () => {
    // Refresh events to update ticket counts
    window.location.reload();
  };

  const liveEvents = events.filter(event => event.isLive && new Date() >= event.dropTime);
  const upcomingEvents = events.filter(event => !event.isLive || new Date() < event.dropTime);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-neon-gradient-dark" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center animate-fadeIn">
            <div className="flex justify-center mb-6">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 px-4 py-2 rounded-full border border-purple-500/30 pulse">
                <Zap className="w-5 h-5 text-neon-gold" />
                <span className="text-sm font-medium text-neon-purple">
                  {loading ? 'Loading...' : `${events.length} events this week`}
                </span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 float">
              <span className="text-neon-purple">
                Harry's Tix
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Every ticket comes from Harry. The most exclusive student events in London, 
              handpicked for the ultimate night out experience.
            </p>

            {!user ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/signup" className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:from-purple-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-purple-500/25 transform hover:scale-105">
                  Join the Club
                </Link>
                <Link href="/login" className="border border-purple-500/50 text-purple-300 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-500/10 hover:border-purple-400 transition-all duration-200">
                  Sign In
                </Link>
              </div>
            ) : !user.isMember ? (
              <div className="bg-neon-gradient-dark p-6 rounded-2xl border border-purple-500/30 max-w-md mx-auto card-neon-hover">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Crown className="w-6 h-6 text-neon-gold" />
                  <span className="text-lg font-semibold text-neon-purple">Join Harry's Club</span>
                </div>
                <p className="text-gray-300 mb-4">
                  Get early access, member prices, and exclusive events
                </p>
                <button className="button-neon w-full pulse">
                  Apply Now 👑
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-3 bg-neon-gradient-dark p-4 rounded-xl border border-purple-500/30 card-neon-hover">
                <Crown className="w-6 h-6 text-neon-gold" />
                <span className="text-lg font-medium text-neon-purple">
                  Welcome back, {user.name}! 
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-neon-cyan">Member since {user.joinDate.toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="divider"></div>

      {/* Stats Section */}
      <section className="py-12 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center card-neon-hover p-6 rounded-lg">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-neon-gradient rounded-full flex items-center justify-center pulse">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-neon-cyan mb-2">10,000+</div>
              <div className="text-gray-400">Students served</div>
            </div>
            
            <div className="text-center card-neon-hover p-6 rounded-lg">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-neon-gradient rounded-full flex items-center justify-center pulse">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-neon-cyan mb-2">500+</div>
              <div className="text-gray-400">Events hosted</div>
            </div>
            
            <div className="text-center card-neon-hover p-6 rounded-lg">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-neon-gradient rounded-full flex items-center justify-center pulse">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-neon-cyan mb-2">20+</div>
              <div className="text-gray-400">London venues</div>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-20">
              <div className="loading-neon mx-auto mb-4" style={{ width: '64px', height: '64px' }}></div>
              <p className="text-gray-400">Loading events...</p>
            </div>
          ) : (
            <>
              {/* Live Events */}
              {liveEvents.length > 0 && (
                <div className="mb-16 animate-slideIn">
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="w-3 h-3 bg-neon-cyan rounded-full pulse"></div>
                    <h2 className="text-3xl font-bold text-neon-cyan">Live Now</h2>
                    <div className="text-gray-400">• Tickets available</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {liveEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onBuyTicket={handleBuyTicket}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <div className="animate-slideIn">
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <h2 className="text-3xl font-bold text-white">Coming Soon</h2>
                    <div className="text-gray-400">• Get ready</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {upcomingEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onBuyTicket={handleBuyTicket}
                      />
                    ))}
                  </div>
                </div>
              )}

              {events.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4 float">🎟️</div>
                  <h3 className="text-2xl font-bold text-neon-purple mb-4">No events yet</h3>
                  <p className="text-gray-400">
                    Harry's cooking up something special. Check back soon!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!user?.isMember && (
        <section className="py-16 bg-neon-gradient-dark">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex justify-center mb-6">
              <Crown className="w-16 h-16 text-neon-gold float" />
            </div>
            <h2 className="text-4xl font-bold text-neon-purple mb-6">
              Ready to join the VIP list?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Harry's Club members get early access, discounted tickets, and exclusive events
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="button-neon pulse">
                Apply for Membership 👑
              </button>
              <button className="border-neon-animated text-neon-cyan px-8 py-4 rounded-lg font-medium hover:bg-purple-500/10 transition-all duration-200">
                Learn More
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Ticket Purchase Modal */}
      <TicketPurchaseModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPurchaseComplete={handlePurchaseComplete}
      />
    </div>
  );
};

export default Home;