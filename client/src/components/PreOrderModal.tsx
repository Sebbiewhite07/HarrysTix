import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import { Event } from '../types';
import { X, Star, Clock, Calendar, MapPin } from 'lucide-react';

interface PreOrderModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onPreOrderComplete: () => void;
}

export function PreOrderModal({ event, isOpen, onClose, onPreOrderComplete }: PreOrderModalProps) {
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPreOrderMutation = useMutation({
    mutationFn: async (data: { eventId: string; quantity: number }) => {
      return await apiRequest('POST', '/api/pre-orders', data);
    },
    onSuccess: () => {
      toast({
        title: "Pre-order placed successfully!",
        description: "Your pre-order has been submitted. You'll be notified when tickets are available.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pre-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pre-orders/weekly'] });
      onPreOrderComplete();
      onClose();
      setQuantity(1);
    },
    onError: (error: Error) => {
      console.error('Pre-order error:', error);
      toast({
        title: "Pre-order failed",
        description: error.message || "Failed to place pre-order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    if (quantity < 1 || quantity > event.memberMaxPerUser) {
      toast({
        title: "Invalid quantity",
        description: `Please select between 1 and ${event.memberMaxPerUser} tickets.`,
        variant: "destructive",
      });
      return;
    }

    createPreOrderMutation.mutate({
      eventId: event.id,
      quantity,
    });
  };

  if (!event) return null;

  const totalPrice = event.memberPrice * quantity;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Pre-Order Tickets
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-gray-400 mb-6">
          Reserve your tickets for this week's event as a Harry's Club member
        </p>

        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-purple-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">{event.title}</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-400" />
              <span>{event.venue}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>{new Date(event.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>{event.time}</span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
            <span className="text-sm">Member Price:</span>
            <span className="font-semibold text-cyan-400">£{event.memberPrice}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>Max per member:</span>
            <span>{event.memberMaxPerUser} tickets</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-2">
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              max={event.memberMaxPerUser}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="border-t border-gray-700 pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total:</span>
              <span className="text-cyan-400">£{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-purple-900/20 p-4 rounded-lg text-sm text-purple-200">
            <p className="font-semibold mb-2 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Pre-Order Benefits:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs ml-6">
              <li>Reserve tickets before public sale</li>
              <li>Member pricing guaranteed</li>
              <li>Payment collected when tickets drop</li>
              <li>Priority access to sold-out events</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
              disabled={createPreOrderMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg hover:from-purple-600 hover:to-cyan-600 transition-all disabled:opacity-50"
              disabled={createPreOrderMutation.isPending}
            >
              {createPreOrderMutation.isPending ? "Placing..." : "Place Pre-Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PreOrderModal;