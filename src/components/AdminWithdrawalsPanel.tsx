import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, ArrowUpFromLine, Copy } from "lucide-react";
import { approveWithdrawal, rejectWithdrawal } from '@/lib/adminTransactionService';

interface Withdrawal {
    id: string;
    user_id: string;
    transaction_id?: string;
    amount: number;
    address: string;
    network: string;
    fee: number;
    type: 'withdrawal' | 'send';
    status: 'pending' | 'completed' | 'rejected';
    created_at: string;
    user?: {
        email: string;
        name: string;
    };
}

const AdminWithdrawalsPanel = () => {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Initial fetch
        fetchWithdrawals();

        // Auto-refresh every 10 seconds as fallback
        const refreshInterval = setInterval(() => {
            console.log('Auto-refreshing withdrawals...');
            fetchWithdrawals();
        }, 10000);

        // Realtime subscription
        const channel = supabase
            .channel('admin_withdrawals_realtime')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'withdrawals' },
                (payload) => {
                    console.log('New withdrawal received:', payload);
                    fetchWithdrawals();
                }
            )
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'withdrawals' },
                (payload) => {
                    console.log('Withdrawal updated:', payload);
                    fetchWithdrawals();
                }
            )
            .on('postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'withdrawals' },
                (payload) => {
                    console.log('Withdrawal deleted:', payload);
                    fetchWithdrawals();
                }
            )
            .subscribe((status) => {
                console.log('Withdrawals realtime status:', status);
            });

        return () => {
            clearInterval(refreshInterval);
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchWithdrawals = async () => {
        try {
            // Fetch withdrawals with user data
            const { data, error } = await supabase
                .from('withdrawals')
                .select('*, user:users!user_id(email, name)')
                .eq('type', 'withdrawal')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const withdrawalsWithUsers = data.map((w: any) => ({
                    ...w,
                    user: w.user
                }));
                setWithdrawals(withdrawalsWithUsers);
            } else {
                setWithdrawals([]);
            }
        } catch (error: any) {
            console.error('Fetch withdrawals error:', error);
            toast.error("Failed to fetch withdrawals: " + error.message);
            setWithdrawals([]);
        } finally {
            setIsLoading(false);
        }
    };



    const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected' | 'completed', amount: number, userId: string, network: string) => {
        try {
            if (status === 'approved' || status === 'completed') {
                await approveWithdrawal(id);
                toast.success(`Withdrawal approved`);
            } else if (status === 'rejected') {
                await rejectWithdrawal(id, amount, userId, network);
                toast.success(`Withdrawal rejected`);
            }

            fetchWithdrawals();
        } catch (error: any) {
            console.error('Status update error:', error);
            toast.error("Failed to update status: " + error.message);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <Card className="border-border bg-card shadow-lg">
            <CardHeader className="border-b border-border/50 bg-muted/20">
                <CardTitle className="flex items-center gap-2">
                    <ArrowUpFromLine className="w-5 h-5 text-primary" />
                    Withdrawal Requests
                    <Badge variant="secondary" className="ml-2">{withdrawals.filter(w => w.status === 'pending').length} Pending</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="pl-6">User</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Network / Address</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {withdrawals.map((withdrawal) => (
                            <TableRow key={withdrawal.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell className="pl-6 font-medium">
                                    <div>
                                        <div className="font-semibold">{withdrawal.user?.name || 'Unknown'}</div>
                                        <div className="text-xs text-muted-foreground">{withdrawal.user?.email}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-mono font-bold">${withdrawal.amount.toFixed(2)}</div>
                                    {withdrawal.fee > 0 && (
                                        <div className="text-[10px] text-muted-foreground">Fee: ${withdrawal.fee.toFixed(2)}</div>
                                    )}
                                    <Badge variant="outline" className="text-[10px] py-0 h-4 mt-1">
                                        {withdrawal.type || 'withdrawal'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <span className="font-semibold">{withdrawal.network}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-1 rounded select-all">
                                                {withdrawal.address}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(withdrawal.address);
                                                    toast.success("Address copied");
                                                }}
                                                title="Copy Address"
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(withdrawal.created_at).toLocaleDateString()}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={`capitalize ${withdrawal.status === 'completed' ? 'bg-green-500/15 text-green-600 border-green-200' :
                                        withdrawal.status === 'pending' ? 'bg-yellow-500/15 text-yellow-600 border-yellow-200' :
                                            'bg-red-500/15 text-red-600 border-red-200'
                                        }`} variant="outline">
                                        {withdrawal.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    {withdrawal.status === 'pending' && (
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-200"
                                                onClick={() => handleStatusUpdate(withdrawal.id, 'rejected', withdrawal.amount, withdrawal.user_id, withdrawal.network)}
                                                title="Reject"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleStatusUpdate(withdrawal.id, 'completed', withdrawal.amount, withdrawal.user_id, withdrawal.network)}
                                                title="Approve"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {withdrawals.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No withdrawal requests found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default AdminWithdrawalsPanel;
