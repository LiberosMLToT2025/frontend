export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  hash?: string;
  txId?: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
}

export interface User {
  xpub?: string;
  xpriv?: string;
  paymail?: string;
  publicName?: string;
  balance?: number;
  walletId?: string;
} 