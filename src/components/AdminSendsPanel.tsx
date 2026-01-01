import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Send, Copy } from "lucide-react";
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

const AdminSendsPanel = () => {
    const [sends, setSends] = useState<Withdrawal[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Initial fetch
        fetchSends();

        // Auto-refresh every 10 seconds
        const refreshInterval = setInterval(() => {
            fetchSends();
        }, 10000);

        // Realtime subscription
        const channel = supabase
            .channel('admin_sends_realtime')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'withdrawals' },
                () => fetchSends()
            )
            .subscribe();

        return () => {
            clearInterval(refreshInterval);
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchSends = async () => {
        try {
            // Fetch sends from the RPC (workaround for column/schema cache)
            const { data: withdrawalsData, error: withdrawalsError } = await supabase
                .rpc('get_admin_withdrawals', { type_filter: 'send' });

            if (withdrawalsError) throw withdrawalsError;

            if (withdrawalsData && withdrawalsData.length > 0) {
                const userIds = [...new Set(withdrawalsData.map(w => w.user_id))];
                const { data: usersData } = await supabase
                    .from('users')
                    .select('id, email, name')
                    .in('id', userIds);

                const sendsWithUsers = withdrawalsData.map(send => ({
                    ...send,
                    user: usersData?.find(u => u.id === send.user_id)
                }));

                setSends(sendsWithUsers as Withdrawal[]);
            } else {
                setSends([]);
            }
        } catch (error: any) {
            console.error('Fetch sends error:', error);
            setSends([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected' | 'completed', amount: number, userId: string, network: string) => {
        try {
            if (status === 'approved' || status === 'completed') {
                await approveWithdrawal(id);
                toast.success(`Send request approved`);
            } else if (status === 'rejected') {
                await rejectWithdrawal(id, amount, userId, network);
                toast.success(`Send request rejected`);
            }
            fetchSends();
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
                    <Send className="w-5 h-5 text-primary" />
                    USDT Send Requests
                    <Badge variant="secondary" className="ml-2">{sends.filter(s => s.status === 'pending').length} Pending</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="pl-6">User</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Network / Recipient</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sends.map((send) => (
                            <TableRow key={send.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell className="pl-6 font-medium">
                                    <div>
                                        <div className="font-semibold">{send.user?.name || 'Unknown'}</div>
                                        <div className="text-xs text-muted-foreground">{send.user?.email}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-mono font-bold">${send.amount.toFixed(2)}</div>
                                    {send.fee > 0 && (
                                        <div className="text-[10px] text-muted-foreground">Fee: ${send.fee.toFixed(2)}</div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <span className="font-semibold">{send.network}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-1 rounded select-all truncate max-w-[150px]">
                                                {send.address}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(send.address);
                                                    toast.success("Address copied");
                                                }}
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(send.created_at).toLocaleDateString()}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={`capitalize ${send.status === 'completed' ? 'bg-green-500/15 text-green-600 border-green-200' :
                                        send.status === 'pending' ? 'bg-yellow-500/15 text-yellow-600 border-yellow-200' :
                                            'bg-red-500/15 text-red-600 border-red-200'
                                        }`} variant="outline">
                                        {send.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    {send.status === 'pending' && (
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-200"
                                                onClick={() => handleStatusUpdate(send.id, 'rejected', send.amount, send.user_id, send.network)}
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleStatusUpdate(send.id, 'completed', send.amount, send.user_id, send.network)}
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {sends.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No send requests found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default AdminSendsPanel;
