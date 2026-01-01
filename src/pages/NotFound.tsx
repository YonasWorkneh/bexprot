import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Home, TrendingUp, Wallet, ArrowLeft, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/markets?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="text-center max-w-2xl w-full relative z-10">
        {/* Glitchy 404 */}
        <div className="mb-8 relative inline-block">
          <h1 className="text-[120px] md:text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-secondary leading-none select-none">
            404
          </h1>
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center opacity-50 blur-sm animate-pulse">
            <h1 className="text-[120px] md:text-[180px] font-black text-primary/20 leading-none">
              404
            </h1>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-2">
            <AlertTriangle size={14} />
            <span>Page Not Found</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">
            Lost in the Blockchain?
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            The block you are looking for has not been mined yet or does not exist.
          </p>
          <p className="text-xs text-muted-foreground/40 font-mono bg-secondary/30 inline-block px-2 py-1 rounded">
            Route: {location.pathname}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-10 max-w-md mx-auto">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
            <div className="relative flex items-center bg-card rounded-xl border border-border">
              <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search markets, assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 bg-transparent border-none focus-visible:ring-0 text-base"
              />
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto mb-12">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            size="lg"
            className="rounded-xl h-12 border-border hover:bg-secondary/50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button
            onClick={() => navigate("/trade")}
            size="lg"
            className="rounded-xl h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Start Trading
          </Button>
        </div>

        {/* Quick Links */}
        <div className="flex justify-center gap-6 text-sm text-muted-foreground">
          <button onClick={() => navigate("/")} className="hover:text-primary transition-colors flex items-center gap-1">
            <Home size={14} /> Home
          </button>
          <button onClick={() => navigate("/wallet")} className="hover:text-primary transition-colors flex items-center gap-1">
            <Wallet size={14} /> Wallet
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
