"use client";
import React from 'react';
import useStore from '../lib/store';
import { FileItem } from '../lib/types';

// Funkcja pomocnicza do formatowania rozmiaru pliku
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const FileList = () => {
  const { files, removeFile } = useStore();

  if (files.length === 0) {
    return (
      <div className="text-center py-6 px-4 bg-gray-50 rounded border border-gray-200">
        <h3 className="text-base font-medium text-gray-900">Brak plików</h3>
        <p className="mt-1 text-sm text-gray-500">
          Prześlij swój pierwszy plik, aby rozpocząć korzystanie z platformy.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              Nazwa pliku
            </th>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              Rozmiar
            </th>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              Data
            </th>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              Status
            </th>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              Transakcja
            </th>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              Akcje
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map((file: FileItem) => (
            <tr key={file.id} className="hover:bg-gray-50">
              <td className="py-2 px-3 border-b border-gray-100">
                <div className="text-sm font-medium text-gray-900">{file.name}</div>
                <div className="text-xs text-gray-500 truncate max-w-xs">{file.type}</div>
              </td>
              <td className="py-2 px-3 border-b border-gray-100 text-sm text-gray-500">
                {formatFileSize(file.size)}
              </td>
              <td className="py-2 px-3 border-b border-gray-100 text-sm text-gray-500">
                {new Date(file.uploadedAt).toLocaleString('pl-PL')}
              </td>
              <td className="py-2 px-3 border-b border-gray-100">
                {file.status === 'pending' && (
                  <span className="px-2 py-1 text-xs rounded bg-yellow-50 text-yellow-700 border border-yellow-200">
                    Oczekujący
                  </span>
                )}
                {file.status === 'uploading' && (
                  <div>
                    <span className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Przesyłanie {file.progress}%
                    </span>
                    <div className="mt-1 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600"
                        style={{ width: `${file.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {file.status === 'completed' && (
                  <span className="px-2 py-1 text-xs rounded bg-green-50 text-green-700 border border-green-200">
                    Zakończony
                  </span>
                )}
                {file.status === 'failed' && (
                  <span className="px-2 py-1 text-xs rounded bg-red-50 text-red-700 border border-red-200">
                    Błąd
                  </span>
                )}
              </td>
              <td className="py-2 px-3 border-b border-gray-100 text-sm text-gray-500">
                {file.txId ? (
                  <a 
                    href={`https://whatsonchain.com/tx/${file.txId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 truncate block max-w-[150px]"
                  >
                    {file.txId.substring(0, 12)}...
                  </a>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="py-2 px-3 border-b border-gray-100 text-sm">
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Usuń
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FileList; 