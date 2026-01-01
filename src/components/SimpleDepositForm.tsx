import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NETWORKS = ['BTC', 'ETH', 'USDT_TRC20', 'SOL', 'XRP', 'LTC', 'BNB'];

export default function SimpleDepositForm() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [network, setNetwork] = useState('BTC');
    const [txHash, setTxHash] = useState('');
    const [amount, setAmount] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user?.id) {
            toast.error('Please log in first');
            return;
        }

        if (!txHash || !amount || parseFloat(amount) <= 0) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        console.log('=== SIMPLE DEPOSIT SUBMIT ===');
        console.log('User:', user.id);
        console.log('Network:', network);
        console.log('TX Hash:', txHash);
        console.log('Amount:', amount);

        try {
            const depositCode = `DEP-${network}-${Date.now().toString(36).toUpperCase()}`;
            
            // Insert into crypto_deposits
            const { data: cryptoData, error: cryptoError } = await supabase
                .from('crypto_deposits')
                .insert({
                    user_id: user.id,
                    deposit_code: depositCode,
                    currency: network,
                    deposit_address: 'user_reported',
                    transaction_hash: txHash,
                    amount: parseFloat(amount),
                    amount_usd: parseFloat(amount),
                    user_reported_amount: parseFloat(amount),
                    status: 'reported',
                    reported_at: new Date().toISOString()
                })
                .select()
                .single();

            if (cryptoError) {
                console.error('crypto_deposits error:', cryptoError);
                throw cryptoError;
            }

            console.log('✅ crypto_deposits insert success:', cryptoData);

            // Legacy 'deposits' table insertion removed.
            // Admin panel now reads from 'crypto_deposits' directly.

            toast.success(`Deposit reported! Code: ${depositCode}`);
            
            // Reset form
            setTxHash('');
            setAmount('');
            
        } catch (error: any) {
            console.error('=== DEPOSIT ERROR ===');
            console.error('Error:', error);
            console.error('Code:', error.code);
            console.error('Message:', error.message);
            console.error('Details:', error.details);
            
            toast.error(`Failed: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
            console.log('=== DEPOSIT FINISHED ===');
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Report Deposit</CardTitle>
                <CardDescription>Submit your crypto deposit for admin approval</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Network</Label>
                        <Select value={network} onValueChange={setNetwork}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {NETWORKS.map(n => (
                                    <SelectItem key={n} value={n}>{n}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Transaction Hash</Label>
                        <Input 
                            value={txHash}
                            onChange={(e) => setTxHash(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div>
                        <Label>Amount (USD)</Label>
                        <Input 
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="100.00"
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Submitting...' : 'Report Deposit'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
