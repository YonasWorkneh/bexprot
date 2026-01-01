import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWalletStore, type WalletTransaction } from "@/store/walletStore";
import { formatBalance, formatTxHash, getExplorerUrl, getSolanaExplorerUrl, getNativeCurrency } from "@/lib/walletUtils";
import { ArrowDownToLine, ArrowUpFromLine, ExternalLink, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const TransactionHistory = () => {
    const { transactions, walletType, chainId } = useWalletStore();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'pending':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'failed':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const openExplorer = (tx: WalletTransaction) => {
        let url: string;
        if (walletType === 'solana') {
            url = getSolanaExplorerUrl(tx.hash);
        } else {
            url = getExplorerUrl(chainId || 1, tx.hash);
        }
        window.open(url, '_blank');
    };

    if (transactions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No transactions yet</p>
                        <p className="text-sm mt-2">Your transaction history will appear here</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                        {transactions.map((tx) => (
                            <div
                                key={tx.id}
                                className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                            >
                                {/* Icon */}
                                <div className={`p-2 rounded-lg ${tx.type === 'receive' ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
                                    {tx.type === 'receive' ? (
                                        <ArrowDownToLine className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <ArrowUpFromLine className="h-4 w-4 text-blue-500" />
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold capitalize">{tx.type}</span>
                                        <Badge variant="outline" className={getStatusColor(tx.status)}>
                                            {tx.status === 'pending' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                            {tx.status}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground font-mono truncate">
                                        {formatTxHash(tx.hash)}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {new Date(tx.timestamp).toLocaleString()}
                                    </div>
                                </div>

                                {/* Amount */}
                                <div className="text-right">
                                    <div className={`font-semibold font-mono ${tx.type === 'receive' ? 'text-green-500' : 'text-blue-500'}`}>
                                        {tx.type === 'receive' ? '+' : '-'}{formatBalance(tx.amount)} {tx.asset}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-1 h-6 text-xs"
                                        onClick={() => openExplorer(tx)}
                                    >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Explorer
                                    </Button>
                                    {/* Only show details for internal transactions (UUIDs) */}
                                    {!tx.id.startsWith('tx_') && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-1 ml-2 h-6 text-xs"
                                            onClick={() => window.location.href = `/transaction/${tx.id}`}
                                        >
                                            Details
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

export default TransactionHistory;
