import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from '../components/AuthForm';

const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [error, setError] = useState('');

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      setError('');
      await login(data.email, data.password);
      setLocation('/');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎟️</div>
          <p className="text-gray-400">
            Welcome back! Ready for another epic night?
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <AuthForm mode="login" onSubmit={handleLogin} loading={isLoading} />

        <div className="text-center mt-8">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-purple-400 hover:text-purple-300 transition-colors duration-200">
              Sign up here
            </Link>
          </p>
        </div>

        <div className="mt-8 p-4 bg-gray-900/30 rounded-lg border border-gray-800">
          <p className="text-sm text-gray-400 mb-2">Demo accounts:</p>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Member: member@example.com</div>
            <div>Admin: admin@example.com</div>
            <div>Regular: user@example.com</div>
            <div className="text-purple-400 mt-2">Password: anything</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;