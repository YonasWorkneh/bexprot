export interface DepositAddress {
  id: string;
  currency: string;
  address: string;
  network: string;
  networkSymbol: string;
  minDeposit: number;
  isActive: boolean;
}

export interface CryptoDeposit {
  id: string;
  userId: string;
  user?: {
    name: string;
    email: string;
  };
  depositCode?: string;
  currency: string;
  depositAddress: string;
  transactionHash?: string;
  userReportedAmount?: number;
  adminVerifiedAmount?: number;
  amount: number;
  amountUsd: number;
  status: "reported" | "pending" | "confirmed" | "credited" | "rejected";
  confirmations: number;
  blockchainExplorerUrl?: string;
  notes?: string;
  verificationNotes?: string;
  reportedAt?: string;
  verifiedAt?: string;
  creditedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
  screenshotUrl?: string;
}

// Deposit address configuration
export const DEPOSIT_ADDRESSES = {
  BTC: {
    currency: "BTC",
    address: "bc1qerkz35fpm895yu6ktnvajp9eepe4yg2u84f6v6",
    network: "Bitcoin",
    networkSymbol: "BTC",
    minDeposit: 0.0001,
    explorerUrl: "https://blockchair.com/bitcoin/address/",
  },
  USDT_TRC20: {
    currency: "USDT_TRC20",
    address: "TXrJGy8P4MohRcjCNZRSK5zvv1ZP4YNRjc",
    network: "Tron (TRC20)",
    networkSymbol: "USDT",
    minDeposit: 10,
    explorerUrl: "https://tronscan.org/#/address/",
  },
  SOL: {
    currency: "SOL",
    address: "BNThwmdcs7JTSuRDrNhrEtPRuXHbKpywawj8JKPSBX6j",
    network: "Solana",
    networkSymbol: "SOL",
    minDeposit: 0.01,
    explorerUrl: "https://explorer.solana.com/address/",
  },
  XRP: {
    currency: "XRP",
    address: "rfQxrooWfucovtY7ByYVb7C8T96ne6GPi",
    network: "XRP Ledger",
    networkSymbol: "XRP",
    minDeposit: 10,
    explorerUrl: "https://xrpscan.com/account/",
  },
  LTC: {
    currency: "LTC",
    address: "ltc1qeug4ljja4wxyn8f6v7zggjnjd5s4e5c6qv6tql",
    network: "Litecoin",
    networkSymbol: "LTC",
    minDeposit: 0.01,
    explorerUrl: "https://blockchair.com/litecoin/address/",
  },
  BNB: {
    currency: "BNB",
    address: "0x180da5d29351fbcf2c37c5002d331d470361b454",
    network: "BNB Smart Chain",
    networkSymbol: "BNB",
    minDeposit: 0.01,
    explorerUrl: "https://bscscan.com/address/",
  },
  ETH: {
    currency: "ETH",
    address: "0xa6504490122Abb1C9DBF794a3cb191F23b6F888A",
    network: "Ethereum",
    networkSymbol: "ETH",
    minDeposit: 0.001,
    explorerUrl: "https://etherscan.io/address/",
  },
  USDC_ERC20: {
    currency: "USDC_ERC20",
    address: "0xa6504490122Abb1C9DBF794a3cb191F23b6F888A",
    network: "Ethereum (ERC20)",
    networkSymbol: "USDC",
    minDeposit: 10,
    explorerUrl: "https://etherscan.io/address/",
  },
} as const;

export type CryptoCurrency = keyof typeof DEPOSIT_ADDRESSES;
