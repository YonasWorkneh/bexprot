import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Copy,
  Upload,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { DEPOSIT_ADDRESSES, type CryptoCurrency } from "@/lib/depositAddresses";
import { reportDeposit, getExplorerUrl } from "@/lib/cryptoDepositService";
import { supabase } from "@/lib/supabase";

interface DepositReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  preselectedCurrency?: CryptoCurrency;
  preselectedAddress?: string;
}

const DepositReportDialog = ({
  open,
  onOpenChange,
  onSuccess,
  preselectedCurrency,
  preselectedAddress,
}: DepositReportDialogProps) => {
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [currency, setCurrency] = useState<CryptoCurrency>(
    preselectedCurrency || "BTC"
  );
  const [transactionHash, setTransactionHash] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [depositCode, setDepositCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync currency when preselectedCurrency changes
  useEffect(() => {
    if (preselectedCurrency) {
      setCurrency(preselectedCurrency);
    }
  }, [preselectedCurrency]);

  const selectedConfig = DEPOSIT_ADDRESSES[currency];
  const amountNum = parseFloat(amount);
  const isValidAmount =
    !isNaN(amountNum) && amountNum >= selectedConfig.minDeposit;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Screenshot must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setScreenshot(file);
    }
  };

  const uploadScreenshot = async (
    userId: string
  ): Promise<string | undefined> => {
    if (!screenshot) return undefined;

    const fileExt = screenshot.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Try to upload to 'deposit-proofs' bucket, fallback to 'profiles' if it fails (as a hack)
    // Ideally we should ensure 'deposit-proofs' exists.
    try {
      const { data, error } = await supabase.storage
        .from("deposit-proofs")
        .upload(fileName, screenshot);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("deposit-proofs").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.warn(
        "Failed to upload to deposit-proofs, trying profiles bucket...",
        error
      );
      // Fallback to profiles bucket
      const { data, error: profileError } = await supabase.storage
        .from("profiles")
        .upload(`deposits/${fileName}`, screenshot);

      if (profileError) throw profileError;

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("profiles")
        .getPublicUrl(`deposits/${fileName}`);

      return publicUrl;
    }
  };

  const handleSubmit = async () => {
    console.log("=== DEPOSIT SUBMIT STARTED ===");
    console.log("User ID:", user?.id);
    console.log("Currency:", currency);
    console.log("Transaction Hash:", transactionHash);
    console.log("Amount:", amount);
    console.log("Has Screenshot:", !!screenshot);

    if (!user?.id) {
      console.error("No user ID - not authenticated");
      toast({
        title: "Authentication Required",
        description: "Please log in to report a deposit",
        variant: "destructive",
      });
      return;
    }

    if (!screenshot) {
      console.error("No screenshot provided");
      toast({
        title: "Proof of Payment Required",
        description: "Please upload a screenshot as proof of payment",
        variant: "destructive",
      });
      return;
    }

    if (!isValidAmount) {
      console.error("Invalid amount:", amount);
      toast({
        title: "Invalid Amount",
        description: `Minimum deposit is ${selectedConfig.minDeposit} ${selectedConfig.networkSymbol}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    console.log("Loading state set to true");

    try {
      // Upload screenshot if exists
      let screenshotUrl: string | undefined;
      if (screenshot) {
        console.log("Starting screenshot upload...");
        try {
          screenshotUrl = await uploadScreenshot(user.id);
          console.log("Screenshot uploaded:", screenshotUrl);
        } catch (uploadError) {
          console.error("Screenshot upload failed:", uploadError);
          toast({
            title: "Upload Failed",
            description:
              "Failed to upload screenshot, but proceeding with report.",
            variant: "destructive",
          });
          screenshotUrl = undefined; // Proceed without screenshot
        }
      } else {
        console.log("No screenshot to upload");
      }

      // Simple USD conversion (in production, use real-time price API)
      const amountUsd = amountNum; // Assuming 1:1 for USDT, adjust for other currencies

      console.log("Calling reportDeposit with:", {
        userId: user.id,
        currency,
        transactionHash: transactionHash.trim(),
        amount: amountNum,
        amountUsd,
        address: preselectedAddress || selectedConfig.address,
        screenshotUrl,
      });

      // Generate unique placeholder transaction hash if not provided
      const finalTransactionHash =
        transactionHash.trim() ||
        `pending_${user.id}_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}`;

      const result = await reportDeposit(
        user.id,
        currency,
        finalTransactionHash,
        amountNum,
        amountUsd,
        preselectedAddress || selectedConfig.address,
        screenshotUrl
      );

      console.log("reportDeposit result:", result);

      if (result.success && result.depositCode) {
        console.log("Deposit reported successfully:", result.depositCode);
        setDepositCode(result.depositCode);
        toast({
          title: "Deposit Reported Successfully",
          description: `Your deposit code is ${result.depositCode}`,
        });
        onSuccess?.();
      } else {
        console.error("Deposit report failed:", result.error);
        throw new Error(result.error || "Failed to report deposit");
      }
    } catch (error: unknown) {
      console.error("=== DEPOSIT SUBMIT ERROR ===");
      const errorMessage =
        error instanceof Error ? error.message : "Failed to report deposit";
      console.error("Error:", error);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
      console.log("=== DEPOSIT SUBMIT FINISHED ===");
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      // Reset form after a delay
      setTimeout(() => {
        setTransactionHash("");
        setAmount("");
        setDepositCode(null);
        setCopied(false);
        setScreenshot(null);
      }, 200);
    }
  };

  const copyDepositCode = () => {
    if (depositCode) {
      navigator.clipboard.writeText(depositCode);
      setCopied(true);
      toast({
        title: "Copied",
        description: "Deposit code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openExplorer = () => {
    if (transactionHash.trim()) {
      const url = getExplorerUrl(currency, transactionHash.trim());
      window.open(url, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Your Deposit</DialogTitle>
          <DialogDescription>
            {depositCode
              ? "Your deposit has been reported successfully"
              : "Enter your transaction details to report your deposit"}
          </DialogDescription>
        </DialogHeader>

        {depositCode ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Deposit Reported!</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Your deposit has been submitted for verification. We'll credit
                your account within 1-24 hours.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <Label className="text-xs text-muted-foreground">
                Your Deposit Code
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 text-lg font-mono font-bold">
                  {depositCode}
                </code>
                <Button variant="outline" size="icon" onClick={copyDepositCode}>
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Save this code for your records. You can use it to track your
                deposit status.
              </p>
            </div>

            {screenshot && (
              <div className="bg-muted/50 rounded-lg p-4">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Uploaded Screenshot
                </Label>
                <div className="relative h-32 w-full rounded-md overflow-hidden border">
                  <img
                    src={URL.createObjectURL(screenshot)}
                    alt="Deposit Screenshot"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>What happens next?</strong>
                <ul className="mt-2 space-y-1 list-disc pl-4">
                  <li>
                    Our team will verify your transaction on the blockchain
                  </li>
                  <li>Once verified, funds will be credited to your account</li>
                  <li>You'll be notified when your deposit is credited</li>
                  <li>Typical verification time: 1-24 hours</li>
                </ul>
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Cryptocurrency</Label>
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as CryptoCurrency)}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DEPOSIT_ADDRESSES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.networkSymbol} - {config.network}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="txHash">Transaction Hash (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="txHash"
                  placeholder="Enter transaction hash (optional)"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  className="font-mono text-sm"
                />
                {transactionHash.trim() && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={openExplorer}
                    title="View on blockchain explorer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Optional: Copy the transaction hash from your wallet for faster
                verification
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount Sent ({selectedConfig.networkSymbol})
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.00000001"
                min={selectedConfig.minDeposit}
                placeholder={`Min: ${selectedConfig.minDeposit}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono"
              />
              {amount && !isValidAmount && (
                <p className="text-xs text-destructive">
                  Minimum deposit is {selectedConfig.minDeposit}{" "}
                  {selectedConfig.networkSymbol}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Proof of Payment (Screenshot){" "}
                <span className="text-muted-foreground">*</span>
              </Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {screenshot ? "Change Screenshot" : "Upload Screenshot"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  required
                />
              </div>
              {screenshot && (
                <div className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <span className="truncate max-w-[200px]">
                    {screenshot.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setScreenshot(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {!screenshot && (
                <p className="text-xs text-muted-foreground">
                  Screenshot is required to verify your deposit
                </p>
              )}
              {screenshot && (
                <p className="text-xs text-muted-foreground">
                  Screenshot uploaded successfully
                </p>
              )}
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800 text-xs">
                <strong>Before submitting:</strong>
                <ul className="mt-2 space-y-1 list-disc pl-4">
                  <li>Verify you sent to the correct address</li>
                  <li>Ensure you selected the correct network</li>
                  <li>Double-check your transaction hash</li>
                  <li>Confirm the amount matches what you sent</li>
                </ul>
              </AlertDescription>
            </Alert>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !screenshot || !isValidAmount}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Report Deposit
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DepositReportDialog;
