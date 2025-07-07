import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { X, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Event } from '../types';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface TicketPaymentModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onPurchaseComplete: () => void;
  quantity: number;
}

interface CheckoutFormProps {
  event: Event;
  onClose: () => void;
  onPurchaseComplete: () => void;
  quantity: number;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ 
  event, 
  onClose, 
  onPurchaseComplete,
  quantity 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const unitPrice = user?.isMember ? event.memberPrice : event.publicPrice;
  const totalAmount = unitPrice * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}?payment=success`,
        },
        redirect: 'if_required'
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
      } else {
        // Payment succeeded - create ticket immediately
        try {
          const response = await fetch('/api/tickets/confirm-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              eventId: event.id,
              quantity,
              totalPrice: totalAmount,
            }),
          });

          if (response.ok) {
            onPurchaseComplete();
            onClose();
          } else {
            setErrorMessage('Payment processed but ticket creation failed. Please contact support.');
          }
        } catch (err) {
          setErrorMessage('Payment processed but ticket creation failed. Please contact support.');
        }
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg">{event.title}</h3>
          <p className="text-gray-600">{new Date(event.date).toLocaleDateString()}</p>
          <p className="text-gray-600">{event.venue}</p>
          
          <div className="mt-3 space-y-1">
            <div className="flex justify-between">
              <span>Quantity:</span>
              <span>{quantity}</span>
            </div>
            <div className="flex justify-between">
              <span>Price per ticket:</span>
              <span>£{unitPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>£{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <PaymentElement />

        {errorMessage && (
          <div className="text-red-600 bg-red-50 p-3 rounded-lg">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-gradient-to-r from-purple-500 to-cyan-500 text-white py-3 rounded-lg font-bold hover:from-purple-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              <span>Pay £{totalAmount.toFixed(2)}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export const TicketPaymentModal: React.FC<TicketPaymentModalProps> = ({
  event,
  isOpen,
  onClose,
  onPurchaseComplete,
  quantity
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && event) {
      setIsLoading(true);
      setError(null);
      
      fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          eventId: event.id,
          quantity
        }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.client_secret) {
          setClientSecret(data.client_secret);
        } else {
          setError(data.error || 'Failed to initialize payment');
        }
      })
      .catch(err => {
        setError('Failed to connect to payment service');
      })
      .finally(() => {
        setIsLoading(false);
      });
    }
  }, [isOpen, event, quantity]);

  if (!isOpen || !event) return null;

  const options = {
    clientSecret: clientSecret || undefined,
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#9333ea',
      },
    },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Complete Purchase</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
              <span className="ml-3 text-gray-600">Setting up payment...</span>
            </div>
          )}

          {error && (
            <div className="text-red-600 bg-red-50 p-4 rounded-lg">
              {error}
            </div>
          )}

          {clientSecret && (
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm
                event={event}
                onClose={onClose}
                onPurchaseComplete={onPurchaseComplete}
                quantity={quantity}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketPaymentModal;