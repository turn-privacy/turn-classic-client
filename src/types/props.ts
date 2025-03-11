import { ReactNode } from "react";

// Component interfaces
export interface CardProps {
  title?: string;
  children: ReactNode;
  error?: boolean;
  style?: React.CSSProperties;
}

export interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  style?: React.CSSProperties;
}

export interface WalletInfoProps {
  address: string;
  seedPhrase: string;
  emoji: string;
  onRequestFunds?: () => void;
  onSignup?: () => void;
  socket?: WebSocket | null;
  balance?: { lovelace: bigint } | null;
  faucetInfo?: {
    sent: boolean;
    txHash: string | null;
  };
  onRecycleTada?: () => void;
  showRecycle?: boolean;
}

export interface TransactionSigningUIProps {
  pendingTransaction: any;
  isSigning: boolean;
  signStatus: string | null;
  onSign: () => void;
}


export interface LocalNetworkProps {
  walletAddress: string | null;
  walletSeedPhrase: string | null;
  recipientAddress: string | null;
  recipientSeedPhrase: string | null;
  pendingTransaction: any;
  isSigning: boolean;
  signStatus: string | null;
  socket: WebSocket | null;
  faucetSent: boolean;
  faucetTxHash: string | null;
  previewLucid: any;
}

export interface PreviewNetworkProps {
  walletError: string | null;
  walletSelectList: string[];
  previewWallet: any;
  previewAddress: string | null;
  walletBalance: { lovelace: bigint } | null;
  recipientAddress: string | null;
  recipientSeedPhrase: string | null;
  pendingTransaction: any;
  isSigning: boolean;
  signStatus: string | null;
  socket: WebSocket | null;
  faucetSent: boolean;
  faucetTxHash: string | null;
  previewLucid: any;
  previewWalletApi: any;
  onSelectWallet: (walletName: string) => void;
  setError: (error: string | null) => void;
  setIsSigning: (signing: boolean) => void;
  setSignStatus: (status: string | null) => void;
}