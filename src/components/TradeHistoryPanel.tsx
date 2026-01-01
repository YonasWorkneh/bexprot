import { useTradingStore, type Order, type Position } from '@/store/tradingStore';
import { TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatBalance } from '@/lib/walletUtils';

interface TradeHistoryPanelProps {
    assetId: string;
    assetName: string;
}

const TradeHistoryPanel = ({ assetId, assetName }: TradeHistoryPanelProps) => {
    const { orderHistory, completedContracts } = useTradingStore();

    // 1. Filter Spot/Futures History (from orderHistory)
    const assetOrders = orderHistory.filter(
        (order) => order.assetId && order.assetId.toLowerCase() === assetId.toLowerCase()
    );

    // 2. Filter Contract History (from completedContracts)
    const assetContracts = completedContracts.filter(
        (contract) => contract.assetId && contract.assetId.toLowerCase() === assetId.toLowerCase()
    );

    // 3. Combine and Normalize Data for Display
    const combinedHistory = [
        ...assetOrders.map(order => ({
            id: order.id,
            type: order.mode || 'spot',
            side: order.side,
            amount: order.amount,
            price: order.price,
            total: order.total,
            timestamp: order.timestamp,
            status: 'filled',
            pnl: 0, // Spot trades usually don't have PnL stored directly in history yet
            isWin: null,
            closePrice: undefined
        })),
        ...assetContracts.map(contract => ({
            id: contract.id,
            type: 'contract',
            side: contract.side,
            amount: contract.amount,
            price: contract.entryPrice,
            closePrice: contract.currentPrice,
            total: contract.initialInvestment,
            timestamp: contract.expiresAt || Date.now(),
            status: 'closed',
            pnl: contract.finalProfit || 0,
            isWin: contract.finalResult === 'win'
        }))
    ].sort((a, b) => b.timestamp - a.timestamp);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (combinedHistory.length === 0) {
        return (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                <p>No trade history for {assetName}</p>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-foreground">Trade History - {assetName}</h3>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Time</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Side</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Total / Invest</TableHead>
                            <TableHead className="text-right">Result / P&L</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {combinedHistory.map((trade) => (
                            <TableRow key={trade.id} className="hover:bg-secondary/20">
                                <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                                    {formatDate(trade.timestamp)}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                        {trade.type}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className={`flex items-center gap-1 font-medium ${trade.side === 'buy' ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                        {trade.side === 'buy' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        <span className="capitalize">{trade.side}</span>
                                    </span>
                                </TableCell>
                                <TableCell className="font-mono">
                                    ${formatBalance(trade.price)}
                                    {trade.closePrice && (
                                        <div className="text-xs text-muted-foreground">
                                            → ${formatBalance(trade.closePrice)}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="font-mono">
                                    {trade.amount}
                                </TableCell>
                                <TableCell className="font-mono">
                                    ${formatBalance(trade.total || 0)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {trade.type === 'contract' ? (
                                        <div className={`flex items-center justify-end gap-1.5 ${trade.isWin ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                            {trade.isWin ? (
                                                <>
                                                    <CheckCircle2 size={14} />
                                                    <span>+${formatBalance(trade.pnl)}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle size={14} />
                                                    <span>Loss</span>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default TradeHistoryPanel;
