"use client";
import React from 'react';
import { useState, useEffect } from 'react';
import useStore from '../lib/store';
import { exchangeFileWithBsv, getTransactionHistory } from '../lib/file-service';
import { FileItem, Transaction } from '../lib/types';

interface FileExchangeProps {
  readonly?: boolean;
}

const FileExchange = ({ readonly = false }: FileExchangeProps) => {
  const [recipientPaymail, setRecipientPaymail] = useState('');
  const [selectedFileId, setSelectedFileId] = useState('');
  const [isExchanging, setIsExchanging] = useState(false);
  const [message, setMessage] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { files, user } = useStore();
  
  const completedFiles = files.filter((file: FileItem) => file.status === 'completed');
  
  // Funkcja do wyzwalania odświeżania dashboardu
  const triggerDashboardRefresh = () => {
    console.log("FileExchange - Wyzwalanie odświeżania dashboardu po wymianie pliku");
    const refreshEvent = new CustomEvent('dashboardRefresh', { bubbles: true });
    window.dispatchEvent(refreshEvent);
    // Dodatkowe bezpośrednie wywołanie zdarzenia dla pewności
    setTimeout(() => {
      console.log("FileExchange - Ponowna próba wyzwolenia odświeżania dashboardu");
      window.dispatchEvent(new Event('dashboardRefresh'));
    }, 500);
  };
  
  // Pobierz historię transakcji przy montowaniu komponentu
  useEffect(() => {
    if (user && user.xpub) {
      fetchTransactionHistory();
    }
  }, [user]);
  
  const fetchTransactionHistory = async () => {
    setIsLoading(true);
    try {
      const history = await getTransactionHistory(user.xpub);
      setTransactions(history);
      console.log('Pobrano historię transakcji:', history);
    } catch (error: any) {
      console.error('Błąd podczas pobierania historii transakcji:', error);
      setMessage(`Nie udało się pobrać historii transakcji: ${error.message || 'nieznany błąd'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFileId || !recipientPaymail) {
      setMessage('Wybierz plik i podaj adres paymail odbiorcy');
      return;
    }
    
    if (!user.xpriv) {
      setMessage('Potrzebujesz zalogować się z kluczem prywatnym, aby wymieniać pliki');
      return;
    }
    
    setIsExchanging(true);
    setMessage('Rozpoczynam bezpieczną wymianę pliku...');
    
    try {
      // Wywołanie serwisu do wymiany pliku
      const result = await exchangeFileWithBsv(
        selectedFileId, 
        recipientPaymail, 
        user.xpriv
      );
      
      setMessage(`Wymiana pliku zakończona pomyślnie! Transakcja: ${result.txId}`);
      
      // Czyszczenie formularza
      setRecipientPaymail('');
      setSelectedFileId('');
      
      // Odśwież historię transakcji
      fetchTransactionHistory();
      
      // Wyzwól odświeżenie dashboardu
      triggerDashboardRefresh();
    } catch (error: any) {
      console.error('Błąd podczas wymiany pliku:', error);
      setMessage(`Wystąpił błąd podczas wymiany pliku: ${error.message || 'nieznany błąd'}`);
    } finally {
      setIsExchanging(false);
    }
  };
  
  // Renderuj historię transakcji
  const renderTransactionHistory = () => {
    if (isLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Ładowanie historii transakcji...</p>
        </div>
      );
    }
    
    if (transactions.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p className="mt-2 text-gray-600">Brak historii transakcji dla tego portfela</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
              <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kwota (satoshi)</th>
              <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Transakcji</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((tx, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="py-2 px-4 text-sm text-gray-900">
                  {new Date(tx.timestamp).toLocaleDateString('pl-PL')}
                  {' '}
                  {new Date(tx.timestamp).toLocaleTimeString('pl-PL')}
                </td>
                <td className="py-2 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tx.type === 'sent' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {tx.type === 'sent' ? 'Wysłano' : 'Odebrano'}
                  </span>
                </td>
                <td className="py-2 px-4 text-sm text-gray-900">
                  {tx.amount}
                </td>
                <td className="py-2 px-4 text-sm text-blue-600 truncate max-w-xs">
                  <a 
                    href={`https://whatsonchain.com/tx/${tx.txId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {tx.txId.substring(0, 10)}...
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  return (
    <div className="bg-gray-50 p-4 rounded border border-gray-200">
      {readonly ? (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Historia transakcji portfela</h2>
          {message && (
            <div className={`p-3 mb-4 rounded text-sm bg-red-50 text-red-700 border border-red-200`}>
              {message}
            </div>
          )}
          <div className="mb-4">
            <button 
              onClick={fetchTransactionHistory}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Odśwież historię
            </button>
          </div>
          {renderTransactionHistory()}
        </div>
      ) : (
        <>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Wymiana plików</h2>
          
          {message && (
            <div className={`p-3 mb-4 rounded text-sm ${
              message.includes('błąd') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : message.includes('Rozpoczynam') 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}
          
          <form onSubmit={handleExchange} className="space-y-4">
            <div>
              <label htmlFor="file-select" className="block text-sm font-medium text-gray-700 mb-1">
                Wybierz plik do wymiany
              </label>
              <select
                id="file-select"
                value={selectedFileId}
                onChange={(e) => setSelectedFileId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">-- Wybierz plik --</option>
                {completedFiles.length > 0 ? (
                  completedFiles.map((file: FileItem) => (
                    <option key={file.id} value={file.id}>
                      {file.name} ({new Date(file.uploadedAt).toLocaleDateString('pl-PL')})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Brak dostępnych plików</option>
                )}
              </select>
              
              {completedFiles.length === 0 && (
                <p className="mt-1 text-sm text-yellow-600">
                  Najpierw prześlij jakiś plik, aby móc go wymienić
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="recipient-paymail" className="block text-sm font-medium text-gray-700 mb-1">
                Paymail odbiorcy
              </label>
              <input
                type="email"
                id="recipient-paymail"
                value={recipientPaymail}
                onChange={(e) => setRecipientPaymail(e.target.value)}
                placeholder="nazwa@przyklad.com"
                className="w-full p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Wprowadź adres paymail osoby, której chcesz udostępnić ten plik
              </p>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isExchanging || !selectedFileId || !recipientPaymail || !user.xpriv || completedFiles.length === 0}
                className={`w-full py-2 px-4 rounded ${
                  isExchanging || !selectedFileId || !recipientPaymail || !user.xpriv || completedFiles.length === 0
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isExchanging ? 'Trwa wymiana...' : 'Rozpocznij wymianę'}
              </button>
            </div>
          </form>
          
          {!user.xpriv && (
            <div className="mt-4 p-3 bg-red-50 rounded border border-red-200 text-sm text-red-700">
              <p className="font-medium">Wymagany klucz prywatny</p>
              <p>
                Aby bezpiecznie wymieniać pliki, musisz zalogować się używając klucza prywatnego.
              </p>
            </div>
          )}
          
          <div className="mt-8">
            <h3 className="text-md font-medium text-gray-900 mb-3">Historia transakcji</h3>
            {renderTransactionHistory()}
          </div>
        </>
      )}
    </div>
  );
};

export default FileExchange; 