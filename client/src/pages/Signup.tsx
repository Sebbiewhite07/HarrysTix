import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from '../components/AuthForm';

const Signup: React.FC = () => {
  const { signup, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [error, setError] = useState('');

  const handleSignup = async (data: { email: string; password: string; name?: string }) => {
    try {
      setError('');
      await signup(data.email, data.password, data.name || '');
      setLocation('/');
    } catch (err) {
      setError('Failed to create account');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-gray-400">
            Join thousands of students having the time of their lives
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <AuthForm mode="signup" onSubmit={handleSignup} loading={isLoading} />

        <div className="text-center mt-8">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 transition-colors duration-200">
              Sign in here
            </Link>
          </p>
        </div>

        <div className="mt-8 p-4 bg-gray-900/30 rounded-lg border border-gray-800">
          <p className="text-sm text-gray-400 mb-2">What happens next:</p>
          <div className="text-xs text-gray-500 space-y-1">
            <div>✓ Instant access to events</div>
            <div>✓ Email confirmations</div>
            <div>✓ Apply for Harry's Club membership</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;