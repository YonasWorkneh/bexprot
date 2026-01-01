import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTradingStore } from "@/store/tradingStore";
import { useWalletStore } from "@/store/walletStore";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ArrowUpFromLine, Wallet } from "lucide-react";

interface WithdrawDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const WithdrawDialog = ({ open, onOpenChange }: WithdrawDialogProps) => {
    const { toast } = useToast();
    const balance = useTradingStore((state) => state.balance);
    const withdrawToWallet = useTradingStore((state) => state.withdrawToWallet);
    const { walletAddress, connectedWallet, depositFromWallet: depositToWallet } = useWalletStore();

    const [amount, setAmount] = useState("");
    const [withdrawing, setWithdrawing] = useState(false);

    const handleWithdraw = async () => {
        const withdrawAmount = parseFloat(amount);

        if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
            toast({
                title: "Invalid Amount",
                description: "Please enter a valid amount",
                variant: "destructive",
            });
            return;
        }

        setWithdrawing(true);

        try {
            const result = withdrawToWallet(withdrawAmount, walletAddress || undefined);

            if (result.success) {
                // If wallet is connected, add to wallet balance
                if (connectedWallet && walletAddress) {
                    depositToWallet(withdrawAmount);
                }

                toast({
                    title: "Withdrawal Successful",
                    description: `Successfully withdrew $${withdrawAmount.toFixed(2)}${walletAddress ? ' to your wallet' : ''}`,
                });

                setAmount("");
                onOpenChange(false);
            } else {
                toast({
                    title: "Withdrawal Failed",
                    description: result.error || "Failed to process withdrawal",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            toast({
                title: "Withdrawal Error",
                description: error.message || "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setWithdrawing(false);
        }
    };

    const handleMaxClick = () => {
        setAmount(balance.toString());
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                    <DialogDescription>
                        Withdraw funds from your trading account
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Balance Display */}
                    <div className="bg-secondary/50 rounded-lg p-4">
                        <div className="text-sm text-muted-foreground mb-1">Available Balance</div>
                        <div className="text-2xl font-bold font-mono text-foreground">
                            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    {/* Wallet Info */}
                    {connectedWallet && walletAddress && (
                        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                            <Wallet size={16} className="text-primary" />
                            <div className="flex-1 text-sm">
                                <div className="font-medium">Withdraw to connected wallet</div>
                                <div className="text-xs text-muted-foreground font-mono">
                                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Amount Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Amount (USD)</label>
                        <div className="relative">
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pr-20"
                                step="0.01"
                                min="0"
                                max={balance}
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
                                onClick={handleMaxClick}
                            >
                                MAX
                            </Button>
                        </div>
                    </div>

                    {/* Warning */}
                    {!connectedWallet && (
                        <div className="text-xs text-muted-foreground bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                            <strong>Note:</strong> Connect a wallet to withdraw directly to your crypto wallet. Otherwise, funds will be marked for bank withdrawal.
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                            disabled={withdrawing}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 bg-primary text-foreground"
                            onClick={handleWithdraw}
                            disabled={withdrawing || !amount || parseFloat(amount) <= 0}
                        >
                            {withdrawing ? (
                                <>
                                    <ArrowUpFromLine className="mr-2 h-4 w-4 animate-pulse" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <ArrowUpFromLine className="mr-2 h-4 w-4" />
                                    Withdraw
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default WithdrawDialog;
