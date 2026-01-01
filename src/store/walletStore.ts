import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WalletId, WalletType } from "@/lib/walletConfig";
import { weiToEth, estimateUSDValue, getNativeCurrency } from "@/lib/walletUtils";
import { supabase } from "@/lib/supabase";
import { useAuthStore as useAuthStoreHook } from "./authStore";

export interface WalletTransaction {
  id: string;
  hash: string;
  type: 'send' | 'receive';
  amount: number;
  asset: string;
  toAddress?: string;
  fromAddress?: string;
  status: 'pending' | 'confirmed' | 'failed';
  network: string;
  timestamp: number;
}

interface WalletState {
  // Connection state
  connectedWallet: WalletId | null;
  walletType: WalletType | null;
  walletAddress: string | null;
  chainId: number | null;

  // Balance state
  nativeBalance: number; // in native currency (ETH, SOL, etc.)
  balanceUSD: number; // USD equivalent

  // Transaction state
  transactions: WalletTransaction[];
  pendingTx: string | null;

  // EVM wallet actions
  connectMetaMask: () => Promise<{ success: boolean; error?: string }>;
  connectWalletConnect: () => Promise<{ success: boolean; error?: string }>;
  connectCoinbase: () => Promise<{ success: boolean; error?: string }>;

  // Solana wallet actions
  connectPhantom: () => Promise<{ success: boolean; error?: string }>;

  // Common actions
  disconnectWallet: () => void;
  fetchBalance: () => Promise<void>;
  switchChain: (chainId: number) => Promise<{ success: boolean; error?: string }>;

  // Transaction actions
  sendTransaction: (to: string, amount: number, asset?: string) => Promise<{ success: boolean; hash?: string; error?: string }>;
  addTransaction: (tx: WalletTransaction) => Promise<void>;
  updateTransactionStatus: (hash: string, status: 'confirmed' | 'failed') => void;
  reconnect: () => Promise<void>;
  fetchUserTransactions: () => Promise<void>;
  subscribeToChanges: () => () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial state
      connectedWallet: null,
      walletType: null,
      walletAddress: null,
      chainId: null,
      nativeBalance: 0,
      balanceUSD: 0,
      transactions: [],
      pendingTx: null,

      // MetaMask connection
      connectMetaMask: async () => {
        try {
          if (typeof window !== "undefined" && window.ethereum) {
            let provider = window.ethereum;

            // Handle multiple wallets (e.g. Trust Wallet + MetaMask)
            if ((window.ethereum as any).providers) {
              provider = (window.ethereum as any).providers.find((p: any) => p.isMetaMask) || window.ethereum;
            }

            const accounts = await provider.request({
              method: "eth_requestAccounts",
            });

            if (accounts.length > 0) {
              const address = accounts[0];
              const chainId = await provider.request({ method: "eth_chainId" });

              set({
                connectedWallet: "metamask",
                walletType: "evm",
                walletAddress: address,
                chainId: parseInt(chainId, 16),
              });

              // Fetch balance after connecting
              await get().fetchBalance();

              // Listen for account changes
              provider.on("accountsChanged", (accounts: string[]) => {
                if (accounts.length === 0) {
                  get().disconnectWallet();
                } else {
                  set({ walletAddress: accounts[0] });
                  get().fetchBalance();
                }
              });

              // Listen for chain changes
              provider.on("chainChanged", (chainId: string) => {
                set({ chainId: parseInt(chainId, 16) });
                get().fetchBalance();
              });

              return { success: true };
            }
          }
          return { success: false, error: "MetaMask not installed" };
        } catch (error: any) {
          return { success: false, error: error.message || "Failed to connect" };
        }
      },

      // WalletConnect connection (placeholder - needs wagmi integration)
      connectWalletConnect: async () => {
        return { success: false, error: "Coming Soon: This feature requires a WalletConnect Project ID." };
      },

      // Coinbase Wallet connection (placeholder - needs wagmi integration)
      connectCoinbase: async () => {
        return { success: false, error: "Coming Soon: This feature requires a WalletConnect Project ID." };
      },

      // Phantom (Solana) connection
      connectPhantom: async () => {
        try {
          if (typeof window !== "undefined" && (window as any).solana) {
            const solana = (window as any).solana;

            if (solana.isPhantom) {
              const response = await solana.connect();
              const address = response.publicKey.toString();

              set({
                connectedWallet: "phantom",
                walletType: "solana",
                walletAddress: address,
                chainId: null, // Solana doesn't use chainId
              });

              // Fetch balance
              await get().fetchBalance();

              // Listen for account changes
              solana.on("accountChanged", (publicKey: any) => {
                if (publicKey) {
                  set({ walletAddress: publicKey.toString() });
                  get().fetchBalance();
                } else {
                  get().disconnectWallet();
                }
              });

              return { success: true };
            }
          }
          return { success: false, error: "Phantom wallet not installed" };
        } catch (error: any) {
          return { success: false, error: error.message || "Failed to connect" };
        }
      },

