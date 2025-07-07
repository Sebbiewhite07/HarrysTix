import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (data: { email: string; password: string; name?: string }) => void;
  loading?: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-2xl card-neon-hover">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-neon-purple mb-2">
            {mode === 'login' ? 'Welcome Back!' : 'Join the Party'}
          </h2>
          <p className="text-gray-400">
            {mode === 'login' 
              ? 'Harry\'s been waiting for you...' 
              : 'Get ready for the best nights out'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'signup' && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="input-neon w-full pl-14 pr-4 py-3"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="input-neon w-full pl-14 pr-4 py-3"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="input-neon w-full pl-14 pr-14 py-3"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-neon-cyan transition-colors duration-200"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`button-neon w-full ${loading ? '' : 'pulse'}`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="loading-neon"></div>
                <span>Processing...</span>
              </div>
            ) : (
              mode === 'login' ? 'Sign In 🎟️' : 'Create Account 🎉'
            )}
          </button>
        </form>

        {mode === 'login' && (
          <div className="mt-6 text-center">
            <a
              href="#"
              className="text-neon-cyan hover:text-neon-purple text-sm transition-colors duration-200"
            >
              Forgot your password?
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthForm;