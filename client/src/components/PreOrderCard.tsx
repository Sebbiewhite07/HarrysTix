import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import { PreOrder } from '../types';
import { Calendar, Clock, MapPin, Users, DollarSign } from 'lucide-react';

interface PreOrderCardProps {
  preOrder: PreOrder;
  eventTitle?: string;
  eventDate?: Date;
  eventTime?: string;
  eventVenue?: string;
}

export function PreOrderCard({ preOrder, eventTitle, eventDate, eventTime, eventVenue }: PreOrderCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const cancelPreOrderMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/pre-orders/${preOrder.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Pre-order cancelled",
        description: "Your pre-order has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pre-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pre-orders/weekly'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation failed",
        description: error.message || "Failed to cancel pre-order. Please try again.",
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

  const canCancel = preOrder.status === 'pending' || preOrder.status === 'approved';

  return (
    <div className="bg-gray-900 border border-purple-500/20 rounded-lg overflow-hidden">
      <div className="p-4 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-white">{eventTitle || 'Event'}</h3>
            <p className="text-sm text-gray-400">
              Pre-order placed on {new Date(preOrder.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(preOrder.status)}`}>
            {preOrder.status.charAt(0).toUpperCase() + preOrder.status.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="px-4 pb-4 space-y-4">
        {eventDate && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>{eventDate.toLocaleDateString()}</span>
            </div>
            {eventTime && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>{eventTime}</span>
              </div>
            )}
            {eventVenue && (
              <div className="flex items-center gap-2 col-span-2">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span>{eventVenue}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-purple-500/20">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>{preOrder.quantity} ticket{preOrder.quantity > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              <span>£{parseFloat(preOrder.totalPrice).toFixed(2)}</span>
            </div>
          </div>
          
          {canCancel && (
            <button
              onClick={() => cancelPreOrderMutation.mutate()}
              disabled={cancelPreOrderMutation.isPending}
              className="px-3 py-1 text-sm border border-red-500/30 text-red-400 rounded hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {cancelPreOrderMutation.isPending ? "Cancelling..." : "Cancel"}
            </button>
          )}
        </div>

        {preOrder.status === 'pending' && (
          <div className="bg-yellow-900/20 p-3 rounded-lg text-sm text-yellow-200">
            <p className="font-semibold">Awaiting Approval</p>
            <p className="text-xs text-yellow-300 mt-1">
              Your pre-order will be processed when tickets become available.
            </p>
          </div>
        )}

        {preOrder.status === 'approved' && (
          <div className="bg-blue-900/20 p-3 rounded-lg text-sm text-blue-200">
            <p className="font-semibold">Approved - Payment Required</p>
            <p className="text-xs text-blue-300 mt-1">
              Your pre-order has been approved. Payment will be collected soon.
            </p>
          </div>
        )}

        {preOrder.status === 'paid' && (
          <div className="bg-green-900/20 p-3 rounded-lg text-sm text-green-200">
            <p className="font-semibold">Payment Complete</p>
            <p className="text-xs text-green-300 mt-1">
              Your tickets have been secured. Check your email for details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PreOrderCard;