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
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const checkAdminSession = async () => {
      if (!isMounted) return;

      // Quick check: if we have a valid session in localStorage and user object is already loaded with admin role
      const storedSession = localStorage.getItem(ADMIN_SESSION_KEY);
      if (storedSession && user && user.role === "admin") {
        try {
          const session: AdminSession = JSON.parse(storedSession);
          if (session.expiresAt > Date.now() && session.userId === user.id) {
            // Quick path: valid session + user is admin = grant access immediately
            if (isMounted) {
              setIsAdmin(true);
              setIsCheckingAdmin(false);
            }
            return;
          }
        } catch (e) {
          // Invalid session, continue with full check
        }
      }

      // Full verification check
      if (!isMounted) return;
      setIsCheckingAdmin(true);

      try {
        // 1. Check localStorage for admin session first
        if (storedSession) {
          try {
            const session: AdminSession = JSON.parse(storedSession);

            // Check if session is still valid
            if (session.expiresAt > Date.now()) {
              // Verify the user is still authenticated and is admin
              const {
                data: { user: authUser },
              } = await supabase.auth.getUser();

              if (!isMounted) return;

              if (authUser && authUser.id === session.userId) {
                // Verify admin role in database
                const { data: profile } = await supabase
                  .from("users")
                  .select("role")
                  .eq("id", authUser.id)
                  .maybeSingle();

                if (!isMounted) return;

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

        // 2. If no valid stored session was found, check if user is authenticated and is admin
        if (!isMounted) return;

        // Check if user object is available (might be loading after login)
        if (isAuthenticated && user) {
          if (user.role === "admin") {
            // Store admin session
            const adminSession: AdminSession = {
              userId: user.id,
              email: user.email,
              expiresAt: Date.now() + ADMIN_SESSION_DURATION,
            };
            localStorage.setItem(
              ADMIN_SESSION_KEY,
              JSON.stringify(adminSession)
            );
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else if (!storedSession) {
          // No stored session and no authenticated user - wait a bit more for user to load
          // This handles the case where we just logged in but user object hasn't loaded yet
          if (isAuthenticated && !user) {
            // User is authenticated but user object not loaded yet, wait a bit
            timeoutId = setTimeout(() => {
              if (isMounted) {
                checkAdminSession();
              }
            }, 300);
            return;
          }
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin session:", error);
        if (isMounted) {
          setIsAdmin(false);
        }
      } finally {
        if (isMounted && !timeoutId) {
          setIsCheckingAdmin(false);
        }
      }
    };

    // Wait for auth to finish loading before checking admin session
    if (!isLoading) {
      // Small delay to allow auth store to fully populate user object after login
      timeoutId = setTimeout(() => {
        checkAdminSession();
      }, 50);
    }

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthenticated, user, isLoading]);

  if (isLoading || isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">
            Verifying admin access...
          </p>
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
