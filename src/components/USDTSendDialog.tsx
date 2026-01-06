import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  sendUSDT,
  // TODO: Add address validation back later
  // validateAddress,
  formatUSDT,
  calculateFee,
  NETWORKS,
  getNetworkConfig,
  type USDTWallet,
  type Network,
} from "@/lib/usdtWalletUtils";
import { useAuthStore } from "@/store/authStore";

interface USDTSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: USDTWallet;
  onSuccess?: () => void;
}

const USDTSendDialog = ({
  open,
  onOpenChange,
  wallet,
  onSuccess,
}: USDTSendDialogProps) => {
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();

  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const network = getNetworkConfig(wallet.network) || NETWORKS.USDT_TRC20;
  const fee = amount
    ? calculateFee(wallet.network as Network, parseFloat(amount))
    : 0;
  const totalAmount = amount ? parseFloat(amount) + fee : 0;
  // TODO: Add address validation back later
  // const isValidAddress = toAddress ? validateAddress(toAddress, wallet.network as Network) : true;
  const isValidAddress = true; // Temporarily disabled - validation will be added back later
  const hasEnoughBalance = totalAmount <= wallet.balance;

  const handleSend = async () => {
    if (!user?.id) return;

    setError("");
    setLoading(true);

    try {
      const amountNum = parseFloat(amount);

      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Please enter a valid amount");
      }

      // TODO: Add address validation back later
      // if (!isValidAddress) {
      //     throw new Error('Invalid recipient address');
      // }

      if (!hasEnoughBalance) {
        throw new Error("Insufficient balance");
      }

      const result = await sendUSDT(
        wallet.id,
        user.id,
        amountNum,
        wallet.network as Network,
        toAddress
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to send USDT");
      }

      setSuccess(true);
      toast({
        title: "Transaction Sent",
        description: `Successfully sent ${formatUSDT(amountNum)} USDT`,
      });

      // Wait a moment to show success, then close
      setTimeout(() => {
        onOpenChange(false);
        resetForm();
        onSuccess?.();
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send USDT";
      setError(errorMessage);
      toast({
        title: "Transaction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setToAddress("");
    setAmount("");
    setError("");
    setSuccess(false);
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      resetForm();
    }
  };

  const setMaxAmount = () => {
    const maxSendable = Math.max(0, wallet.balance - fee);
    setAmount(maxSendable.toString());
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send USDT
          </DialogTitle>
          <DialogDescription>
            Send USDT from your {network.name} wallet
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Transaction Sent!</h3>
            <p className="text-sm text-muted-foreground text-center">
              Your USDT is being sent. It may take a few moments to complete.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Wallet Info */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Available Balance
                </span>
                <span className="font-mono font-semibold">
                  ${formatUSDT(wallet.balance)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Network</span>
                <span className="text-sm font-medium">{network.name}</span>
              </div>
            </div>

            {/* Recipient Address */}
            <div className="space-y-2">
              <Label htmlFor="toAddress">Recipient Address</Label>
              <Input
                id="toAddress"
                placeholder={`Enter ${network.name} address`}
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                // TODO: Add address validation styling back later
                // className={!isValidAddress && toAddress ? 'border-red-500' : ''}
              />
              {/* TODO: Add address validation error message back later */}
              {/* {!isValidAddress && toAddress && (
                                <p className="text-xs text-red-500">Invalid address format for {network.name}</p>
                            )} */}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USDT)</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={setMaxAmount}
                  className="shrink-0"
                >
                  Max
                </Button>
              </div>
            </div>

            {/* Transaction Summary */}
            {amount && parseFloat(amount) > 0 && (
              <div className="bg-muted/30 rounded-lg p-4 space-y-2 border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-mono">
                    ${formatUSDT(parseFloat(amount))}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Network Fee</span>
                  <span className="font-mono">${formatUSDT(fee)}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-mono font-bold">
                    ${formatUSDT(totalAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Insufficient Balance Warning */}
            {amount && !hasEnoughBalance && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Insufficient balance. You need ${formatUSDT(totalAmount)}{" "}
                  (including fees).
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {!success && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={
                loading ||
                !toAddress ||
                !amount ||
                !isValidAddress ||
                !hasEnoughBalance ||
                parseFloat(amount) <= 0
              }
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send USDT
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default USDTSendDialog;
