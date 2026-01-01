import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ExternalLink, Loader2, RefreshCw, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUserDeposits } from '@/lib/cryptoDepositService';
import type { CryptoDeposit } from '@/lib/depositAddresses';

interface UserDepositHistoryProps {
    userId: string;
}

const UserDepositHistory = ({ userId }: UserDepositHistoryProps) => {
    const { toast } = useToast();
    const [deposits, setDeposits] = useState<CryptoDeposit[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const loadDeposits = async () => {
        setLoading(true);
        const result = await getUserDeposits(userId);
        if (result.success && result.data) {
            setDeposits(result.data);
        } else {
            toast({
                title: 'Error',
                description: result.error || 'Failed to load deposit history',
                variant: 'destructive',
            });
        }
        setLoading(false);
    };

    useEffect(() => {
        loadDeposits();
    }, [userId]);

    const filteredDeposits = statusFilter === 'all'
        ? deposits
        : deposits.filter(d => d.status === statusFilter);

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            reported: { variant: 'secondary', label: 'Reported' },
            pending: { variant: 'secondary', label: 'Pending' },
            confirmed: { variant: 'default', label: 'Confirmed' },
            credited: { variant: 'outline', label: 'Credited' },
            rejected: { variant: 'destructive', label: 'Rejected' },
        };
        const config = variants[status] || { variant: 'default', label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const copyDepositCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast({
            title: 'Copied',
            description: 'Deposit code copied to clipboard',
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Deposit History</CardTitle>
                        <CardDescription>Track your cryptocurrency deposits</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="reported">Reported</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="credited">Credited</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={loadDeposits}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredDeposits.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No deposits found</p>
                        {statusFilter !== 'all' && (
                            <Button variant="link" onClick={() => setStatusFilter('all')} className="mt-2">
                                View all deposits
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Deposit Code</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Currency</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>USD Value</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDeposits.map((deposit) => (
                                    <TableRow key={deposit.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                                    {deposit.depositCode || 'N/A'}
                                                </code>
                                                {deposit.depositCode && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => copyDepositCode(deposit.depositCode!)}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {new Date(deposit.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{deposit.currency}</Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {deposit.amount.toFixed(8)}
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            ${deposit.amountUsd.toFixed(2)}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                                        <TableCell>
                                            {deposit.transactionHash && deposit.blockchainExplorerUrl && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => window.open(deposit.blockchainExplorerUrl!, '_blank')}
                                                >
                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                    View TX
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default UserDepositHistory;
