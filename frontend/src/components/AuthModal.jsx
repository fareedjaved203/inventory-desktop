import React, { useState } from 'react';
import axios from 'axios';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

function AuthModal({ onSuccess, queryClient }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  
  // Get previously used emails from localStorage
  const [savedEmails] = useState(() => {
    const saved = localStorage.getItem('savedEmails');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Save email to localStorage on successful login
  const saveEmail = (emailToSave) => {
    const existing = savedEmails.filter(e => e !== emailToSave);
    const updated = [emailToSave, ...existing].slice(0, 5); // Keep last 5 emails
    localStorage.setItem('savedEmails', JSON.stringify(updated));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const data = { email, password };
      const response = await axios.post(`${import.meta.env.VITE_API_URL}${endpoint}`, data);
      
      // Save email for autocomplete
      saveEmail(email);
      
      // Invalidate auth check query to refetch user count
      if (queryClient) {
        queryClient.invalidateQueries(['auth-check']);
      }
      
      onSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        email: resetEmail
      });
      
      setShowResetForm(true);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        email: resetEmail,
        otp,
        newPassword
      });
      
      setShowForgotPassword(false);
      setShowResetForm(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-8 rounded-lg w-full max-w-md shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-primary-800 mb-2">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600">
            {isSignup 
              ? 'Start your 7-day free trial' 
              : 'Sign in to access your inventory system'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                name="email"
                id="email"
                list="email-suggestions"
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter email"
              />
              <datalist id="email-suggestions">
                {savedEmails.map((savedEmail, index) => (
                  <option key={index} value={savedEmail} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={4}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                className="w-full pl-10 pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800'
            }`}
          >
            {loading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        {!showForgotPassword && (
          <div className="mt-4 text-center space-y-2">
            {!isSignup && (
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary-600 hover:text-primary-800 block w-full"
              >
                Forgot Password?
              </button>
            )}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}
              </p>
              <button
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                  setEmail('');
                  setPassword('');
                }}
                className="text-primary-600 hover:text-primary-800 font-medium"
              >
                {isSignup ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </div>
        )}

        {showForgotPassword && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Reset Password</h3>
            
            {!showResetForm ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter your email"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full py-2 px-4 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50"
                >
                  Back to Login
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="6-digit OTP"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter new password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetForm(false);
                    setShowForgotPassword(false);
                  }}
                  className="w-full py-2 px-4 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        )}

        {isSignup && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>7-Day Free Trial:</strong> Full access to all features. No credit card required.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthModal;