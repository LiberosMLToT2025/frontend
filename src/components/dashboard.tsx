import { useState, useEffect } from 'react';
import { getWalletInfo, getTransactions } from '../lib/wallet';
import React from 'react';
import useStore from '../lib/store';

interface WalletInfo {
  id: string;
  createdAt: string;
  currentBalance: number;
}

// Zmodyfikowany interfejs Transaction, aby odpowiadał danym z API
interface Transaction {
  id: string;
  createdAt: string;
  status: string;
  amount?: number;
  direction?: 'incoming' | 'outgoing';
  purpose?: string;
  [key: string]: any; // Pozwala na dodatkowe pola z API
}

interface DashboardProps {
  xpub: string;
}

export default function Dashboard({ xpub }: DashboardProps) {
  const { user } = useStore();
  const [xpriv, setXpriv] = useState<string | null>(user.xpriv || null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isPrivateKeyMode, setIsPrivateKeyMode] = useState<boolean>(user.isPrivateMode || false);

  useEffect(() => {
    console.log("Dashboard - Stan początkowy:", { 
      xpub, 
      userXpub: user.xpub,
      userXpriv: user.xpriv ? "[ukryty dla bezpieczeństwa]" : null,
      isPrivateMode: user.isPrivateMode 
    });
    
    // Jeśli użytkownik ma już ustawioną flagę isPrivateMode w store, używamy jej
    if (user.isPrivateMode !== undefined) {
      setIsPrivateKeyMode(user.isPrivateMode);
    }
    
    // Jeśli użytkownik ma już klucz prywatny w store, używamy go
    if (user.xpriv) {
      setXpriv(user.xpriv);
    }
  }, [user]);

  const fetchInitialData = async () => {
    // Domyślnie zawsze startujemy w trybie publicznym jeśli nie ma flagi w store
    if (!user.isPrivateMode) {
      console.log("Dashboard - Ustawianie trybu publicznego (tylko odczyt)");
      setIsPrivateKeyMode(false);
      await fetchTransactionHistory();
    } else {
      console.log("Dashboard - Tryb prywatny aktywny z store");
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [xpub, user.isPrivateMode]);

  // Efekt dla zmian xpriv
  useEffect(() => {
    const switchToPrivateMode = async () => {
      if (xpriv) {
        console.log("Dashboard - Przełączanie na tryb prywatny");
        setIsPrivateKeyMode(true);
        await fetchWalletData();
      }
    };

    if (xpriv) {
      switchToPrivateMode();
    }
  }, [xpriv]);

  const fetchWalletData = async () => {
    if (!xpriv) {
      console.log("Dashboard - Brak klucza xpriv, nie można pobrać danych portfela");
      return;
    }
    
    console.log("Dashboard - Rozpoczynam pobieranie danych portfela...");
    setIsLoading(true);
    setError(null);
  
    try {
      console.log("Dashboard - Pobieranie danych portfela kluczem prywatnym...");
      const walletData: WalletInfo = await getWalletInfo(xpriv);
      console.log("Dashboard - Pobrano dane portfela:", walletData);
  
      setWalletInfo(walletData);
      
      // Pobierz również historię transakcji
      await fetchTransactionHistory();
    } catch (err) {
      console.error('Dashboard - Błąd pobierania danych portfela:', err);
      setError('Nie udało się pobrać danych portfela. Spróbuj ponownie lub sprawdź poprawność klucza xpriv.');
      // Wróć do trybu publicznego
      setIsPrivateKeyMode(false);
    } finally {
      setIsLoading(false);
      console.log("Dashboard - Zakończono pobieranie danych portfela");
    }
  };

  const fetchTransactionHistory = async () => {
    setError(null);
    
    try {
      console.log("Dashboard - Pobieranie historii transakcji dla klucza publicznego...");
      const transactionData: any = await getTransactions(xpub);
      console.log("Dashboard - Historia transakcji:", transactionData);
      
      // Sprawdzamy strukturę danych i wyciągamy listę transakcji
      let transactionList: any[] = [];
      if (Array.isArray(transactionData)) {
        transactionList = transactionData;
      } else if (transactionData && typeof transactionData === 'object') {
        // Sprawdzamy różne możliwe pola, które mogą zawierać listę transakcji
        if (Array.isArray(transactionData.results)) {
          transactionList = transactionData.results;
        } else if (Array.isArray(transactionData.transactions)) {
          transactionList = transactionData.transactions;
        } else if (Array.isArray(transactionData.items)) {
          transactionList = transactionData.items;
        } else if (transactionData.data && Array.isArray(transactionData.data)) {
          transactionList = transactionData.data;
        }
      }
      
      setTransactions(transactionList as Transaction[]);
      console.log("Dashboard - Liczba transakcji:", transactionList.length);
    } catch (err) {
      console.error('Dashboard - Błąd pobierania historii transakcji:', err);
      setError('Nie udało się pobrać historii transakcji. Spróbuj ponownie.');
    }
  };

  // Listen for route changes to refresh data
  useEffect(() => {
    const handleRouteChange = async (event: Event) => {
      console.log(`Dashboard - Złapano zdarzenie odświeżania: ${event.type}`, { isPrivateKeyMode, hasXpriv: !!xpriv });
      
      // Zawsze używamy aktualnych wartości ze stanu, a nie z domknięcia
      if (isPrivateKeyMode && xpriv) {
        console.log("Dashboard - Odświeżanie danych w trybie prywatnym (saldo + historia)");
        await fetchWalletData();
      } else {
        console.log("Dashboard - Odświeżanie danych w trybie publicznym (tylko historia)");
        await fetchTransactionHistory();
      }
      
      console.log("Dashboard - Zakończono odświeżanie danych");
    };

    console.log("Dashboard - Ustawianie nasłuchiwaczy zdarzeń odświeżania", { isPrivateKeyMode, hasXpriv: !!xpriv });

    // Listen for both route changes and dashboard refresh events
    window.addEventListener('routeChangeComplete', handleRouteChange);
    window.addEventListener('dashboardRefresh', handleRouteChange);
    return () => {
      window.removeEventListener('routeChangeComplete', handleRouteChange);
      window.removeEventListener('dashboardRefresh', handleRouteChange);
    };
  }, [isPrivateKeyMode, xpriv]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (isPrivateKeyMode && xpriv) {
        await fetchWalletData();
      } else {
        await fetchTransactionHistory();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const applyPrivateKey = () => {
    console.log("Dashboard - Próba przełączenia na tryb prywatny");
    if (xpriv) {
      fetchWalletData();
    } else {
      setError('Proszę wprowadzić prawidłowy klucz xpriv');
    }
  };

  const switchToPublicMode = () => {
    console.log("Dashboard - Przełączanie na tryb publiczny");
    setXpriv(null);
    setIsPrivateKeyMode(false);
    setWalletInfo(null);
    fetchTransactionHistory();
  };

  const formatSatoshis = (satoshis: number): string => {
    return (satoshis / 100000000).toFixed(8); // Convert satoshis to BSV
  };

  // Dodanie funkcji do wyzwalania odświeżania, którą można wywołać po transakcji
  const dispatchRefreshEvent = () => {
    console.log("Dashboard - Wyzwalanie zdarzenia odświeżania po transakcji");
    const refreshEvent = new CustomEvent('dashboardRefresh');
    window.dispatchEvent(refreshEvent);
  };

  // Poprawiona funkcja do określania kierunku transakcji
  const getTransactionDirection = (tx: Transaction): string => {
    if (tx.direction) return tx.direction;
    
    // Próbujemy określić kierunek na podstawie innych pól
    if (tx.type === 'receive' || tx.type === 'incoming') return 'incoming';
    if (tx.type === 'send' || tx.type === 'outgoing') return 'outgoing';
    
    // Sprawdzamy na podstawie pól from i to
    if (tx.from && tx.to) {
      return 'outgoing'; // Najprostsze założenie
    }
    
    // Sprawdzamy na podstawie wartości (ujemna = wychodzące)
    if (tx.amount && tx.amount < 0) return 'outgoing';
    if (tx.amount && tx.amount > 0) return 'incoming';
    
    return 'unknown';
  };

  // Poprawiona funkcja do określania kwoty transakcji
  const getTransactionAmount = (tx: Transaction): number => {
    if (typeof tx.amount === 'number') return Math.abs(tx.amount);
    
    // Próbujemy określić kwotę na podstawie innych pól
    if (tx.satoshis) return Math.abs(tx.satoshis);
    if (tx.value) return Math.abs(tx.value);
    if (tx.outputs && Array.isArray(tx.outputs)) {
      return tx.outputs.reduce((sum, output) => sum + (output.satoshis || 0), 0);
    }
    
    return 0;
  };

  console.log("Dashboard - Aktualny stan komponentu:", { 
    isPrivateKeyMode, 
    hasWalletInfo: !!walletInfo, 
    transactionsCount: transactions.length,
    hasError: !!error
  });

  return (
    <div className="max-w-lg mx-auto">
      {/* Informacja o trybie przeglądania */}
      <div className={`mb-4 p-4 rounded ${isPrivateKeyMode ? 'bg-green-100 border border-green-500' : 'bg-yellow-100 border border-yellow-500'}`}>
        <p className={`${isPrivateKeyMode ? 'text-green-800' : 'text-yellow-800'} font-medium`}>
          {isPrivateKeyMode 
            ? 'Tryb prywatny: Masz pełny dostęp do portfela włącznie z saldem.'
            : 'Tryb publiczny: Przeglądasz portfel w trybie tylko do odczytu (bez dostępu do salda).'}
        </p>
      </div>

      {/* Przełączanie między trybami */}
      <div className="mb-4 flex flex-col">
        {!isPrivateKeyMode ? (
          <div className="p-4 bg-white shadow-md rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Przełącz na tryb prywatny</h3>
            <p className="text-sm text-gray-600 mb-3">
              Wprowadź klucz prywatny (xpriv), aby zobaczyć saldo i przeprowadzać transakcje:
            </p>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded mb-2"
              placeholder="Wprowadź klucz xpriv"
              onChange={(e) => setXpriv(e.target.value)}
            />
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              onClick={applyPrivateKey}
            >
              Przełącz na tryb prywatny
            </button>
          </div>
        ) : (
          <div className="p-4 bg-white shadow-md rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Tryb prywatny aktywny</h3>
            <p className="text-sm text-gray-600 mb-3">
              Jesteś w trybie prywatnym z pełnym dostępem do portfela.
            </p>
            <button
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              onClick={switchToPublicMode}
            >
              Przełącz na tryb publiczny
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-4">Ładowanie informacji o portfelu...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Wallet Overview */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Przegląd portfela</h2>

            <div className="mb-4">
              <p className="text-sm text-gray-600">ID portfela</p>
              <p className="font-mono text-sm break-all">{walletInfo?.id || xpub}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Sieć</p>
              <p>{process.env.SPV_WALLET_NETWORK || 'mainnet'}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Data utworzenia</p>
              <p>{walletInfo?.createdAt ? new Date(walletInfo.createdAt).toLocaleString() : '-'}</p>
            </div>
          </div>

          {/* Wallet Balance - tylko jeśli użytkownik jest zalogowany przez xpriv */}
          {isPrivateKeyMode && walletInfo && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Saldo</h2>

              <div className="text-2xl font-bold text-green-600">
                {formatSatoshis(walletInfo.currentBalance)} BSV
              </div>

              <p className="text-sm text-gray-500">
                {walletInfo.currentBalance} Satoshi
              </p>

              <button
                className={`mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center ${
                  isRefreshing ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Odświeżanie...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Odśwież saldo
                  </>
                )}
              </button>
            </div>
          )}

          {/* Transaction History */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Historia transakcji</h2>

            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Brak transakcji do wyświetlenia</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Typ
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Opis
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kwota (satoshi)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          {getTransactionDirection(tx) === 'incoming' ? (
                            <span className="px-2 py-1 text-xs rounded bg-green-50 text-green-700 border border-green-200">
                              Przychodzący
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 border border-blue-200">
                              Wychodzący
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {tx.purpose || tx.description || 'Brak opisu'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          {tx.status === 'completed' ? (
                            <span className="px-2 py-1 text-xs rounded bg-green-50 text-green-700 border border-green-200">
                              Zakończona
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded bg-yellow-50 text-yellow-700 border border-yellow-200">
                              {tx.status}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {getTransactionAmount(tx)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button
              className={`mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center ${
                isRefreshing ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Odświeżanie...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Odśwież transakcje
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
