import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  QrCode,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Bitcoin,
  Coins,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeCanvas } from "qrcode.react";
import { DEPOSIT_ADDRESSES, type CryptoCurrency } from "@/lib/depositAddresses";
import {
  getCryptoIcon,
  getCryptoSymbol,
  getCryptoColors,
} from "@/lib/cryptoIcons";
import { Badge } from "@/components/ui/badge";
import DepositReportDialog from "./DepositReportDialog";

interface CryptoDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CryptoDepositDialog = ({
  open,
  onOpenChange,
}: CryptoDepositDialogProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [selectedCrypto, setSelectedCrypto] =
    useState<CryptoCurrency>("USDT_TRC20");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const currentAddress = DEPOSIT_ADDRESSES[selectedCrypto];

  const copyAddress = () => {
    navigator.clipboard.writeText(currentAddress.address);
    setCopied(true);
    toast({
      title: "Address Copied",
      description: "Deposit address copied to clipboard",
    });

    setTimeout(() => setCopied(false), 2000);
  };

  const openExplorer = () => {
    window.open(
      `${currentAddress.explorerUrl}${currentAddress.address}`,
      "_blank"
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Deposit Cryptocurrency
          </DialogTitle>
          <DialogDescription>
            Select a cryptocurrency and send funds to the address below
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={selectedCrypto}
          onValueChange={(v) => setSelectedCrypto(v as CryptoCurrency)}
        >
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
            {Object.keys(DEPOSIT_ADDRESSES).map((currency) => (
              <TabsTrigger
                key={currency}
                value={currency}
                className="text-xs flex items-center gap-1"
              >
                <img
                  src={getCryptoIcon(currency as CryptoCurrency)}
                  alt={currency}
                  className="w-4 h-4 sm:w-5 sm:h-5"
                />
                <span className="hidden sm:inline">
                  {currency.replace("_", " ")}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(DEPOSIT_ADDRESSES).map(([currency, config]) => (
            <TabsContent key={currency} value={currency} className="space-y-6">
              {/* Currency Header */}
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-2 shadow-md">
                    <img
                      src={getCryptoIcon(currency as CryptoCurrency)}
                      alt={config.networkSymbol}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-lg">
                      {config.networkSymbol}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {config.network}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  Min: {config.minDeposit} {config.networkSymbol}
                </Badge>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-xl shadow-lg border-4 border-primary/20">
                  <QRCodeCanvas
                    value={config.address}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Scan this QR code to get the deposit address
                </p>
              </div>

              {/* Deposit Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Deposit Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="address"
                    value={config.address}
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
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={openExplorer}
                    className="shrink-0"
                    title="View on blockchain explorer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Important Warnings */}
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <p className="font-semibold mb-2">Important:</p>
                  <ul className="text-xs space-y-1 list-disc pl-4">
                    <li>Only send {config.networkSymbol} to this address</li>
                    <li>Make sure you're using the {config.network} network</li>
                    <li>Sending other tokens may result in permanent loss</li>
                    <li>
                      Minimum deposit: {config.minDeposit}{" "}
                      {config.networkSymbol}
                    </li>
                    <li>
                      Deposits are verified manually by our team (usually within
                      1-24 hours)
                    </li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Network Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-3">
                  Network Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Network</span>
                    <span className="font-medium">{config.network}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Symbol</span>
                    <span className="font-medium">{config.networkSymbol}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Minimum Deposit
                    </span>
                    <span className="font-medium">
                      {config.minDeposit} {config.networkSymbol}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">How to Deposit:</h4>
                <ol className="text-sm space-y-2 list-decimal pl-5 text-muted-foreground">
                  <li>Copy the deposit address above or scan the QR code</li>
                  <li>Open your external wallet or exchange</li>
                  <li>Select {config.network} as the network</li>
                  <li>Paste the address and send {config.networkSymbol}</li>
                  <li>
                    <strong>Click "Report Deposit" below after sending</strong>
                  </li>
                  <li>
                    Your balance will be credited after verification (1-24
                    hours)
                  </li>
                </ol>
              </div>

              {/* Report Deposit Button */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border-2 border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">
                      Already sent your crypto?
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Report your deposit to get it verified and credited faster
                    </p>
                    <Button
                      onClick={() => setReportDialogOpen(true)}
                      className="w-full"
                      size="sm"
                    >
                      Report Deposit
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>

      {/* Deposit Report Dialog */}
      <DepositReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        preselectedCurrency={selectedCrypto}
        preselectedAddress={currentAddress.address}
      />
    </Dialog>
  );
};

export default CryptoDepositDialog;
