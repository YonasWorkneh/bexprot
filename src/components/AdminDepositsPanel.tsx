import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle,
  XCircle,
  ArrowDownCircle,
  Copy,
  FileText,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { creditUserDeposit, rejectDeposit } from "@/lib/cryptoDepositService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CryptoDeposit {
  id: string;
  user_id: string;
  deposit_code: string;
  currency: string;
  deposit_address: string;
  transaction_hash: string | null;
  amount: number;
  amount_usd: number;
  status: "reported" | "pending" | "confirmed" | "credited" | "rejected";
  created_at: string;
  screenshot_url?: string;
  user?: {
    email: string;
    name: string;
  };
}

const AdminDepositsPanel = () => {
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  // Fetch deposits with React Query
  const {
    data: deposits = [],
    isLoading,
    isRefetching: isRefreshing,
    refetch: refetchDeposits,
  } = useQuery<CryptoDeposit[]>({
    queryKey: ["admin-crypto-deposits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crypto_deposits")
        .select("*, user:users!user_id(email, name)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Admin Deposits] Query error:", error);
        console.error("[Admin Deposits] Error details:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        toast.error("Failed to fetch deposits: " + error.message);
        throw error;
      }

      console.log(
        "[Admin Deposits] Query SUCCESS - found",
        data?.length || 0,
        "deposits"
      );
      const depositsWithUsers = (data || []).map((d: CryptoDeposit) => ({
        ...d,
        user: d.user,
      }));
      console.log(
        "[Admin Deposits] Setting deposits state:",
        depositsWithUsers
      );
      return depositsWithUsers;
    },
    staleTime: 1000 * 5, // 5 seconds stale time
    refetchInterval: 10000, // Auto-refetch every 10 seconds
    retry: 2,
  });

  useEffect(() => {
    // Realtime subscription
    const channel = supabase
      .channel("admin_crypto_deposits_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "crypto_deposits" },
        () => {
          console.log("Crypto deposit change detected, refreshing...");
          refetchDeposits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchDeposits]);

  const handleStatusUpdate = async (
    deposit: CryptoDeposit,
    action: "approve" | "reject"
  ) => {
    try {
      // Get admin ID (current user)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in as admin");
        return;
      }

      if (action === "approve") {
        // Credit the user
        const result = await creditUserDeposit(
          deposit.id,
          user.id,
          1,
          "Admin approved via panel"
        );
        if (result.success) {
          toast.success(
            `✅ Deposit approved! $${deposit.amount_usd} credited to user.`
          );
        } else {
          throw new Error(result.error);
        }
      } else if (action === "reject") {
        const result = await rejectDeposit(
          deposit.id,
          user.id,
          "Rejected by admin via panel"
        );
        if (result.success) {
          toast.success(`Deposit rejected`);
        } else {
          throw new Error(result.error);
        }
      }

      refetchDeposits();
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update status: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card className="border-border bg-card shadow-lg">
        <CardHeader className="border-b border-border/50 bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5 text-primary" />
              Deposit Requests
              <Badge variant="secondary" className="ml-2">
                {
                  deposits.filter(
                    (d) => d.status === "pending" || d.status === "reported"
                  ).length
                }{" "}
                Pending
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchDeposits()}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6">User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Currency / Address</TableHead>
                <TableHead>TX Hash / Proof</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.map((deposit) => (
                <TableRow
                  key={deposit.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="pl-6 font-medium">
                    <div>
                      <div className="font-semibold">
                        {deposit.user?.name || "Unknown User"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {deposit.user?.email || "No Email"}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                        {deposit.deposit_code}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono font-bold">
                      $
                      {deposit.amount_usd?.toFixed(2) ||
                        deposit.amount?.toFixed(2)}
                    </div>
                    {deposit.amount_usd !== deposit.amount && (
                      <div className="text-xs text-muted-foreground">
                        {deposit.amount} {deposit.currency}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-semibold">{deposit.currency}</span>
                      {deposit.deposit_address && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-1 rounded select-all max-w-[150px] truncate">
                            {deposit.deposit_address}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                deposit.deposit_address
                              );
                              toast.success("Address copied");
                            }}
                            title="Copy Address"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {deposit.transaction_hash ? (
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-1 rounded select-all max-w-[120px] truncate">
                          {deposit.transaction_hash}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              deposit.transaction_hash!
                            );
                            toast.success("TX hash copied");
                          }}
                          title="Copy TX Hash"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                    {deposit.screenshot_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 text-xs flex items-center gap-1 h-6 w-full justify-center"
                        onClick={() =>
                          setSelectedProof(deposit.screenshot_url!)
                        }
                      >
                        <FileText className="w-3 h-3" />
                        View Proof
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(deposit.created_at).toLocaleDateString()}
                      <div className="text-xs opacity-70">
                        {new Date(deposit.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`capitalize ${
                        deposit.status === "credited" ||
                        deposit.status === "confirmed"
                          ? "bg-green-500/15 text-green-600 border-green-200"
                          : deposit.status === "pending" ||
                            deposit.status === "reported"
                          ? "bg-yellow-500/15 text-yellow-600 border-yellow-200"
                          : "bg-red-500/15 text-red-600 border-red-200"
                      }`}
                      variant="outline"
                    >
                      {deposit.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    {(deposit.status === "pending" ||
                      deposit.status === "reported") && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-200"
                          onClick={() => handleStatusUpdate(deposit, "reject")}
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleStatusUpdate(deposit, "approve")}
                          title="Approve & Credit"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {deposits.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No deposit requests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedProof}
        onOpenChange={(open) => !open && setSelectedProof(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Proof of Payment</DialogTitle>
          </DialogHeader>
          {selectedProof && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black/5">
              <img
                src={selectedProof}
                alt="Proof of Payment"
                className="object-contain w-full h-full"
              />
              <div className="absolute top-2 right-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(selectedProof, "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Open Original
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminDepositsPanel;
