import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wallet, AlertCircle } from 'lucide-react';

const IMIT8_CHAIN = {
    chainId: '0x110C48', // 1117256 in hex
    chainName: 'Imit8',
    nativeCurrency: {
      name: 'IMIT',
      symbol: 'IMIT',
      decimals: 18
    },
    rpcUrls: ['https://subnets.avacloud.io/f42c253d-a0d9-4326-b568-2ea514391459'],
    blockExplorerUrls: []
  };
  
  const WalletConnection = ({ onConnected }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [account, setAccount] = useState('');
    const [isCorrectChain, setIsCorrectChain] = useState(false);
    const [error, setError] = useState('');
    const [isChecking, setIsChecking] = useState(true);
  
    useEffect(() => {
      checkConnection();
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
      }
  
      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }, []);
  
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          setIsChecking(true);
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts',
            params: []
          });
          
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
            
            // Check if we're already on the correct network
            const chainId = await window.ethereum.request({ 
              method: 'eth_chainId',
              params: []
            });
            
            const isCorrect = chainId.toLowerCase() === IMIT8_CHAIN.chainId.toLowerCase();
            setIsCorrectChain(isCorrect);
            
            if (isCorrect && onConnected) {
              onConnected(accounts[0]);
            }
          }
        } catch (err) {
          console.error('Error checking connection:', err);
        } finally {
          setIsChecking(false);
        }
      }
    };
  
    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        const isCorrect = await checkAndSetCorrectChain();
        if (isCorrect && onConnected) {
          onConnected(accounts[0]);
        }
      } else {
        setIsConnected(false);
        setAccount('');
        setIsCorrectChain(false);
      }
    };
  
    const handleChainChanged = async (newChainId) => {
      const isCorrect = newChainId.toLowerCase() === IMIT8_CHAIN.chainId.toLowerCase();
      setIsCorrectChain(isCorrect);
      if (isCorrect && account && onConnected) {
        onConnected(account);
      }
    };
  
    const checkAndSetCorrectChain = async () => {
      try {
        const chainId = await window.ethereum.request({ 
          method: 'eth_chainId',
          params: []
        });
        const isCorrect = chainId.toLowerCase() === IMIT8_CHAIN.chainId.toLowerCase();
        setIsCorrectChain(isCorrect);
        return isCorrect;
      } catch (err) {
        console.error('Error checking chain:', err);
        return false;
      }
    };
  
    const addImit8Network = async () => {
      try {
        // First check if we're already on the correct network
        const currentChainId = await window.ethereum.request({
          method: 'eth_chainId',
          params: []
        });
  
        if (currentChainId.toLowerCase() === IMIT8_CHAIN.chainId.toLowerCase()) {
          setIsCorrectChain(true);
          if (account && onConnected) {
            onConnected(account);
          }
          return true;
        }
  
        // If not on correct network, try to switch
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: IMIT8_CHAIN.chainId }]
          });
          setIsCorrectChain(true);
          return true;
        } catch (switchError) {
          // If network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: IMIT8_CHAIN.chainId,
                chainName: IMIT8_CHAIN.chainName,
                nativeCurrency: IMIT8_CHAIN.nativeCurrency,
                rpcUrls: IMIT8_CHAIN.rpcUrls,
                blockExplorerUrls: IMIT8_CHAIN.blockExplorerUrls
              }]
            });
            return await checkAndSetCorrectChain();
          }
          throw switchError;
        }
      } catch (err) {
        console.error('Error adding network:', err);
        setError('Failed to add network. Please try again.');
        return false;
      }
    };
  
    const connectWallet = async () => {
      if (!window.ethereum) {
        setError('Please install MetaMask to continue!');
        return;
      }
  
      try {
        setError('');
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
          params: []
        });
        
        setAccount(accounts[0]);
        setIsConnected(true);
        
        const networkSuccess = await addImit8Network();
        if (networkSuccess && onConnected) {
          onConnected(accounts[0]);
        }
      } catch (err) {
        console.error('Connection error:', err);
        setError('Failed to connect. Please try again.');
      }
    };
  
    if (isChecking) {
      return <div className="text-center">Checking connection...</div>;
    }
  
    return (
      <div className="flex flex-col items-center mt-32">
        <div className="w-full max-w-md space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl backdrop-blur-sm bg-opacity-90">
            {!isConnected ? (
              <Button 
              onClick={connectWallet}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-8 rounded-2xl font-bold text-2xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
            >
              <Wallet className="w-8 h-8" />
              Connect Wallet
            </Button>            
            ) : !isCorrectChain ? (
              <Button 
                onClick={addImit8Network}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-6 rounded-full font-semibold flex items-center justify-center gap-2 text-lg"
              >
                <AlertCircle className="w-6 h-6" />
                Switch to Imit8 Network
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Connected Wallet</p>
                <p className="font-mono bg-gray-100 rounded-full px-4 py-2 text-sm">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </p>
              </div>
            )}
  
            {error && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  export default WalletConnection;