import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Navigation from "./Navigation";
import TopBar from "./TopBar";
import PriceUpdater from "./PriceUpdater";
import BottomNav from "./BottomNav";
import SupportChatButton from "./SupportChatButton";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const MainLayout = () => {
  const { user, updatePreferences } = useAuthStore();
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasCheckedWelcome, setHasCheckedWelcome] = useState(false);
  const navigate = useNavigate();

  // Check if user has seen welcome dialog (first time visit check)
  useEffect(() => {
    if (!user || hasCheckedWelcome) return;

    // Check both user preferences and localStorage as fallback
    const hasSeenWelcomeInPrefs = user.preferences?.hasSeenWelcome === true;
    const hasSeenWelcomeInStorage =
      localStorage.getItem(`welcome_seen_${user.id}`) === "true";

    // Only show if user hasn't seen it in either place
    if (!hasSeenWelcomeInPrefs && !hasSeenWelcomeInStorage) {
      // Small delay to ensure smooth loading
      const timer = setTimeout(() => {
        setShowWelcome(true);
        setHasCheckedWelcome(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setHasCheckedWelcome(true);
    }
  }, [user, hasCheckedWelcome]);

  const markWelcomeAsSeen = async () => {
    if (!user) return;

    // Update both user preferences and localStorage
    const updatedPrefs = { ...user.preferences, hasSeenWelcome: true };

    try {
      await updatePreferences(updatedPrefs);
      // Also store in localStorage as backup
      localStorage.setItem(`welcome_seen_${user.id}`, "true");
    } catch (error) {
      console.error("Failed to update welcome preference:", error);
      // Still mark in localStorage even if DB update fails
      localStorage.setItem(`welcome_seen_${user.id}`, "true");
    }
  };

  const handleStartGuide = async () => {
    await markWelcomeAsSeen();
    setShowWelcome(false);
    navigate("/how-to-use");
  };

  const handleSkip = async () => {
    await markWelcomeAsSeen();
    setShowWelcome(false);
  };

  console.log("MainLayout Rendered");

  return (
    <SidebarProvider defaultOpen={true}>
      <PriceUpdater />
      <div className="flex min-h-screen w-full bg-background text-foreground pb-16 lg:pb-0">
        <div className="hidden lg:block">
          <Navigation />
        </div>
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0 w-full z-10">
            <div className="hidden lg:block">
              <SidebarTrigger />
            </div>
            <TopBar />
          </header>
          <main className="flex-1 overflow-auto p-0">
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
              <Outlet />
            </div>
          </main>
        </div>
        <BottomNav />
        <SupportChatButton />
      </div>

      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Welcome to Bexprot! 🚀
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Your advanced platform for crypto, stocks, and forex trading.
              Would you like a quick tour of the features?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={handleStartGuide}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Show Me How to Use
            </Button>
            <Button variant="ghost" onClick={handleSkip} className="w-full">
              Skip for Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default MainLayout;
