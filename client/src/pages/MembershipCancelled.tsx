import React from 'react';
import { Link } from 'wouter';
import { X, ArrowLeft, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MembershipCancelled() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <Card className="bg-gray-900 border-orange-500/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-orange-400" />
            </div>
            <CardTitle className="text-2xl text-orange-400">
              Subscription Cancelled
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your Harry's Club subscription was not completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <p className="text-orange-400 font-medium mb-2">No charges were made</p>
              <p className="text-sm text-gray-300">
                You can still join Harry's Club at any time to get access to:
              </p>
              <ul className="text-sm text-gray-300 space-y-1 mt-2">
                <li>• Exclusive ticket pre-orders</li>
                <li>• Member discounts on all events</li>
                <li>• Priority customer support</li>
                <li>• Access to members-only events</li>
              </ul>
            </div>

            <div className="text-sm text-gray-400">
              <p>Changed your mind? You can subscribe to Harry's Club anytime.</p>
              <p>Just £15/month with no setup fees.</p>
            </div>

            <div className="flex gap-4 justify-center">
              <Link to="/" className="no-underline">
                <Button variant="outline" className="border-gray-500/50 hover:bg-gray-500/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Events
                </Button>
              </Link>
              
              <Link to="/membership" className="no-underline">
                <Button className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}