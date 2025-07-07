import React, { useState } from 'react';
import { Plus, Users, Calendar, Settings, BarChart3, Crown, Mail, Edit, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('events');

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

  const mockEvents = [
    {
      id: '1',
      title: 'Warehouse Rave',
      venue: 'Ministry of Sound',
      date: '2024-01-15',
      time: '22:00',
      publicPrice: 15,
      memberPrice: 12,
      maxTickets: 500,
      soldTickets: 342,
      status: 'live'
    },
    {
      id: '2',
      title: 'Freshers Finale',
      venue: 'Fabric',
      date: '2024-01-20',
      time: '23:00',
      publicPrice: 20,
      memberPrice: 16,
      maxTickets: 800,
      soldTickets: 156,
      status: 'scheduled'
    }
  ];

  const mockUsers = [
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      isMember: true,
      joinDate: '2024-01-10',
      ticketsPurchased: 5
    },
    {
      id: '2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      isMember: false,
      joinDate: '2024-01-12',
      ticketsPurchased: 2
    }
  ];

  const mockApplications = [
    {
      id: '1',
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      university: 'King\'s College London',
      reason: 'Love the nightlife scene and want early access to events',
      status: 'pending',
      appliedDate: '2024-01-14'
    },
    {
      id: '2',
      name: 'Diana Prince',
      email: 'diana@example.com',
      university: 'UCL',
      reason: 'Been to previous events and want to join the exclusive club',
      status: 'pending',
      appliedDate: '2024-01-13'
    }
  ];

  const tabs = [
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'applications', label: 'Applications', icon: Crown },
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
        <div className="space-y-6">
          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Events Management</h2>
                <button className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-purple-500/25 flex items-center space-x-2">
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
                      {mockEvents.map((event) => (
                        <tr key={event.id} className="hover:bg-gray-800/30">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-white font-medium">{event.title}</div>
                              <div className="text-gray-400 text-sm">{event.venue}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-white">{event.date}</div>
                            <div className="text-gray-400 text-sm">{event.time}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-white">{event.soldTickets}/{event.maxTickets}</div>
                            <div className="text-gray-400 text-sm">
                              {Math.round((event.soldTickets / event.maxTickets) * 100)}% sold
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              event.status === 'live' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              {event.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button className="text-blue-400 hover:text-blue-300 transition-colors">
                                <Eye className="w-5 h-5" />
                              </button>
                              <button className="text-purple-400 hover:text-purple-300 transition-colors">
                                <Edit className="w-5 h-5" />
                              </button>
                              <button className="text-red-400 hover:text-red-300 transition-colors">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Users Management</h2>
                <div className="flex items-center space-x-4">
                  <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
                    <option>All Users</option>
                    <option>Members Only</option>
                    <option>Regular Users</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tickets</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {mockUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-800/30">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-white font-medium">{user.name}</div>
                              <div className="text-gray-400 text-sm">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {user.isMember ? (
                              <div className="flex items-center space-x-2">
                                <Crown className="w-4 h-4 text-yellow-400" />
                                <span className="text-purple-400">Member</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">Regular</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-white">{user.joinDate}</td>
                          <td className="px-6 py-4 text-white">{user.ticketsPurchased}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button className="text-blue-400 hover:text-blue-300 transition-colors">
                                <Eye className="w-5 h-5" />
                              </button>
                              <button className="text-purple-400 hover:text-purple-300 transition-colors">
                                <Mail className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Membership Applications</h2>
                <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 px-3 py-2 rounded-lg border border-purple-500/30">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  <span className="text-purple-300">{mockApplications.length} pending</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockApplications.map((application) => (
                  <div key={application.id} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">{application.name}</h3>
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-500/20 text-orange-400">
                        Pending
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div>
                        <span className="text-sm text-gray-400">Email:</span>
                        <div className="text-white">{application.email}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">University:</span>
                        <div className="text-white">{application.university}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Reason:</span>
                        <div className="text-white text-sm mt-1">{application.reason}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Applied:</span>
                        <div className="text-white">{application.appliedDate}</div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200">
                        Approve
                      </button>
                      <button className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-200">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Analytics Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                  <div className="text-3xl font-bold text-white mb-2">342</div>
                  <div className="text-gray-400 text-sm">Total Tickets Sold</div>
                  <div className="text-green-400 text-sm mt-2">+12% from last week</div>
                </div>
                
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                  <div className="text-3xl font-bold text-white mb-2">£6,840</div>
                  <div className="text-gray-400 text-sm">Total Revenue</div>
                  <div className="text-green-400 text-sm mt-2">+8% from last week</div>
                </div>
                
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                  <div className="text-3xl font-bold text-white mb-2">89</div>
                  <div className="text-gray-400 text-sm">Active Members</div>
                  <div className="text-purple-400 text-sm mt-2">+5 new this week</div>
                </div>
                
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                  <div className="text-3xl font-bold text-white mb-2">94%</div>
                  <div className="text-gray-400 text-sm">Conversion Rate</div>
                  <div className="text-green-400 text-sm mt-2">Above average</div>
                </div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-white">New ticket sale: Warehouse Rave</span>
                    </div>
                    <span className="text-gray-400 text-sm">2 mins ago</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-white">New membership application</span>
                    </div>
                    <span className="text-gray-400 text-sm">5 mins ago</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-white">Event created: Techno Thursday</span>
                    </div>
                    <span className="text-gray-400 text-sm">1 hour ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Platform Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Default Service Fee
                      </label>
                      <input
                        type="number"
                        defaultValue="1.00"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Member Discount (%)
                      </label>
                      <input
                        type="number"
                        defaultValue="15"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Membership Price (£)
                      </label>
                      <input
                        type="number"
                        defaultValue="12.00"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Email Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Ticket confirmations</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Event reminders</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Membership renewals</span>
                      <input type="checkbox" defaultChecked className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Marketing emails</span>
                      <input type="checkbox" className="rounded" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button className="px-6 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
                <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-cyan-600 transition-all duration-200">
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;