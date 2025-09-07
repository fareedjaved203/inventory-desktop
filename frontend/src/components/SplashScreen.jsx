import React from 'react';

function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center">
        <img 
          src="/full-logo.png" 
          alt="Logo" 
          className="w-48 h-auto mb-4"
        />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    </div>
  );
}

export default SplashScreen;