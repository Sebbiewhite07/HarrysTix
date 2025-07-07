import React, { useState } from 'react';
import { X, Crown, Ticket, CreditCard, Minus, Plus } from 'lucide-react';
import { Event } from '../types';
import { useAuth } from '../contexts/AuthContext';
import TicketPaymentModal from './TicketPaymentModal';

interface TicketPurchaseModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onPurchaseComplete: () => void;
}

const TicketPurchaseModal: React.FC<TicketPurchaseModalProps> = ({
  event,
  isOpen,
  onClose,
  onPurchaseComplete,
}) => {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [showPayment, setShowPayment] = useState(false);

  if (!isOpen || !event) return null;

  const unitPrice = user?.isMember ? event.memberPrice : event.publicPrice;
  const totalPrice = unitPrice * quantity;
  const maxAllowed = user?.isMember ? event.memberMaxPerUser : event.maxPerUser;
  const ticketsLeft = event.maxTickets - event.soldTickets;
  const maxQuantity = Math.min(maxAllowed, ticketsLeft);

  const handlePurchase = () => {
    setShowPayment(true);
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    onPurchaseComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-purple-500/30 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <Ticket className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Buy Tickets</h2>
          </div>
          
          <h3 className="text-lg font-semibold text-purple-300">{event.title}</h3>
          <p className="text-gray-400">{event.venue} • {event.date.toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Membership Badge */}
          {user?.isMember && (
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-300 font-medium">Member Price Applied!</span>
              </div>
              <p className="text-sm text-yellow-200/80 mt-1">
                You're saving £{((event.publicPrice - event.memberPrice) * quantity).toFixed(2)}
              </p>
            </div>
          )}

          {/* Quantity Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Number of Tickets
            </label>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-10 h-10 rounded-lg border border-gray-600 flex items-center justify-center text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <span className="text-2xl font-bold text-white w-8 text-center">
                {quantity}
              </span>
              
              <button
                onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                disabled={quantity >= maxQuantity}
                className="w-10 h-10 rounded-lg border border-gray-600 flex items-center justify-center text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mt-2">
              Maximum {maxAllowed} tickets per {user?.isMember ? 'member' : 'person'} • {ticketsLeft} tickets left
            </p>
          </div>

          {/* Price Breakdown */}
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-gray-300">
              <span>{quantity}x {user?.isMember ? 'Member' : 'Public'} Ticket</span>
              <span>£{(unitPrice * quantity).toFixed(2)}</span>
            </div>
            
            <div className="border-t border-gray-700 pt-2 flex justify-between text-lg font-bold text-white">
              <span>Total</span>
              <span>£{totalPrice.toFixed(2)}</span>
            </div>
          </div>



          {/* Purchase Button */}
          <button
            onClick={handlePurchase}
            disabled={maxQuantity === 0}
            className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white py-3 rounded-lg font-bold text-lg hover:from-purple-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <CreditCard className="w-5 h-5" />
            <span>
              {maxQuantity === 0 ? 'Sold Out' : `Buy for £${totalPrice.toFixed(2)}`}
            </span>
          </button>

          <p className="text-xs text-gray-500 text-center">
            Secure payment powered by Stripe
          </p>
        </div>
      </div>

      {/* Payment Modal */}
      <TicketPaymentModal
        event={event}
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onPurchaseComplete={handlePaymentComplete}
        quantity={quantity}
      />
    </div>
  );
};

export default TicketPurchaseModal;