import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Bitcoin, Loader2, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { createStripeDeposit, createCoinbaseDeposit, createNOWPaymentsDeposit, getAvailablePaymentMethods, isPaymentGatewayConfigured, type PaymentMethod } from '@/lib/paymentGateways';

interface InlineDepositSystemProps {
  onSuccess?: () => void;
}

const InlineDepositSystem = ({ onSuccess }: InlineDepositSystemProps) => {
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'fiat' | 'crypto'>('fiat');
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('stripe');
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const available = getAvailablePaymentMethods();
  const hasAnyGateway = available.fiat.length > 0 || available.crypto.length > 0;

  const handleDeposit = async () => {
    if (!user?.id) {
      toast({ title: 'Authentication Required', description: 'Please log in to make a deposit', variant: 'destructive' });
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 10) {
      toast({ title: 'Invalid Amount', description: 'Minimum deposit is $10', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      let result;
      if (selectedMethod === 'stripe') {
        result = await createStripeDeposit(user.id, amountNum, 'USD');
      } else if (selectedMethod === 'coinbase') {
        result = await createCoinbaseDeposit(user.id, amountNum, 'USDT');
      } else if (selectedMethod === 'nowpayments') {
        result = await createNOWPaymentsDeposit(user.id, amountNum, 'USDT');
      } else {
        throw new Error('Invalid payment method');
      }
      if (result.success && result.checkoutUrl) {
        setCheckoutUrl(result.checkoutUrl);
        toast({ title: 'Payment Created', description: 'Redirecting to payment gateway...' });
        if (onSuccess) onSuccess();
      } else {
        throw new Error(result.error || 'Failed to create payment');
      }
    } catch (error: any) {
      toast({ title: 'Deposit Failed', description: error.message || 'Failed to create deposit', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!hasAnyGateway && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Payment gateways are not configured. Configure Stripe, Coinbase Commerce, or NOWPayments in .env.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Open Real Deposit</CardTitle>
          <CardDescription>Securely add funds using fiat or cryptocurrency</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'fiat' | 'crypto')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="fiat" disabled={available.fiat.length === 0}><CreditCard className="mr-2 h-4 w-4" />Fiat</TabsTrigger>
              <TabsTrigger value="crypto" disabled={available.crypto.length === 0}><Bitcoin className="mr-2 h-4 w-4" />Crypto</TabsTrigger>
            </TabsList>

            <TabsContent value="fiat" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (USD)</label>
                <Input id="fiat-amount" type="number" step="0.01" min="10" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="font-mono text-lg" />
                <p className="text-xs text-muted-foreground">Minimum deposit: $10.00</p>
              </div>
              {isPaymentGatewayConfigured('stripe') && (
                <Card className={`cursor-pointer ${selectedMethod === 'stripe' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`} onClick={() => setSelectedMethod('stripe')}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" />Stripe</CardTitle>
                    <CardDescription className="text-xs">Card and bank payments</CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">Processing fee applies</CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="crypto" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (USD equivalent)</label>
                <Input id="crypto-amount" type="number" step="0.01" min="10" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="font-mono text-lg" />
                <p className="text-xs text-muted-foreground">Minimum deposit: $10.00</p>
              </div>
              {isPaymentGatewayConfigured('coinbase') && (
                <Card className={`cursor-pointer ${selectedMethod === 'coinbase' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`} onClick={() => setSelectedMethod('coinbase')}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Bitcoin className="h-4 w-4" />Coinbase Commerce</CardTitle>
                    <CardDescription className="text-xs">BTC, ETH, USDT, USDC, and more</CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">Network fee varies</CardContent>
                </Card>
              )}
              {isPaymentGatewayConfigured('nowpayments') && (
                <Card className={`cursor-pointer ${selectedMethod === 'nowpayments' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`} onClick={() => setSelectedMethod('nowpayments')}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Bitcoin className="h-4 w-4" />NOWPayments</CardTitle>
                    <CardDescription className="text-xs">200+ cryptocurrencies</CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">Processing fee applies</CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setAmount('')} disabled={loading}>Clear</Button>
            <Button onClick={handleDeposit} disabled={loading || !amount || parseFloat(amount) < 10}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue to Payment
            </Button>
          </div>

          {checkoutUrl && (
            <div className="flex items-center gap-2 mt-4 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Payment created.</span>
              <Button variant="link" className="px-0" onClick={() => window.open(checkoutUrl!, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-1" />Open Checkout
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InlineDepositSystem;
