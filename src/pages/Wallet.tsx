import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, Copy, Power, Network, ArrowUpFromLine } from "lucide-react";
import { useTradingStore } from "@/store/tradingStore";
import { useAuthStore } from "@/store/authStore";
import { useWalletStore } from "@/store/walletStore";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import WalletConnectModal from "@/components/WalletConnectModal";
import SendCrypto from "@/components/SendCrypto";
import ReceiveCrypto from "@/components/ReceiveCrypto";
import TransactionHistory from "@/components/TransactionHistory";
import WithdrawDialog from "@/components/WithdrawDialog";
import CustomUSDTWallet from "@/components/CustomUSDTWallet";
import CryptoNetworkAddresses from "@/components/CryptoNetworkAddresses";
import { formatBalance, formatAddress, getNetworkName, getNativeCurrency } from "@/lib/walletUtils";
import { SUPPORTED_WALLETS } from "@/lib/walletConfig";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const Wallet = () => {
    const balance = useTradingStore((state) => state.balance);
    const { syncWithWalletBalance } = useTradingStore();
    const user = useAuthStore((state) => state.user);
    const {
        connectedWallet,
        walletAddress,
        nativeBalance,
        balanceUSD,
        walletType,
        chainId,
        disconnectWallet,
        switchChain,
        fetchBalance,
    } = useWalletStore();
    const { toast } = useToast();
    const [walletModalOpen, setWalletModalOpen] = useState(false);
    const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
    const { reconnect } = useWalletStore();

    // Reconnect wallet on mount
    useEffect(() => {
        reconnect();
    }, [reconnect]);

    // Fetch USDT balance on mount and when user changes
    const { fetchUSDTBalance } = useTradingStore();
    useEffect(() => {
        if (user) {
            fetchUSDTBalance();
        }
    }, [user, fetchUSDTBalance]);


    // Sync wallet balance with trading balance
    useEffect(() => {
        if (connectedWallet && balanceUSD >= 0) {
            syncWithWalletBalance(balanceUSD);
        } else if (!connectedWallet) {
            syncWithWalletBalance(0);
        }
    }, [balanceUSD, connectedWallet, syncWithWalletBalance]);

    // Refresh balance periodically
    useEffect(() => {
        if (connectedWallet) {
            const interval = setInterval(() => {
                fetchBalance();
            }, 30000); // Every 30 seconds

            return () => clearInterval(interval);
        }
    }, [connectedWallet, fetchBalance]);

    const copyAddress = () => {
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress);
            toast({
                title: "Copied",
                description: "Wallet address copied to clipboard",
            });
        }
    };

    const handleDisconnect = () => {
        disconnectWallet();
        toast({
            title: "Wallet Disconnected",
            description: "Your wallet has been disconnected",
        });
    };

    const handleSwitchChain = async (newChainId: number) => {
        const result = await switchChain(newChainId);
        if (result.success) {
            toast({
                title: "Network Switched",
                description: `Switched to ${getNetworkName(newChainId)}`,
            });
        } else {
            toast({
                title: "Switch Failed",
                description: result.error || "Failed to switch network",
                variant: "destructive",
            });
        }
    };

    const walletInfo = SUPPORTED_WALLETS.find(w => w.id === connectedWallet);
    const currency = walletType === 'solana' ? 'SOL' : getNativeCurrency(chainId || 1);

    return (
        <div className="p-4 md:p-6">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Wallet</h1>
                <p className="text-muted-foreground">Manage your crypto wallet and transactions</p>
            </div>



            {/* Bexprot Wallet (formerly USDT Wallet) - Now at the top */}
            <div className="mb-8">
                <CustomUSDTWallet />
            </div>

            {/* Crypto Network Addresses */}
            <div className="mb-8">
                <CryptoNetworkAddresses />
            </div>

            <div className="border-t border-border my-8"></div>

            <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground mb-4">External Wallet</h2>

                {/* External Wallet Card */}
                <div className="relative mb-6 max-w-2xl">
                    {connectedWallet ? (
                        <div className="bg-gradient-to-br from-primary via-primary/80 to-primary/60 rounded-2xl p-6 md:p-8 shadow-2xl border border-primary/20 backdrop-blur-sm">
                            {/* Card Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg p-2">
                                        <img
                                            src={walletInfo?.logo}
                                            alt={`${walletInfo?.name} logo`}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div>
                                        <div className="font-bold text-foreground text-lg">{walletInfo?.name}</div>
                                        <div className="text-foreground/80 text-xs">
                                            {walletType === 'solana' ? 'Solana Network' : getNetworkName(chainId || 1)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {walletType === 'evm' && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-foreground/80 hover:text-foreground">
                                                    <Network size={18} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Switch Network</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleSwitchChain(1)}>
                                                    Ethereum Mainnet
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleSwitchChain(11155111)}>
                                                    Sepolia Testnet
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleSwitchChain(137)}>
                                                    Polygon
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleSwitchChain(56)}>
                                                    BSC
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleSwitchChain(42161)}>
                                                    Arbitrum
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleDisconnect}
                                        className="text-foreground/80 hover:text-foreground"
                                    >
                                        <Power size={18} />
                                    </Button>
                                </div>
                            </div>

                            {/* Balance */}
                            <div className="mb-6">
                                <div className="text-foreground/80 text-xs mb-1 uppercase tracking-wide">Wallet Balance</div>
                                <div className="text-4xl md:text-5xl font-bold font-mono text-foreground mb-2">
                                    {formatBalance(nativeBalance, 6)} {currency}
                                </div>
                                <div className="text-foreground/80 text-sm">
                                    ≈ ${formatBalance(balanceUSD, 2)} USD
                                </div>
                            </div>

                            {/* Address */}
                            <div className="flex items-center justify-between p-3 bg-foreground/10 rounded-lg backdrop-blur-sm">
                                <div>
                                    <div className="text-foreground/80 text-xs mb-1">Address</div>
                                    <div className="font-mono text-foreground text-sm">
                                        {formatAddress(walletAddress || '', 8)}
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={copyAddress} className="text-foreground/80 hover:text-foreground">
                                    <Copy size={16} />
                                </Button>
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute top-4 right-4 w-16 h-16 bg-foreground/10 rounded-full blur-2xl"></div>
                            <div className="absolute bottom-4 left-4 w-12 h-12 bg-foreground/10 rounded-full blur-xl"></div>
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <WalletIcon className="mx-auto mb-4 text-muted-foreground" size={48} />
                                <h3 className="text-xl font-semibold mb-2">No External Wallet Connected</h3>
                                <p className="text-muted-foreground mb-6">
                                    Connect your wallet to send, receive, and manage your crypto
                                </p>
                                <Button onClick={() => setWalletModalOpen(true)} className="bg-primary text-foreground">
                                    <WalletIcon className="mr-2" size={18} />
                                    Connect Wallet
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* External Wallet Actions */}
                {connectedWallet && (
                    <div className="max-w-6xl">
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-6">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="send">Send</TabsTrigger>
                                <TabsTrigger value="receive">Receive</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-6">
                                <TransactionHistory />
                            </TabsContent>

                            <TabsContent value="send">
                                <SendCrypto />
                            </TabsContent>

                            <TabsContent value="receive">
                                <ReceiveCrypto />
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </div>

            {/* Account Balance Card */}
            <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6 max-w-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm text-muted-foreground mb-1">Trading Account Balance</div>
                        <div className="text-3xl font-bold font-mono text-foreground">
                            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div className="text-right space-y-2">
                        <div className="text-xs text-muted-foreground mb-1">Account Holder</div>
                        <div className="font-semibold text-foreground">{user?.name || "Guest User"}</div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setWithdrawDialogOpen(true)}
                            className="mt-2"
                        >
                            <ArrowUpFromLine size={16} className="mr-2" />
                            Withdraw
                        </Button>
                    </div>
                </div>
            </div>

            <WalletConnectModal
                open={walletModalOpen}
                onOpenChange={setWalletModalOpen}
            />

            <WithdrawDialog
                open={withdrawDialogOpen}
                onOpenChange={setWithdrawDialogOpen}
            />
        </div>
    );
};

export default Wallet;
