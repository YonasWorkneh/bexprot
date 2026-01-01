import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/store/walletStore";
import { useToast } from "@/hooks/use-toast";
import { Copy, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { generateQRCodeData } from "@/lib/qrUtils";
import { formatAddress } from "@/lib/walletUtils";

const ReceiveCrypto = () => {
    const { toast } = useToast();
    const { walletAddress, walletType } = useWalletStore();

    const copyAddress = () => {
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress);
            toast({
                title: "Copied",
                description: "Wallet address copied to clipboard",
            });
        }
    };

    const shareAddress = async () => {
        if (walletAddress && navigator.share) {
            try {
                await navigator.share({
                    title: 'My Wallet Address',
                    text: walletAddress,
                });
            } catch (error) {
                // User cancelled or share not supported
                copyAddress();
            }
        } else {
            copyAddress();
        }
    };

    if (!walletAddress) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Receive Crypto</CardTitle>
                    <CardDescription>Connect your wallet to receive cryptocurrency</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const qrData = generateQRCodeData(walletAddress);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Receive Crypto</CardTitle>
                <CardDescription>
                    Share your wallet address or QR code to receive cryptocurrency
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* QR Code */}
                <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-xl border-2 border-border">
                        <QRCodeSVG
                            value={qrData}
                            size={200}
                            level="H"
                            includeMargin={false}
                        />
                    </div>
                </div>

                {/* Wallet Address */}
                <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                        Your {walletType === 'solana' ? 'Solana' : 'Ethereum'} Address
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                        <div className="flex-1 font-mono text-sm break-all">
                            {walletAddress}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={copyAddress}
                    >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Address
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={shareAddress}
                    >
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                    </Button>
                </div>

                {/* Warning */}
                <div className="text-xs text-muted-foreground bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <strong>Important:</strong> Only send {walletType === 'solana' ? 'Solana (SOL)' : 'Ethereum and ERC-20 tokens'} to this address.
                    Sending other cryptocurrencies may result in permanent loss.
                </div>
            </CardContent>
        </Card>
    );
};

export default ReceiveCrypto;
