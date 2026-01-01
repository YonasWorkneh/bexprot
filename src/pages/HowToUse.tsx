import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Wallet, TrendingUp, ShieldCheck, ArrowRightLeft } from "lucide-react";

const HowToUse = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">How to Use Bexprot</h1>
        <p className="text-muted-foreground">Comprehensive guide to trading and managing your assets</p>
      </div>

      <Tabs defaultValue="getting-started" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-[800px]">
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="wallet">Wallet & Deposits</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                Getting Started with Bexprot
              </CardTitle>
              <CardDescription>
                Welcome to the next generation of trading. Here's how to begin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">1. Account Verification</h3>
                  <p className="text-muted-foreground">
                    Before you can start trading, you need to complete the KYC (Know Your Customer) process.
                    Go to Settings &gt; KYC Verification and upload your identification documents.
                    Verification usually takes less than 24 hours.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">2. Secure Your Account</h3>
                  <p className="text-muted-foreground">
                    We strongly recommend enabling Two-Factor Authentication (2FA) immediately.
                    Navigate to Settings &gt; Security to set up 2FA using Google Authenticator or Authy.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trading">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Trading Guide
              </CardTitle>
              <CardDescription>
                Master Spot, Futures, and Contract trading.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">USDT Only Trading</h3>
                <div className="bg-secondary/50 p-4 rounded-lg border border-border">
                  <p className="text-sm">
                    <strong>Important:</strong> All trading on Bexprot is settled in USDT. 
                    You must hold USDT in your Bexprot Wallet to place orders. 
                    If you deposit other cryptocurrencies, please swap them to USDT first using the Wallet page.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Spot Trading</h4>
                  <p className="text-sm text-muted-foreground">
                    Buy and sell assets directly. You own the underlying asset. 
                    Best for long-term holding.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Futures Trading</h4>
                  <p className="text-sm text-muted-foreground">
                    Trade with leverage (up to 100x). Speculate on price movements without owning the asset.
                    High risk, high reward.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Contract Trading</h4>
                  <p className="text-sm text-muted-foreground">
                    Predict if the price will go Up or Down within a specific timeframe (e.g., 60s).
                    Fixed payouts (e.g., 20-50%).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-6 w-6 text-primary" />
                Wallet & Deposits
              </CardTitle>
              <CardDescription>
                Managing your funds securely.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Depositing Funds</h3>
                <p className="text-muted-foreground">
                  Go to the Wallet page and click "Deposit". Select your preferred network (Ethereum, BSC, Polygon, or Tron).
                  Send USDT to the generated address. Your balance will update automatically after network confirmation.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Swapping Assets</h3>
                <p className="text-muted-foreground">
                  Use the "Swap" feature in your Wallet to convert other cryptocurrencies to USDT for trading.
                  We offer competitive rates with minimal fees.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Withdrawals</h3>
                <p className="text-muted-foreground">
                  To withdraw, click "Withdraw" in your Wallet. Enter the destination address and amount.
                  Withdrawals are processed securely and may require 2FA verification.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                Security Best Practices
              </CardTitle>
              <CardDescription>
                Keep your account and funds safe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Never share your password or 2FA codes with anyone.</li>
                <li>Always verify the URL is <strong>bexprot.com</strong> before logging in.</li>
                <li>Use a strong, unique password for your Bexprot account.</li>
                <li>Contact support immediately if you notice any suspicious activity.</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HowToUse;
