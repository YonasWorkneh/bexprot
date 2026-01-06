import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { format } from "date-fns";
import {
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Send,
  Download,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  formatBalance,
  getExplorerUrl,
  getSolanaExplorerUrl,
} from "@/lib/walletUtils";

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

interface USDTTransactionHistoryProps {
  userId: string;
  onRefresh?: () => void;
}

const ITEMS_PER_PAGE = 15;

const USDTTransactionHistory = ({
  userId,
  onRefresh,
}: USDTTransactionHistoryProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch transactions from wallet_transactions table with pagination
  const {
    data: transactionsData,
    isLoading,
    isRefetching: refreshing,
  } = useQuery<{ transactions: WalletTransaction[]; total: number }>({
    queryKey: ["usdt-wallet-transactions", userId, currentPage],
    queryFn: async () => {
      if (!userId) return { transactions: [], total: 0 };

      const limit = ITEMS_PER_PAGE;
      const offset = (currentPage - 1) * limit;

      // Get total count
      const { count, error: countError } = await supabase
        .from("wallet_transactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (countError) {
        console.error(
          "[USDTTransactionHistory] Error fetching count:",
          countError
        );
        throw countError;
      }

      // Get paginated data
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error(
          "[USDTTransactionHistory] Error fetching transactions:",
          error
        );
        throw error;
      }

      return {
        transactions: (data || []) as WalletTransaction[],
        total: count || 0,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 5, // 5 seconds stale time
    refetchInterval: 10000, // Auto-refetch every 10 seconds
  });

  const transactions = transactionsData?.transactions || [];
  const totalCount = transactionsData?.total || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["usdt-wallet-transactions", userId, currentPage],
    });
    onRefresh?.();
  };

  const getTransactionType = (
    tx: WalletTransaction
  ): { displayType: string; isDebit: boolean } => {
    const isDebit = tx.amount < 0;

    if (isDebit) {
      return { displayType: "debit", isDebit: true };
    }

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

  const getStatusBadge = (status: string, isDebit: boolean = false) => {
    if (isDebit) {
      return (
        <Badge
          variant="destructive"
          className="flex items-center gap-1 w-fit bg-red-500/10 text-red-500 border-red-500/20 max-w-[100px] justify-center"
        >
          Debit
        </Badge>
      );
    }

    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: React.ComponentType<{ className?: string }>;
        label: string;
        className?: string;
      }
    > = {
      pending: {
        variant: "secondary",
        icon: Clock,
        label: "Pending",
      },
      processing: {
        variant: "default",
        icon: Loader2,
        label: "Processing",
      },
      completed: {
        variant: "default",
        icon: CheckCircle,
        label: "Completed",
        className: "bg-green-500/10 text-green-500 border-green-500/20",
      },
      confirmed: {
        variant: "default",
        icon: CheckCircle,
        label: "Confirmed",
        className: "bg-green-500/10 text-green-500 border-green-500/20",
      },
      failed: {
        variant: "destructive",
        icon: XCircle,
        label: "Failed",
      },
      rejected: {
        variant: "destructive",
        icon: XCircle,
        label: "Rejected",
      },
    };

    const config = variants[status?.toLowerCase()] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge
        variant={config.variant}
        className={`flex items-center gap-1 w-fit max-w-[100px] justify-center ${
          config.className || ""
        }`}
      >
        <Icon
          className={`h-3 w-3 ${
            status?.toLowerCase() === "processing" ? "animate-spin" : ""
          }`}
        />
        {config.label}
      </Badge>
    );
  };

  const getTypeIcon = (displayType: string, isDebit: boolean) => {
    if (isDebit || displayType === "send" || displayType === "withdrawal") {
      return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
    }

    switch (displayType) {
      case "deposit":
      case "receive":
        return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
      case "profit":
        return <Download className="h-4 w-4 text-green-600" />;
      case "adjustment":
        return <Send className="h-4 w-4 text-blue-600" />;
      default:
        return <Send className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "-";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTransactionExplorerUrl = (tx: WalletTransaction): string | null => {
    if (!tx.transaction_hash) return null;

    const network = tx.network?.toLowerCase() || "";

    if (network.includes("solana") || network === "sol") {
      return getSolanaExplorerUrl(tx.transaction_hash);
    }

    // Detect chain ID from network name
    const chainId = network.includes("polygon")
      ? 137
      : network.includes("bsc") || network.includes("binance")
      ? 56
      : network.includes("arbitrum")
      ? 42161
      : network.includes("tron") || network.includes("trc20")
      ? 0
      : 1; // Tron uses different explorer

    if (chainId === 0) {
      // Tron explorer
      return `https://tronscan.org/#/transaction/${tx.transaction_hash}`;
    }

    return getExplorerUrl(chainId, tx.transaction_hash);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Network</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Download className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
        <p className="text-sm text-muted-foreground">
          Your transaction history will appear here once you start using your
          wallet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {refreshing ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <>
              Showing {transactions.length} of {totalCount} transaction
              {totalCount !== 1 ? "s" : ""}
              {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </>
          )}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Network</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {refreshing
              ? // Show skeleton rows while refreshing
                [...Array(ITEMS_PER_PAGE)].map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              : transactions.map((tx) => {
                  const { displayType, isDebit } = getTransactionType(tx);
                  const displayAmount = Math.abs(tx.amount);
                  const status = isDebit ? "debit" : tx.status;
                  const explorerUrl = getTransactionExplorerUrl(tx);
                  const networkLabel = tx.network || tx.asset || "N/A";

                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(displayType, isDebit)}
                          <span className="font-medium capitalize">
                            {displayType}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className={`font-mono font-semibold ${
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
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {networkLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs">
                          {tx.type === "send" || tx.type === "withdrawal"
                            ? formatAddress(tx.to_address || "-")
                            : formatAddress(tx.from_address || "-")}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(status, isDebit)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {(() => {
                            try {
                              return format(
                                new Date(tx.timestamp),
                                "MMM dd, yyyy"
                              );
                            } catch (e) {
                              return "Invalid Date";
                            }
                          })()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(() => {
                            try {
                              return format(new Date(tx.timestamp), "HH:mm");
                            } catch (e) {
                              return "--:--";
                            }
                          })()}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                  }
                }}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <PaginationItem key={page}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              return null;
            })}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) {
                    setCurrentPage(currentPage + 1);
                  }
                }}
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default USDTTransactionHistory;
