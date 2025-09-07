import React from 'react';
import AWSSpinner from './AWSSpinner';

function LoadingSpinner({ size = 'md', text = 'Loading...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <AWSSpinner size={size} className="text-blue-600 mb-3" />
      <p className="text-gray-600 text-sm font-medium">{text}</p>
    </div>
  );
}

export default LoadingSpinner;