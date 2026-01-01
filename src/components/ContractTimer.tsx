import { useEffect, useState } from 'react';
import { useTradingStore } from '@/store/tradingStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, TrendingUp, TrendingDown, CheckCircle2, XCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const ContractTimer = () => {
  const { positions, completedContracts, systemSettings } = useTradingStore();
  const [activeContracts, setActiveContracts] = useState<any[]>([]);
  const [hiddenContractIds, setHiddenContractIds] = useState<string[]>([]);

  // Handler to dismiss completed contract notification
  const dismissCompletedContract = (contractId: string) => {
    const currentContracts = useTradingStore.getState().completedContracts;
    const updatedContracts = currentContracts.filter(c => c.id !== contractId);
    useTradingStore.setState({ completedContracts: updatedContracts });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // Update local state for UI
      const now = Date.now();
      const contracts = positions.filter(p => p.mode === 'contract' && p.expiresAt && p.expiresAt > now);
      setActiveContracts(contracts);

      // Check for expired contracts and settle them
      useTradingStore.getState().checkContractExpirations();
    }, 100); // Update more frequently for smooth progress

    return () => clearInterval(interval);
  }, [positions]);

  // We handle active contracts and completed contracts separately now
  // Active: Small floating cards
  // Completed: Large Modal

  return (
    <>
      {/* Active Contracts */}
      <div className={`fixed z-[9998] pointer-events-none inset-0 flex items-center justify-center transition-all duration-500 ${activeContracts.length > 0 && !hiddenContractIds.includes(activeContracts[activeContracts.length - 1].id) ? 'backdrop-blur-sm bg-black/20' : ''}`}>
        <AnimatePresence>
          {activeContracts.map((contract) => {
            const timeLeft = Math.max(0, (contract.expiresAt - Date.now()) / 1000);
            const totalDuration = (contract.expiresAt - contract.openedAt) / 1000;
            const progress = (timeLeft / totalDuration) * 100;

            let isWinning = false;
            const { contract_outcome_mode } = systemSettings;

            if (contract_outcome_mode === 'always_win') {
              isWinning = true;
            } else if (contract_outcome_mode === 'always_loss') {
              isWinning = false;
            } else {
              isWinning = contract.side === 'buy'
                ? contract.currentPrice > contract.entryPrice
                : contract.currentPrice < contract.entryPrice;
            }

            const statusColor = isWinning ? "text-green-500" : "text-red-500";
            const progressColor = isWinning ? "bg-green-500" : "bg-red-500";
            const borderColor = isWinning ? "border-green-500" : "border-red-500";

            // Check if this is the "focused" contract (most recent one, unless hidden)
            // We use a local state to track hidden contracts
            const isHidden = hiddenContractIds.includes(contract.id);
            const isFocused = !isHidden && contract.id === activeContracts[activeContracts.length - 1].id;

            if (isFocused) {
              return (
                <motion.div
                  key={`popup-${contract.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="pointer-events-auto bg-card border-2 border-primary/20 p-8 rounded-2xl shadow-2xl w-full max-w-sm relative overflow-hidden backdrop-blur-xl"
                >
                  {/* Background Glow */}
                  <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-10 ${isWinning ? 'bg-green-500' : 'bg-red-500'}`} />

                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold flex items-center gap-2">
                        {contract.assetName}
                        <span className={`text-sm px-2 py-0.5 rounded-full ${contract.side === 'buy' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                          {contract.side === 'buy' ? 'Long' : 'Short'}
                        </span>
                      </h3>
                      <p className="text-muted-foreground text-sm">Target: ${contract.entryPrice}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setHiddenContractIds(prev => [...prev, contract.id])}
                      className="h-8 w-8 hover:bg-secondary"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-col items-center justify-center mb-8">
                    <div className={`text-6xl font-mono font-bold tracking-tighter mb-2 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-foreground'}`}>
                      {timeLeft.toFixed(1)}s
                    </div>
                    <div className={`text-lg font-medium ${statusColor}`}>
                      {isWinning ? 'Winning' : 'Losing'} (${contract.currentPrice})
                    </div>
                  </div>

                  <div className="relative h-2 w-full bg-secondary rounded-full overflow-hidden mb-4">
                    <motion.div
                      className={`absolute top-0 left-0 h-full ${progressColor}`}
                      initial={{ width: "100%" }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.1, ease: "linear" }}
                    />
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setHiddenContractIds(prev => [...prev, contract.id])}
                  >
                    Hide Popup
                  </Button>
                </motion.div>
              );
            }

            // Minimized View (Bottom Right)
            return (
              <motion.div
                key={`minimized-${contract.id}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                layout
                className="fixed bottom-4 right-4 z-[9998] w-80 pointer-events-auto"
                style={{ marginBottom: `${activeContracts.indexOf(contract) * 110}px` }} // Stack them
              >
                <Card className={`p-3 border-l-4 ${isWinning ? 'border-l-green-500' : 'border-l-red-500'} shadow-lg bg-card/95 backdrop-blur-sm`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {contract.side === 'buy' ? (
                        <div className="bg-green-500/10 p-1 rounded">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        </div>
                      ) : (
                        <div className="bg-red-500/10 p-1 rounded">
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-sm">{contract.assetName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          {contract.side === 'buy' ? 'Long' : 'Short'} • ${contract.initialInvestment?.toFixed(2) || contract.amount}
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-mono font-medium ${statusColor}`}>
                      <Clock className="w-3 h-3" />
                      {timeLeft.toFixed(1)}s
                    </div>
                  </div>

                  <div className="relative h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className={`absolute top-0 left-0 h-full ${progressColor}`}
                      initial={{ width: "100%" }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.1, ease: "linear" }}
                    />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Completed Contracts - Large Modal Overlay */}
      <AnimatePresence>
        {completedContracts?.map((contract) => {
          const isWinning = contract.finalResult === 'win';
          const statusColor = isWinning ? "text-green-500" : "text-red-500";
          const bgColor = isWinning ? "bg-green-500/10" : "bg-red-500/10";
          const borderColor = isWinning ? "border-green-500" : "border-red-500";

          return (
            <motion.div
              key={contract.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            >
              <Card className={`w-full max-w-md p-6 border-2 ${borderColor} ${bgColor} shadow-2xl relative overflow-hidden`}>
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => dismissCompletedContract(contract.id)}
                  className="absolute top-4 right-4 h-8 w-8 hover:bg-secondary z-20"
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Background Glow */}
                <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 ${isWinning ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className={`absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-20 ${isWinning ? 'bg-green-500' : 'bg-red-500'}`} />

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className={`mb-4 p-4 rounded-full ${isWinning ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {isWinning ? (
                      <CheckCircle2 className={`w-16 h-16 ${statusColor}`} />
                    ) : (
                      <XCircle className={`w-16 h-16 ${statusColor}`} />
                    )}
                  </div>

                  <h2 className={`text-4xl font-bold mb-2 ${statusColor}`}>
                    {isWinning ? "YOU WON!" : "YOU LOST"}
                  </h2>

                  <div className="text-xl font-medium text-muted-foreground mb-6">
                    {contract.assetName} {contract.side === 'buy' ? 'Long' : 'Short'}
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full mb-6">
                    <div className="bg-background/50 p-3 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">Investment</div>
                      <div className="font-mono font-semibold text-lg">
                        ${contract.initialInvestment?.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">Payout</div>
                      <div className={`font-mono font-bold text-lg ${statusColor}`}>
                        {isWinning ? `+$${contract.finalProfit?.toFixed(2)}` : `-$${contract.initialInvestment?.toFixed(2)}`}
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-background/50 p-3 rounded-lg border border-border mb-6 flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Entry Price</span>
                    <span className="font-mono">{contract.entryPrice}</span>
                  </div>
                  <div className="w-full bg-background/50 p-3 rounded-lg border border-border mb-6 flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Close Price</span>
                    <span className="font-mono">{contract.currentPrice}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </>
  );
};

export default ContractTimer;
