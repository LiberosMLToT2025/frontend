import { createOpReturnTransaction } from './wallet';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// W rzeczywistej aplikacji te funkcje byłyby połączone z BSV
// i obsługiwałyby faktyczne przesyłanie plików oraz hashowanie

/**
 * Oblicza hash pliku
 */
export const calculateFileHash = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    // W rzeczywistej implementacji użylibyśmy prawdziwego hashowania
    // np. za pomocą crypto.subtle.digest
    
    // Symulacja obliczania hasha
    setTimeout(() => {
      const randomHash = Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      
      resolve(randomHash);
    }, 300);
  });
};

/**
 * Uploads a file to the database and returns the database record ID and hash
 */
export const uploadFileWithBsv = async (
  file: File, 
  xpriv: string
): Promise<{ id: number; hash: string; txId: string }> => {
  try {
    // Upload file to database
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadResponse = await axios.post(`${API_BASE_URL}/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    const { id, hash } = uploadResponse.data;

    // Register transaction for the file
    const tx = await createOpReturnTransaction(xpriv, JSON.stringify({
      fileId: id,
      hash: hash,
      filename: file.name,
      timestamp: new Date().toISOString()
    }));

    // Register the transaction with the database
    await axios.post(`${API_BASE_URL}/register_transaction/${id}/${tx.id}`);

    return { 
      id,
      hash,
      txId: tx.id 
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Downloads a file by database record ID
 */
export const downloadFileById = async (id: number): Promise<Blob> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/download/${id}`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

/**
 * Downloads a file by blockchain transaction ID
 */
export const downloadFileByTxId = async (txId: string): Promise<Blob> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/download_by_transaction/${txId}`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

/**
 * Validates file integrity by comparing hash
 */
export const validateFile = async (id: number, expectedHash: string): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/validate/${id}/${expectedHash}`);
    return response.data.is_valid;
  } catch (error) {
    console.error('Error validating file:', error);
    throw error;
  }
};

/**
 * Clears the database (for testing purposes)
 */
export const clearDatabase = async (): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/clear`);
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};

/**
 * Wymienia plik z innym użytkownikiem
 */
export const exchangeFileWithBsv = async (
  fileId: string, 
  recipientPaymail: string, 
  xpriv: string
): Promise<{ txId: string }> => {
  // W rzeczywistej implementacji tutaj byłaby logika wymiany pliku
  
  // Symulacja transakcji wymiany
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        txId: `exchange-tx-${Date.now()}`
      });
    }, 1000);
  });
};

/**
 * Pobiera listę plików z BSV
 */
export const getFilesFromBsv = async (xpub: string): Promise<any[]> => {
  // W rzeczywistej implementacji pobieralibyśmy listę transakcji
  // i ekstrakcję metadanych o plikach
  
  // Symulacja pobrania listy plików
  return [];
};