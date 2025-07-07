import React, { useState } from 'react';
import { Star, Crown, Zap, ArrowRight, Users, Calendar, MapPin, Package } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../hooks/useEvents';
import EventCard from '../components/EventCard';
import TicketPurchaseModal from '../components/TicketPurchaseModal';
import PreOrderModal from '../components/PreOrderModal';
import PreOrderCard from '../components/PreOrderCard';
import { Event } from '../types';
import { useQuery } from '@tanstack/react-query';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { events, loading } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreOrderModalOpen, setIsPreOrderModalOpen] = useState(false);

  const handleBuyTicket = (event: Event) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handlePreOrder = (event: Event) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setSelectedEvent(event);
    setIsPreOrderModalOpen(true);
  };

  const handlePurchaseComplete = () => {
    // Refresh events to update ticket counts
    window.location.reload();
  };

  const handlePreOrderComplete = () => {
    // Refresh to update pre-order status
    window.location.reload();
  };

  // Fetch user's weekly pre-order if they're a member
  const { data: weeklyPreOrder } = useQuery({
    queryKey: ['/api/pre-orders/weekly'],
    enabled: !!user?.isMember,
    retry: false,
  });

  // Fetch user's pre-orders if they're a member
  const { data: userPreOrders = [] } = useQuery({
    queryKey: ['/api/pre-orders'],
    enabled: !!user,
    retry: false,
  });

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
              {/* Harry's Club Pre-Order Section */}
              {user?.isMember && upcomingEvents.length > 0 && (
                <div className="mb-16 animate-slideIn">
                  <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-purple-500/30 rounded-xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          <Crown className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-white">Harry's Club Pre-Order</h2>
                          <p className="text-gray-400">Reserve your tickets before the public sale</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 bg-purple-500/20 px-4 py-2 rounded-full">
                        <Package className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-purple-400">1 pre-order per week</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-cyan-400">This Week's Event</h3>
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          {upcomingEvents[0] && (
                            <div>
                              <h4 className="font-semibold text-white mb-2">{upcomingEvents[0].title}</h4>
                              <div className="space-y-2 text-sm text-gray-300">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-purple-400" />
                                  <span>{upcomingEvents[0].venue}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-purple-400" />
                                  <span>{new Date(upcomingEvents[0].date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Star className="w-4 h-4 text-cyan-400" />
                                  <span>Member Price: £{upcomingEvents[0].memberPrice}</span>
                                </div>
                              </div>
                              {weeklyPreOrder ? (
                                <div className="w-full mt-4 bg-purple-900/30 border border-purple-500/50 rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-purple-400">Pre-Order Active</p>
                                      <p className="text-xs text-gray-400">
                                        Status: <span className="capitalize text-purple-300">{weeklyPreOrder.status}</span>
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-medium text-white">{weeklyPreOrder.quantity} ticket(s)</p>
                                      <p className="text-xs text-gray-400">£{weeklyPreOrder.totalPrice}</p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handlePreOrder(upcomingEvents[0])}
                                  className="w-full mt-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-cyan-600 transition-all"
                                >
                                  Place Pre-Order
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-cyan-400">Benefits</h3>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                            <div>
                              <p className="text-white font-medium">Priority Access</p>
                              <p className="text-gray-400 text-sm">Get tickets before public sale opens</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></div>
                            <div>
                              <p className="text-white font-medium">Member Pricing</p>
                              <p className="text-gray-400 text-sm">Exclusive discounted rates for all events</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                            <div>
                              <p className="text-white font-medium">Guaranteed Tickets</p>
                              <p className="text-gray-400 text-sm">Reserve your spot even for sold-out events</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* User's Pre-Orders */}
              {user && userPreOrders.length > 0 && (
                <div className="mb-16 animate-slideIn">
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="w-3 h-3 bg-purple-500 rounded-full pulse"></div>
                    <h2 className="text-3xl font-bold text-purple-400">Your Pre-Orders</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userPreOrders.map((preOrder) => {
                      const event = events.find(e => e.id === preOrder.eventId);
                      return (
                        <PreOrderCard
                          key={preOrder.id}
                          preOrder={preOrder}
                          eventTitle={event?.title}
                          eventDate={event ? new Date(event.date) : undefined}
                          eventTime={event?.time}
                          eventVenue={event?.venue}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

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
                        onPreOrder={handlePreOrder}
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
                        onPreOrder={handlePreOrder}
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

      <PreOrderModal
        event={selectedEvent}
        isOpen={isPreOrderModalOpen}
        onClose={() => setIsPreOrderModalOpen(false)}
        onPreOrderComplete={handlePreOrderComplete}
      />
    </div>
  );
};

export default Home;