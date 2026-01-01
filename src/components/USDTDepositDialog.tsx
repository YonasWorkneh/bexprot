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
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowDownCircle, AlertCircle, CheckCircle, Copy, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '@/lib/supabase';
import {
    createDepositTransaction,
    formatUSDT,
    NETWORKS,
    getNetworkConfig,
    type USDTWallet,
    type Network,
} from '@/lib/usdtWalletUtils';
import { useAuthStore } from '@/store/authStore';

interface USDTDepositDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    wallet: USDTWallet;
    onSuccess?: () => void;
}

const USDTDepositDialog = ({ open, onOpenChange, wallet, onSuccess }: USDTDepositDialogProps) => {
    const user = useAuthStore((state) => state.user);
    const { toast } = useToast();

    const [step, setStep] = useState<'info' | 'confirm' | 'success'>('info');
    const [amount, setAmount] = useState('');
    const [transactionHash, setTransactionHash] = useState('');
    const [fromAddress, setFromAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [proofFile, setProofFile] = useState<File | null>(null);

    const network = getNetworkConfig(wallet.network) || NETWORKS.USDT_TRC20;

    const handleSubmitDeposit = async () => {
        if (!user?.id) return;

        setLoading(true);

        try {
            const amountNum = parseFloat(amount);

            if (isNaN(amountNum) || amountNum < 10) {
                throw new Error('Minimum deposit is $10 USDT');
            }

            if (!transactionHash.trim()) {
                throw new Error('Please provide transaction hash');
            }

            if (!fromAddress.trim()) {
                throw new Error('Please provide sender address');
            }

            // Upload proof if exists
            let proofUrl = undefined;
            if (proofFile) {
                const fileExt = proofFile.name.split('.').pop();
                const fileName = `deposit_${user.id}_${Date.now()}.${fileExt}`;
                const { data, error } = await supabase.storage
                    .from('transaction-proofs')
                    .upload(fileName, proofFile);

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('transaction-proofs')
                    .getPublicUrl(fileName);

                proofUrl = publicUrl;
            }

            const transaction = await createDepositTransaction(
                wallet.id,
                user.id,
                amountNum,
                wallet.network as Network,
                fromAddress,
                transactionHash,
                proofUrl
            );

            if (!transaction) {
                throw new Error('Failed to create deposit request');
            }

            setStep('success');
            toast({
                title: 'Deposit Request Submitted',
                description: 'Your deposit will be processed shortly',
            });

            setTimeout(() => {
                onOpenChange(false);
                resetForm();
                onSuccess?.();
            }, 3000);
        } catch (err: any) {
            toast({
                title: 'Deposit Failed',
                description: err.message || 'Failed to submit deposit',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStep('info');
        setAmount('');
        setTransactionHash('');
        setFromAddress('');
    };

    const handleClose = () => {
        if (!loading) {
            onOpenChange(false);
            setTimeout(resetForm, 200);
        }
    };

    const copyAddress = () => {
        navigator.clipboard.writeText(wallet.address);
        setCopied(true);
        toast({
            title: 'Address Copied',
            description: 'Wallet address copied to clipboard',
        });

        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowDownCircle className="h-5 w-5" />
                        Deposit USDT
                    </DialogTitle>
                    <DialogDescription>
                        Deposit USDT to your {network.name} wallet
                    </DialogDescription>
                </DialogHeader>

                {step === 'info' && (
                    <div className="space-y-4">
                        {/* QR Code and Address */}
                        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6 text-center">
                            <div className="inline-block bg-white p-3 rounded-lg shadow-md mb-4">
                                <QRCodeCanvas
                                    value={wallet.address}
                                    size={150}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>

                            <Label className="block mb-2 text-sm font-medium">
                                Deposit Address ({network.symbol})
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    value={wallet.address}
                                    readOnly
                                    className="font-mono text-xs bg-background"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={copyAddress}
                                    className="shrink-0"
                                >
                                    {copied ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Important Instructions */}
                        <Alert className="bg-blue-50 border-blue-200">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                <p className="font-semibold mb-2">Before you deposit:</p>
                                <ul className="text-xs space-y-1 list-disc pl-4">
                                    <li>Send USDT to the address above using {network.name} network</li>
                                    <li>Minimum deposit: <strong>$10 USDT</strong></li>
                                    <li>Only send USDT tokens (other tokens will be lost)</li>
                                    <li>Wait for blockchain confirmation before proceeding</li>
                                </ul>
                            </AlertDescription>
                        </Alert>

                        {/* Network Info */}
                        <div className="bg-muted/50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold mb-2">Network Details</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Network:</span>
                                    <p className="font-medium">{network.name}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Symbol:</span>
                                    <p className="font-medium">{network.symbol}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Min Deposit:</span>
                                    <p className="font-medium">$10 USDT</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Est. Time:</span>
                                    <p className="font-medium">5-30 min</p>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-muted-foreground mb-3">
                                Already sent USDT? Confirm your deposit below
                            </p>
                            <Button onClick={() => setStep('confirm')} className="w-full">
                                I've Sent USDT
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="space-y-4">
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Please provide details about your deposit for verification
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <Label htmlFor="depositAmount">Amount Sent (USDT)</Label>
                            <Input
                                id="depositAmount"
                                type="number"
                                step="0.01"
                                min="10"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="font-mono"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="senderAddress">From Address</Label>
                            <Input
                                id="senderAddress"
                                placeholder="Enter the address you sent from"
                                value={fromAddress}
                                onChange={(e) => setFromAddress(e.target.value)}
                                className="font-mono text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="txHash">Transaction Hash </Label>
                            <Textarea
                                id="txHash"
                                placeholder="Enter transaction hash for faster processing"
                                value={transactionHash}
                                onChange={(e) => setTransactionHash(e.target.value)}
                                className="font-mono text-xs resize-none"
                                rows={3}
                            />
                            <p className="text-xs text-muted-foreground">
                                You can find the transaction hash in your wallet or blockchain explorer
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Proof of Payment (Screenshot) <span className="text-muted-foreground">*</span></Label>
                            <div className="flex items-center gap-2">
                                <div className="relative w-full">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-start text-muted-foreground"
                                        onClick={() => document.getElementById('proof-upload')?.click()}
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        {proofFile ? proofFile.name : "Upload Payment Screenshot"}
                                    </Button>
                                    <Input
                                        id="proof-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setProofFile(e.target.files[0]);
                                            }
                                        }}
                                        className="hidden"
                                    />
                                </div>
                                {proofFile && <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />}
                            </div>
                        </div>

                        {amount && parseFloat(amount) >= 10 && (
                            <div className="bg-muted/30 rounded-lg p-4 border">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Deposit Amount</span>
                                    <span className="font-mono font-bold">${formatUSDT(parseFloat(amount))}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 'success' && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Deposit Submitted!</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-sm">
                            Your deposit request is being processed. Funds will be credited to your account
                            once the transaction is confirmed on the blockchain.
                        </p>
                    </div>
                )}

                {step !== 'success' && (
                    <DialogFooter>
                        {step === 'confirm' && (
                            <Button
                                variant="outline"
                                onClick={() => setStep('info')}
                                disabled={loading}
                            >
                                Back
                            </Button>
                        )}
                        {step === 'info' ? (
                            <Button variant="outline" onClick={handleClose}>
                                Close
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmitDeposit}
                                disabled={
                                    loading ||
                                    !amount ||
                                    parseFloat(amount) < 10 ||
                                    !fromAddress
                                }
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Deposit
                            </Button>
                        )}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default USDTDepositDialog;
