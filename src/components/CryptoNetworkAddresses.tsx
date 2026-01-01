import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DEPOSIT_ADDRESSES, type CryptoCurrency } from '@/lib/depositAddresses';
import { getCryptoIcon } from '@/lib/cryptoIcons';

const CryptoNetworkAddresses = () => {
    const { toast } = useToast();

    const copyAddress = (address: string, currency: string) => {
        navigator.clipboard.writeText(address);
        toast({
            title: 'Copied',
            description: `${currency} address copied to clipboard`,
        });
    };

    const openExplorer = (currency: CryptoCurrency) => {
        const config = DEPOSIT_ADDRESSES[currency];
        if (config.explorerUrl) {
            window.open(`${config.explorerUrl}${config.address}`, '_blank');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Wallets Across Networks</CardTitle>
                <CardDescription>Your deposit addresses for different cryptocurrencies</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Object.entries(DEPOSIT_ADDRESSES).map(([currency, config]) => (
                        <Card
                            key={currency}
                            className="hover:shadow-lg transition-all hover:ring-1 hover:ring-primary/50"
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-2 shadow-md">
                                        <img 
                                            src={getCryptoIcon(currency as CryptoCurrency)} 
                                            alt={config.networkSymbol}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-lg font-bold">{config.currency.replace('_', ' ')}</p>
                                        <p className="text-xs text-muted-foreground">{config.network}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-xs font-semibold">
                                        {config.networkSymbol}
                                    </Badge>
                                </div>
                                <div className="mb-3 p-2 bg-muted/50 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">Address</p>
                                    <p className="font-mono text-xs break-all">
                                        {config.address.slice(0, 12)}...{config.address.slice(-8)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => copyAddress(config.address, config.currency)}
                                    >
                                        <Copy className="h-3 w-3 mr-1" />
                                        Copy
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openExplorer(currency as CryptoCurrency)}
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                    </Button>
                                </div>
                                <div className="mt-2 text-xs text-muted-foreground">
                                    Min: {config.minDeposit} {config.networkSymbol}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default CryptoNetworkAddresses;
