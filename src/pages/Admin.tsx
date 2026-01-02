import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle,
  XCircle,
  LogOut,
  Eye,
  FileText,
  User,
  Coins,
  ArrowUpFromLine,
  Settings,
  RefreshCw,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminDepositsPanel from "@/components/AdminDepositsPanel";
import AdminWithdrawalsPanel from "@/components/AdminWithdrawalsPanel";
import AdminSendsPanel from "@/components/AdminSendsPanel";
import AdminSettingsPanel from "@/components/AdminSettingsPanel";
import AdminSupportPanel from "@/components/AdminSupportPanel";
import { MessageCircle, Send } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name: string;
  created_at: string;
  kyc_status: "not_started" | "pending" | "verified" | "rejected";
  avatar_url: string | null;
  role: "user" | "admin";
}

interface KycSubmission {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  nationality: string;
  address_line: string;
  city: string;
  zip_code: string;
  country: string;
  id_type: string;
  id_number: string;
  id_front_url: string;
  id_back_url: string;
  selfie_url: string;
  status: string;
  submitted_at: string;
}

import { useAuthStore } from "@/store/authStore";
import { Order } from "@/store/tradingStore";

const Admin = () => {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userDetails, setUserDetails] = useState<any | null>(null); // For full details from RPC
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"credit" | "debit">("credit");
  const navigate = useNavigate();

  // Fetch users with React Query
  const {
    data: users = [],
    isLoading,
    isRefetching: isRefreshing,
    refetch: refetchUsers,
    error: usersError,
  } = useQuery<UserData[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to fetch users: " + error.message);
        throw error;
      }
      return (data || []) as UserData[];
    },
    enabled: () => {
      // Enable query if user is admin OR if there's a valid admin session in localStorage
      if (user && user.role === "admin") {
        return true;
      }
      // Check localStorage for admin session (for early query enablement)
      try {
        const adminSession = localStorage.getItem("admin_session");
        if (adminSession) {
          const session = JSON.parse(adminSession);
          return session.expiresAt > Date.now();
        }
      } catch (e) {
        // Invalid session
      }
      return false;
    },
    staleTime: 1000 * 5, // 5 seconds stale time
    refetchInterval: 10000, // Auto-refetch every 10 seconds
    retry: 2,
  });

  useEffect(() => {
    checkAdminAuth();
    // When user becomes available and is admin, ensure users are fetched
    if (user && user.role === "admin") {
      refetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkAdminAuth = async () => {
    // If user is not available yet, check localStorage session
    if (!user) {
      const adminSession = localStorage.getItem("admin_session");
      if (adminSession) {
        try {
          const session = JSON.parse(adminSession);
          if (session.expiresAt > Date.now()) {
            // Valid session exists, user object should load soon
            // Don't redirect, just wait for user to load
            // AdminProtectedRoute will handle the check
            return;
          }
        } catch (e) {
          // Invalid session
        }
      }

      // No valid session and no user, but AdminProtectedRoute will handle redirect
      // Don't redirect here to avoid conflicts
      return;
    }

    // User is loaded, verify admin role
    if (user.role !== "admin") {
      navigate("/admin");
      return;
    }

    // User is admin, React Query will handle fetching users
  };

  // Manual refresh function
  const handleRefreshUsers = () => {
    refetchUsers();
    toast.success("Refreshing users...");
  };

  // Fetch KYC details with React Query
  const {
    data: kycDetails,
    isLoading: isLoadingDetails,
    refetch: refetchKycDetails,
  } = useQuery<KycSubmission | null>({
    queryKey: ["kyc-details", selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser?.id) return null;

      const { data, error } = await supabase
        .from("kyc_submissions")
        .select("*")
        .eq("user_id", selectedUser.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        console.error("Error fetching KYC details:", error);
        throw error;
      }

      if (!data) return null;

      // Generate signed URLs for images
      const signedData = { ...data };
      const imageFields = ["id_front_url", "id_back_url", "selfie_url"];

      for (const field of imageFields) {
        const urlOrPath = data[field];
        if (urlOrPath) {
          // Extract path if it's a full URL
          let path = urlOrPath;
          if (urlOrPath.includes("/storage/v1/object/public/kyc-documents/")) {
            path = urlOrPath.split(
              "/storage/v1/object/public/kyc-documents/"
            )[1];
          }

          // Generate signed URL (valid for 1 hour)
          const { data: signedUrlData, error: signedError } =
            await supabase.storage
              .from("kyc-documents")
              .createSignedUrl(path, 3600);

          if (!signedError && signedUrlData) {
            signedData[field] = signedUrlData.signedUrl;
          }
        }
      }

      return signedData as KycSubmission;
    },
    enabled: !!selectedUser?.id && isDetailsOpen,
    staleTime: 1000 * 5, // 5 seconds stale time
    refetchInterval: 10000, // Refetch every 10 seconds
    retry: 2,
  });

  const fetchFullUserDetails = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc("get_user_full_details", {
        target_user_id: userId,
      });
      if (error) throw error;
      setUserDetails(data);
    } catch (error) {
      console.error("Error fetching full user details:", error);
      // Fallback or silent fail if RPC not exists yet
    }
  };

  const handleAdjustBalance = async (userId: string) => {
    if (!adjustAmount || isNaN(Number(adjustAmount))) {
      toast.error("Please enter a valid amount");
      return;
    }

    const amountNum = Number(adjustAmount);
    if (amountNum <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    try {
      // Get the user's USDT wallet (first wallet, ordered by created_at)
      const { data: usdtWallets, error: fetchError } = await supabase
        .from("usdt_wallets")
        .select("id, balance")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1);
      console.log("usdtWallets", usdtWallets);

      if (fetchError) throw fetchError;

      let walletId: string;
      let currentBalance: number;

      if (usdtWallets && usdtWallets.length > 0) {
        // Use existing wallet
        walletId = usdtWallets[0].id;
        currentBalance = Number(usdtWallets[0].balance || 0);
      } else {
        // Create a new USDT wallet if none exists
        const { data: newWallet, error: createError } = await supabase
          .from("usdt_wallets")
          .insert({
            user_id: userId,
            network: "USDT_TRC20",
            address: `admin_created_${userId}_${Date.now()}`,
            balance: 0,
          })
          .select("id, balance")
          .single();

        if (createError) throw createError;
        walletId = newWallet.id;
        currentBalance = 0;
      }

      // Calculate new balance based on credit/debit
      const newBalance =
        adjustType === "credit"
          ? currentBalance + amountNum
          : currentBalance - amountNum;

      // Prevent negative balance on debit
      if (adjustType === "debit" && newBalance < 0) {
        toast.error(
          `Insufficient balance. Current balance: $${currentBalance.toFixed(2)}`
        );
        return;
      }

      // Update wallet balance directly in usdt_wallets table
      const { error: updateError } = await supabase
        .from("usdt_wallets")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", walletId);

      if (updateError) throw updateError;

      // Create transaction record for audit trail
      await supabase.from("wallet_transactions").insert({
        user_id: userId,
        type: adjustType === "credit" ? "deposit" : "withdrawal",
        amount: adjustType === "credit" ? amountNum : -amountNum,
        asset: "USDT",
        status: "completed",
        timestamp: new Date().toISOString(),
      });

      toast.success(
        `Successfully ${
          adjustType === "credit" ? "credited" : "debited"
        } $${amountNum.toFixed(2)}. New balance: $${newBalance.toFixed(2)}`
      );
      setAdjustAmount("");
      fetchFullUserDetails(userId); // Refresh details
      refetchUsers(); // Refresh user list
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to adjust balance";
      toast.error("Failed to adjust balance: " + errorMessage);
    }
  };

  const handleViewDetails = async (user: UserData) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
    await fetchFullUserDetails(user.id);
    // KYC details will be fetched automatically by React Query when selectedUser changes
  };

  const updateKycStatus = async (
    userId: string,
    status: "verified" | "rejected"
  ) => {
    try {
      // Update users table
      const { error: userError } = await supabase
        .from("users")
        .update({ kyc_status: status })
        .eq("id", userId);

      if (userError) throw userError;

      // Update kyc_submissions table if exists
      if (kycDetails) {
        const { error: kycError } = await supabase
          .from("kyc_submissions")
          .update({ status: status })
          .eq("user_id", userId);

        if (kycError) throw kycError;
      }

      // Send email notification to user
      try {
        const { sendEmail } = await import("@/lib/emailService");
        const userEmail = selectedUser?.email;
        const userName = kycDetails?.full_name || selectedUser?.name || "User";

        if (userEmail) {
          if (status === "verified") {
            await sendEmail({
              to: userEmail,
              subject: "KYC Verification Approved - Bexprot",
              html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <h2 style="color: #10b981;">KYC Verification Approved! ✓</h2>
                                    <p>Dear ${userName},</p>
                                    <p>Congratulations! Your KYC verification has been approved.</p>
                                    <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                                        <p style="margin: 5px 0; color: #065f46;"><strong>Status:</strong> Verified ✓</p>
                                        <p style="margin: 5px 0; color: #065f46;"><strong>Approved:</strong> ${new Date().toLocaleString()}</p>
                                    </div>
                                    <p>You now have full access to all trading features on Bexprot, including:</p>
                                    <ul style="color: #374151;">
                                        <li>Higher trading limits</li>
                                        <li>Faster withdrawals</li>
                                        <li>Access to premium features</li>
                                    </ul>
                                    <p><a href="${
                                      window.location.origin
                                    }/dashboard" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Start Trading</a></p>
                                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                                    <p style="color: #6b7280; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
                                </div>
                            `,
              text: `Congratulations! Your KYC verification has been approved. You now have full access to all trading features on Bexprot.`,
            });
          } else {
            await sendEmail({
              to: userEmail,
              subject: "KYC Verification Update - Bexprot",
              html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <h2 style="color: #ef4444;">KYC Verification Update</h2>
                                    <p>Dear ${userName},</p>
                                    <p>We regret to inform you that your KYC verification could not be approved at this time.</p>
                                    <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                                        <p style="margin: 5px 0; color: #991b1b;"><strong>Status:</strong> Requires Attention</p>
                                        <p style="margin: 5px 0; color: #991b1b;"><strong>Reviewed:</strong> ${new Date().toLocaleString()}</p>
                                    </div>
                                    <p><strong>Common reasons for rejection:</strong></p>
                                    <ul style="color: #374151;">
                                        <li>Documents are unclear or unreadable</li>
                                        <li>Information doesn't match across documents</li>
                                        <li>Expired identification documents</li>
                                        <li>Selfie doesn't clearly show face and ID</li>
                                    </ul>
                                    <p>Please review your documents and submit a new KYC verification with clear, valid documents.</p>
                                    <p><a href="${
                                      window.location.origin
                                    }/kyc" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Resubmit KYC</a></p>
                                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                                    <p style="color: #6b7280; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
                                </div>
                            `,
              text: `Your KYC verification requires attention. Please review your documents and resubmit with clear, valid identification.`,
            });
          }
        }
      } catch (emailError) {
        console.error("Failed to send KYC status email:", emailError);
        // Don't fail the status update if email fails
      }

      toast.success(
        `User KYC ${status === "verified" ? "approved" : "rejected"}`
      );
      refetchUsers();
      refetchKycDetails(); // Refetch KYC details after status update
      setIsDetailsOpen(false);
    } catch (error: any) {
      toast.error("Failed to update status: " + error.message);
    }
  };

  const handleLogout = async () => {
    // Clear admin session from localStorage
    localStorage.removeItem("admin_session");
    await logout("/admin");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage users and KYC verification
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-6">
            <TabsTrigger value="users">
              <User className="w-4 h-4 mr-2" />
              Users & KYC
            </TabsTrigger>
            <TabsTrigger value="deposits">
              <Coins className="w-4 h-4 mr-2" />
              Deposits
            </TabsTrigger>
            <TabsTrigger value="withdrawals">
              <ArrowUpFromLine className="w-4 h-4 mr-2" />
              Withdrawals
            </TabsTrigger>
            <TabsTrigger value="sends">
              <Send className="w-4 h-4 mr-2" />
              Sends
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="support">
              <MessageCircle className="w-4 h-4 mr-2" />
              Support
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card className="border-border bg-card shadow-lg">
              <CardHeader className="border-b border-border/50 bg-muted/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Registered Users
                    <Badge variant="secondary" className="ml-2">
                      {users.length}
                    </Badge>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshUsers}
                    disabled={isRefreshing}
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-2 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-none border-0">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="pl-6">User Profile</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Joined Date</TableHead>
                        <TableHead>KYC Status</TableHead>
                        <TableHead className="text-right pr-6">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow
                          key={user.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="pl-6 font-medium">
                            <div className="flex items-center gap-3">
                              {user.avatar_url ? (
                                <img
                                  src={user.avatar_url}
                                  alt={user.name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-background shadow-sm"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold border-2 border-background shadow-sm">
                                  {user.name?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold">
                                  {user.name || "Unknown User"}
                                </div>
                                <div className="text-xs text-muted-foreground capitalize">
                                  {user.role || "user"}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{user.email}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`capitalize px-3 py-1 ${
                                user.kyc_status === "verified"
                                  ? "bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-200"
                                  : user.kyc_status === "pending"
                                  ? "bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25 border-yellow-200"
                                  : user.kyc_status === "rejected"
                                  ? "bg-red-500/15 text-red-600 hover:bg-red-500/25 border-red-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                              variant="outline"
                            >
                              {user.kyc_status === "verified" && (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              )}
                              {user.kyc_status === "pending" && (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              )}
                              {user.kyc_status === "rejected" && (
                                <XCircle className="w-3 h-3 mr-1" />
                              )}
                              {(user.kyc_status || "not_started").replace(
                                "_",
                                " "
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button
                              size="sm"
                              variant={
                                user.kyc_status === "pending"
                                  ? "default"
                                  : "outline"
                              }
                              className={
                                user.kyc_status === "pending"
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : ""
                              }
                              onClick={() => handleViewDetails(user)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              {user.kyc_status === "pending"
                                ? "Review"
                                : "Details"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {users.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-12 text-muted-foreground"
                          >
                            <div className="flex flex-col items-center justify-center">
                              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <User className="w-8 h-8 opacity-20" />
                              </div>
                              <p className="text-lg font-medium">
                                No users found
                              </p>
                              <p className="text-sm">
                                New registrations will appear here.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deposits">
            <AdminDepositsPanel />
          </TabsContent>

          <TabsContent value="withdrawals">
            <AdminWithdrawalsPanel />
          </TabsContent>

          <TabsContent value="sends">
            <AdminSendsPanel />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettingsPanel />
          </TabsContent>

          <TabsContent value="support">
            <AdminSupportPanel />
          </TabsContent>
        </Tabs>

        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Review user information and KYC documents
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="overview">Overview & KYC</TabsTrigger>
                  <TabsTrigger value="trading">Trading Activity</TabsTrigger>
                  <TabsTrigger value="finance">Finance & Wallet</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Account Info</h3>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">Name:</span>{" "}
                          {selectedUser.name}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Email:</span>{" "}
                          {selectedUser.email}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Joined:</span>{" "}
                          {new Date(selectedUser.created_at).toLocaleString()}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Status:</span>{" "}
                          {selectedUser.kyc_status}
                        </p>
                      </div>
                    </div>

                    {kycDetails && (
                      <div>
                        <h3 className="font-semibold mb-2">Personal Info</h3>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="text-muted-foreground">
                              Full Name:
                            </span>{" "}
                            {kycDetails.full_name}
                          </p>
                          <p>
                            <span className="text-muted-foreground">DOB:</span>{" "}
                            {kycDetails.date_of_birth}
                          </p>
                          <p>
                            <span className="text-muted-foreground">
                              Nationality:
                            </span>{" "}
                            {kycDetails.nationality}
                          </p>
                          <p>
                            <span className="text-muted-foreground">
                              Address:
                            </span>{" "}
                            {kycDetails.address_line}, {kycDetails.city},{" "}
                            {kycDetails.country}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {isLoadingDetails ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : kycDetails ? (
                    <div className="space-y-4">
                      <h3 className="font-semibold border-b pb-2">
                        KYC Documents
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">ID Front</p>
                          {kycDetails.id_front_url ? (
                            <a
                              href={kycDetails.id_front_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block border rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                            >
                              <img
                                src={kycDetails.id_front_url}
                                alt="ID Front"
                                className="w-full h-48 object-cover"
                              />
                            </a>
                          ) : (
                            <div className="h-48 bg-muted flex items-center justify-center text-muted-foreground text-sm">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">ID Back</p>
                          {kycDetails.id_back_url ? (
                            <a
                              href={kycDetails.id_back_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block border rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                            >
                              <img
                                src={kycDetails.id_back_url}
                                alt="ID Back"
                                className="w-full h-48 object-cover"
                              />
                            </a>
                          ) : (
                            <div className="h-48 bg-muted flex items-center justify-center text-muted-foreground text-sm">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Selfie</p>
                          {kycDetails.selfie_url ? (
                            <a
                              href={kycDetails.selfie_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block border rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                            >
                              <img
                                src={kycDetails.selfie_url}
                                alt="Selfie"
                                className="w-full h-48 object-cover"
                              />
                            </a>
                          ) : (
                            <div className="h-48 bg-muted flex items-center justify-center text-muted-foreground text-sm">
                              No Image
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                          variant="outline"
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-200"
                          onClick={() =>
                            updateKycStatus(selectedUser.id, "rejected")
                          }
                          disabled={selectedUser.kyc_status === "rejected"}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject KYC
                        </Button>
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() =>
                            updateKycStatus(selectedUser.id, "verified")
                          }
                          disabled={selectedUser.kyc_status === "verified"}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve KYC
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No KYC documents submitted yet.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="trading" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total Trades
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {userDetails?.stats?.total_trades || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                          Total Volume
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          $
                          {userDetails?.stats?.total_volume?.toFixed(2) ||
                            "0.00"}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        History
                      </h3>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Asset</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Profit</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userDetails?.trades?.map((trade: any) => (
                              <TableRow key={trade.id}>
                                <TableCell className="font-medium">
                                  {trade.asset?.toUpperCase() || "N/A"}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      trade.type === "buy"
                                        ? "default"
                                        : "destructive"
                                    }
                                    className="capitalize"
                                  >
                                    {trade.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>{trade.quantity || 0}</TableCell>
                                <TableCell>${trade.price || 0}</TableCell>
                                <TableCell>
                                  {trade.status ? (
                                    <Badge
                                      variant={
                                        trade.status === "win"
                                          ? "default"
                                          : trade.status === "loss"
                                          ? "destructive"
                                          : trade.status === "open"
                                          ? "secondary"
                                          : "outline"
                                      }
                                      className="capitalize"
                                    >
                                      {trade.status}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">Completed</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {trade.profit !== null &&
                                  trade.profit !== undefined ? (
                                    <span
                                      className={
                                        trade.profit >= 0
                                          ? "text-green-500"
                                          : "text-red-500"
                                      }
                                    >
                                      {trade.profit >= 0 ? "+" : ""}$
                                      {Number(trade.profit).toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      -
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {trade.timestamp
                                    ? new Date(trade.timestamp).toLocaleString()
                                    : trade.created_at
                                    ? new Date(
                                        trade.created_at
                                      ).toLocaleString()
                                    : "N/A"}
                                </TableCell>
                              </TableRow>
                            ))}
                            {!userDetails?.trades?.length && (
                              <TableRow>
                                <TableCell
                                  colSpan={7}
                                  className="text-center py-4 text-muted-foreground"
                                >
                                  No trade history
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-primary" />
                        Recent Trades
                      </h3>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Asset</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userDetails?.trades?.map((trade: any) => (
                              <TableRow key={trade.id}>
                                <TableCell className="font-medium">
                                  {trade.asset?.toUpperCase()}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      trade.type === "buy"
                                        ? "default"
                                        : "destructive"
                                    }
                                    className="capitalize"
                                  >
                                    {trade.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>{trade.quantity}</TableCell>
                                <TableCell>${trade.price}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {new Date(trade.timestamp).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                            {!userDetails?.trades?.length && (
                              <TableRow>
                                <TableCell
                                  colSpan={5}
                                  className="text-center py-4 text-muted-foreground"
                                >
                                  No recent trades
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="finance" className="space-y-6">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Coins className="w-4 h-4 text-primary" />
                        Wallet Balances
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {userDetails?.balances?.map((wallet: any) => (
                          <div
                            key={wallet.id}
                            className="flex items-center justify-between p-4 border rounded-lg bg-muted/10"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                $
                              </div>
                              <div>
                                <div className="font-medium">
                                  USDT Wallet ({wallet.network})
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {wallet.address}
                                </div>
                              </div>
                            </div>
                            <div className="text-xl font-bold">
                              ${wallet.balance?.toFixed(2)}
                            </div>
                          </div>
                        ))}
                        {!userDetails?.balances?.length && (
                          <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                            No wallets found
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Recent Transactions
                      </h3>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userDetails?.transactions?.map((tx: any) => (
                              <TableRow key={tx.id}>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {tx.type.replace("_", " ")}
                                  </Badge>
                                </TableCell>
                                <TableCell
                                  className={
                                    tx.amount >= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }
                                >
                                  {tx.amount >= 0 ? "+" : ""}
                                  {tx.amount.toFixed(2)} USDT
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      tx.status === "completed"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className="capitalize"
                                  >
                                    {tx.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {new Date(tx.timestamp).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                            {!userDetails?.transactions?.length && (
                              <TableRow>
                                <TableCell
                                  colSpan={4}
                                  className="text-center py-4 text-muted-foreground"
                                >
                                  No recent transactions
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-border">
                    <h3 className="font-semibold text-foreground">
                      Adjust Balance
                    </h3>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                        />
                      </div>
                      <Select
                        value={adjustType}
                        onValueChange={(value: "credit" | "debit") =>
                          setAdjustType(value)
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credit">Credit (+)</SelectItem>
                          <SelectItem value="debit">Debit (-)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => handleAdjustBalance(selectedUser.id)}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;
