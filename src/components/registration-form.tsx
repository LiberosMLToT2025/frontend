"use client"; // ✅ Ensure this file is treated as a client component

import { useState } from "react";
import { useRouter } from "next/navigation"; // ✅ Correct import for App Router
import { createUserWallet } from "../lib/wallet";
import { generateKeys, keysToWallet } from "../lib/wallet-keys";
import useStore from "../lib/store";

export default function RegistrationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [paymail, setPaymail] = useState("");
  const [publicName, setPublicName] = useState("");
  const { setUser } = useStore();
  const router = useRouter();

  // Stan rejestracji podzielony na etapy
  const [step, setStep] = useState<'info' | 'keys' | 'backup' | 'confirm'>("info");
  
  // Klucze portfela
  const [walletKeys, setWalletKeys] = useState<{
    mnemonic: string;
    xpriv: string;
    xpub: string;
  } | null>(null);
  
  // Pole do potwierdzenia mnemonika
  const [confirmMnemonic, setConfirmMnemonic] = useState("");
  
  // Checkbox do potwierdzenia zapisania frazy
  const [mnemonicSaved, setMnemonicSaved] = useState(false);

  // Generowanie nowych kluczy
  const generateNewKeys = () => {
    try {
      const generatedKeys = generateKeys();
      const keys = keysToWallet(generatedKeys);
      setWalletKeys(keys);
      setStep('keys');
    } catch (err) {
      console.error("Błąd generowania kluczy:", err);
      setError("Nie udało się wygenerować kluczy portfela. Spróbuj ponownie.");
    }
  };

  // Przejście do kroku zabezpieczenia frazy mnemonicznej
  const proceedToBackup = () => {
    setStep('backup');
  };

  // Przejście do kroku potwierdzenia frazy mnemonicznej
  const proceedToConfirmation = () => {
    if (!mnemonicSaved) {
      setError("Musisz potwierdzić, że zapisałeś swoją frazę odzyskiwania.");
      return;
    }
    setError(null);
    setStep('confirm');
  };

  // Sprawdzenie czy wprowadzona fraza jest poprawna
  const verifyMnemonic = () => {
    if (!walletKeys) return false;
    
    // Usuwamy nadmiarowe spacje i porównujemy
    const normalizedMnemonic = confirmMnemonic.trim().replace(/\s+/g, ' ').toLowerCase();
    const originalMnemonic = walletKeys.mnemonic.trim().toLowerCase();
    
    return normalizedMnemonic === originalMnemonic;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Jeśli jesteśmy na kroku informacji
    if (step === 'info') {
      if (!name || !paymail || !publicName) {
        setError("Proszę wypełnić wszystkie pola");
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      generateNewKeys();
      return;
    }

    // Jeśli jesteśmy na kroku potwierdzenia
    if (step === 'confirm') {
      if (!verifyMnemonic()) {
        setError("Wprowadzona fraza odzyskiwania jest nieprawidłowa. Spróbuj ponownie.");
        setIsLoading(false);
        return;
      }

      if (!walletKeys || !walletKeys.xpub) {
        setError("Brak klucza publicznego. Spróbuj wygenerować klucze ponownie.");
        setIsLoading(false);
        return;
      }

      try {
        // Rejestrujemy portfel na serwerze
        const response = await createUserWallet(walletKeys.xpub, paymail, publicName);

        if (response && response.success) {
          // Zapisujemy dane użytkownika w store
          setUser({
            xpub: walletKeys.xpub,
            xpriv: walletKeys.xpriv,
            paymail,
            publicName,
            balance: response.balance || 0,
            walletId: response.id
          });
          
          // Przekierowujemy do strony głównej
          router.push('/');
        } else {
          throw new Error("Utworzenie portfela nie powiodło się");
        }
      } catch (err) {
        console.error("Nie udało się zarejestrować użytkownika:", err);
        setError("Rejestracja nie powiodła się. Sprawdź dane i spróbuj ponownie.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Renderowanie formularza w zależności od kroku
  const renderStepContent = () => {
    switch (step) {
      case 'info':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="name">
                Twoje imię
              </label>
              <input
                className="w-full px-3 py-2 border border-subtle rounded-md bg-card focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                id="name"
                type="text"
                placeholder="Twoje imię"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="paymail">
                Paymail
              </label>
              <input
                className="w-full px-3 py-2 border border-subtle rounded-md bg-card focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                id="paymail"
                type="email"
                placeholder="adres@przykład.com"
                value={paymail}
                onChange={(e) => setPaymail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="publicName">
                Nazwa publiczna
              </label>
              <input
                className="w-full px-3 py-2 border border-subtle rounded-md bg-card focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                id="publicName"
                type="text"
                placeholder="Twoja nazwa wyświetlana"
                value={publicName}
                onChange={(e) => setPublicName(e.target.value)}
                required
              />
            </div>

            <button
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
              type="submit"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
              </svg>
              Dalej: Generuj klucze
            </button>
          </>
        );

      case 'keys':
        return (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Wygenerowaliśmy dla Ciebie klucze portfela. Poniżej znajduje się Twoja fraza odzyskiwania.
                <strong className="text-danger"> Zapisz ją w bezpiecznym miejscu!</strong>
              </p>
              
              <div className="bg-subtle p-4 rounded-md border border-subtle my-4">
                <h3 className="text-sm font-medium mb-2">Fraza odzyskiwania (12 słów):</h3>
                <div className="bg-card border border-subtle rounded-md p-3 font-mono text-sm break-all">
                  {walletKeys?.mnemonic}
                </div>
              </div>
              
              <div className="bg-subtle p-4 rounded-md border border-subtle my-4">
                <h3 className="text-sm font-medium mb-2">Klucz prywatny (xpriv):</h3>
                <div className="bg-card border border-subtle rounded-md p-3 font-mono text-xs break-all">
                  {walletKeys?.xpriv}
                </div>
              </div>
              
              <div className="bg-subtle p-4 rounded-md border border-subtle my-4">
                <h3 className="text-sm font-medium mb-2">Klucz publiczny (xpub):</h3>
                <div className="bg-card border border-subtle rounded-md p-3 font-mono text-xs break-all">
                  {walletKeys?.xpub}
                </div>
              </div>
            </div>

            <div className="bg-warning/10 border border-warning/20 text-warning-dark dark:text-warning px-4 py-3 rounded-md mb-4">
              <p className="text-sm">
                <strong>UWAGA:</strong> Nigdy nie udostępniaj swojego klucza prywatnego ani frazy odzyskiwania!
                Utrata tych danych oznacza utratę dostępu do portfela i środków.
              </p>
            </div>

            <button
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
              type="button"
              onClick={proceedToBackup}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
              </svg>
              Dalej: Zabezpiecz swoje klucze
            </button>
          </>
        );

      case 'backup':
        return (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Zabezpiecz swój portfel</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Zapisz swoją frazę odzyskiwania w bezpiecznym miejscu. Będziesz jej potrzebować, aby odzyskać dostęp do portfela.
              </p>
              
              <div className="bg-warning/10 border border-warning/20 text-warning-dark dark:text-warning px-4 py-3 rounded-md mb-4">
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li>Zapisz 12 słów w odpowiedniej kolejności</li>
                  <li>Przechowuj je w bezpiecznym miejscu, offline</li>
                  <li>Nigdy nie udostępniaj tych słów nikomu</li>
                  <li>Utrata tych słów oznacza utratę dostępu do portfela</li>
                </ul>
              </div>
              
              <div className="my-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    className="mt-1 mr-2"
                    checked={mnemonicSaved}
                    onChange={(e) => setMnemonicSaved(e.target.checked)}
                  />
                  <span className="text-sm">
                    Potwierdzam, że zapisałem/am moją frazę odzyskiwania w bezpiecznym miejscu i rozumiem, że jej utrata oznacza utratę dostępu do mojego portfela.
                  </span>
                </label>
              </div>
            </div>

            <button
              className={`w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center ${
                !mnemonicSaved ? "opacity-50 cursor-not-allowed" : ""
              }`}
              type="button"
              onClick={proceedToConfirmation}
              disabled={!mnemonicSaved}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
              </svg>
              Dalej: Potwierdź frazę
            </button>
          </>
        );

      case 'confirm':
        return (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Potwierdź swoją frazę odzyskiwania</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Wprowadź swoją frazę odzyskiwania, aby potwierdzić, że została prawidłowo zapisana.
              </p>
              
              <textarea
                className="w-full px-3 py-2 border border-subtle rounded-md bg-card focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary min-h-[120px]"
                placeholder="Wprowadź 12 słów oddzielonych spacją..."
                value={confirmMnemonic}
                onChange={(e) => setConfirmMnemonic(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Wprowadź 12 słów w dokładnie takiej samej kolejności jak zostały wygenerowane
              </p>
            </div>

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
                  Rejestrowanie...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Zakończ rejestrację
                </>
              )}
            </button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-6 text-center">Zarejestruj swój portfel</h2>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-in-out" 
              style={{ 
                width: 
                  step === 'info' ? '25%' : 
                  step === 'keys' ? '50%' : 
                  step === 'backup' ? '75%' : 
                  '100%' 
              }}
            ></div>
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span className={step === 'info' ? 'text-primary font-medium' : ''}>Dane</span>
          <span className={step === 'keys' ? 'text-primary font-medium' : ''}>Klucze</span>
          <span className={step === 'backup' ? 'text-primary font-medium' : ''}>Zabezpieczenie</span>
          <span className={step === 'confirm' ? 'text-primary font-medium' : ''}>Potwierdzenie</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {renderStepContent()}
      </form>
    </div>
  );
}
