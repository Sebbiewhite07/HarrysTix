import React, { useState, useEffect } from 'react';
import { Plus, Users, Calendar, Settings, BarChart3, Crown, Mail, Edit, Trash2, Eye, Upload, UserCheck, FileText, Package, Tag } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { Event } from '../types';
import AddEventModal from '../components/AddEventModal';
import UploadTicketsModal from '../components/UploadTicketsModal';
import AdminUsers from './AdminUsers';
import AdminApplications from './AdminApplications';
import AdminAnalytics from './AdminAnalytics';
import AdminSettings from './AdminSettings';
import AdminPreOrders from './AdminPreOrders';
import AdminPreOrderManagement from './AdminPreOrderManagement';
import AdminCoupons from './AdminCoupons';

const Admin: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showUploadTicketsModal, setShowUploadTicketsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      setLocation('/');
      return;
    }
  }, [user, isLoading, setLocation]);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events', {
        credentials: 'include',
      });
      if (response.ok) {
        const eventsData = await response.json();
        const processedEvents = eventsData.map((event: any) => ({
          ...event,
          date: new Date(event.date),
          dropTime: new Date(event.dropTime),
          publicPrice: parseFloat(event.publicPrice),
          memberPrice: parseFloat(event.memberPrice),
        }));
        setEvents(processedEvents);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const refreshEvents = async () => {
    try {
      const response = await fetch('/api/events', {
        credentials: 'include',
      });
      if (response.ok) {
        const eventsData = await response.json();
        const processedEvents = eventsData.map((event: any) => ({
          ...event,
          date: new Date(event.date),
          dropTime: new Date(event.dropTime),
          publicPrice: parseFloat(event.publicPrice),
          memberPrice: parseFloat(event.memberPrice),
        }));
        setEvents(processedEvents);
      }
    } catch (error) {
      console.error('Failed to refresh events:', error);
    }
  };

  const handleUploadTickets = (event: Event) => {
    setSelectedEvent(event);
    setShowUploadTicketsModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'pre-orders', label: 'Pre-Orders', icon: Package },
    { id: 'pre-order-management', label: 'Pre-Order Management', icon: Crown },
    { id: 'coupons', label: 'Coupons', icon: Tag },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage events, users, and grow Harry's empire</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-800">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'applications' && <AdminApplications />}
        {activeTab === 'pre-orders' && <AdminPreOrders />}
        {activeTab === 'pre-order-management' && <AdminPreOrderManagement />}
        {activeTab === 'coupons' && <AdminCoupons />}
        {activeTab === 'analytics' && <AdminAnalytics />}
        {activeTab === 'settings' && <AdminSettings />}

        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Events Management</h2>
              <button 
                onClick={() => setShowAddEventModal(true)}
                className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-purple-500/25 flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Event</span>
              </button>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sales</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {eventsLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center">
                          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                          <p className="text-gray-400">Loading events...</p>
                        </td>
                      </tr>
                    ) : events.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center">
                          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-400">No events yet</p>
                        </td>
                      </tr>
                    ) : (
                      events.map((event) => (
                        <tr key={event.id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-white font-medium">{event.title}</div>
                              <div className="text-gray-400 text-sm">{event.venue}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-white">
                              {event.date.toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-gray-400 text-sm">{event.time}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-white">{event.soldTickets} / {event.maxTickets}</div>
                            <div className="w-20 bg-gray-700 rounded-full h-2 mt-1">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(event.soldTickets / event.maxTickets) * 100}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              event.isLive 
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {event.isLive ? 'Live' : 'Draft'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button className="text-blue-400 hover:text-blue-300 transition-colors p-1">
                                <Eye className="w-5 h-5" />
                              </button>
                              <button className="text-purple-400 hover:text-purple-300 transition-colors p-1">
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleUploadTickets(event)}
                                className="text-cyan-400 hover:text-cyan-300 transition-colors p-1"
                                title="Upload Tickets"
                              >
                                <Upload className="w-5 h-5" />
                              </button>
                              <button className="text-red-400 hover:text-red-300 transition-colors p-1">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddEventModal
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        onEventAdded={refreshEvents}
      />
      
      <UploadTicketsModal
        event={selectedEvent}
        isOpen={showUploadTicketsModal}
        onClose={() => setShowUploadTicketsModal(false)}
        onTicketsUploaded={refreshEvents}
      />
    </div>
  );
};

export default Admin;