      // Fetch balance based on wallet type
      fetchBalance: async () => {
        try {
          const { walletType, walletAddress, chainId } = get();

          if (!walletAddress) return;

          if (walletType === "evm" && typeof window !== "undefined" && window.ethereum) {
            // Use the correct provider if possible, otherwise fallback to window.ethereum
            let provider = window.ethereum;
            if ((window.ethereum as any).providers) {
              provider = (window.ethereum as any).providers.find((p: any) => p.isMetaMask) || window.ethereum;
            }

            const balance = await provider.request({
              method: "eth_getBalance",
              params: [walletAddress, "latest"],
            });

            const balanceInEth = weiToEth(balance);
            const currency = getNativeCurrency(chainId || 1);
            const balanceInUSD = estimateUSDValue(balanceInEth, currency);

            set({
              nativeBalance: balanceInEth,
              balanceUSD: balanceInUSD
            });

            // Sync with Trading Store
            const { useTradingStore } = await import("./tradingStore");
            useTradingStore.getState().syncWithWalletBalance(balanceInUSD);
          } else if (walletType === "solana" && typeof window !== "undefined" && (window as any).solana) {
            const solana = (window as any).solana;
            const connection = new (await import("@solana/web3.js")).Connection(
              "https://api.mainnet-beta.solana.com"
            );

            const publicKey = new (await import("@solana/web3.js")).PublicKey(walletAddress);
            const balance = await connection.getBalance(publicKey);
            const balanceInSOL = balance / 1e9; // Convert lamports to SOL
            const balanceInUSD = estimateUSDValue(balanceInSOL, "SOL");

            set({
              nativeBalance: balanceInSOL,
              balanceUSD: balanceInUSD
            });

            // Sync with Trading Store
            const { useTradingStore } = await import("./tradingStore");
            useTradingStore.getState().syncWithWalletBalance(balanceInUSD);
          }
        } catch (error) {
          console.error("Failed to fetch balance:", error);
        }
      },

