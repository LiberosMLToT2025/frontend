"use client";
import React from 'react';
import { useState, useEffect } from 'react';
import FileUpload from './file-upload';
import FileList from './file-list';
import FileExchange from './file-exchange';
import InscribeText from './inscribe-text';
import useStore from '../lib/store';
import { useRouter } from 'next/navigation';

const HomeDashboard = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'exchange' | 'inscribe'>('upload');
  const { user, clearUser } = useStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Unikaj hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    clearUser();
    router.push('/');
  };

  if (!mounted) return null;

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-blue-purple text-transparent bg-clip-text">Stellum</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Bezpieczna wymiana plików i zapisywanie wiadomości na blockchain Bitcoin SV
        </p>
      </div>

      {user.xpub ? (
        <div className="bg-card rounded-lg shadow-soft border border-subtle">
          <div className="border-b border-subtle">
            <div className="flex flex-col sm:flex-row justify-between items-center p-4">
              <div className="flex mb-4 sm:mb-0">
                <button
                  className={`px-4 py-2 mr-2 rounded-md flex items-center ${
                    activeTab === 'upload'
                      ? 'bg-primary text-white'
                      : 'bg-subtle text-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
                  } transition-colors`}
                  onClick={() => setActiveTab('upload')}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  Pliki
                </button>
                <button
                  className={`px-4 py-2 mr-2 rounded-md flex items-center ${
                    activeTab === 'exchange'
                      ? 'bg-primary text-white'
                      : 'bg-subtle text-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
                  } transition-colors`}
                  onClick={() => setActiveTab('exchange')}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                  </svg>
                  Wymiana
                </button>
                <button
                  className={`px-4 py-2 rounded-md flex items-center ${
                    activeTab === 'inscribe'
                      ? 'bg-primary text-white'
                      : 'bg-subtle text-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
                  } transition-colors`}
                  onClick={() => setActiveTab('inscribe')}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Wiadomość
                </button>
              </div>
              <div className="bg-subtle rounded-md px-4 py-2 border border-subtle flex items-center">
                <svg className="w-4 h-4 mr-2 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="font-medium text-foreground">Saldo:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-300">{user.balance || 0} satoshi</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'upload' && (
              <div className="space-y-6">
                <div className="bg-subtle p-5 rounded-lg border border-subtle">
                  <h2 className="text-lg font-medium mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    Prześlij nowy plik
                  </h2>
                  <FileUpload />
                </div>
                <div className="bg-subtle p-5 rounded-lg border border-subtle">
                  <h2 className="text-lg font-medium mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Twoje pliki
                  </h2>
                  <div>
                    <FileList />
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'exchange' && <FileExchange />}
            
            {activeTab === 'inscribe' && (
              <div className="bg-subtle p-5 rounded-lg border border-subtle">
                <h2 className="text-lg font-medium mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Zapisz wiadomość na blockchain
                </h2>
                <InscribeText xpriv={user.xpriv} />
              </div>
            )}
          </div>
          
          <div className="border-t border-subtle p-4 flex justify-center">
            <button
              onClick={handleLogout}
              className="bg-subtle hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground px-4 py-2 rounded-md transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              Wyloguj się
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-card p-6 rounded-lg shadow-soft border border-subtle">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">
              Zaloguj się lub stwórz portfel aby korzystać z Stellum
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-lg mx-auto">
              Aby przesyłać i wymieniać pliki na Bitcoin SV, musisz najpierw zalogować się lub utworzyć nowy portfel.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="/"
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                </svg>
                Zaloguj się
              </a>
              <a
                href="/"
                className="px-4 py-2 bg-subtle text-foreground hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Stwórz portfel
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-card rounded-lg shadow-soft border border-subtle overflow-hidden">
        <div className="border-b border-subtle p-4 bg-subtle">
          <h3 className="text-lg font-medium">
            Dlaczego warto korzystać z Stellum?
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="p-4 border border-subtle rounded-lg hover:shadow-soft transition-shadow">
              <div className="text-accent mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <h4 className="text-base font-medium mb-2">Bezpieczeństwo</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Wszystkie pliki są szyfrowane i zapisywane w bezpieczny sposób na blockchain Bitcoin SV.
              </p>
            </div>
            <div className="p-4 border border-subtle rounded-lg hover:shadow-soft transition-shadow">
              <div className="text-secondary mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h4 className="text-base font-medium mb-2">Szybkość</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Wymiana plików odbywa się natychmiastowo dzięki nowoczesnej infrastrukturze blockchain.
              </p>
            </div>
            <div className="p-4 border border-subtle rounded-lg hover:shadow-soft transition-shadow">
              <div className="text-primary mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h4 className="text-base font-medium mb-2">Globalny dostęp</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Dostęp do twoich plików z dowolnego miejsca na świecie bez ograniczeń.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard; 