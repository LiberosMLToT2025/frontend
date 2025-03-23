"use client";
import React from 'react';
import { useState, useRef, useEffect } from 'react';
import useStore from '../lib/store';
import { v4 as uuidv4 } from 'uuid';
import { uploadFileWithBsv, validateFile, downloadFileById, downloadFileByTxId, createOpReturnTransaction } from '../lib/file-service';

const FileUpload = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [xPrivKey, setXPrivKey] = useState('');
  const [xPrivError, setXPrivError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addFile, updateFile, user, files } = useStore();

  // Automatycznie ustaw klucz prywatny z store, jeśli jest dostępny
  useEffect(() => {
    if (user.xpriv) {
      setXPrivKey(user.xpriv);
    }
  }, [user.xpriv]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setDragActive(false);
  };

  const processFile = async (id: string, file: File) => {
    updateFile(id, { status: 'uploading', progress: 10 });
    
    try {
      if (!xPrivKey) {
        throw new Error('Wprowadź klucz prywatny (xPriv)');
      }
      
      // Handle PNG files differently
      if (file.type === 'image/png') {
        // Convert PNG to base64
        const reader = new FileReader();
        reader.onload = async (e) => {
          if (e.target && typeof e.target.result === 'string') {
            const base64Image = e.target.result;
            
            // Create OP_RETURN transaction with base64 image
            const tx = await createOpReturnTransaction(xPrivKey, base64Image);
            
            // Update file state with transaction ID
            updateFile(id, { 
              status: 'completed',
              progress: 100,
              txId: tx.id,
              databaseId: 0, // No database ID for PNG files
              hash: "null" // No hash for PNG files
            });
          }
        };
        reader.readAsDataURL(file);
      } else {
        // Upload file to database for other file types
        const result = await uploadFileWithBsv(file, xPrivKey);
        
        // Validate file integrity
        const isValid = await validateFile(result.id, result.hash);
        if (!isValid) {
          throw new Error('File integrity validation failed');
        }
        
        // Update file state with database record ID and hash
        updateFile(id, { 
          status: 'completed',
          progress: 100,
          hash: result.hash,
          txId: result.txId,
          databaseId: result.id,
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      updateFile(id, { 
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleDownloadById = async (databaseId: number) => {
    if (!databaseId) {
      // This is a PNG file, we can't download it directly from database
      return;
    }
    try {
      const fileBlob = await downloadFileById(databaseId);
      const url = window.URL.createObjectURL(fileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `downloaded_file`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  const handleDownloadByTx = async (txId: string) => {
    try {
      // Try to download by transaction ID first
      const fileBlob = await downloadFileByTxId(txId);
      const url = window.URL.createObjectURL(fileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `downloaded_file`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!xPrivKey) {
      setXPrivError('Wprowadź klucz prywatny (xPriv)');
      return;
    }

    if (selectedFiles.length === 0) {
      setXPrivError('Wybierz pliki do przesłania');
      return;
    }

    setIsSubmitting(true);
    setXPrivError('');

    try {
      for (const file of selectedFiles) {
        const newFile = {
          id: uuidv4(),
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date(),
          status: 'pending' as const,
          progress: 0,
        };
        
        addFile(newFile);
        await processFile(newFile.id, file);
      }
      
      setSelectedFiles([]);
    } catch (error) {
      console.error('Błąd podczas przesyłania plików:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesSelected(e.target.files);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center p-4 space-y-4">
        <div className="flex flex-col gap-4 w-full max-w-md">
          {!user.xpriv && (
            <div>
              <label 
                htmlFor="xPrivKey" 
                className="block text-sm font-medium mb-1"
              >
                Klucz prywatny (xPriv)
              </label>
              <input
                id="xPrivKey"
                type="password"
                className="w-full px-3 py-2 border border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-card"
                placeholder="Wprowadź swój klucz prywatny xpriv"
                value={xPrivKey}
                onChange={(e) => {
                  setXPrivKey(e.target.value);
                  setXPrivError('');
                }}
                required={!user.xpriv}
              />
              {xPrivError && (
                <p className="mt-1 text-xs text-danger">
                  {xPrivError}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Twój klucz prywatny jest potrzebny do podpisania transakcji
              </p>
            </div>
          )}

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragActive ? 'border-primary bg-primary/5' : 'border-subtle bg-card'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <p className="text-gray-500 dark:text-gray-400">
              Przeciągnij i upuść pliki tutaj lub
            </p>
            <button
              onClick={handleButtonClick}
              className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Wybierz pliki
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />

          {selectedFiles.length > 0 && (
            <div className="mt-4 p-3 bg-card rounded-md border border-subtle">
              <p className="text-sm text-gray-600">Wybrane pliki ({selectedFiles.length}):</p>
              <ul className="mt-2 space-y-1">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="text-sm text-gray-500">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !xPrivKey || selectedFiles.length === 0}
            className={`w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors flex items-center justify-center ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Przesyłanie...
              </>
            ) : (
              'Prześlij pliki'
            )}
          </button>
        </div>
      </form>

      {/* File List */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Przesłane pliki</h2>
        <div className="space-y-4">
          {files.map((file) => (
            <div key={file.id} className="bg-card p-4 rounded-md border border-subtle">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{file.name}</h3>
                  <p className="text-sm text-gray-500">
                    {file.status === 'completed' && (
                      <>
                        <span className="text-green-500">Zakończono</span>
                        <span className="ml-2">|</span>
                        <span className="ml-2">Hash: {file.hash?.substring(0, 8)}...</span>
                        <span className="ml-2">|</span>
                        <span className="ml-2">TX ID: {file.txId?.substring(0, 8)}...</span>
                      </>
                    )}
                    {file.status === 'failed' && (
                      <span className="text-red-500">Błąd: {file.error}</span>
                    )}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {file.status === 'completed' && (
                    <>
                      {file.databaseId && (
                        <button
                          onClick={() => handleDownloadById(file.databaseId!)}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Pobierz (ID)
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadByTx(file.txId!)}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Pobierz (TX)
                      </button>
                    </>
                  )}
                  {file.status === 'failed' && (
                    <span className="text-red-500">Błąd: {file.error}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;