import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import { useAuthStore } from "./store/authStore";
import { useNotificationStore } from "./store/notificationStore";
import { useTradingStore } from "./store/tradingStore";
import { useWalletStore } from "./store/walletStore";
import MainLayout from "./components/MainLayout";
import ContractTimer from "./components/ContractTimer";
import SystemAnnouncementModal from "./components/SystemAnnouncementModal";
import { APP_VERSION } from "./config/version";
import { supabase } from "@/lib/supabase";

// Lazy load pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Trade = lazy(() => import("./pages/Trade"));
const Markets = lazy(() => import("./pages/Markets"));
const CryptoMarkets = lazy(() => import("./pages/CryptoMarkets"));
const AssetDetail = lazy(() => import("./pages/AssetDetail"));
const CryptoDetail = lazy(() => import("./pages/CryptoDetail"));
const Stocks = lazy(() => import("./pages/Stocks"));
const StockDetail = lazy(() => import("./pages/StockDetail"));
const Forex = lazy(() => import("./pages/Forex"));
const ForexDetail = lazy(() => import("./pages/ForexDetail"));
const Commodities = lazy(() => import("./pages/Commodities"));
const CommodityDetail = lazy(() => import("./pages/CommodityDetail"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const KYC = lazy(() => import("./pages/KYC"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotificationDetail = lazy(() => import("./pages/NotificationDetail"));
const TransactionDetail = lazy(() => import("./pages/TransactionDetail"));
const HowToUse = lazy(() => import("./pages/HowToUse"));
const TestDeposit = lazy(() => import("./pages/TestDeposit"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const checkSession = useAuthStore((state) => state.checkSession);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const fetchData = useTradingStore((state) => state.fetchData);
  const subscribeToChanges = useTradingStore(
    (state) => state.subscribeToChanges
  );

  // Initialize auth session on mount
  useEffect(() => {
    checkSession();

    // Failsafe: If checkSession takes too long (e.g. network hang), force loading to false
    const timer = setTimeout(() => {
      if (useAuthStore.getState().isLoading) {
        console.warn("App: Session check timed out, forcing loading=false");
        useAuthStore.setState({ isLoading: false });
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timer);
  }, [checkSession]);

  // Version check: Auto-reload and Nuke Cache if new version is deployed
  useEffect(() => {
    const storedVersion = localStorage.getItem("app_version");

    if (storedVersion && storedVersion !== APP_VERSION) {
      console.log(
        `[CacheBuster] Version mismatch: stored=${storedVersion}, current=${APP_VERSION}. NUKING CACHE...`
      );

      // 1. Clear LocalStorage (Critical for stale zustand state)
      // We purposefully don't clear everything to avoid completely resetting the user's browser,
      // but we clear keys that might be causing issues.
      localStorage.removeItem("wallet-storage"); // The one we just added persistence for
      localStorage.removeItem("trading-storage"); // Just in case
      localStorage.setItem("app_version", APP_VERSION);

      // 2. Clear SessionStorage
      sessionStorage.clear();

      // 3. Clear Browser Caches (Service Workers, etc)
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            console.log(`[CacheBuster] Deleting cache: ${name}`);
            caches.delete(name);
          });
        });
      }

      // 4. Unregister Service Workers
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            console.log(
              `[CacheBuster] Unregistering SW: ${registration.scope}`
            );
            registration.unregister();
          });
        });
      }

      // 5. Force hard reload (bypass browser cache)
      console.log("[CacheBuster] Reloading...");
      window.location.reload();
    } else if (!storedVersion) {
      // First time visit, just store the version
      localStorage.setItem("app_version", APP_VERSION);
    }
  }, []);

  // Fetch data and subscribe to changes when authenticated
  // Fetch data and subscribe to changes when authenticated and user is available
  useEffect(() => {
    const user = useAuthStore.getState().user;

    if (isAuthenticated && user) {
      console.log("App: Authenticated & User Ready under ID:", user.id);

      // 1. Reconnect External Wallet (MetaMask/Phantom) persistence
      useWalletStore.getState().reconnect();

      // 2. Trading Store - Fetch initial data
      fetchData();
      const unsubscribeTrading = subscribeToChanges();

      // 3. Wallet Store - Fetch transactions
      const { fetchUserTransactions, subscribeToChanges: subscribeToWallet } =
        useWalletStore.getState();
      fetchUserTransactions();
      const unsubscribeWallet = subscribeToWallet();

      // 4. Notification Store
      const { fetchNotifications, subscribeToNotifications } =
        useNotificationStore.getState();
      fetchNotifications();
      const unsubscribeNotifications = subscribeToNotifications();

      return () => {
        unsubscribeTrading();
        unsubscribeWallet();
        unsubscribeNotifications();
      };
    } else if (isAuthenticated && !user) {
      console.warn("App: Authenticated but user object is missing, waiting...");
    }
  }, [isAuthenticated, fetchData, subscribeToChanges]);

  console.log(
    "App Render: isLoading=",
    isLoading,
    "isAuthenticated=",
    isAuthenticated
  );

  if (isLoading) {
    console.log("App: Rendering Loading Spinner");
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  console.log("App: Rendering Main Content");
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <ContractTimer />
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-background">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  </div>
                </div>
              }
            >
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <AdminProtectedRoute>
                      <Admin />
                    </AdminProtectedRoute>
                  }
                />
                <Route element={<MainLayout />}>
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/trade"
                    element={
                      <ProtectedRoute>
                        <Trade />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/markets"
                    element={
                      <ProtectedRoute>
                        <Markets />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/markets/crypto"
                    element={
                      <ProtectedRoute>
                        <CryptoMarkets />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/crypto/:id"
                    element={
                      <ProtectedRoute>
                        <CryptoDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/asset/:id"
                    element={
                      <ProtectedRoute>
                        <AssetDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/stocks"
                    element={
                      <ProtectedRoute>
                        <Stocks />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/stock/:symbol"
                    element={
                      <ProtectedRoute>
                        <StockDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/forex"
                    element={
                      <ProtectedRoute>
                        <Forex />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/forex/:pair"
                    element={
                      <ProtectedRoute>
                        <ForexDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/commodities"
                    element={
                      <ProtectedRoute>
                        <Commodities />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/commodity/:id"
                    element={
                      <ProtectedRoute>
                        <CommodityDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/wallet"
                    element={
                      <ProtectedRoute>
                        <Wallet />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/kyc"
                    element={
                      <ProtectedRoute>
                        <KYC />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <Notifications />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications/:id"
                    element={
                      <ProtectedRoute>
                        <NotificationDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/transaction/:id"
                    element={
                      <ProtectedRoute>
                        <TransactionDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/how-to-use"
                    element={
                      <ProtectedRoute>
                        <HowToUse />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/test-deposit"
                    element={
                      <ProtectedRoute>
                        <TestDeposit />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </ErrorBoundary>
          <Toaster />
          <Sonner />
          <ContractTimer />
          {/* <SystemAnnouncementModal /> */}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
