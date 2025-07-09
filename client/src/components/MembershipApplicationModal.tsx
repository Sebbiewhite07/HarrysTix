import React, { useState } from 'react';
import { X, Crown, Users, Star, CreditCard } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface MembershipApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplicationComplete: () => void;
}

// Application form with payment details
function ApplicationForm({ onClose, onApplicationComplete }: { onClose: () => void; onApplicationComplete: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    university: '',
    reason: '',
    couponCode: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<string>('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const createApplicationMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/membership-applications-with-payment', data);
    },
    onSuccess: () => {
      toast({
        title: "Application submitted!",
        description: "Your membership application has been submitted with payment details.",
      });
      onApplicationComplete();
      onClose();
      setFormData({ university: '', reason: '', couponCode: '' });
      setCouponValid(null);
      setCouponDiscount('');
      setIsSubmitting(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Application failed",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.university.trim() || !formData.reason.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!stripe || !elements) {
      toast({
        title: "Payment system not ready",
        description: "Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast({
        title: "Card details required",
        description: "Please provide your payment card details.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Create payment method
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      toast({
        title: "Card error",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Submit application with payment method
    createApplicationMutation.mutate({
      ...formData,
      paymentMethodId: paymentMethod.id,
      couponCode: formData.couponCode.trim() || undefined
    });
  };

  // Validate coupon code
  const validateCoupon = async (code: string) => {
    if (!code.trim()) {
      setCouponValid(null);
      setCouponDiscount('');
      return;
    }

    setValidatingCoupon(true);
    try {
      const response = await apiRequest('POST', '/api/validate-coupon', { couponCode: code });
      const data = await response.json();
      
      if (data.valid) {
        setCouponValid(true);
        setCouponDiscount(data.discount);
      } else {
        setCouponValid(false);
        setCouponDiscount('');
      }
    } catch (error) {
      setCouponValid(false);
      setCouponDiscount('');
    }
    setValidatingCoupon(false);
  };

  // Debounced coupon validation
  const debouncedValidateCoupon = React.useCallback(
    React.useMemo(
      () => {
        let timeoutId: NodeJS.Timeout;
        return (code: string) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => validateCoupon(code), 500);
        };
      },
      []
    ),
    []
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Benefits */}
      <div className="p-4 bg-gradient-to-r from-purple-900/30 to-cyan-900/30 rounded-lg border border-purple-500/20">
        <h3 className="text-lg font-semibold text-purple-400 mb-3">Member Benefits</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-gray-300">Early access to all events</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-300">Exclusive member pricing</span>
          </div>
          <div className="flex items-center space-x-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-300">VIP pre-order system</span>
          </div>
        </div>
        <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded text-center">
          {couponValid && couponDiscount ? (
            <div>
              <span className="text-red-400 font-semibold line-through">£15/month</span>
              <span className="text-green-400 font-semibold ml-2">{couponDiscount}</span>
              <div className="text-gray-300 text-sm">Coupon applied! Cancel anytime</div>
            </div>
          ) : (
            <div>
              <span className="text-green-400 font-semibold">£15/month</span>
              <span className="text-gray-300 text-sm ml-2">Cancel anytime</span>
            </div>
          )}
        </div>
      </div>

      {/* Application Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            University/College *
          </label>
          <input
            type="text"
            value={formData.university}
            onChange={(e) => setFormData({ ...formData, university: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            placeholder="Which university do you attend?"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Why do you want to join Harry's Club? *
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
            placeholder="Tell us why you'd like to be part of Harry's Club..."
            rows={3}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Coupon Code */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Coupon Code (Optional)
          </label>
          <input
            type="text"
            value={formData.couponCode}
            onChange={(e) => {
              const code = e.target.value;
              setFormData({ ...formData, couponCode: code });
              debouncedValidateCoupon(code);
            }}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            placeholder="Enter discount code"
            disabled={isSubmitting}
          />
          {validatingCoupon && (
            <p className="text-xs text-gray-400 mt-1">Validating coupon...</p>
          )}
          {couponValid === true && (
            <p className="text-xs text-green-400 mt-1">✓ Coupon applied: {couponDiscount}</p>
          )}
          {couponValid === false && formData.couponCode.trim() && (
            <p className="text-xs text-red-400 mt-1">✗ Invalid coupon code</p>
          )}
        </div>

        {/* Payment Details */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <CreditCard className="w-4 h-4 inline mr-2" />
            Payment Details *
          </label>
          <div className="p-3 bg-gray-800 border border-gray-600 rounded-lg">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#ffffff',
                    '::placeholder': {
                      color: '#9ca3af',
                    },
                  },
                  invalid: {
                    color: '#ef4444',
                  },
                },
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {couponValid && couponDiscount 
              ? `Your card will be charged ${couponDiscount.includes('Free') ? 'nothing for the first period' : couponDiscount} if your application is approved`
              : 'Your card will be charged £15/month if your application is approved'
            }
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 px-4 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !stripe}
          className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg hover:from-purple-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Apply to Join'}
        </button>
      </div>
    </form>
  );
}

export default function MembershipApplicationModal({ 
  isOpen, 
  onClose, 
  onApplicationComplete 
}: MembershipApplicationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6 w-full max-w-lg animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Join Harry's Club</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <Elements stripe={stripePromise}>
          <ApplicationForm onClose={onClose} onApplicationComplete={onApplicationComplete} />
        </Elements>
      </div>
    </div>
  );
}