import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import Index from "@/pages/index";

const HomeRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Otherwise, show the landing page
  return <Index />;
};

export default HomeRoute;

