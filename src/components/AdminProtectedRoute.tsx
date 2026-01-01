import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const ADMIN_SESSION_KEY = "admin_session";
const ADMIN_SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

interface AdminSession {
  userId: string;
  email: string;
  expiresAt: number;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAdminSession = async () => {
      setIsCheckingAdmin(true);

      try {
        // 1. Check localStorage for admin session
        const storedSession = localStorage.getItem(ADMIN_SESSION_KEY);
        if (storedSession) {
          try {
            const session: AdminSession = JSON.parse(storedSession);
            
            // Check if session is still valid
            if (session.expiresAt > Date.now()) {
              // Verify the user is still authenticated and is admin
              const { data: { user: authUser } } = await supabase.auth.getUser();
              
              if (authUser && authUser.id === session.userId) {
                // Verify admin role in database
                const { data: profile } = await supabase
                  .from("users")
                  .select("role")
                  .eq("id", authUser.id)
                  .maybeSingle();

                if (profile?.role?.toLowerCase() === "admin") {
                  setIsAdmin(true);
                  setIsCheckingAdmin(false);
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

        // 2. If no valid session, check if user is authenticated and is admin
        if (isAuthenticated && user) {
          if (user.role === "admin") {
            // Store admin session
            const adminSession: AdminSession = {
              userId: user.id,
              email: user.email,
              expiresAt: Date.now() + ADMIN_SESSION_DURATION,
            };
            localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminSession));
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin session:", error);
        setIsAdmin(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    // Wait for auth to finish loading before checking admin session
    if (!isLoading) {
      checkAdminSession();
    }
  }, [isAuthenticated, user, isLoading]);

  if (isLoading || isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    // Store the attempted location to redirect back after login
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;

