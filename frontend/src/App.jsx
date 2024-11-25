import React, { useState } from 'react';
import { ThirdwebProvider } from "thirdweb/react";
import EmotionGame from './components/EmotionGame';
import WalletConnection from './components/WalletConnection';
import PhotoWall from './components/PhotoWall';
import FunHeader from './components/FunHeader';

const clientId = "9407d81e31b2a1f968068fa68fccb769";

function App() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [userAccount, setUserAccount] = useState(null);

  const handleWalletConnected = (account) => {
    setIsWalletConnected(true);
    setUserAccount(account);
  };

  return (
    <ThirdwebProvider clientId={clientId}>
      <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100">
        <div className="w-full py-12 px-8 absolute top-0">
          <FunHeader />
        </div>

        <div className="container mx-auto px-4">
          <div className="pt-40 pb-12">
            {!isWalletConnected ? (
              <div className="max-w-4xl mx-auto">
                <WalletConnection onConnected={handleWalletConnected} />
              </div>
            ) : (
              <EmotionGame userWallet={userAccount} clientId={clientId} />
            )}
          </div>
          
          <div className="py-12">
            <PhotoWall />
          </div>
        </div>
      </div>
    </ThirdwebProvider>
  );
}

export default App;