"use client";

import { useState, useEffect } from 'react';
import { createOpReturnTransaction } from '../lib/wallet';
import useStore from '../lib/store';

interface InscribeTextProps {
  xpriv?: string;
}

export default function InscribeText({ xpriv }: InscribeTextProps) {
  const { user } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [userXpriv, setUserXpriv] = useState('');

  // Funkcja do wyzwalania odświeżania dashboardu
  const triggerDashboardRefresh = () => {
    console.log("InscribeText - Wyzwalanie odświeżania dashboardu po zapisie na blockchain");
    const refreshEvent = new CustomEvent('dashboardRefresh', { bubbles: true });
    window.dispatchEvent(refreshEvent);
    // Dodatkowe bezpośrednie wywołanie zdarzenia dla pewności
    setTimeout(() => {
      console.log("InscribeText - Ponowna próba wyzwolenia odświeżania dashboardu");
      window.dispatchEvent(new Event('dashboardRefresh'));
    }, 500);
  };

  // Użyj klucza prywatnego z props lub ze store
  useEffect(() => {
    if (xpriv) {
      setUserXpriv(xpriv);
    } else if (user.xpriv) {
      setUserXpriv(user.xpriv);
    }
  }, [xpriv, user.xpriv]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!userXpriv) {
      setError('Podaj klucz prywatny xpriv');
      setIsLoading(false);
      return;
    }

    try {
      // Używamy rzeczywistego API do zapisania transakcji
      const transaction = await createOpReturnTransaction(userXpriv, message);
      setTransactionId(transaction.id);
      setSuccess('Wiadomość została zapisana na blockchain!');
      setMessage('');
      
      // Odśwież dashboard po pomyślnym zapisie na blockchain
      triggerDashboardRefresh();
    } catch (err) {
      console.error('Nie udało się utworzyć transakcji:', err);
      setError('Nie udało się utworzyć transakcji. Sprawdź dane i spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-md mb-4">
          <p>{success}</p>
          <p className="text-sm mt-1">
            ID transakcji: <span className="font-mono">{transactionId}</span>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!xpriv && !user.xpriv && (
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="xpriv">
              Klucz prywatny xPriv
            </label>
            <input
              className="w-full px-3 py-2 border border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-card"
              id="xpriv"
              type="password"
              placeholder="Wprowadź swój klucz xpriv"
              value={userXpriv}
              onChange={(e) => setUserXpriv(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Twój klucz prywatny nigdy nie jest przechowywany na serwerze
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="message">
            Wiadomość (OP_RETURN)
          </label>
          <textarea
            className="w-full px-3 py-2 border border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-card min-h-[120px]"
            id="message"
            placeholder="Wprowadź swoją wiadomość do zapisania na blockchain"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Ta wiadomość zostanie trwale zapisana na blockchain Bitcoin SV
          </p>
        </div>

        <div className="pt-2">
          <button
            className={`w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Zapisywanie...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Zapisz na blockchain
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
