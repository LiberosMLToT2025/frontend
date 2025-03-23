"use client";
import React from 'react';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RegistrationForm from "../components/registration-form";
import HomeDashboard from "../components/home-dashboard";
import useStore from "../lib/store";
import { getWalletInfo } from "../lib/wallet";
import { SPVWalletUserAPI, OpReturn, DraftTransactionConfig } from '@bsv/spv-wallet-js-client';
import { initUserWallet } from "../lib/wallet";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"register" | "login" | "dashboard">("register");
  const [walletId, setWalletId] = useState("");
  const [xPrivKey, setXPrivKey] = useState("");
  const [message, setMessage] = useState("");
  const [serverUrl, setServerUrl] = useState(process.env.NEXT_PUBLIC_SPV_WALLET_BASE_URL || 'https://spv.money');
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [usePrivateKey, setUsePrivateKey] = useState(false);
  const { user, setUser, clearUser } = useStore();
  const [mounted, setMounted] = useState(false);

  // Unikaj hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Sprawdź, czy użytkownik już jest zalogowany
    if (user.xpub) {
      setActiveTab("dashboard");
    }
  }, [user.xpub]);

  if (!mounted) return null;

  const createOpReturnTransaction = async (xpriv: string, message: string) => {
    try {
      const walletClient = await initUserWallet(xpriv);
      
      const opReturn: OpReturn = {
        stringParts: [message],
      };
      
      const transactionConfig: DraftTransactionConfig = {
        outputs: [
          {
            opReturn: opReturn,
          },
        ],
      };
      
      const draftTransaction = await walletClient.draftTransaction(transactionConfig, {});
      const finalized = await walletClient.finalizeTransaction(draftTransaction);
      const transaction = await walletClient.recordTransaction(finalized, draftTransaction.id, {});
      
      setResult(transaction);
      return transaction;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const handleLogout = () => {
    clearUser();
    setActiveTab("login");
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);

    try {
      if (usePrivateKey) {
        // Logowanie za pomocą klucza prywatnego
        if (!xPrivKey) {
          setLoginError("Wprowadź klucz prywatny (xpriv)");
          setIsLoading(false);
          return;
        }

        console.log("Logowanie za pomocą klucza prywatnego (xpriv)");

        // Inicjalizujemy portfel z kluczem prywatnym
        const walletClient = await initUserWallet(xPrivKey);
        const xpubInfo = await walletClient.xPub();
        
        // Pobieramy dane portfela
        const walletInfo = {
          id: xpubInfo.id,
          currentBalance: xpubInfo.currentBalance || 0
        };
        
        console.log("Dane portfela (tryb prywatny):", walletInfo);
        
        // Ustawiamy dane użytkownika w store z kluczem prywatnym
        setUser({ 
          xpub: xpubInfo.id,
          xpriv: xPrivKey,
          balance: walletInfo.currentBalance,
          walletId: walletInfo.id,
          isPrivateMode: true // Dodajemy flagę trybu prywatnego
        });
        
        setActiveTab("dashboard");
      } else {
        // Logowanie za pomocą klucza publicznego (xpub)
        if (!walletId) {
          setLoginError("Wprowadź klucz publiczny (xpub)");
          setIsLoading(false);
          return;
        }

        console.log("Logowanie za pomocą klucza publicznego (xpub)");

        try {
          // Pobieramy podstawowe dane portfela z API (bez salda)
          const walletInfo = await getWalletInfo(walletId);
          console.log("Dane portfela (tryb publiczny):", walletInfo);
          
          // Ustawiamy dane użytkownika w store - BEZ salda
          setUser({ 
            xpub: walletId,
            walletId: walletInfo.id || walletId,
            isPrivateMode: false // Dodajemy flagę trybu publicznego
          });
        } catch (err) {
          console.error("Błąd pobierania danych portfela:", err);
          // Nawet jeśli API nie zwróci danych, pozwalamy na zalogowanie tylko z kluczem publicznym
          setUser({ 
            xpub: walletId,
            walletId: walletId,
            isPrivateMode: false
          });
        }
        
        setActiveTab("dashboard");
      }
    } catch (error) {
      console.error("Błąd logowania:", error);
      setLoginError(usePrivateKey 
        ? "Nie udało się zalogować. Sprawdź poprawność klucza prywatnego (xpriv)." 
        : "Nie udało się zalogować. Sprawdź poprawność klucza publicznego (xpub).");
    } finally {
      setIsLoading(false);
    }
  };

  const renderLoginForm = () => (
    <div className="bg-card p-6 rounded-lg shadow-md max-w-md mx-auto border border-subtle">
      <h2 className="text-xl font-semibold mb-6">Zaloguj się do portfela</h2>
      {loginError && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-md mb-4">
          {loginError}
        </div>
      )}
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="flex mb-4">
          <button
            type="button"
            className={`flex-1 py-2 text-center ${
              !usePrivateKey
                ? "bg-primary text-white"
                : "bg-subtle text-foreground"
            }`}
            onClick={() => setUsePrivateKey(false)}
          >
            Klucz publiczny
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-center ${
              usePrivateKey
                ? "bg-primary text-white"
                : "bg-subtle text-foreground"
            }`}
            onClick={() => setUsePrivateKey(true)}
          >
            Klucz prywatny
          </button>
        </div>

        {usePrivateKey ? (
          <div>
            <label htmlFor="xPrivKey" className="block text-sm font-medium mb-1">
              Klucz prywatny (xPriv)
            </label>
            <input
              id="xPrivKey"
              type="password"
              value={xPrivKey}
              onChange={(e) => setXPrivKey(e.target.value)}
              placeholder="Wprowadź klucz prywatny (xpriv)..."
              className="w-full px-3 py-2 border border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-card"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Wprowadź klucz prywatny (xpriv), aby uzyskać pełny dostęp do swojego portfela
            </p>
          </div>
        ) : (
          <div>
            <label htmlFor="walletId" className="block text-sm font-medium mb-1">
              Klucz publiczny (xPub)
            </label>
            <input
              id="walletId"
              type="text"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              placeholder="Wprowadź klucz publiczny (xpub)..."
              className="w-full px-3 py-2 border border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-card"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Wprowadź klucz publiczny (xpub), aby uzyskać dostęp do swojego portfela (tylko odczyt)
            </p>
          </div>
        )}
        
        <button 
          type="submit" 
          className={`w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors flex items-center justify-center ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Logowanie...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
              Zaloguj się
            </>
          )}
        </button>
      </form>
    </div>
  );

  // Dodajemy nową funkcję renderującą informacje o koncie użytkownika
  const renderUserInfo = () => {
    return (
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold bg-gradient-blue-purple text-transparent bg-clip-text">
          Stellum Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Witaj, ID portfela: {user.walletId || user.xpub?.substring(0, 8)}...
        </p>
        {user.publicName && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {user.publicName} {user.paymail && `(${user.paymail})`}
          </p>
        )}
        
        {/* Wyświetlamy saldo tylko w trybie prywatnym */}
        {user.isPrivateMode && user.balance !== undefined && (
          <div className="mt-2 bg-subtle inline-block px-4 py-2 rounded-full">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="font-medium">Saldo: {user.balance} satoshi</span>
            </div>
          </div>
        )}
        
        {/* Informacja o trybie przeglądania */}
        <div className={`mt-2 inline-block px-4 py-2 rounded-full ${user.isPrivateMode ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {user.isPrivateMode ? 'Tryb prywatny' : 'Tryb publiczny (tylko odczyt)'}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-5xl px-4">
      {user.xpub ? (
        <div>
          <div className="mb-6">
            {renderUserInfo()}
            <button
              onClick={handleLogout}
              className="bg-subtle hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground px-4 py-2 rounded-md transition-colors block mx-auto"
            >
              Wyloguj się
            </button>
          </div>

          <HomeDashboard />
        </div>
      ) : (
        <div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-blue-purple text-transparent bg-clip-text">Stellum</h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Bezpieczna wymiana plików i zapisywanie wiadomości na blockchain Bitcoin SV.
              Przesyłaj, przechowuj i wymieniaj dane z zachowaniem pełnego bezpieczeństwa.
            </p>
          </div>
        
          <div className="mb-6">
            <div className="border-b border-subtle pb-1">
              <ul className="flex space-x-6 justify-center">
                <li>
                  <button
                    className={`px-3 py-2 font-medium rounded-t-lg transition-colors ${
                      activeTab === "register"
                        ? "text-primary border-b-2 border-primary bg-white/5"
                        : "text-gray-500 hover:text-primary"
                    }`}
                    onClick={() => setActiveTab("register")}
                  >
                    Stwórz portfel
                  </button>
                </li>
                <li>
                  <button
                    className={`px-3 py-2 font-medium rounded-t-lg transition-colors ${
                      activeTab === "login"
                        ? "text-primary border-b-2 border-primary bg-white/5"
                        : "text-gray-500 hover:text-primary"
                    }`}
                    onClick={() => setActiveTab("login")}
                  >
                    Zaloguj się
                  </button>
                </li>
              </ul>
            </div>

            <div className="max-w-lg mx-auto mb-8">
              {activeTab === "register" ? (
                <div className="bg-card p-6 rounded-lg shadow-md border border-subtle">
                  <RegistrationForm />
                </div>
              ) : activeTab === "login" ? (
                renderLoginForm()
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}