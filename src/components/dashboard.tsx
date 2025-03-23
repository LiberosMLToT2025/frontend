import { useState, useEffect } from 'react';
import { getWalletInfo } from '../lib/wallet';
import React from 'react';

interface WalletInfo {
  id: string;
  createdAt: string;
  currentBalance: number;
}

interface DashboardProps {
  xpub: string;
}

export default function Dashboard({ xpub }: DashboardProps) {
  const [xpriv, setXpriv] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Fetch wallet data on component mount and when xpriv changes
  useEffect(() => {
    const fetchInitialData = async () => {
      if (xpriv) {
        await fetchWalletData();
      }
    };

    fetchInitialData();
  }, [xpriv, xpub]);

// Listen for route changes to refresh data
useEffect(() => {
  const handleRouteChange = async () => {
    if (xpriv) {
      await fetchWalletData();
    }
  };

  // Listen for both route changes and dashboard refresh events
  window.addEventListener('routeChangeComplete', handleRouteChange);
  window.addEventListener('dashboardRefresh', handleRouteChange);
  return () => {
    window.removeEventListener('routeChangeComplete', handleRouteChange);
    window.removeEventListener('dashboardRefresh', handleRouteChange);
  };
}, [xpriv]);

  const fetchWalletData = async () => {
    setIsLoading(true);
    setError(null);
  
    try {
      console.log("Fetching wallet info...");
      const walletData: WalletInfo = await getWalletInfo(xpriv!);
      console.log("Wallet info:", walletData);
  
      setWalletInfo(walletData);
    } catch (err) {
      console.error('Failed to fetch wallet data:', err);
      setError('Failed to fetch wallet data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchWalletData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const applyChanges = () => {
    if (xpriv) {
      handleRefresh();
    } else {
      setError('Please enter your xpriv key first');
    }
  };

  const formatSatoshis = (satoshis: number): string => {
    return (satoshis / 100000000).toFixed(8); // Convert satoshis to BSV
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Ask for xpriv if not provided */}
      {!xpriv && (
        <div className="mb-4 p-4 border border-yellow-500 bg-yellow-100 rounded">
          <p className="text-yellow-800">Please enter your xpriv to fetch wallet details:</p>
          <input
            type="password"
            className="mt-2 w-full px-3 py-2 border rounded"
            placeholder="Enter xpriv"
            onChange={(e) => setXpriv(e.target.value)}
          />
          <button
            className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={applyChanges}
          >
            Apply
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-4">Loading wallet information...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Wallet Overview */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Wallet Overview</h2>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Wallet ID</p>
              <p className="font-mono text-sm break-all">{walletInfo?.id || 'N/A'}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Network</p>
              <p>{process.env.SPV_WALLET_NETWORK || 'mainnet'}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Created</p>
              <p>{walletInfo?.createdAt ? new Date(walletInfo.createdAt).toLocaleString() : '-'}</p>
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Balance</h2>

            <div className="text-2xl font-bold text-green-600">
              {walletInfo ? formatSatoshis(walletInfo.currentBalance) : '0.00000000'} BSV
            </div>

            <p className="text-sm text-gray-500">
              {walletInfo?.currentBalance || 0} Satoshis
            </p>

            <button
              className={`mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center ${
                isRefreshing || !xpriv ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handleRefresh}
              disabled={isRefreshing || !xpriv}
            >
              {isRefreshing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Refresh Balance
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
