import React, { useState } from 'react';
import { X, Crown, Users, Star } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';

interface MembershipApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplicationComplete: () => void;
}

export default function MembershipApplicationModal({ 
  isOpen, 
  onClose, 
  onApplicationComplete 
}: MembershipApplicationModalProps) {
  const [formData, setFormData] = useState({
    university: '',
    reason: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createApplicationMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/membership-applications', data);
    },
    onSuccess: () => {
      toast({
        title: "Application submitted!",
        description: "Your membership application has been submitted for review.",
      });
      onApplicationComplete();
      onClose();
      setFormData({ university: '', reason: '' });
    },
    onError: (error: Error) => {
      toast({
        title: "Application failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.university.trim() || !formData.reason.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createApplicationMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6 w-full max-w-md animate-fadeIn">
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

        {/* Benefits */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/30 to-cyan-900/30 rounded-lg border border-purple-500/20">
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
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="university" className="block text-sm font-medium text-gray-300 mb-2">
              University/Institution *
            </label>
            <input
              type="text"
              id="university"
              value={formData.university}
              onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              placeholder="e.g. University of London"
              required
            />
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-2">
              Why do you want to join Harry's Club? *
            </label>
            <textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none h-20 resize-none"
              placeholder="Tell us why you'd like to be part of Harry's Club..."
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-400 rounded-lg hover:bg-gray-800 transition-colors"
              disabled={createApplicationMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg hover:from-purple-600 hover:to-cyan-600 transition-all disabled:opacity-50"
              disabled={createApplicationMutation.isPending}
            >
              {createApplicationMutation.isPending ? "Submitting..." : "Apply Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}