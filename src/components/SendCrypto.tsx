import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletStore } from "@/store/walletStore";
import { useToast } from "@/hooks/use-toast";
import { isValidAddress, formatBalance, getNativeCurrency } from "@/lib/walletUtils";
import { Loader2, Send } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

const SendCrypto = () => {
    const { toast } = useToast();
    const { walletAddress, walletType, nativeBalance, chainId, sendTransaction } = useWalletStore();

    const [toAddress, setToAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [sending, setSending] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const currency = walletType === 'evm' ? getNativeCurrency(chainId || 1) : 'SOL';
    const maxAmount = nativeBalance;

    const handleSend = async () => {
        // Validation
        if (!toAddress || !amount) {
            toast({
                title: "Invalid Input",
                description: "Please enter both address and amount",
                variant: "destructive",
            });
            return;
        }

        if (!isValidAddress(toAddress, walletType || 'evm')) {
            toast({
                title: "Invalid Address",
                description: `Please enter a valid ${walletType === 'solana' ? 'Solana' : 'Ethereum'} address`,
                variant: "destructive",
            });
            return;
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            toast({
                title: "Invalid Amount",
                description: "Please enter a valid amount",
                variant: "destructive",
            });
            return;
        }

        if (amountNum > maxAmount) {
            toast({
                title: "Insufficient Balance",
                description: `You only have ${formatBalance(maxAmount)} ${currency}`,
                variant: "destructive",
            });
            return;
        }

        // Show confirmation dialog
        setConfirmOpen(true);
    };

    const confirmSend = async () => {
        setSending(true);
        setConfirmOpen(false);

        try {
            const result = await sendTransaction(toAddress, parseFloat(amount), currency);

            if (result.success) {
                toast({
                    title: "Transaction Sent",
                    description: `Successfully sent ${amount} ${currency}`,
                });

                // Reset form
                setToAddress("");
                setAmount("");
            } else {
                toast({
                    title: "Transaction Failed",
                    description: result.error || "Failed to send transaction",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setSending(false);
        }
    };

    if (!walletAddress) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Send Crypto</CardTitle>
                    <CardDescription>Connect your wallet to send cryptocurrency</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Send {currency}</CardTitle>
                    <CardDescription>
                        Send cryptocurrency to another wallet
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="to-address">Recipient Address</Label>
                        <Input
                            id="to-address"
                            placeholder={walletType === 'solana' ? 'Solana address' : '0x...'}
                            value={toAddress}
                            onChange={(e) => setToAddress(e.target.value)}
                            className="font-mono text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="amount">Amount</Label>
                            <span className="text-xs text-muted-foreground">
                                Balance: {formatBalance(maxAmount)} {currency}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                id="amount"
                                type="number"
                                step="0.0001"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="font-mono"
                            />
                            <Button
                                variant="outline"
                                onClick={() => setAmount(maxAmount.toString())}
                                disabled={sending}
                            >
                                Max
                            </Button>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button
                            className="w-full"
                            onClick={handleSend}
                            disabled={sending || !toAddress || !amount}
                        >
                            {sending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send {currency}
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Transaction</DialogTitle>
                        <DialogDescription>
                            Please review the transaction details before confirming
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">To:</span>
                            <span className="font-mono text-xs">{toAddress.slice(0, 10)}...{toAddress.slice(-8)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="font-semibold">{amount} {currency}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Network:</span>
                            <span>{walletType === 'solana' ? 'Solana' : getNativeCurrency(chainId || 1)}</span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmSend}>
                            Confirm Send
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default SendCrypto;
