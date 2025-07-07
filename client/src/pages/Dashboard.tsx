import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Crown, Ticket, Users, Star, Gift, Mail } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { Ticket as TicketType } from '../types';

const Dashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [tickets, setTickets] = useState<(TicketType & { event: any })[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
      return;
    }
  }, [user, isLoading, setLocation]);

  useEffect(() => {
    if (user) {
      // Fetch user tickets
      const fetchTickets = async () => {
        try {
          const response = await fetch('/api/tickets', {
            credentials: 'include',
          });
          if (response.ok) {
            const ticketsData = await response.json();
            setTickets(ticketsData);
          }
        } catch (error) {
          console.error('Failed to fetch tickets:', error);
        } finally {
          setTicketsLoading(false);
        }
      };

      fetchTickets();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) return null;

  // Remove mock tickets as we'll use real data from API

  const membershipDaysLeft = user.membershipExpiry 
    ? Math.ceil((user.membershipExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-neon-purple mb-2">
                Hey {user.name}! 👋
              </h1>
              <p className="text-gray-400">
                {user.isMember ? 'Welcome back to the VIP experience' : 'Ready to join the club?'}
              </p>
            </div>
            
            {user.isMember && (
              <div className="badge-gold pulse">
                <Crown className="w-5 h-5 mr-2" />
                Harry's Club Member
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Membership Status */}
            {user.isMember ? (
              <div className="bg-neon-gradient-dark backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 card-neon-hover">
                <div className="flex items-center space-x-3 mb-4">
                  <Crown className="w-6 h-6 text-neon-gold" />
                  <h2 className="text-2xl font-bold text-neon-purple">Membership Status</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neon-cyan">{membershipDaysLeft}</div>
                    <div className="text-sm text-gray-400">Days left</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-neon-purple">£3</div>
                    <div className="text-sm text-gray-400">Saved this month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">2</div>
                    <div className="text-sm text-gray-400">Events attended</div>
                  </div>
                </div>
                <div className="divider my-4"></div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Next billing date:</span>
                  <span className="text-neon-cyan font-medium">
                    {user.membershipExpiry?.toLocaleDateString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-neon-gradient-dark backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 card-neon-hover">
                <div className="flex items-center space-x-3 mb-4">
                  <Crown className="w-6 h-6 text-neon-gold" />
                  <h2 className="text-2xl font-bold text-neon-purple">Join Harry's Club</h2>
                </div>
                <p className="text-gray-300 mb-6">
                  Get early access to tickets, member-only pricing, and exclusive events
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-neon-gold" />
                    <span className="text-gray-300">Early access tickets</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Gift className="w-5 h-5 text-neon-purple" />
                    <span className="text-gray-300">Member-only pricing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-neon-cyan" />
                    <span className="text-gray-300">Invite friends</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Exclusive events</span>
                  </div>
                </div>
                <button className="button-neon w-full pulse">
                  Apply for Membership 👑
                </button>
              </div>
            )}

            {/* Tickets */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 card-neon-hover">
              <div className="flex items-center space-x-3 mb-6">
                <Ticket className="w-6 h-6 text-neon-purple" />
                <h2 className="text-2xl font-bold text-neon-cyan">Your Tickets</h2>
              </div>
              
              {ticketsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading tickets...</p>
                </div>
              ) : tickets.length > 0 ? (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-purple-500/50 transition-all duration-200 ticket-glow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-neon-cyan">{ticket.event?.title || 'Event'}</h3>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">£{ticket.totalPrice}</div>
                          <div className="text-xs text-green-400 pulse">Confirmed</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center space-x-2 text-gray-300">
                          <Calendar className="w-4 h-4 text-neon-purple" />
                          <span>{ticket.event?.date ? new Date(ticket.event.date).toLocaleDateString() : 'TBD'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-300">
                          <Clock className="w-4 h-4 text-neon-purple" />
                          <span>{ticket.event?.time || 'TBD'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-300">
                          <span className="text-neon-purple">{ticket.event?.venue || 'TBD'}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-400">
                        Quantity: {ticket.quantity} • Purchase Date: {new Date(ticket.purchaseDate).toLocaleDateString()}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Confirmation:</span>
                          <span className="text-xs text-neon-cyan font-mono">{ticket.confirmationCode}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No tickets yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Get your first ticket and the party starts here!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 card-neon-hover">
              <h3 className="text-lg font-semibold text-neon-purple mb-4">Account Info</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-400">Email:</span>
                  <div className="text-white">{user.email}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Member since:</span>
                  <div className="text-white">{user.joinDate.toLocaleDateString()}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Status:</span>
                  <div className="flex items-center space-x-2">
                    {user.isMember ? (
                      <div className="badge-gold">
                        <Crown className="w-4 h-4 mr-1" />
                        Harry's Club Member
                      </div>
                    ) : (
                      <span className="text-gray-300">Regular User</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 card-neon-hover">
              <h3 className="text-lg font-semibold text-neon-purple mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors duration-200 hover:border-neon-cyan border border-transparent">
                  <div className="text-white font-medium">Browse Events</div>
                  <div className="text-sm text-gray-400">Find your next night out</div>
                </button>
                <button className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors duration-200 hover:border-neon-cyan border border-transparent">
                  <div className="text-white font-medium">Resend Tickets</div>
                  <div className="text-sm text-gray-400">Get tickets via email</div>
                </button>
                <button className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors duration-200 hover:border-neon-cyan border border-transparent">
                  <div className="text-white font-medium">Account Settings</div>
                  <div className="text-sm text-gray-400">Update your profile</div>
                </button>
              </div>
            </div>

            {/* Harry's Message */}
            <div className="bg-neon-gradient-dark backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 card-neon-hover">
              <h3 className="text-lg font-semibold text-neon-purple mb-3">Message from Harry</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                "Thanks for being part of the family! Keep an eye out for some exclusive events coming up. 
                The best nights are always ahead of us! 🎉"
              </p>
              <div className="mt-4 text-right">
                <span className="text-sm text-neon-gold">- Harry</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;