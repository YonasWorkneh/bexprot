import { type CryptoCurrency } from './depositAddresses';

// Crypto icon configuration - using CoinGecko CDN and local icons
export const CRYPTO_ICONS: Record<CryptoCurrency, string> = {
  BTC: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  USDT_TRC20: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  LTC: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  USDC_ERC20: '/crypto-icons/usdc.png',
};

// Network icon mapping - now supports all cryptocurrencies
export const NETWORK_ICONS: Record<string, string> = {
  BTC: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  USDT_TRC20: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  LTC: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  USDC_ERC20: '/crypto-icons/usdc.png',
};

// Fallback text symbols for crypto icons
export const CRYPTO_SYMBOLS: Record<CryptoCurrency, string> = {
  BTC: '₿',
  USDT_TRC20: '₮',
  SOL: '◎',
  XRP: 'Ᵽ',
  LTC: 'Ł',
  BNB: 'B',
  ETH: 'Ξ',
  USDC_ERC20: '$',
};

// Crypto color schemes for styling
export const CRYPTO_COLORS: Record<CryptoCurrency, { bg: string; text: string; border: string }> = {
  BTC: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600' },
  USDT_TRC20: { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' },
  SOL: { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-600' },
  XRP: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
  LTC: { bg: 'bg-gray-400', text: 'text-white', border: 'border-gray-500' },
  BNB: { bg: 'bg-yellow-500', text: 'text-black', border: 'border-yellow-600' },
  ETH: { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-600' },
  USDC_ERC20: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700' },
};

// Helper function to get crypto icon
export const getCryptoIcon = (currency: CryptoCurrency): string => {
  return CRYPTO_ICONS[currency];
};

// Helper function to get network icon with legacy support
export const getNetworkIcon = (network: string): string => {
  // Legacy network mapping
  const legacyMap: Record<string, string> = {
    'ethereum': 'ETH',
    'bsc': 'BNB',
    'polygon': 'USDT_TRC20',
    'tron': 'USDT_TRC20',
  };
  
  // Normalize network name
  const normalizedNetwork = legacyMap[network] || network;
  
  return NETWORK_ICONS[normalizedNetwork] || 'https://assets.coingecko.com/coins/images/325/large/Tether.png';
};

// Helper function to get crypto symbol
export const getCryptoSymbol = (currency: CryptoCurrency): string => {
  return CRYPTO_SYMBOLS[currency];
};

// Helper function to get crypto colors
export const getCryptoColors = (currency: CryptoCurrency) => {
  return CRYPTO_COLORS[currency];
};
