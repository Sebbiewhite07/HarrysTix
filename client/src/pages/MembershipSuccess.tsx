import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { CheckCircle, Home, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MembershipSuccess() {
  const [location] = useLocation();
  const sessionId = new URLSearchParams(location.split('?')[1] || '').get('session_id');

  useEffect(() => {
    // Optional: You could verify the session with your backend here
    console.log('Subscription successful, session ID:', sessionId);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <Card className="bg-gray-900 border-green-500/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl text-green-400">
              Welcome to Harry's Club! 🎉
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your subscription has been successfully activated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-green-400 font-medium mb-2">You now have access to:</p>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Exclusive ticket pre-orders before public release</li>
                <li>• Member discounts on all events</li>
                <li>• Priority customer support</li>
                <li>• Access to members-only events</li>
              </ul>
            </div>

            <div className="text-sm text-gray-400">
              <p>Your first payment of £15 has been processed.</p>
              <p>You'll be billed monthly on the same date.</p>
            </div>

            <div className="flex gap-4 justify-center">
              <Link to="/" className="no-underline">
                <Button className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Events
                </Button>
              </Link>
              
              <Link to="/membership" className="no-underline">
                <Button variant="outline" className="border-purple-500/50 hover:bg-purple-500/10">
                  <Calendar className="w-4 h-4 mr-2" />
                  Manage Subscription
                </Button>
              </Link>
            </div>

            {sessionId && (
              <p className="text-xs text-gray-500">
                Session ID: {sessionId}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}