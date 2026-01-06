import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MarketAnalysis = () => {
  return (
    <div className="min-h-screen bg-black text-foreground">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back Button */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="default" size="sm" className="gap-2 bg-primary hover:bg-primary/90">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Content */}
        <div className="glass rounded-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Market Analysis
          </h1>
          <p className="text-muted-foreground mb-8">
            Comprehensive market insights and analysis tools
          </p>

          <div className="space-y-8">
            {/* Technical Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Technical Analysis
                </CardTitle>
                <CardDescription>Analyze price movements and market trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Chart Patterns</h3>
                  <p className="text-sm text-muted-foreground">
                    Identify support and resistance levels, trend lines, and chart patterns using our advanced TradingView integration. These patterns can help predict future price movements.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Technical Indicators</h3>
                  <p className="text-sm text-muted-foreground">
                    Use popular indicators like RSI, MACD, Moving Averages, and Bollinger Bands to make informed trading decisions. All indicators are available directly on our charts.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Fundamental Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Fundamental Analysis
                </CardTitle>
                <CardDescription>Evaluate asset value based on economic factors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Market News</h3>
                  <p className="text-sm text-muted-foreground">
                    Stay updated with the latest market news, economic events, and announcements that can impact asset prices. Our platform aggregates news from trusted sources.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Economic Indicators</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor key economic indicators such as GDP, inflation rates, employment data, and central bank decisions that influence market movements.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Market Sentiment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-primary" />
                  Market Sentiment
                </CardTitle>
                <CardDescription>Understand market psychology and trader behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Fear & Greed Index</h3>
                  <p className="text-sm text-muted-foreground">
                    Track market sentiment indicators to understand whether the market is driven by fear or greed. Extreme readings can signal potential reversals.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Volume Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Analyze trading volume to confirm price movements. High volume often validates trends, while low volume may indicate weak moves.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Tools */}
            <Card>
              <CardHeader>
                <CardTitle>Available Analysis Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Real-time price charts with multiple timeframes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Advanced technical indicators and drawing tools</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Market depth and order book analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Historical price data and performance metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Custom alerts and price notifications</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Disclaimer:</strong> Market analysis is for informational purposes only and should not be considered as financial advice. Always conduct your own research and consult with financial advisors before making trading decisions. Past performance does not guarantee future results.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketAnalysis;

