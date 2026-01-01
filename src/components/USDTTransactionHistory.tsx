import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import {
    Clock,
    Loader2,
    CheckCircle,
    XCircle,
    ArrowDownCircle,
    ArrowUpCircle,
    Send,
    Download,
    RefreshCw,
    ExternalLink
} from 'lucide-react';
import { getTransactionHistory, type USDTTransaction, NETWORKS, getNetworkConfig, type Network, formatUSDT } from '@/lib/usdtWalletUtils';

interface USDTTransactionHistoryProps {
    userId: string;
    onRefresh?: () => void;
}

const USDTTransactionHistory = ({ userId, onRefresh }: USDTTransactionHistoryProps) => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<USDTTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadTransactions = async () => {
        try {
            setRefreshing(true);
            const history = await getTransactionHistory(userId, 50);
            setTransactions(history);
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadTransactions();
    }, [userId]);

    const handleRefresh = () => {
        loadTransactions();
        onRefresh?.();
    };

    const getStatusBadge = (status: USDTTransaction['status']) => {
        const variants: Record<string, { variant: any; icon: any; label: string }> = {
            pending: {
                variant: 'secondary',
                icon: Clock,
                label: 'Pending',
            },
            processing: {
                variant: 'default',
                icon: Loader2,
                label: 'Processing',
            },
            completed: {
                variant: 'default',
                icon: CheckCircle,
                label: 'Completed',
            },
            failed: {
                variant: 'destructive',
                icon: XCircle,
                label: 'Failed',
            },
        };

        const config = variants[status] || variants.pending;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
                <Icon className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
                {config.label}
            </Badge>
        );
    };

    const getTypeIcon = (type: USDTTransaction['type']) => {
        switch (type) {
            case 'deposit':
                return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
            case 'withdrawal':
                return <ArrowUpCircle className="h-4 w-4 text-orange-600" />;
            case 'send':
                return <Send className="h-4 w-4 text-blue-600" />;
            case 'receive':
                return <Download className="h-4 w-4 text-green-600" />;
            default:
                return null;
        }
    };

    const getTypeLabel = (type: USDTTransaction['type']) => {
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    const formatAddress = (address: string) => {
        if (!address) return '-';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const getExplorerUrl = (network: Network, hash?: string) => {
        if (!hash) return null;

        const explorers: Record<Network, string> = {
            ethereum: `https://etherscan.io/tx/${hash}`,
            bsc: `https://bscscan.com/tx/${hash}`,
            polygon: `https://polygonscan.com/tx/${hash}`,
            tron: `https://tronscan.org/#/transaction/${hash}`,
        };

        return explorers[network];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading transactions...</p>
                </div>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Download className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
                <p className="text-sm text-muted-foreground">
                    Your transaction history will appear here once you start using your wallet
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Network</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((tx) => {
                            const network = getNetworkConfig(tx.network) || NETWORKS.USDT_TRC20;
                            const explorerUrl = getExplorerUrl(tx.network as Network, tx.transaction_hash);

                            return (
                                <TableRow key={tx.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getTypeIcon(tx.type)}
                                            <span className="font-medium">{getTypeLabel(tx.type)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-mono font-semibold">${formatUSDT(tx.amount)}</div>
                                            {tx.fee > 0 && (
                                                <div className="text-xs text-muted-foreground">
                                                    Fee: ${formatUSDT(tx.fee)}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono text-xs">
                                            {network.symbol}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-mono text-xs">
                                            {tx.type === 'send' || tx.type === 'withdrawal'
                                                ? formatAddress(tx.to_address || '-')
                                                : formatAddress(tx.from_address || '-')}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {(() => {
                                                try {
                                                    return format(new Date(tx.created_at || new Date()), 'MMM dd, yyyy');
                                                } catch (e) {
                                                    return 'Invalid Date';
                                                }
                                            })()}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {(() => {
                                                try {
                                                    return format(new Date(tx.created_at || new Date()), 'HH:mm');
                                                } catch (e) {
                                                    return '--:--';
                                                }
                                            })()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate(`/transaction/${tx.id}`)}
                                            >
                                                Details
                                            </Button>
                                            {explorerUrl && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <a
                                                        href={explorerUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        <span className="text-xs">View</span>
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default USDTTransactionHistory;
