import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft,
    ExternalLink,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    ArrowUpCircle,
    ArrowDownCircle,
    Send,
    Download,
    Copy,
    Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatUSDT, NETWORKS, getNetworkConfig, normalizeNetworkName, type USDTTransaction, type Network } from '@/lib/usdtWalletUtils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const TransactionDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [transaction, setTransaction] = useState<USDTTransaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchTransaction = async () => {
            if (!id) return;

            try {
                const { data, error } = await supabase
                    .from('wallet_transactions')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setTransaction(data);
            } catch (error) {
                console.error('Error fetching transaction:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load transaction details',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchTransaction();
    }, [id, toast]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
            title: 'Copied',
            description: 'Copied to clipboard',
        });
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; icon: any; label: string; color: string }> = {
            pending: { variant: 'secondary', icon: Clock, label: 'Pending', color: 'text-yellow-600' },
            processing: { variant: 'default', icon: Loader2, label: 'Processing', color: 'text-blue-600' },
            completed: { variant: 'default', icon: CheckCircle, label: 'Completed', color: 'text-green-600' },
            failed: { variant: 'destructive', icon: XCircle, label: 'Failed', color: 'text-red-600' },
        };

        const config = variants[status] || variants.pending;
        const Icon = config.icon;

        return (
            <div className={`flex flex-col items-center gap-2 ${config.color}`}>
                <Icon className={`h-12 w-12 ${status === 'processing' ? 'animate-spin' : ''}`} />
                <span className="font-bold text-lg">{config.label}</span>
            </div>
        );
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'deposit': return <ArrowDownCircle className="h-6 w-6 text-green-600" />;
            case 'withdrawal': return <ArrowUpCircle className="h-6 w-6 text-orange-600" />;
            case 'send': return <Send className="h-6 w-6 text-blue-600" />;
            case 'receive': return <Download className="h-6 w-6 text-green-600" />;
            default: return null;
        }
    };

    const getExplorerUrl = (networkName: string, hash?: string) => {
        if (!hash) return null;
        const normalized = normalizeNetworkName(networkName);
        const explorers: Partial<Record<Network, string>> = {
            ETH: `https://etherscan.io/tx/${hash}`,
            BNB: `https://bscscan.com/tx/${hash}`,
            BTC: `https://blockchain.info/tx/${hash}`,
            USDT_TRC20: `https://tronscan.org/#/transaction/${hash}`,
            SOL: `https://solscan.io/tx/${hash}`,
            XRP: `https://xrpscan.com/tx/${hash}`,
            LTC: `https://blockchair.com/litecoin/transaction/${hash}`,
        };
        return explorers[normalized];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="container mx-auto p-4 max-w-2xl text-center py-12">
                <h2 className="text-2xl font-bold mb-4">Transaction Not Found</h2>
                <Button onClick={() => navigate('/wallet')}>Back to Wallet</Button>
            </div>
        );
    }

    const normalizedNetwork = transaction.network ? transaction.network : 'USDT_TRC20';
    const network = getNetworkConfig(normalizedNetwork);
    const explorerUrl = getExplorerUrl(normalizedNetwork as Network, transaction.transaction_hash);

    return (
        <div className="container mx-auto p-4 max-w-2xl space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>

            <Card>
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-4">
                        {getStatusBadge(transaction.status)}
                    </div>
                    <CardTitle className="text-3xl font-mono">
                        ${formatUSDT(transaction.amount)}
                    </CardTitle>
                    <div className="flex items-center justify-center gap-2 text-muted-foreground mt-2">
                        {getTypeIcon(transaction.type)}
                        <span className="capitalize">{transaction.type}</span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Separator />

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Date</span>
                            <span className="font-medium">
                                {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm:ss')}
                            </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Network</span>
                            <Badge variant="outline">{network?.name || transaction.network}</Badge>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Fee</span>
                            <span className="font-medium">${formatUSDT(transaction.fee)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Total</span>
                            <span className="font-medium font-mono">
                                ${formatUSDT(transaction.amount + transaction.fee)}
                            </span>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <span className="text-muted-foreground text-sm">Transaction Hash</span>
                            <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                                <code className="text-xs font-mono flex-1 break-all">
                                    {transaction.transaction_hash || 'Pending...'}
                                </code>
                                {transaction.transaction_hash && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(transaction.transaction_hash!)}>
                                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {(transaction.from_address || transaction.to_address) && (
                            <div className="space-y-2">
                                <span className="text-muted-foreground text-sm">
                                    {transaction.type === 'deposit' ? 'From Address' : 'To Address'}
                                </span>
                                <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                                    <code className="text-xs font-mono flex-1 break-all">
                                        {transaction.type === 'deposit' ? transaction.from_address : transaction.to_address}
                                    </code>
                                </div>
                            </div>
                        )}
                    </div>

                    {explorerUrl && (
                        <Button className="w-full" variant="outline" asChild>
                            <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View on Explorer
                            </a>
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TransactionDetail;
