"use client";
import React from 'react';
import { useState } from 'react';
import useStore from '../lib/store';
import { exchangeFileWithBsv } from '../lib/file-service';
import { FileItem } from '../lib/types';

const FileExchange = () => {
  const [recipientPaymail, setRecipientPaymail] = useState('');
  const [selectedFileId, setSelectedFileId] = useState('');
  const [isExchanging, setIsExchanging] = useState(false);
  const [message, setMessage] = useState('');
  
  const { files, user } = useStore();
  
  const completedFiles = files.filter((file: FileItem) => file.status === 'completed');
  
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
    } catch (error: any) {
      console.error('Błąd podczas wymiany pliku:', error);
      setMessage(`Wystąpił błąd podczas wymiany pliku: ${error.message || 'nieznany błąd'}`);
    } finally {
      setIsExchanging(false);
    }
  };
  
  return (
    <div className="bg-gray-50 p-4 rounded border border-gray-200">
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
    </div>
  );
};

export default FileExchange; 