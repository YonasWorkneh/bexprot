import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, QrCode, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { NETWORKS, getNetworkConfig, type USDTWallet, type Network } from '@/lib/usdtWalletUtils';

interface USDTReceiveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    wallet: USDTWallet;
}

const USDTReceiveDialog = ({ open, onOpenChange, wallet }: USDTReceiveDialogProps) => {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const network = getNetworkConfig(wallet.network) || NETWORKS.USDT_TRC20;

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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <QrCode className="h-5 w-5" />
                        Receive USDT
                    </DialogTitle>
                    <DialogDescription>
                        Receive USDT on {network.name} network
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* QR Code */}
                    <div className="flex flex-col items-center">
                        <div className="bg-white p-4 rounded-xl shadow-lg border-4 border-primary/20">
                            <QRCodeCanvas
                                value={wallet.address}
                                size={200}
                                level="H"
                                includeMargin={false}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 text-center">
                            Scan this QR code to get the wallet address
                        </p>
                    </div>

                    {/* Network Badge */}
                    <div className="bg-primary/10 rounded-lg p-3 text-center">
                        <p className="text-sm font-medium text-primary">
                            {network.name} ({network.symbol})
                        </p>
                    </div>

                    {/* Wallet Address */}
                    <div className="space-y-2">
                        <Label htmlFor="address">Wallet Address</Label>
                        <div className="flex gap-2">
                            <Input
                                id="address"
                                value={wallet.address}
                                readOnly
                                className="font-mono text-sm"
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

                    {/* Important Notes */}
                    <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                            <p className="font-semibold mb-2">Important:</p>
                            <ul className="text-xs space-y-1 list-disc pl-4">
                                <li>Only send USDT to this address</li>
                                <li>Make sure you're using the {network.name} network</li>
                                <li>Sending other tokens may result in permanent loss</li>
                                <li>Minimum deposit: $10 USDT</li>
                            </ul>
                        </AlertDescription>
                    </Alert>

                    {/* Network Info */}
                    <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold mb-3">Network Information</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Network</span>
                                <span className="font-medium">{network.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Symbol</span>
                                <span className="font-medium">{network.symbol}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Decimals</span>
                                <span className="font-medium">{network.decimals}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Estimated Fee</span>
                                <span className="font-medium">${network.fee} {network.symbol}</span>
                            </div>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold">How to Receive:</h4>
                        <ol className="text-sm space-y-2 list-decimal pl-5 text-muted-foreground">
                            <li>Copy the wallet address above or scan the QR code</li>
                            <li>Open your external wallet or exchange</li>
                            <li>Select {network.name} as the network</li>
                            <li>Paste the address and send USDT</li>
                            <li>Your balance will update once the transaction is confirmed</li>
                        </ol>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default USDTReceiveDialog;
