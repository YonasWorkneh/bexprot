import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import {
  formatBalance,
  formatTxHash,
  getExplorerUrl,
  getSolanaExplorerUrl,
} from "@/lib/walletUtils";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WalletTransaction {
  id: string;
  user_id: string;
  wallet_address: string | null;
  to_address: string | null;
  from_address: string | null;
  transaction_hash: string | null;
  type:
    | "send"
    | "receive"
    | "deposit"
    | "withdrawal"
    | "trade_pnl"
    | "admin_adjustment";
  amount: number;
  asset: string;
  network: string | null;
  status: string;
  timestamp: string;
}

const TransactionHistory = () => {
  const { user } = useAuthStore();

  // Fetch transactions from wallet_transactions table
  const {
    data: transactions = [],
    isLoading,
    error: queryError,
  } = useQuery<WalletTransaction[]>({
    queryKey: ["wallet-transactions", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log("[TransactionHistory] No user ID, returning empty array");
        return [];
      }

      console.log(
        "[TransactionHistory] Fetching transactions for user:",
        user.id
      );

      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false })
        .limit(100);

      if (error) {
        console.error(
          "[TransactionHistory] Error fetching transactions:",
          error
        );
        console.error("[TransactionHistory] Error details:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      console.log(
        "[TransactionHistory] Fetched transactions:",
        data?.length || 0,
        "transactions"
      );
      console.log("[TransactionHistory] Sample transaction:", data?.[0]);

      return (data || []) as WalletTransaction[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 5, // 5 seconds stale time
    refetchInterval: 10000, // Auto-refetch every 10 seconds
    retry: 2,
  });

  const getStatusColor = (status: string, isDebit: boolean = false) => {
    if (isDebit) {
      return "bg-red-500/10 text-red-500 border-red-500/20";
    }

    switch (status?.toLowerCase()) {
      case "confirmed":
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "pending":
      case "processing":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "failed":
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getTransactionType = (
    tx: WalletTransaction
  ): { displayType: string; isDebit: boolean } => {
    const isDebit = tx.amount < 0;

    // If amount is negative, it's always a debit
    if (isDebit) {
      return { displayType: "debit", isDebit: true };
    }

    // Map transaction types for positive amounts
    switch (tx.type) {
      case "receive":
      case "deposit":
        return { displayType: "receive", isDebit: false };
      case "send":
      case "withdrawal":
        return { displayType: "send", isDebit: false };
      case "trade_pnl":
        return { displayType: "profit", isDebit: false };
      case "admin_adjustment":
        return { displayType: "adjustment", isDebit: false };
      default:
        return { displayType: tx.type || "transaction", isDebit: false };
    }
  };

  const openExplorer = (tx: WalletTransaction) => {
    if (!tx.transaction_hash) return;

    let url: string;
    const network = tx.network?.toLowerCase() || "";

    if (network.includes("solana") || network === "sol") {
      url = getSolanaExplorerUrl(tx.transaction_hash);
    } else {
      // Default to Ethereum mainnet or try to detect from network
      const chainId = network.includes("polygon")
        ? 137
        : network.includes("bsc")
        ? 56
        : network.includes("arbitrum")
        ? 42161
        : 1;
      url = getExplorerUrl(chainId, tx.transaction_hash);
    }
    window.open(url, "_blank");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg"
                >
                  {/* Icon */}
                  <Skeleton className="h-8 w-8 rounded-lg" />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-3 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <Skeleton className="h-5 w-24 mb-2" />
                    <div className="flex gap-2 justify-end">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  if (queryError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-red-500 mb-2">Error loading transactions</p>
            <p className="text-sm">
              {queryError instanceof Error
                ? queryError.message
                : "Unknown error occurred"}
            </p>
            <p className="text-xs mt-2 text-muted-foreground">
              Check the browser console for more details
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>No transactions yet</p>
            <p className="text-sm mt-2">
              Your transaction history will appear here
            </p>
            {user?.id && (
              <p className="text-xs mt-4 text-muted-foreground/70">
                User ID: {user.id.substring(0, 8)}...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {transactions.map((tx) => {
              const { displayType, isDebit } = getTransactionType(tx);
              const displayAmount = Math.abs(tx.amount);
              const status = isDebit ? "debit" : tx.status;

              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                >
                  {/* Icon */}
                  <div
                    className={`p-2 rounded-lg ${
                      isDebit ||
                      displayType === "send" ||
                      displayType === "withdrawal"
                        ? "bg-red-500/10"
                        : "bg-green-500/10"
                    }`}
                  >
                    {isDebit ||
                    displayType === "send" ||
                    displayType === "withdrawal" ? (
                      <ArrowUpFromLine className="h-4 w-4 text-red-500" />
                    ) : (
                      <ArrowDownToLine className="h-4 w-4 text-green-500" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold capitalize">
                        {displayType}
                      </span>
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(
                          status,
                          isDebit
                        )} min-w-[80px] justify-center flex items-center gap-1`}
                      >
                        {(status === "pending" || status === "processing") && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        {status}
                      </Badge>
                    </div>
                    {tx.transaction_hash && (
                      <div className="text-sm text-muted-foreground font-mono truncate">
                        {formatTxHash(tx.transaction_hash)}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <div
                      className={`font-semibold font-mono ${
                        isDebit ||
                        displayType === "send" ||
                        displayType === "withdrawal"
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      {isDebit ||
                      displayType === "send" ||
                      displayType === "withdrawal"
                        ? "-"
                        : "+"}
                      {formatBalance(displayAmount)} {tx.asset}
                    </div>
                    {tx.transaction_hash && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-6 text-xs"
                        onClick={() => openExplorer(tx)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Explorer
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 ml-2 h-6 text-xs"
                      onClick={() =>
                        (window.location.href = `/transaction/${tx.id}`)
                      }
                    >
                      Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
