import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDownUp, Loader2, Search, ChevronDown } from "lucide-react";
import { useTradingStore } from "@/store/tradingStore";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchTopCryptos } from "@/lib/coingecko";
import { ScrollArea } from "@/components/ui/scroll-area";

const SwapModal = () => {
  const [open, setOpen] = useState(false);
  const [assetSelectorOpen, setAssetSelectorOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [swapDirection, setSwapDirection] = useState<"USDT_TO_TOKEN" | "TOKEN_TO_USDT">("USDT_TO_TOKEN");
  
  const { balance, positions } = useTradingStore();
  const { toast } = useToast();

  const { data: cryptos } = useQuery({
    queryKey: ["topCryptosForSwap"],
    queryFn: () => fetchTopCryptos(100),
    staleTime: 60000,
    enabled: open,
  });

  // Set default asset to Bitcoin when list loads
  useEffect(() => {
    if (cryptos && cryptos.length > 0 && !selectedAsset) {
      const btc = cryptos.find(c => c.symbol === "btc");
      if (btc) setSelectedAsset(btc);
    }
  }, [cryptos, selectedAsset]);

  const handleSwap = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to swap.",
        variant: "destructive",
      });
      return;
    }

    const numAmount = Number(amount);

    if (swapDirection === "USDT_TO_TOKEN") {
        if (numAmount > balance) {
            toast({
                title: "Insufficient Balance",
                description: "You do not have enough USDT to swap.",
                variant: "destructive",
            });
            return;
        }
    } else {
        // Token to USDT
        const position = positions.find(p => p.assetId === selectedAsset?.id);
        const tokenBalance = position ? position.amount : 0;

        if (numAmount > tokenBalance) {
             toast({
                title: "Insufficient Balance",
                description: `You do not have enough ${selectedAsset?.symbol.toUpperCase()} to swap. Balance: ${tokenBalance}`,
                variant: "destructive",
            });
            return;
        }
    }

    setIsLoading(true);
    // Simulate swap delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    setOpen(false);
    setAmount("");
    
    const fromSymbol = swapDirection === "USDT_TO_TOKEN" ? "USDT" : selectedAsset?.symbol.toUpperCase();
    const toSymbol = swapDirection === "USDT_TO_TOKEN" ? selectedAsset?.symbol.toUpperCase() : "USDT";

    toast({
      title: "Swap Successful",
      description: `Successfully swapped ${amount} ${fromSymbol} to ${toSymbol}.`,
    });
  };

  const toggleDirection = () => {
      setSwapDirection(prev => prev === "USDT_TO_TOKEN" ? "TOKEN_TO_USDT" : "USDT_TO_TOKEN");
      setAmount(""); // Reset amount on toggle to avoid confusion
  };

  const filteredCryptos = cryptos?.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Calculate estimated output
  const estimatedOutput = amount && selectedAsset ? (
      swapDirection === "USDT_TO_TOKEN" 
        ? (Number(amount) / selectedAsset.current_price).toFixed(6)
        : (Number(amount) * selectedAsset.current_price).toFixed(2)
  ) : "";

  // Get current balance for the "From" field
  const currentBalance = swapDirection === "USDT_TO_TOKEN" 
    ? balance 
    : (positions.find(p => p.assetId === selectedAsset?.id)?.amount || 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white">
          <ArrowDownUp className="mr-2 h-4 w-4" />
          Swap
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Swap Assets</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* From Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">From</label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-32 h-14 text-lg"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {swapDirection === "USDT_TO_TOKEN" ? (
                      <div className="flex items-center gap-2 bg-secondary px-2 py-1 rounded-lg h-10">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">T</div>
                        <span className="font-bold text-sm">USDT</span>
                      </div>
                  ) : (
                      <Dialog open={assetSelectorOpen} onOpenChange={setAssetSelectorOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-10 gap-2 bg-secondary hover:bg-secondary/80 rounded-lg px-3">
                                {selectedAsset ? (
                                    <>
                                        <img src={selectedAsset.image} alt={selectedAsset.symbol} className="w-5 h-5 rounded-full" />
                                        <span className="font-bold text-sm">{selectedAsset.symbol.toUpperCase()}</span>
                                    </>
                                ) : (
                                    <span className="text-sm">Select</span>
                                )}
                                <ChevronDown size={14} className="opacity-50" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-sm p-0">
                            <div className="p-4 border-b border-border">
                                <h3 className="font-semibold mb-2">Select Token</h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <Input 
                                        placeholder="Search name or symbol" 
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <ScrollArea className="h-[300px]">
                                <div className="p-2">
                                    {filteredCryptos.map((crypto) => (
                                        <button
                                            key={crypto.id}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-secondary rounded-lg transition-colors text-left"
                                            onClick={() => {
                                                setSelectedAsset(crypto);
                                                setAssetSelectorOpen(false);
                                            }}
                                        >
                                            <img src={crypto.image} alt={crypto.name} className="w-8 h-8 rounded-full" />
                                            <div className="flex-1">
                                                <div className="font-bold">{crypto.symbol.toUpperCase()}</div>
                                                <div className="text-xs text-muted-foreground">{crypto.name}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-mono">${crypto.current_price.toLocaleString()}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>
                  )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              Balance: {currentBalance.toFixed(6)} {swapDirection === "USDT_TO_TOKEN" ? "USDT" : selectedAsset?.symbol.toUpperCase()}
            </div>
          </div>

          <div className="flex justify-center -my-2 relative z-10">
            <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full h-10 w-10 bg-background shadow-sm hover:bg-secondary"
                onClick={toggleDirection}
            >
              <ArrowDownUp size={16} className="text-muted-foreground" />
            </Button>
          </div>

          {/* To Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">To</label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={estimatedOutput}
                readOnly
                className="pr-32 h-14 text-lg bg-secondary/20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {swapDirection === "TOKEN_TO_USDT" ? (
                     <div className="flex items-center gap-2 bg-secondary px-2 py-1 rounded-lg h-10">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">T</div>
                        <span className="font-bold text-sm">USDT</span>
                      </div>
                ) : (
                    <Dialog open={assetSelectorOpen} onOpenChange={setAssetSelectorOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-10 gap-2 bg-secondary hover:bg-secondary/80 rounded-lg px-3">
                                {selectedAsset ? (
                                    <>
                                        <img src={selectedAsset.image} alt={selectedAsset.symbol} className="w-5 h-5 rounded-full" />
                                        <span className="font-bold text-sm">{selectedAsset.symbol.toUpperCase()}</span>
                                    </>
                                ) : (
                                    <span className="text-sm">Select</span>
                                )}
                                <ChevronDown size={14} className="opacity-50" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-sm p-0">
                             <div className="p-4 border-b border-border">
                                <h3 className="font-semibold mb-2">Select Token</h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <Input 
                                        placeholder="Search name or symbol" 
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <ScrollArea className="h-[300px]">
                                <div className="p-2">
                                    {filteredCryptos.map((crypto) => (
                                        <button
                                            key={crypto.id}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-secondary rounded-lg transition-colors text-left"
                                            onClick={() => {
                                                setSelectedAsset(crypto);
                                                setAssetSelectorOpen(false);
                                            }}
                                        >
                                            <img src={crypto.image} alt={crypto.name} className="w-8 h-8 rounded-full" />
                                            <div className="flex-1">
                                                <div className="font-bold">{crypto.symbol.toUpperCase()}</div>
                                                <div className="text-xs text-muted-foreground">{crypto.name}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-mono">${crypto.current_price.toLocaleString()}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              {selectedAsset ? `1 ${selectedAsset.symbol.toUpperCase()} ≈ $${selectedAsset.current_price.toLocaleString()}` : '-'}
            </div>
          </div>

          <Button 
            className="w-full mt-4 h-12 text-lg font-semibold" 
            onClick={handleSwap}
            disabled={isLoading || !amount || !selectedAsset}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Swapping...
              </>
            ) : (
              "Swap Now"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SwapModal;
