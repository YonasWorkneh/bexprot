import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    CreditCard,
    Bitcoin,
    DollarSign,
    Loader2,
    CheckCircle,
    AlertTriangle,
    ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import {
    createStripeDeposit,
    createCoinbaseDeposit,
    createNOWPaymentsDeposit,
    getAvailablePaymentMethods,
    isPaymentGatewayConfigured,
    type PaymentMethod,
} from '@/lib/paymentGateways';

interface RealDepositDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const RealDepositDialog = ({ open, onOpenChange, onSuccess }: RealDepositDialogProps) => {
    const user = useAuthStore((state) => state.user);
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState<'fiat' | 'crypto'>('fiat');
    const [amount, setAmount] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('stripe');
    const [loading, setLoading] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

    const availableMethods = getAvailablePaymentMethods();
    const hasAnyGateway = availableMethods.fiat.length > 0 || availableMethods.crypto.length > 0;

    const handleDeposit = async () => {
        if (!user?.id) {
            toast({
                title: 'Authentication Required',
                description: 'Please log in to make a deposit',
                variant: 'destructive',
            });
            return;
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum < 10) {
            toast({
                title: 'Invalid Amount',
                description: 'Minimum deposit is $10',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            let result;

            switch (selectedMethod) {
                case 'stripe':
                    result = await createStripeDeposit(user.id, amountNum, 'USD');
                    break;
                case 'coinbase':
                    result = await createCoinbaseDeposit(user.id, amountNum, 'USDT');
                    break;
                case 'nowpayments':
                    result = await createNOWPaymentsDeposit(user.id, amountNum, 'USDT');
                    break;
                default:
                    throw new Error('Invalid payment method');
            }

            if (result.success && result.checkoutUrl) {
                setCheckoutUrl(result.checkoutUrl);
                toast({
                    title: 'Payment Created',
                    description: 'Redirecting to payment gateway...',
                });

                // In production, redirect to actual payment gateway
                // window.location.href = result.checkoutUrl;
            } else {
                throw new Error(result.error || 'Failed to create payment');
            }
        } catch (error: any) {
            toast({
                title: 'Deposit Failed',
                description: error.message || 'Failed to create deposit',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setAmount('');
        setCheckoutUrl(null);
    };

    const handleClose = () => {
        if (!loading) {
            onOpenChange(false);
            setTimeout(resetForm, 200);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Deposit Funds
                    </DialogTitle>
                    <DialogDescription>
                        Choose your preferred payment method to add funds to your account
                    </DialogDescription>
                </DialogHeader>

                {!hasAnyGateway ? (
                    <Alert className="bg-red-50 border-red-200">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            <p className="font-semibold mb-2">Payment Gateways Not Configured</p>
                            <p className="text-sm mb-3">
                                No payment gateways are currently configured. To accept real payments, you need to:
                            </p>
                            <ol className="text-sm space-y-2 list-decimal pl-5">
                                <li>
                                    <strong>For Fiat Payments (Credit/Debit Cards):</strong>
                                    <br />
                                    Sign up at{' '}
                                    <a
                                        href="https://stripe.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline"
                                    >
                                        Stripe.com
                                    </a>{' '}
                                    and add your API keys to .env file
                                </li>
                                <li>
                                    <strong>For Crypto Payments:</strong>
                                    <br />
                                    Sign up at{' '}
                                    <a
                                        href="https://commerce.coinbase.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline"
                                    >
                                        Coinbase Commerce
                                    </a>{' '}
                                    or{' '}
                                    <a
                                        href="https://nowpayments.io"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline"
                                    >
                                        NOWPayments
                                    </a>
                                </li>
                                <li>Add your API keys to the .env file (see .env.example)</li>
                                <li>Restart your development server</li>
                            </ol>
                        </AlertDescription>
                    </Alert>
                ) : checkoutUrl ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Payment Created!</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                            Your payment has been created. Click the button below to complete your payment.
                        </p>
                        <Button onClick={() => window.open(checkoutUrl, '_blank')} className="gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Complete Payment
                        </Button>
                    </div>
                ) : (
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'fiat' | 'crypto')}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="fiat" disabled={availableMethods.fiat.length === 0}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Fiat (Card/Bank)
                            </TabsTrigger>
                            <TabsTrigger value="crypto" disabled={availableMethods.crypto.length === 0}>
                                <Bitcoin className="mr-2 h-4 w-4" />
                                Cryptocurrency
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="fiat" className="space-y-4">
                            <Alert className="bg-blue-50 border-blue-200">
                                <CreditCard className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-800">
                                    <p className="font-semibold mb-1">Secure Fiat Payment</p>
                                    <p className="text-xs">
                                        Pay with credit card, debit card, or bank transfer via Stripe. Your payment
                                        information is encrypted and secure.
                                    </p>
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fiat-amount">Amount (USD)</Label>
                                    <Input
                                        id="fiat-amount"
                                        type="number"
                                        step="0.01"
                                        min="10"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="font-mono text-lg"
                                    />
                                    <p className="text-xs text-muted-foreground">Minimum deposit: $10.00</p>
                                </div>

                                {isPaymentGatewayConfigured('stripe') && (
                                    <Card
                                        className={`cursor-pointer transition-all ${selectedMethod === 'stripe'
                                                ? 'border-primary ring-2 ring-primary/20'
                                                : 'hover:border-primary/50'
                                            }`}
                                        onClick={() => setSelectedMethod('stripe')}
                                    >
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <CreditCard className="h-4 w-4" />
                                                Stripe
                                            </CardTitle>
                                            <CardDescription className="text-xs">
                                                Credit/Debit Card, Bank Transfer
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="text-xs text-muted-foreground">
                                            Processing fee: 2.9% + $0.30
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="crypto" className="space-y-4">
                            <Alert className="bg-purple-50 border-purple-200">
                                <Bitcoin className="h-4 w-4 text-purple-600" />
                                <AlertDescription className="text-purple-800">
                                    <p className="font-semibold mb-1">Cryptocurrency Payment</p>
                                    <p className="text-xs">
                                        Pay with USDT, Bitcoin, Ethereum, or other cryptocurrencies. Instant processing
                                        after blockchain confirmation.
                                    </p>
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="crypto-amount">Amount (USD equivalent)</Label>
                                    <Input
                                        id="crypto-amount"
                                        type="number"
                                        step="0.01"
                                        min="10"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="font-mono text-lg"
                                    />
                                    <p className="text-xs text-muted-foreground">Minimum deposit: $10.00</p>
                                </div>

                                <div className="space-y-3">
                                    {isPaymentGatewayConfigured('coinbase') && (
                                        <Card
                                            className={`cursor-pointer transition-all ${selectedMethod === 'coinbase'
                                                    ? 'border-primary ring-2 ring-primary/20'
                                                    : 'hover:border-primary/50'
                                                }`}
                                            onClick={() => setSelectedMethod('coinbase')}
                                        >
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Bitcoin className="h-4 w-4" />
                                                    Coinbase Commerce
                                                </CardTitle>
                                                <CardDescription className="text-xs">
                                                    BTC, ETH, USDT, USDC, and more
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="text-xs text-muted-foreground">
                                                Network fee: Varies by blockchain
                                            </CardContent>
                                        </Card>
                                    )}

                                    {isPaymentGatewayConfigured('nowpayments') && (
                                        <Card
                                            className={`cursor-pointer transition-all ${selectedMethod === 'nowpayments'
                                                    ? 'border-primary ring-2 ring-primary/20'
                                                    : 'hover:border-primary/50'
                                                }`}
                                            onClick={() => setSelectedMethod('nowpayments')}
                                        >
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Bitcoin className="h-4 w-4" />
                                                    NOWPayments
                                                </CardTitle>
                                                <CardDescription className="text-xs">
                                                    200+ cryptocurrencies supported
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="text-xs text-muted-foreground">
                                                Processing fee: 0.5% + network fee
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                )}

                {hasAnyGateway && !checkoutUrl && (
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={handleClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeposit}
                            disabled={loading || !amount || parseFloat(amount) < 10}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Continue to Payment
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default RealDepositDialog;
