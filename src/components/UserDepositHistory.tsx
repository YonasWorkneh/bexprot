import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ExternalLink,
  Loader2,
  RefreshCw,
  Copy,
  CheckCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Download,
  Clock,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getUserDeposits } from "@/lib/cryptoDepositService";
import type { CryptoDeposit } from "@/lib/depositAddresses";
import { format } from "date-fns";
import { formatBalance } from "@/lib/walletUtils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface UserDepositHistoryProps {
  userId: string;
}

const ITEMS_PER_PAGE = 15;

const UserDepositHistory = ({ userId }: UserDepositHistoryProps) => {
  const { toast } = useToast();
  const [deposits, setDeposits] = useState<CryptoDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadDeposits = useCallback(async () => {
    setLoading(true);
    const result = await getUserDeposits(userId, {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      status: statusFilter,
    });
    if (result.success && result.data) {
      setDeposits(result.data);
      setTotalCount(result.total ?? 0);
    } else {
      setDeposits([]);
      setTotalCount(0);
      toast({
        title: "Error",
        description: result.error || "Failed to load deposit history",
        variant: "destructive",
      });
    }
    setLoading(false);
  }, [userId, currentPage, statusFilter, toast]);

  useEffect(() => {
    loadDeposits();
  }, [loadDeposits]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const filteredDeposits = deposits; // Already filtered by the API

  const getTypeIcon = (isDebit: boolean, status: string) => {
    if (isDebit) {
      return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
    }
    return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
  };

  const getStatusBadge = (status: string, amount: number) => {
    // If amount is negative, it's a debit
    const isDebit = amount < 0;
    const displayStatus = isDebit ? "debit" : status;

    if (isDebit) {
      return (
        <Badge
          variant="destructive"
          className="flex items-center gap-1 w-fit bg-red-500/10 text-red-500 border-red-500/20 min-w-[80px] justify-center"
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
      reported: {
        variant: "secondary",
        icon: Clock,
        label: "Reported",
      },
      pending: {
        variant: "secondary",
        icon: Clock,
        label: "Pending",
      },
      confirmed: {
        variant: "default",
        icon: CheckCircle,
        label: "Confirmed",
      },
      credited: {
        variant: "default",
        icon: CheckCircle,
        label: "Credited",
        className: "bg-green-500/10 text-green-500 border-green-500/20",
      },
      rejected: {
        variant: "destructive",
        icon: XCircle,
        label: "Rejected",
      },
    };

    const config = variants[displayStatus] || {
      variant: "default" as const,
      icon: Clock,
      label: displayStatus,
      className: "",
    };
    const Icon = config.icon;

    return (
      <Badge
        variant={config.variant}
        className={`${
          config.className || ""
        } flex items-center gap-1 w-fit min-w-[80px] justify-center`}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const copyDepositCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Deposit code copied to clipboard",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Deposit History</CardTitle>
            <CardDescription className="py-3">
              Track your cryptocurrency deposits
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="reported">Reported</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="credited">Credited</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={loadDeposits}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
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
                    <TableHead>Currency</TableHead>
                    <TableHead>USD Value</TableHead>
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
        ) : filteredDeposits.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Deposits Yet</h3>
            <p className="text-sm text-muted-foreground">
              Your deposit history will appear here once you make a deposit
            </p>
            {statusFilter !== "all" && (
              <Button
                variant="link"
                onClick={() => setStatusFilter("all")}
                className="mt-2"
              >
                View all deposits
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {loading ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  <>
                    Showing {filteredDeposits.length} of {totalCount} deposit
                    {totalCount !== 1 ? "s" : ""}
                    {totalPages > 1 &&
                      ` (Page ${currentPage} of ${totalPages})`}
                  </>
                )}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadDeposits}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
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
                    <TableHead>Currency</TableHead>
                    <TableHead>USD Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? // Show skeleton rows while loading/refreshing
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
                    : filteredDeposits.map((deposit) => {
                        const isDebit = deposit.amount < 0;
                        const displayAmount = Math.abs(deposit.amount);
                        const displayAmountUsd = Math.abs(
                          deposit.amountUsd || 0
                        );
                        const displayType = isDebit ? "debit" : "deposit";

                        return (
                          <TableRow key={deposit.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTypeIcon(isDebit, deposit.status)}
                                <span className="font-medium capitalize">
                                  {displayType}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div
                                className={`font-mono font-semibold ${
                                  isDebit ? "text-red-500" : "text-green-500"
                                }`}
                              >
                                {isDebit ? "-" : "+"}
                                {formatBalance(displayAmount)}{" "}
                                {deposit.currency}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="font-mono text-xs"
                              >
                                {deposit.currency}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold">
                                ${displayAmountUsd.toFixed(2)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(deposit.status, deposit.amount)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {(() => {
                                  try {
                                    return format(
                                      new Date(deposit.createdAt),
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
                                    return format(
                                      new Date(deposit.createdAt),
                                      "HH:mm"
                                    );
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => {
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
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    }
                  )}

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
        )}
      </CardContent>
    </Card>
  );
};

export default UserDepositHistory;
