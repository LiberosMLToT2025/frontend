"use client";
import React from 'react';
import { useState, useRef } from 'react';
import useStore from '../lib/store';
import { v4 as uuidv4 } from 'uuid';
import { uploadFileWithBsv } from '../lib/file-service';

const FileUpload = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const { addFile, updateFile, user } = useStore();

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
    
    Array.from(files).forEach(file => {
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
      
      // Rozpocznij przesyłanie pliku i zapisywanie metadanych w BSV
      processFile(newFile.id, file);
    });
  };

  const processFile = async (id: string, file: File) => {
    updateFile(id, { status: 'uploading', progress: 10 });
    
    try {
      if (!user.xpriv) {
        throw new Error('Brak klucza prywatnego do podpisania transakcji');
      }
      
      // Symulujemy progres
      let progress = 10;
      const interval = setInterval(() => {
        progress += 10;
        if (progress <= 70) {
          updateFile(id, { progress });
        } else {
          clearInterval(interval);
        }
      }, 300);
      
      // Przesyłamy plik i zapisujemy metadane w BSV
      const result = await uploadFileWithBsv(file, user.xpriv);
      
      clearInterval(interval);
      
      // Aktualizujemy stan pliku po zakończeniu przesyłania
      updateFile(id, { 
        status: 'completed',
        progress: 100,
        hash: result.hash,
        txId: result.txId
      });
    } catch (error) {
      console.error('Błąd podczas przesyłania pliku:', error);
      updateFile(id, { 
        status: 'failed',
        progress: 0
      });
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
    <div 
      className={`border-2 border-dashed p-4 rounded text-center ${
        dragActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300'
      }`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />
      
      <div className="flex flex-col items-center justify-center space-y-3">
        <h3 className="text-lg font-medium text-gray-800">
          {dragActive ? 'Upuść pliki tutaj' : 'Przeciągnij i upuść pliki'}
        </h3>
        
        <p className="text-sm text-gray-600 max-w-xs mx-auto">
          Przeciągnij pliki tutaj lub kliknij przycisk poniżej, aby wybrać pliki z dysku
        </p>
        
        <button
          type="button"
          onClick={handleButtonClick}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Wybierz pliki
        </button>
        
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 mt-2">
          <span>Wszystkie typy plików</span>
          <span>•</span>
          <span>Maks. 100MB</span>
          <span>•</span>
          <span>Szyfrowanie BSV</span>
        </div>
      </div>
    </div>
  );
};

export default FileUpload; 