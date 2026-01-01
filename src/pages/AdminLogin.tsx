import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "admin@bexprot.com";
const ADMIN_PASSWORD = "mmmmmm";
const ADMIN_SESSION_KEY = "admin_session";
const ADMIN_SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

interface AdminSession {
  userId: string;
  email: string;
  expiresAt: number;
}

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for existing admin session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      setIsCheckingSession(true);

      try {
        const storedSession = localStorage.getItem(ADMIN_SESSION_KEY);
        if (storedSession) {
          try {
            const session: AdminSession = JSON.parse(storedSession);

            // Check if session is still valid
            if (session.expiresAt > Date.now()) {
              // Verify the user is still authenticated and is admin
              const {
                data: { user: authUser },
              } = await supabase.auth.getUser();

              if (authUser && authUser.id === session.userId) {
                // Verify admin role in database
                const { data: profile } = await supabase
                  .from("users")
                  .select("role")
                  .eq("id", authUser.id)
                  .maybeSingle();

                if (profile?.role?.toLowerCase() === "admin") {
                  // Valid admin session exists, redirect to dashboard
                  const from =
                    (location.state as { from?: { pathname?: string } })?.from
                      ?.pathname || "/admin/dashboard";
                  navigate(from, { replace: true });
                  return;
                }
              }
            } else {
              // Session expired, remove it
              localStorage.removeItem(ADMIN_SESSION_KEY);
            }
          } catch (e) {
            // Invalid session data, remove it
            localStorage.removeItem(ADMIN_SESSION_KEY);
          }
        }
      } catch (error) {
        console.error("Error checking admin session:", error);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkExistingSession();
  }, [navigate, location]);

  const storeAdminSession = (userId: string, userEmail: string) => {
    const adminSession: AdminSession = {
      userId,
      email: userEmail,
      expiresAt: Date.now() + ADMIN_SESSION_DURATION,
    };
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminSession));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      // Attempt login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If login fails, check if it's the specific hardcoded admin email trying to login for the first time
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          // Try to create the account if it doesn't exist
          const { data: signUpData, error: signUpError } =
            await supabase.auth.signUp({
              email,
              password,
              options: {
                data: { name: "Admin" },
              },
            });

          if (!signUpError && signUpData.user) {
            // Account created, try logging in again
            const { data: loginData, error: loginError } =
              await supabase.auth.signInWithPassword({
                email,
                password,
              });

            if (!loginError && loginData.user) {
              // Set role to admin for this new user
              await supabase
                .from("users")
                .update({ role: "admin" })
                .eq("id", loginData.user.id);

              toast.success("Admin account created successfully");
              storeAdminSession(
                loginData.user.id,
                loginData.user.email || email
              );
              setIsLoading(false);
              navigate("/admin/dashboard");
              return;
            } else {
              throw (
                loginError ||
                new Error("Failed to login after account creation")
              );
            }
          } else {
            throw signUpError || new Error("Failed to create admin account");
          }
        }
        throw error;
      }

      // For non-admin users, check if they have admin role in database
      if (data.user) {
        try {
          // Wait a bit for the trigger to create the user record if it doesn't exist yet
          // The trigger should create it automatically, but there might be a slight delay
          const { data: profile, error: profileError } = await supabase
            .from("users")
            .select("role, id, email")
            .eq("id", data.user.id)
            .maybeSingle();

          console.log("profile", profile);

          // Check for RLS errors - RLS violations can appear as errors OR as null data
          // RLS Error Codes:
          // - 42501: PostgreSQL permission denied
          // - PGRST301: PostgREST RLS violation
          // - Also check for null data without error (silent RLS blocking)
          const isRLSError =
            profileError?.code === "42501" || // PostgreSQL permission denied
            profileError?.code === "PGRST301" || // PostgREST RLS violation
            profileError?.message
              ?.toLowerCase()
              .includes("permission denied") ||
            profileError?.message
              ?.toLowerCase()
              .includes("row-level security") ||
            profileError?.message?.toLowerCase().includes("policy") ||
            (!profileError && !profile); // RLS often returns null data without error

          if (isRLSError) {
            // Get auth state once for debugging
            const {
              data: { user: authUser },
            } = await supabase.auth.getUser();

            console.error("🚨 RLS ERROR DETECTED 🚨");
            console.error("RLS Error Details:", {
              code: profileError?.code,
              message: profileError?.message,
              details: profileError?.details,
              hint: profileError?.hint,
              hasError: !!profileError,
              hasData: !!profile,
              userId: data.user.id,
              authUid: authUser?.id,
              authenticated: !!authUser,
              userIdMatch: authUser?.id === data.user.id,
            });

            toast.error(
              "RLS Policy Error: Cannot access user profile. Check RLS policies."
            );

            throw new Error(
              `RLS Policy Violation: ${
                profileError?.message ||
                "No data returned (likely RLS blocking)"
              }`
            );
          }

          if (profileError) {
            console.error("Profile error details:", {
              message: profileError.message,
              details: profileError.details,
              hint: profileError.hint,
              code: profileError.code,
            });

            // If user doesn't exist in public.users, create it
            if (
              profileError.code === "PGRST116" ||
              profileError.message?.includes("No rows")
            ) {
              console.log("User record not found, creating it...");
              const { data: newProfile, error: createError } = await supabase
                .from("users")
                .insert({
                  id: data.user.id,
                  email: data.user.email || email,
                  name: data.user.user_metadata?.name || "Admin",
                  role: email === ADMIN_EMAIL ? "admin" : "user",
                })
                .select("role")
                .single();

              if (createError) {
                console.error("Failed to create user record:", createError);

                // Check if create error is also RLS
                const isCreateRLSError =
                  createError.code === "42501" ||
                  createError.code === "PGRST301" ||
                  createError.message
                    ?.toLowerCase()
                    .includes("permission denied");

                if (isCreateRLSError) {
                  console.error("🚨 RLS ERROR ON INSERT 🚨");
                  toast.error(
                    "RLS Policy Error: Cannot create user record. Check INSERT policies."
                  );
                }

                throw createError;
              }

              if (newProfile?.role?.toLowerCase() === "admin") {
                toast.success("Admin access granted");
                storeAdminSession(data.user.id, data.user.email || email);
                setIsLoading(false);
                navigate("/admin/dashboard");
                return;
              } else {
                await supabase.auth.signOut();
                toast.error("Access denied. Admin privileges required.");
                return;
              }
            }

            throw profileError;
          }

          // Check if profile is null/undefined (RLS might have blocked silently)
          if (!profile) {
            console.error(
              "🚨 RLS SUSPECTED: Query returned no error but also no data 🚨"
            );
            console.error(
              "This usually means RLS policies are blocking access"
            );
            console.error("User ID:", data.user.id);
            console.error(
              "Auth UID:",
              (await supabase.auth.getUser()).data.user?.id
            );

            toast.error(
              "Cannot access user profile. RLS policy may be blocking."
            );
            throw new Error(
              "No profile data returned - likely RLS policy blocking access"
            );
          }

          console.log("profile", profile);

          if (profile?.role?.toLowerCase() === "admin") {
            toast.success("Admin access granted");
            storeAdminSession(data.user.id, data.user.email || email);
            setIsLoading(false);
            navigate("/admin/dashboard");
            return;
          } else {
            await supabase.auth.signOut();
            toast.error("Access denied. Admin privileges required.");
          }
        } catch (roleError: unknown) {
          console.error("Role check error:", roleError);
          // If role check fails, deny access for non-admin emails
          await supabase.auth.signOut();
          toast.error("Access denied. Admin privileges required.");
          throw roleError;
        }
      } else {
        throw new Error("No user data returned");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">
            Checking admin session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
          <CardDescription>Enter admin credentials to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@bexprot.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-secondary/50 border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-secondary/50 border-input"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Access Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
