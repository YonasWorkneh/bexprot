import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/store/walletStore";
import { SUPPORTED_WALLETS } from "@/lib/walletConfig";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface WalletConnectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const WalletConnectModal = ({ open, onOpenChange }: WalletConnectModalProps) => {
    const { toast } = useToast();
    const [connecting, setConnecting] = useState<string | null>(null);
    const {
        connectMetaMask,
        connectWalletConnect,
        connectCoinbase,
        connectPhantom,
    } = useWalletStore();

    const handleConnect = async (walletId: string) => {
        setConnecting(walletId);

        try {
            let result;

            switch (walletId) {
                case 'metamask':
                    result = await connectMetaMask();
                    break;
                case 'walletconnect':
                    result = await connectWalletConnect();
                    break;
                case 'coinbase':
                    result = await connectCoinbase();
                    break;
                case 'phantom':
                    result = await connectPhantom();
                    break;
                default:
                    result = { success: false, error: 'Wallet not supported yet' };
            }

            if (result.success) {
                toast({
                    title: "Wallet Connected",
                    description: `Successfully connected to ${SUPPORTED_WALLETS.find(w => w.id === walletId)?.name}`,
                });
                onOpenChange(false);
            } else {
                toast({
                    title: "Connection Failed",
                    description: result.error || "Failed to connect wallet",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            toast({
                title: "Connection Error",
                description: error.message || "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setConnecting(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Connect Wallet</DialogTitle>
                    <DialogDescription>
                        Choose a wallet to connect to Bexprot
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 py-4">
                    {SUPPORTED_WALLETS.map((wallet) => (
                        <Button
                            key={wallet.id}
                            variant="outline"
                            className="w-full justify-start h-auto py-4 px-4 hover:bg-secondary/80"
                            onClick={() => handleConnect(wallet.id)}
                            disabled={connecting !== null}
                        >
                            <div className="flex items-center gap-3 w-full">
                                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                    <img
                                        src={wallet.logo}
                                        alt={`${wallet.name} logo`}
                                        className="w-8 h-8 object-contain"
                                        onError={(e) => {
                                            // Fallback if image fails to load
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-semibold text-foreground">{wallet.name}</div>
                                    <div className="text-xs text-muted-foreground">{wallet.description}</div>
                                </div>
                                {connecting === wallet.id && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                            </div>
                        </Button>
                    ))}
                </div>

                <div className="text-xs text-muted-foreground text-center">
                    By connecting a wallet, you agree to our Terms of Service and Privacy Policy
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default WalletConnectModal;
