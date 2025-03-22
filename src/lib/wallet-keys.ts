import { HD, Mnemonic } from '@bsv/sdk';

/**
 * Key basic information.
 */
export interface Key {
  xPriv(): string;
  xPub: PubKey;
}

export interface PubKey {
  toString(): string;
}

/**
 * Extends Key interface with mnemonic information.
 */
export interface KeyWithMnemonic extends Key {
  mnemonic: string;
}

// Generuje losowe klucze portfela
export const generateKeys = function (): KeyWithMnemonic {
  // W środowisku przeglądarki musimy użyć Web Crypto API
  const entropy = new Uint8Array(32); // 32 bytes = 256 bits of entropy
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(entropy);
  }
  
  const mnemonic = Mnemonic.fromEntropy(Array.from(entropy));
  return getKeysFromMnemonic(mnemonic.toString());
};

// Odtwarza klucze na podstawie frazy mnemonicznej
export const getKeysFromMnemonic = function (mnemonicStr: string): KeyWithMnemonic {
  const mnemonic = Mnemonic.fromString(mnemonicStr);
  const seed = mnemonic.toSeed();
  const hdWallet = new HD().fromSeed(seed);

  return {
    xPriv: () => hdWallet.toString(),
    mnemonic: mnemonic.toString(),
    xPub: {
      toString() {
        return hdWallet.toPublic().toString();
      },
    },
  };
};

// Konwertuje obiekt KeyWithMnemonic na format wygodny do użycia w aplikacji
export const keysToWallet = function(keys: KeyWithMnemonic) {
  return {
    mnemonic: keys.mnemonic,
    xpriv: keys.xPriv(),
    xpub: keys.xPub.toString()
  };
}; 