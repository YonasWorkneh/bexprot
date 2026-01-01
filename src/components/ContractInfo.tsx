import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ContractInfoProps {
  symbol: string;
  exchange?: string;
}

const ContractInfo = ({ symbol, exchange = 'Bexprot Futures' }: ContractInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Information</CardTitle>
        <CardDescription>Details for {symbol} on {exchange}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Contract Specifications</div>
            <ul className="text-sm space-y-1">
              <li>Contract Size: 1 unit</li>
              <li>Tick Size: 0.0001</li>
              <li>Trading Hours: 24/7</li>
            </ul>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Expiration</div>
            <ul className="text-sm space-y-1">
              <li>Monthly Expirations: Last Friday of month</li>
              <li>Quarterly Expirations: Mar/Jun/Sep/Dec</li>
            </ul>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Margin Requirements</div>
            <ul className="text-sm space-y-1">
              <li>Initial Margin: 5%</li>
              <li>Maintenance Margin: 3%</li>
              <li>Leverage: Up to 20x</li>
            </ul>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Settlement Procedures</div>
            <ul className="text-sm space-y-1">
              <li>Settlement: Cash</li>
              <li>Mark-to-Market: Daily</li>
              <li>Final Settlement: VWAP on expiry day</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractInfo;
