import { useState, useEffect } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 text-center text-sm z-50 flex items-center justify-center gap-2">
      <FaExclamationTriangle />
      <span>You are offline. Showing cached data.</span>
    </div>
  );
}

export default NetworkStatus;