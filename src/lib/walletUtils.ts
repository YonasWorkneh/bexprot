/**
 * Validates an Ethereum address
 */
export const isValidEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Validates a Solana address
 */
export const isValidSolanaAddress = (address: string): boolean => {
    // Solana addresses are base58 encoded and typically 32-44 characters
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
};

/**
 * Validates an address based on network type
 */
export const isValidAddress = (address: string, network: 'evm' | 'solana'): boolean => {
    if (network === 'evm') {
        return isValidEthereumAddress(address);
    }
    return isValidSolanaAddress(address);
};

/**
 * Formats an address for display (shortened)
 */
export const formatAddress = (address: string, chars: number = 4): string => {
    if (!address) return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

/**
 * Formats a balance with proper decimals
 */
export const formatBalance = (balance: number | string, decimals: number = 4): string => {
    const num = typeof balance === 'string' ? parseFloat(balance) : balance;
    if (isNaN(num)) return '0';

    return num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: decimals,
    });
};

/**
 * Converts Wei to Ether
 */
export const weiToEth = (wei: bigint | string): number => {
    const weiValue = typeof wei === 'string' ? BigInt(wei) : wei;
    return Number(weiValue) / 1e18;
};

/**
 * Converts Ether to Wei
 */
export const ethToWei = (eth: number | string): bigint => {
    const ethValue = typeof eth === 'string' ? parseFloat(eth) : eth;
    return BigInt(Math.floor(ethValue * 1e18));
};

/**
 * Gets the network name from chain ID
 */
export const getNetworkName = (chainId: number): string => {
    const networks: Record<number, string> = {
        1: 'Ethereum',
        5: 'Goerli',
        11155111: 'Sepolia',
        137: 'Polygon',
        80001: 'Mumbai',
        56: 'BSC',
        97: 'BSC Testnet',
        42161: 'Arbitrum',
        421613: 'Arbitrum Goerli',
    };
    return networks[chainId] || `Chain ${chainId}`;
};

/**
 * Gets the block explorer URL for a transaction
 */
export const getExplorerUrl = (chainId: number, txHash: string): string => {
    const explorers: Record<number, string> = {
        1: 'https://etherscan.io/tx/',
        5: 'https://goerli.etherscan.io/tx/',
        11155111: 'https://sepolia.etherscan.io/tx/',
        137: 'https://polygonscan.com/tx/',
        80001: 'https://mumbai.polygonscan.com/tx/',
        56: 'https://bscscan.com/tx/',
        97: 'https://testnet.bscscan.com/tx/',
        42161: 'https://arbiscan.io/tx/',
        421613: 'https://goerli.arbiscan.io/tx/',
    };
    return `${explorers[chainId] || 'https://etherscan.io/tx/'}${txHash}`;
};

/**
 * Gets the block explorer URL for Solana
 */
export const getSolanaExplorerUrl = (txHash: string, cluster: 'mainnet-beta' | 'devnet' | 'testnet' = 'mainnet-beta'): string => {
    return `https://explorer.solana.com/tx/${txHash}${cluster !== 'mainnet-beta' ? `?cluster=${cluster}` : ''}`;
};

/**
 * Formats a transaction hash for display
 */
export const formatTxHash = (hash: string, chars: number = 6): string => {
    if (!hash) return '';
    return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
};

/**
 * Gets the native currency symbol for a chain
 */
export const getNativeCurrency = (chainId: number): string => {
    const currencies: Record<number, string> = {
        1: 'ETH',
        5: 'ETH',
        11155111: 'ETH',
        137: 'MATIC',
        80001: 'MATIC',
        56: 'BNB',
        97: 'BNB',
        42161: 'ETH',
        421613: 'ETH',
    };
    return currencies[chainId] || 'ETH';
};

/**
 * Estimates USD value (mock - in production, use real price feeds)
 */
export const estimateUSDValue = (amount: number, currency: string): number => {
    const mockPrices: Record<string, number> = {
        ETH: 2000,
        MATIC: 0.8,
        BNB: 300,
        SOL: 100,
    };
    return amount * (mockPrices[currency] || 0);
};