      // Switch chain (EVM only)
      switchChain: async (chainId: number) => {
        try {
          if (typeof window !== "undefined" && window.ethereum) {
            let provider = window.ethereum;
            if ((window.ethereum as any).providers) {
              provider = (window.ethereum as any).providers.find((p: any) => p.isMetaMask) || window.ethereum;
            }

            try {
              await provider.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: `0x${chainId.toString(16)}` }],
              });
            } catch (switchError: any) {
              // This error code indicates that the chain has not been added to MetaMask.
              if (switchError.code === 4902) {
                const CHAIN_CONFIG: Record<number, any> = {
                  56: {
                    chainId: '0x38',
                    chainName: 'Binance Smart Chain',
                    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                    rpcUrls: ['https://bsc-dataseed.binance.org/'],
                    blockExplorerUrls: ['https://bscscan.com/'],
                  },
                  137: {
                    chainId: '0x89',
                    chainName: 'Polygon Mainnet',
                    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                    rpcUrls: ['https://polygon-rpc.com/'],
                    blockExplorerUrls: ['https://polygonscan.com/'],
                  },
                  // Add more chains as needed
                };

                const chainConfig = CHAIN_CONFIG[chainId];
                if (chainConfig) {
                  await provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [chainConfig],
                  });
                } else {
                  throw new Error("Chain configuration not found");
                }
              } else {
                throw switchError;
              }
            }

            set({ chainId });
            await get().fetchBalance();

            return { success: true };
          }
          return { success: false, error: "No Ethereum wallet found" };
        } catch (error: any) {
          return { success: false, error: error.message || "Failed to switch chain" };
        }
      },

      // Send transaction
      sendTransaction: async (to: string, amount: number, asset?: string) => {
        try {
          const { walletType, walletAddress } = get();

          if (!walletAddress) {
            return { success: false, error: "No wallet connected" };
          }

          if (walletType === "evm" && typeof window !== "undefined" && window.ethereum) {
            const ethereum = window.ethereum as any;
            const { ethToWei } = await import("@/lib/walletUtils");

            const txHash = await ethereum.request({
              method: "eth_sendTransaction",
              params: [{
                from: walletAddress,
                to,
                value: `0x${ethToWei(amount).toString(16)}`,
              }],
            });

            // Add transaction to history
            const tx: WalletTransaction = {
              id: `tx_${Date.now()}`,
              hash: txHash,
              type: 'send',
              amount,
              asset: asset || 'ETH',
              toAddress: to,
              fromAddress: walletAddress,
              status: 'pending',
              network: get().chainId?.toString() || 'unknown',
              timestamp: Date.now(),
            };

            get().addTransaction(tx);
            set({ pendingTx: txHash });

            return { success: true, hash: txHash };
          } else if (walletType === "solana" && typeof window !== "undefined" && (window as any).solana) {
            // Solana transaction implementation
            const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = await import("@solana/web3.js");
            const solana = (window as any).solana;

            const connection = new Connection("https://api.mainnet-beta.solana.com");
            const toPubkey = new PublicKey(to);
            const fromPubkey = new PublicKey(walletAddress);

            const transaction = new Transaction().add(
              SystemProgram.transfer({
                fromPubkey,
                toPubkey,
                lamports: amount * LAMPORTS_PER_SOL,
              })
            );

            transaction.feePayer = fromPubkey;
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;

            const signed = await solana.signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signed.serialize());

            // Add transaction to history
            const tx: WalletTransaction = {
              id: `tx_${Date.now()}`,
              hash: signature,
              type: 'send',
              amount,
              asset: asset || 'SOL',
              toAddress: to,
              fromAddress: walletAddress,
              status: 'pending',
              network: 'solana',
              timestamp: Date.now(),
            };

            get().addTransaction(tx);
            set({ pendingTx: signature });

            return { success: true, hash: signature };
          }

          return { success: false, error: "Unsupported wallet type" };
        } catch (error: any) {
          return { success: false, error: error.message || "Transaction failed" };
        }
      },

      // Fetch user transactions from Supabase
      fetchUserTransactions: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Fetch deposits
          const { data: deposits } = await supabase
            .from('crypto_deposits') // Changed from deposits
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          // Fetch withdrawals
          const { data: withdrawals } = await supabase
            .from('withdrawals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          // Fetch other wallet transactions
          const { data: txs } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false });

          // Normalize and merge
          const normalizedDeposits: WalletTransaction[] = (deposits || []).map(d => ({
            id: d.id,
            hash: d.transaction_hash || `dep_${d.id}`,
            type: 'receive',
            amount: d.amount,
            asset: d.currency, // Changed from network to currency
            status: d.status === 'completed' || d.status === 'credited' ? 'confirmed' : d.status === 'rejected' ? 'failed' : 'pending', // Handle 'credited' status
            network: d.currency, // Changed from network to currency
            timestamp: new Date(d.created_at).getTime(),
            fromAddress: d.deposit_address || undefined, // Changed from from_address
          }));

          const normalizedWithdrawals: WalletTransaction[] = (withdrawals || []).map(w => ({
            id: w.id,
            hash: w.transaction_id || `with_${w.id}`,
            type: 'send',
            amount: w.amount,
            asset: w.network,
            status: w.status === 'completed' ? 'confirmed' : w.status === 'rejected' ? 'failed' : 'pending',
            network: w.network,
            timestamp: new Date(w.created_at).getTime(),
            toAddress: w.address,
          }));

          const normalizedTxs: WalletTransaction[] = (txs || []).map(t => ({
            ...t,
            timestamp: new Date(t.timestamp).getTime(),
          }));

          const allTxs = [...normalizedDeposits, ...normalizedWithdrawals, ...normalizedTxs].sort((a, b) => b.timestamp - a.timestamp);

          set({ transactions: allTxs });
        } catch (error) {
          console.error("Failed to fetch transactions:", error);
        }
      },

      // Add transaction to history and Supabase
      addTransaction: async (tx: WalletTransaction) => {
        set((state) => ({
          transactions: [tx, ...state.transactions],
        }));

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // If it's a withdrawal (send), insert into withdrawals table
          if (tx.type === 'send') {
            await supabase.from('withdrawals').insert({
              user_id: user.id,
              amount: tx.amount,
              network: tx.network,
              address: tx.toAddress || '',
              type: 'send', // Correctly mark as send
              status: tx.status === 'confirmed' ? 'completed' : 'pending',
              transaction_id: tx.hash,
            });
          } else {
            // Generic wallet transaction
            await supabase.from('wallet_transactions').insert({
              user_id: user.id,
              wallet_address: get().walletAddress || '',
              transaction_hash: tx.hash,
              type: tx.type,
              amount: tx.amount,
              asset: tx.asset,
              to_address: tx.toAddress,
              from_address: tx.fromAddress,
              status: tx.status,
              network: tx.network,
            });
          }
        } catch (error) {
          console.error("Failed to persist transaction:", error);
        }
      },

      // Update transaction status
      updateTransactionStatus: (hash: string, status: 'confirmed' | 'failed') => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.hash === hash ? { ...tx, status } : tx
          ),
          pendingTx: state.pendingTx === hash ? null : state.pendingTx,
        }));
      },

      // Disconnect wallet
      disconnectWallet: () => {
        set({
          connectedWallet: null,
          walletType: null,
          walletAddress: null,
          chainId: null,
          nativeBalance: 0,
          balanceUSD: 0,
          pendingTx: null,
        });
      },

      // Reconnect wallet on page load
      reconnect: async () => {
        const { connectedWallet } = get();
        if (connectedWallet === 'metamask') {
          await get().connectMetaMask();
        } else if (connectedWallet === 'phantom') {
          await get().connectPhantom();
        }
        // Fetch transactions on reconnect
        await get().fetchUserTransactions();
      },

      subscribeToChanges: () => {
        const user = useAuthStoreHook.getState().user;
        if (!user) return () => { };

        const channel = supabase
          .channel('wallet_changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${user.id}` }, () => get().fetchUserTransactions())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'crypto_deposits', filter: `user_id=eq.${user.id}` }, () => get().fetchUserTransactions())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals', filter: `user_id=eq.${user.id}` }, () => get().fetchUserTransactions())
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      },
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        connectedWallet: state.connectedWallet,
        walletType: state.walletType,
        walletAddress: state.walletAddress,
        chainId: state.chainId
      }),
    }
  )
);
