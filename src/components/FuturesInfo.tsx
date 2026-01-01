import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface FuturesInfoProps {
  symbol: string;
}

const FuturesInfo = ({ symbol }: FuturesInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Futures Trading Options</CardTitle>
        <CardDescription>Available contracts for {symbol}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-secondary/30 p-3 rounded-lg border border-border">
            <div className="text-sm font-semibold">Monthly</div>
            <div className="text-xs text-muted-foreground">Standard monthly expirations</div>
          </div>
          <div className="bg-secondary/30 p-3 rounded-lg border border-border">
            <div className="text-sm font-semibold">Quarterly</div>
            <div className="text-xs text-muted-foreground">Mar/Jun/Sep/Dec cycle</div>
          </div>
          <div className="bg-secondary/30 p-3 rounded-lg border border-border">
            <div className="text-sm font-semibold">Perpetual</div>
            <div className="text-xs text-muted-foreground">No expiration, funding every 8h</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FuturesInfo;
