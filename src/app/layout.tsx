import React from 'react';
import './globals.css';
import Logo from '../components/logo';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Stellum - Bezpieczna wymiana plików na BSV</title>
        <meta name="description" content="Stellum - Bezpieczna wymiana plików na blockchain Bitcoin SV" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <nav className="bg-gradient-blue-purple text-white shadow-md">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Logo />
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <a href="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors">
                    Strona główna
                  </a>
                  <a href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors">
                    Dokumentacja
                  </a>
                  <a href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition-colors">
                    Kontakt
                  </a>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8">{children}</main>

        <footer className="bg-card text-foreground py-8 mt-12 border-t border-subtle">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">O Stellum</h3>
                <p className="text-gray-500 dark:text-gray-300">
                  Stellum to platforma umożliwiająca bezpieczną wymianę plików na blockchain Bitcoin SV. 
                  Wszystkie transakcje są szyfrowane i zapisywane w sposób trwały.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Linki</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-primary hover:text-primary-dark transition-colors">Strona główna</a></li>
                  <li><a href="#" className="text-primary hover:text-primary-dark transition-colors">Dokumentacja API</a></li>
                  <li><a href="#" className="text-primary hover:text-primary-dark transition-colors">Warunki użytkowania</a></li>
                  <li><a href="#" className="text-primary hover:text-primary-dark transition-colors">Polityka prywatności</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Kontakt</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    <span className="text-gray-500 dark:text-gray-300">kontakt@stellum.pl</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}