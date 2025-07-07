import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, Calendar, DollarSign, Crown, Ticket, Activity, ArrowUp, ArrowDown } from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  totalMembers: number;
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  pendingApplications: number;
  recentSignups: number;
  membershipGrowth: number;
}

interface ChartData {
  userGrowth: { date: string; users: number; members: number }[];
  eventPerformance: { eventId: string; title: string; soldTickets: number; revenue: number }[];
  monthlyRevenue: { month: string; revenue: number; tickets: number }[];
}

const AdminAnalytics: React.FC = () => {
  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/admin/analytics'],
  });

  const { data: chartData, isLoading: chartLoading } = useQuery<ChartData>({
    queryKey: ['/api/admin/analytics/charts'],
  });

  if (analyticsLoading || chartLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Platform insights and performance metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{analytics?.totalUsers || 0}</p>
                <div className="flex items-center mt-2">
                  <ArrowUp className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-green-400 text-sm">{formatPercentage(analytics?.membershipGrowth || 0)}</span>
                  <span className="text-gray-500 text-sm ml-1">this month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Members</p>
                <p className="text-2xl font-bold text-white">{analytics?.totalMembers || 0}</p>
                <div className="flex items-center mt-2">
                  <ArrowUp className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-green-400 text-sm">+12.3%</span>
                  <span className="text-gray-500 text-sm ml-1">this month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Events</p>
                <p className="text-2xl font-bold text-white">{analytics?.totalEvents || 0}</p>
                <div className="flex items-center mt-2">
                  <ArrowUp className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-green-400 text-sm">+8.7%</span>
                  <span className="text-gray-500 text-sm ml-1">this month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(analytics?.totalRevenue || 0)}</p>
                <div className="flex items-center mt-2">
                  <ArrowUp className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-green-400 text-sm">+15.2%</span>
                  <span className="text-gray-500 text-sm ml-1">this month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Tickets Sold</h3>
              <Ticket className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-2">{analytics?.totalTicketsSold || 0}</p>
            <p className="text-gray-400 text-sm">Across all events</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Pending Applications</h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-2">{analytics?.pendingApplications || 0}</p>
            <p className="text-gray-400 text-sm">Awaiting review</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Signups</h3>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-2">{analytics?.recentSignups || 0}</p>
            <p className="text-gray-400 text-sm">Last 7 days</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Growth Chart */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Chart visualization would go here</p>
                <p className="text-gray-500 text-sm">Integration with charting library needed</p>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Monthly Revenue</h3>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Revenue trends would display here</p>
                <p className="text-gray-500 text-sm">Showing {formatCurrency(analytics?.totalRevenue || 0)} total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Events Table */}
        <div className="bg-gray-800 rounded-lg">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Top Performing Events</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-750">
                <tr>
                  <th className="text-left p-4 text-gray-300 font-medium">Event</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Tickets Sold</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Revenue</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {chartData?.eventPerformance?.slice(0, 5).map((event, index) => (
                  <tr key={event.eventId} className="hover:bg-gray-750 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="text-white font-medium">{event.title}</div>
                          <div className="text-gray-400 text-sm">Event ID: {event.eventId.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-white font-medium">{event.soldTickets}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-white font-medium">{formatCurrency(event.revenue)}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-700 rounded-full h-2 mr-3">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full"
                            style={{ width: `${Math.min((event.soldTickets / 100) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-sm">{Math.round((event.soldTickets / 100) * 100)}%</span>
                      </div>
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">
                      No event data available yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;