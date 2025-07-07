import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import { PreOrder } from '../types';
import { Calendar, Clock, Users, DollarSign, User, Mail } from 'lucide-react';

export default function AdminPreOrders() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: preOrders = [], isLoading } = useQuery({
    queryKey: ['/api/admin/pre-orders'],
    retry: false,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['/api/events'],
    retry: false,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    retry: false,
  });

  const updatePreOrderMutation = useMutation({
    mutationFn: async ({ id, status, additionalFields }: { id: string; status: string; additionalFields?: any }) => {
      return await apiRequest('PATCH', `/api/admin/pre-orders/${id}`, { status, ...additionalFields });
    },
    onSuccess: () => {
      toast({
        title: "Pre-order updated",
        description: "Pre-order status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pre-orders'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update pre-order.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'approved':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'paid':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
  };

  const filteredPreOrders = preOrders.filter((preOrder: PreOrder) => 
    selectedStatus === 'all' || preOrder.status === selectedStatus
  );

  const getEventById = (eventId: string) => events.find((event: any) => event.id === eventId);
  const getUserById = (userId: string) => users.find((user: any) => user.id === userId);

  const statusCounts = {
    all: preOrders.length,
    pending: preOrders.filter((p: PreOrder) => p.status === 'pending').length,
    approved: preOrders.filter((p: PreOrder) => p.status === 'approved').length,
    paid: preOrders.filter((p: PreOrder) => p.status === 'paid').length,
    failed: preOrders.filter((p: PreOrder) => p.status === 'failed').length,
    cancelled: preOrders.filter((p: PreOrder) => p.status === 'cancelled').length,
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-purple-500/20 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-purple-500/20 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Pre-Order Management
        </h1>
        <p className="text-gray-400">
          Manage Harry's Club member pre-orders and ticket reservations
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-gray-900 border border-purple-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{statusCounts.all}</div>
          <div className="text-sm text-gray-400">Total</div>
        </div>
        <div className="bg-gray-900 border border-yellow-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{statusCounts.pending}</div>
          <div className="text-sm text-gray-400">Pending</div>
        </div>
        <div className="bg-gray-900 border border-blue-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{statusCounts.approved}</div>
          <div className="text-sm text-gray-400">Approved</div>
        </div>
        <div className="bg-gray-900 border border-green-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{statusCounts.paid}</div>
          <div className="text-sm text-gray-400">Paid</div>
        </div>
        <div className="bg-gray-900 border border-red-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{statusCounts.failed}</div>
          <div className="text-sm text-gray-400">Failed</div>
        </div>
        <div className="bg-gray-900 border border-gray-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-400">{statusCounts.cancelled}</div>
          <div className="text-sm text-gray-400">Cancelled</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex justify-between items-center">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-48 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
        >
          <option value="all">All Pre-orders</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Pre-orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPreOrders.map((preOrder: PreOrder) => {
          const event = getEventById(preOrder.eventId);
          const user = getUserById(preOrder.userId);

          return (
            <div key={preOrder.id} className="bg-gray-900 border border-purple-500/20 rounded-lg overflow-hidden">
              <div className="p-4 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{event?.title || 'Unknown Event'}</h3>
                    <p className="text-sm text-gray-400">
                      Pre-order #{preOrder.id.slice(-6)}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(preOrder.status)}`}>
                    {preOrder.status.charAt(0).toUpperCase() + preOrder.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="px-4 pb-4 space-y-4">
                {/* User Info */}
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-purple-400" />
                  <span>{user?.name || 'Unknown User'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-400">{user?.email || 'No email'}</span>
                </div>

                {/* Event Info */}
                {event && (
                  <div className="grid grid-cols-2 gap-2 text-sm border-t border-purple-500/20 pt-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>{event.time}</span>
                    </div>
                  </div>
                )}

                {/* Order Details */}
                <div className="flex justify-between items-center text-sm border-t border-purple-500/20 pt-3">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>{preOrder.quantity} ticket{preOrder.quantity > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-cyan-400" />
                    <span>£{parseFloat(preOrder.totalPrice).toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-xs text-gray-400">
                  Created: {new Date(preOrder.createdAt).toLocaleString()}
                </div>

                {/* Admin Actions */}
                <div className="flex gap-2 border-t border-purple-500/20 pt-3">
                  {preOrder.status === 'pending' && (
                    <>
                      <button
                        className="flex-1 px-3 py-2 text-sm border border-blue-500/30 text-blue-400 rounded hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                        onClick={() => updatePreOrderMutation.mutate({ 
                          id: preOrder.id, 
                          status: 'approved',
                          additionalFields: { approvedAt: new Date() }
                        })}
                        disabled={updatePreOrderMutation.isPending}
                      >
                        Approve
                      </button>
                      <button
                        className="flex-1 px-3 py-2 text-sm border border-red-500/30 text-red-400 rounded hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        onClick={() => updatePreOrderMutation.mutate({ 
                          id: preOrder.id, 
                          status: 'failed',
                          additionalFields: { failedAt: new Date() }
                        })}
                        disabled={updatePreOrderMutation.isPending}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {preOrder.status === 'approved' && (
                    <button
                      className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                      onClick={() => updatePreOrderMutation.mutate({ 
                        id: preOrder.id, 
                        status: 'paid',
                        additionalFields: { paidAt: new Date() }
                      })}
                      disabled={updatePreOrderMutation.isPending}
                    >
                      Mark as Paid
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPreOrders.length === 0 && (
        <div className="bg-gray-900 border border-purple-500/20 rounded-lg p-8 text-center">
          <div className="text-gray-400">
            No pre-orders found for the selected status.
          </div>
        </div>
      )}
    </div>
  );
}