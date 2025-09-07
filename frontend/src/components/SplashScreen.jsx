import React from 'react';
import AWSSpinner from './AWSSpinner';

function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center z-50">
      <div className="bg-white p-12 rounded-xl shadow-2xl flex flex-col items-center max-w-md mx-4">
        <img 
          src="../assets/full-logo.png" 
          alt="Hisab Ghar" 
          className="w-56 h-auto mb-8"
        />
        <div className="flex flex-col items-center space-y-4">
          <AWSSpinner size="lg" className="text-blue-600" />
          <p className="text-gray-600 text-sm font-medium">Loading application...</p>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;