import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, CreditCard, User, Calendar, MapPin } from 'lucide-react';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import { PreOrder, Event } from '../types';

interface PreOrderWithEvent extends PreOrder {
  event: Event;
  user: {
    name: string;
    email: string;
  };
}

export default function AdminPreOrderManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPreOrders, setSelectedPreOrders] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch all pre-orders with event and user details
  const { data: preOrders = [], isLoading } = useQuery({
    queryKey: ['/api/admin/pre-orders'],
    retry: false,
  });

  // Fulfill pre-orders mutation
  const fulfillMutation = useMutation({
    mutationFn: async (preOrderIds: string[]) => {
      return await apiRequest('POST', '/api/admin/fulfill-pre-orders', { preOrderIds });
    },
    onSuccess: (data) => {
      toast({
        title: "Pre-orders processed",
        description: `Successfully processed ${data.results.filter((r: any) => r.status === 'processing').length} pre-orders`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pre-orders'] });
      setSelectedPreOrders([]);
    },
    onError: (error: any) => {
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process pre-orders",
        variant: "destructive",
      });
    },
  });

  // Approve individual pre-order
  const approveMutation = useMutation({
    mutationFn: async (preOrderId: string) => {
      return await apiRequest('PATCH', `/api/admin/pre-orders/${preOrderId}`, { 
        status: 'approved' 
      });
    },
    onSuccess: () => {
      toast({
        title: "Pre-order approved",
        description: "Pre-order has been approved for fulfillment",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pre-orders'] });
    },
    onError: (error: any) => {
      toast({
        title: "Approval failed", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredPreOrders = preOrders.filter((preOrder: PreOrderWithEvent) => {
    if (statusFilter === 'all') return true;
    return preOrder.status === statusFilter;
  });

  const handleSelectPreOrder = (preOrderId: string) => {
    setSelectedPreOrders(prev => 
      prev.includes(preOrderId) 
        ? prev.filter(id => id !== preOrderId)
        : [...prev, preOrderId]
    );
  };

  const handleSelectAll = () => {
    const pendingPreOrders = filteredPreOrders
      .filter((po: PreOrderWithEvent) => po.status === 'pending')
      .map((po: PreOrderWithEvent) => po.id);
    
    setSelectedPreOrders(
      selectedPreOrders.length === pendingPreOrders.length ? [] : pendingPreOrders
    );
  };

  const handleFulfillSelected = async () => {
    if (selectedPreOrders.length === 0) return;
    fulfillMutation.mutate(selectedPreOrders);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'approved': return 'text-blue-400 bg-blue-400/20';
      case 'paid': return 'text-green-400 bg-green-400/20';
      case 'failed': return 'text-red-400 bg-red-400/20';
      case 'cancelled': return 'text-gray-400 bg-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const statusCounts = {
    pending: preOrders.filter((po: PreOrderWithEvent) => po.status === 'pending').length,
    approved: preOrders.filter((po: PreOrderWithEvent) => po.status === 'approved').length,
    paid: preOrders.filter((po: PreOrderWithEvent) => po.status === 'paid').length,
    failed: preOrders.filter((po: PreOrderWithEvent) => po.status === 'failed').length,
    cancelled: preOrders.filter((po: PreOrderWithEvent) => po.status === 'cancelled').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Pre-Order Management</h1>
        <div className="flex items-center gap-4">
          {selectedPreOrders.length > 0 && (
            <button
              onClick={handleFulfillSelected}
              disabled={fulfillMutation.isPending}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-cyan-600 transition-all disabled:opacity-50"
            >
              {fulfillMutation.isPending ? "Processing..." : `Fulfill ${selectedPreOrders.length} Pre-orders`}
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 bg-gray-800/50 p-4 rounded-lg">
        {[
          { key: 'all', label: 'All', count: preOrders.length },
          { key: 'pending', label: 'Pending', count: statusCounts.pending },
          { key: 'approved', label: 'Approved', count: statusCounts.approved },
          { key: 'paid', label: 'Paid', count: statusCounts.paid },
          { key: 'failed', label: 'Failed', count: statusCounts.failed },
          { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              statusFilter === key
                ? 'bg-purple-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {filteredPreOrders.some((po: PreOrderWithEvent) => po.status === 'pending') && (
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={selectedPreOrders.length === filteredPreOrders.filter((po: PreOrderWithEvent) => po.status === 'pending').length}
                onChange={handleSelectAll}
                className="rounded"
              />
              Select all pending pre-orders
            </label>
            <div className="text-sm text-gray-400">
              {selectedPreOrders.length} selected
            </div>
          </div>
        </div>
      )}

      {/* Pre-Orders List */}
      <div className="space-y-4">
        {filteredPreOrders.map((preOrder: PreOrderWithEvent) => (
          <div key={preOrder.id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {preOrder.status === 'pending' && (
                      <input
                        type="checkbox"
                        checked={selectedPreOrders.includes(preOrder.id)}
                        onChange={() => handleSelectPreOrder(preOrder.id)}
                        className="rounded"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-white">{preOrder.event?.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{preOrder.user?.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(preOrder.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(preOrder.status)}`}>
                      {preOrder.status.charAt(0).toUpperCase() + preOrder.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Customer Details</p>
                    <p className="text-white font-medium">{preOrder.user?.email}</p>
                    <p className="text-gray-300">{preOrder.quantity} ticket(s)</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">Event Details</p>
                    <div className="flex items-center gap-1 text-white">
                      <MapPin className="w-3 h-3" />
                      <span>{preOrder.event?.venue}</span>
                    </div>
                    <p className="text-gray-300">{preOrder.event?.date ? new Date(preOrder.event.date).toLocaleDateString() : ''}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400">Payment Details</p>
                    <p className="text-white font-medium">£{preOrder.totalPrice}</p>
                    {preOrder.stripeCustomerId && (
                      <div className="flex items-center gap-1 text-gray-300">
                        <CreditCard className="w-3 h-3" />
                        <span>Payment method saved</span>
                      </div>
                    )}
                  </div>
                </div>

                {preOrder.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveMutation.mutate(preOrder.id)}
                      disabled={approveMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => fulfillMutation.mutate([preOrder.id])}
                      disabled={fulfillMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Approve & Charge Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPreOrders.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Pre-Orders Found</h3>
          <p className="text-gray-400">
            {statusFilter === 'all' 
              ? "No pre-orders have been placed yet."
              : `No ${statusFilter} pre-orders found.`
            }
          </p>
        </div>
      )}
    </div>
  );
}