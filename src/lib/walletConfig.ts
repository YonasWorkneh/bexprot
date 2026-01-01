import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, polygon, bsc, arbitrum } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// WalletConnect Project ID - you should get your own from https://cloud.walletconnect.com
const projectId = 'YOUR_WALLETCONNECT_PROJECT_ID';

export const config = createConfig({
    chains: [mainnet, sepolia, polygon, bsc, arbitrum],
    connectors: [
        injected({
            target: 'metaMask',
        }),
        walletConnect({
            projectId,
            metadata: {
                name: 'Bexprot',
                description: 'Bexprot Trading Platform',
                url: 'https://bexprot.com',
                icons: ['https://bexprot.com/favicon.png'],
            },
        }),
        coinbaseWallet({
            appName: 'Bexprot',
            appLogoUrl: 'https://bexprot.com/favicon.png',
        }),
    ],
    transports: {
        [mainnet.id]: http(),
        [sepolia.id]: http(),
        [polygon.id]: http(),
        [bsc.id]: http(),
        [arbitrum.id]: http(),
    },
});

// Supported wallet types
export const SUPPORTED_WALLETS = [
    {
        id: 'metamask',
        name: 'MetaMask',
        description: 'Connect with MetaMask',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
        type: 'evm' as const,
    },
    {
        id: 'walletconnect',
        name: 'WalletConnect',
        description: 'Scan with WalletConnect',
        logo: 'https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Blue%20(Default)/Logo.svg',
        type: 'evm' as const,
    },
    {
        id: 'coinbase',
        name: 'Coinbase Wallet',
        description: 'Connect with Coinbase',
        logo: 'https://images.ctfassets.net/q5ulk4bp65r7/3TBS4oVkD1ghowTqVQJlqj/d9e2e9f1c8e4e3e8c8e8e8e8e8e8e8e8/coinbase-icon2.svg',
        type: 'evm' as const,
    },
    {
        id: 'trust',
        name: 'Trust Wallet',
        description: 'Connect with Trust Wallet',
        logo: 'https://trustwallet.com/assets/images/media/assets/TWT.svg',
        type: 'evm' as const,
    },
    {
        id: 'phantom',
        name: 'Phantom',
        description: 'Connect with Phantom (Solana)',
        logo: 'https://phantom.app/img/phantom-logo.svg',
        type: 'solana' as const,
    },
] as const;

export type WalletType = typeof SUPPORTED_WALLETS[number]['type'];
export type WalletId = typeof SUPPORTED_WALLETS[number]['id'];
