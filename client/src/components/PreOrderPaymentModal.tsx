import React, { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { X, CreditCard } from 'lucide-react';
import { Event } from '../types';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface PreOrderPaymentModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onPreOrderComplete: () => void;
}

const PreOrderForm: React.FC<{
  event: Event;
  onClose: () => void;
  onPreOrderComplete: () => void;
}> = ({ event, onClose, onPreOrderComplete }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [quantity] = useState(1); // Fixed to 1 as per requirements

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create setup intent to save payment method without charging
      const setupIntentResponse = await apiRequest('POST', '/api/create-setup-intent');
      const { client_secret } = setupIntentResponse;

      // Confirm setup intent
      const { error, setupIntent } = await stripe.confirmCardSetup(client_secret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Create pre-order with payment method
      await apiRequest('POST', '/api/pre-orders', {
        eventId: event.id,
        quantity,
        paymentMethodId: setupIntent.payment_method,
      });

      toast({
        title: "Pre-order placed successfully!",
        description: "We'll charge your card if your ticket is confirmed by Tuesday 7PM.",
      });

      onPreOrderComplete();
      onClose();
    } catch (error: any) {
      toast({
        title: "Pre-order failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPrice = parseFloat(event.memberPrice) * quantity;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Pre-Order Ticket</h3>
        <p className="text-gray-400 text-sm">
          Save your payment method - we'll only charge if your ticket is confirmed
        </p>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h4 className="font-medium text-white mb-3">{event.title}</h4>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Quantity:</span>
            <span className="text-white">{quantity} ticket</span>
          </div>
          <div className="flex justify-between">
            <span>Member Price:</span>
            <span className="text-cyan-400">£{event.memberPrice}</span>
          </div>
          <div className="flex justify-between font-medium text-white border-t border-gray-600 pt-2">
            <span>Total (if confirmed):</span>
            <span>£{totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-purple-400" />
            <span className="text-white font-medium">Payment Method</span>
          </div>
          <div className="bg-white rounded p-3">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#000',
                    '::placeholder': {
                      color: '#666',
                    },
                  },
                },
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Your card will be saved securely. No charge will be made now.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="flex-1 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white py-3 px-4 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Pre-order - No Charge Now"}
          </button>
        </div>
      </form>
    </div>
  );
};

export function PreOrderPaymentModal({ event, isOpen, onClose, onPreOrderComplete }: PreOrderPaymentModalProps) {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Harry's Club Pre-Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <Elements stripe={stripePromise}>
          <PreOrderForm 
            event={event} 
            onClose={onClose} 
            onPreOrderComplete={onPreOrderComplete}
          />
        </Elements>
      </div>
    </div>
  );
}

export default PreOrderPaymentModal;