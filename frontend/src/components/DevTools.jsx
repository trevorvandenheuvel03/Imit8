import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const DevTools = ({ userWallet }) => {
  const clearAttempts = () => {
    try {
      // Clear attempts for current wallet
      localStorage.removeItem(`attempts_${userWallet}`);
      localStorage.removeItem(`lastAttempt_${userWallet}`);
      
      // Optional: Clear all attempts for all wallets
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('attempts_') || key.startsWith('lastAttempt_')) {
          localStorage.removeItem(key);
        }
      });
      
      alert('Attempts cleared successfully! Please refresh the page.');
    } catch (error) {
      console.error('Error clearing attempts:', error);
      alert('Error clearing attempts. See console for details.');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={clearAttempts}
        className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3"
        title="Clear Attempts (Dev Only)"
      >
        <Trash2 className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default DevTools;