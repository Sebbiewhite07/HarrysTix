import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Calendar, AlertCircle, CheckCircle, X } from 'lucide-react';

interface Membership {
  id: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isActive: boolean;
}

interface MembershipResponse {
  hasSubscription: boolean;
  membership?: Membership;
}

export default function Membership() {
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);

  const { data: membershipData, isLoading, refetch } = useQuery<MembershipResponse>({
    queryKey: ['/api/membership'],
    retry: false,
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (priceId?: string) => {
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create subscription');
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription Error",
        description: error.message,
        variant: "destructive",
      });
      setIsSubscribing(false);
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel subscription');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will end at the current period. You'll retain access until then.",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = () => {
    setIsSubscribing(true);
    createSubscriptionMutation.mutate();
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel your subscription? You will lose access to member benefits at the end of your current billing period.')) {
      cancelSubscriptionMutation.mutate();
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-green-500"><CheckCircle className="w-4 h-4 mr-1" />Active</Badge>;
    }
    
    switch (status) {
      case 'past_due':
        return <Badge variant="destructive"><AlertCircle className="w-4 h-4 mr-1" />Payment Failed</Badge>;
      case 'canceled':
        return <Badge variant="secondary"><X className="w-4 h-4 mr-1" />Cancelled</Badge>;
      case 'incomplete':
        return <Badge variant="outline"><AlertCircle className="w-4 h-4 mr-1" />Incomplete</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500"><Calendar className="w-4 h-4 mr-1" />Trial</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded mb-6 w-1/3"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Harry's Club Membership
        </h1>

        <div className="grid gap-6">
          {/* Current Membership Status */}
          <Card className="bg-gray-900 border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Membership Status
              </CardTitle>
              <CardDescription>
                Your current Harry's Club subscription details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {membershipData?.hasSubscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status:</span>
                    {getStatusBadge(membershipData.membership!.status, membershipData.membership!.isActive)}
                  </div>
                  
                  {membershipData.membership!.currentPeriodEnd && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Next billing date:</span>
                      <span>{formatDate(membershipData.membership.currentPeriodEnd)}</span>
                    </div>
                  )}
                  
                  {membershipData.membership!.cancelAtPeriodEnd && (
                    <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <p className="text-orange-400 text-sm">
                        Your subscription is set to cancel at the end of the current period.
                        You'll retain access until {formatDate(membershipData.membership!.currentPeriodEnd)}.
                      </p>
                    </div>
                  )}
                  
                  {membershipData.membership!.isActive && !membershipData.membership!.cancelAtPeriodEnd && (
                    <Button 
                      onClick={handleCancel}
                      variant="outline"
                      disabled={cancelSubscriptionMutation.isPending}
                      className="border-red-500/50 hover:bg-red-500/10"
                    >
                      {cancelSubscriptionMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-6">You don't have an active Harry's Club subscription.</p>
                  <Button 
                    onClick={handleSubscribe}
                    disabled={isSubscribing}
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                  >
                    {isSubscribing ? 'Processing...' : 'Join Harry\'s Club - £15/month'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Membership Benefits */}
          <Card className="bg-gray-900 border-purple-500/20">
            <CardHeader>
              <CardTitle>Membership Benefits</CardTitle>
              <CardDescription>
                What you get with Harry's Club
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-purple-400">🎟️ Exclusive Pre-Orders</h4>
                  <p className="text-gray-400 text-sm">
                    Get early access to tickets before public release
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-cyan-400">💰 Member Discounts</h4>
                  <p className="text-gray-400 text-sm">
                    Save money with exclusive member pricing on all events
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-purple-400">⚡ Priority Support</h4>
                  <p className="text-gray-400 text-sm">
                    Get priority customer support for all your tickets
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-cyan-400">🎊 Special Events</h4>
                  <p className="text-gray-400 text-sm">
                    Access to members-only events and experiences
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Information */}
          <Card className="bg-gray-900 border-purple-500/20">
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>
                Simple, transparent pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">£15<span className="text-lg text-gray-400">/month</span></div>
                <p className="text-gray-400 mb-4">Cancel anytime • No setup fees • Instant access</p>
                
                {!membershipData?.hasSubscription && (
                  <Button 
                    onClick={handleSubscribe}
                    disabled={isSubscribing}
                    size="lg"
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                  >
                    {isSubscribing ? 'Processing...' : 'Start Your Membership'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}