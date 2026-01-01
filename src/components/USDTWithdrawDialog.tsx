import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowUpCircle, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    createWithdrawalTransaction,
    validateAddress,
    formatUSDT,
    calculateFee,
    NETWORKS,
    getNetworkConfig,
    type USDTWallet,
    type Network,
} from '@/lib/usdtWalletUtils';
import { useAuthStore } from '@/store/authStore';

interface USDTWithdrawDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    wallet: USDTWallet;
    onSuccess?: () => void;
}

const USDTWithdrawDialog = ({ open, onOpenChange, wallet, onSuccess }: USDTWithdrawDialogProps) => {
    const user = useAuthStore((state) => state.user);
    const { toast } = useToast();

    const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
    const [toAddress, setToAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const network = getNetworkConfig(wallet.network) || NETWORKS.USDT_TRC20;
    const fee = amount ? calculateFee(wallet.network as Network, parseFloat(amount)) : 0;
    const totalAmount = amount ? parseFloat(amount) + fee : 0;
    const isValidAddress = true; // Relaxed validation as requested
    const hasEnoughBalance = totalAmount <= wallet.balance;
    const minWithdrawal = 20; // Minimum $20 USDT

    const handleWithdraw = async () => {
        if (!user?.id) return;

        setError('');
        setLoading(true);

        try {
            const amountNum = parseFloat(amount);

            if (isNaN(amountNum) || amountNum < minWithdrawal) {
                throw new Error(`Minimum withdrawal is $${minWithdrawal} USDT`);
            }

            if (!isValidAddress) {
                throw new Error('Invalid withdrawal address');
            }

            if (!hasEnoughBalance) {
                throw new Error('Insufficient balance');
            }

            const result = await createWithdrawalTransaction(
                wallet.id,
                user.id,
                amountNum,
                wallet.network as Network,
                toAddress
            );

            if (!result.success) {
                throw new Error(result.error || 'Failed to create withdrawal');
            }

            setStep('success');
            toast({
                title: 'Withdrawal Requested',
                description: `Successfully requested withdrawal of ${formatUSDT(amountNum)} USDT`,
            });

            setTimeout(() => {
                onOpenChange(false);
                resetForm();
                onSuccess?.();
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to withdraw USDT');
            toast({
                title: 'Withdrawal Failed',
                description: err.message || 'Failed to withdraw USDT',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStep('form');
        setToAddress('');
        setAmount('');
        setError('');
    };

    const handleClose = () => {
        if (!loading) {
            onOpenChange(false);
            setTimeout(resetForm, 200);
        }
    };

    const setMaxAmount = () => {
        const maxWithdrawable = Math.max(0, wallet.balance - fee);
        setAmount(maxWithdrawable.toFixed(2));
    };

    const handleContinue = () => {
        setError('');
        const amountNum = parseFloat(amount);

        if (isNaN(amountNum) || amountNum < minWithdrawal) {
            setError(`Minimum withdrawal is $${minWithdrawal} USDT`);
            return;
        }

        if (!isValidAddress) {
            setError(`Invalid ${network.name} address`);
            return;
        }

        if (!hasEnoughBalance) {
            setError('Insufficient balance');
            return;
        }

        setStep('confirm');
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowUpCircle className="h-5 w-5" />
                        Withdraw USDT
                    </DialogTitle>
                    <DialogDescription>
                        Withdraw USDT from your {network.name} wallet
                    </DialogDescription>
                </DialogHeader>

                {step === 'form' && (
                    <div className="space-y-4">
                        {/* Wallet Info */}
                        <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">Available Balance</span>
                                <span className="font-mono font-semibold">${formatUSDT(wallet.balance)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Network</span>
                                <span className="text-sm font-medium">{network.name}</span>
                            </div>
                        </div>

                        {/* Withdrawal Address */}
                        <div className="space-y-2">
                            <Label htmlFor="withdrawAddress">Withdrawal Address</Label>
                            <Input
                                id="withdrawAddress"
                                placeholder={`Enter ${network.name} address`}
                                value={toAddress}
                                onChange={(e) => setToAddress(e.target.value)}
                                className={!isValidAddress && toAddress ? 'border-red-500 font-mono text-sm' : 'font-mono text-sm'}
                            />
                            {!isValidAddress && toAddress && (
                                <p className="text-xs text-red-500">Invalid address format for {network.name}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Double-check the address. Withdrawals cannot be reversed.
                            </p>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="withdrawAmount">Amount (USDT)</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="withdrawAmount"
                                    type="number"
                                    step="0.01"
                                    min={minWithdrawal}
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
                            <p className="text-xs text-muted-foreground">
                                Minimum: ${minWithdrawal} USDT
                            </p>
                        </div>

                        {/* Transaction Summary */}
                        {amount && parseFloat(amount) >= minWithdrawal && (
                            <div className="bg-muted/30 rounded-lg p-4 space-y-2 border">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Withdrawal Amount</span>
                                    <span className="font-mono">${formatUSDT(parseFloat(amount))}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Network Fee</span>
                                    <span className="font-mono">${formatUSDT(fee)}</span>
                                </div>
                                <div className="h-px bg-border my-2" />
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">Total Deducted</span>
                                    <span className="font-mono font-bold">${formatUSDT(totalAmount)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">You'll Receive</span>
                                    <span className="font-mono font-semibold text-green-600">
                                        ${formatUSDT(parseFloat(amount))}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Security Notice */}
                        <Alert className="bg-yellow-50 border-yellow-200">
                            <Shield className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="text-yellow-800">
                                <ul className="text-xs space-y-1">
                                    <li>• Verify the address carefully before confirming</li>
                                    <li>• Withdrawals are irreversible once processed</li>
                                    <li>• Processing time: 10-60 minutes</li>
                                </ul>
                            </AlertDescription>
                        </Alert>

                        {/* Error Message */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="space-y-4">
                        <Alert className="bg-blue-50 border-blue-200">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                Please review the withdrawal details carefully
                            </AlertDescription>
                        </Alert>

                        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                            <h4 className="font-semibold text-sm">Withdrawal Summary</h4>

                            <div className="space-y-2">
                                <div>
                                    <span className="text-xs text-muted-foreground">Network</span>
                                    <p className="font-medium">{network.name}</p>
                                </div>

                                <div>
                                    <span className="text-xs text-muted-foreground">To Address</span>
                                    <p className="font-mono text-sm break-all">{toAddress}</p>
                                </div>

                                <div className="pt-2 border-t">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-muted-foreground">Amount</span>
                                        <span className="font-mono">${formatUSDT(parseFloat(amount))}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-muted-foreground">Fee</span>
                                        <span className="font-mono">${formatUSDT(fee)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t">
                                        <span className="font-semibold">Total</span>
                                        <span className="font-mono font-bold">${formatUSDT(totalAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Warning:</strong> This action cannot be undone. Make sure all details are correct.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                {step === 'success' && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Withdrawal Requested!</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-sm">
                            Your withdrawal request has been submitted and is being processed.
                            You'll receive your USDT shortly.
                        </p>
                    </div>
                )}

                {step !== 'success' && (
                    <DialogFooter>
                        {step === 'confirm' && (
                            <Button
                                variant="outline"
                                onClick={() => setStep('form')}
                                disabled={loading}
                            >
                                Back
                            </Button>
                        )}
                        {step === 'form' ? (
                            <>
                                <Button variant="outline" onClick={handleClose}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleContinue}
                                    disabled={
                                        !toAddress ||
                                        !amount ||
                                        !isValidAddress ||
                                        !hasEnoughBalance ||
                                        parseFloat(amount) < minWithdrawal
                                    }
                                >
                                    Continue
                                </Button>
                            </>
                        ) : (
                            <Button onClick={handleWithdraw} disabled={loading} variant="destructive">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm Withdrawal
                            </Button>
                        )}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default USDTWithdrawDialog;
