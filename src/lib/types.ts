export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  hash?: string;
  txId?: string;
  databaseId?: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export interface User {
  xpub: string;
  xpriv?: string;
  paymail?: string;
  publicName?: string;
  balance?: number;
  walletId?: string;
  isPrivateMode?: boolean;
}

export interface Transaction {
  txId: string;
  timestamp: number;
  amount: number;
  type: 'sent' | 'received';
  description?: string;
}