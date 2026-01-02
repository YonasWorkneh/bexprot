import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  TrendingUp,
  Shield,
  BarChart3,
  Wallet,
  Eye,
  EyeOff,
} from "lucide-react";
import logo from "@/assets/favicon.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [verificationMethod, setVerificationMethod] = useState<
    "email" | "phone" | "password"
  >("password");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    login,
    register,
    registerWithMagicLink,
    loginWithMagicLink,
    isAuthenticated,
  } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      // Small delay to allow state to settle
      const timer = setTimeout(() => {
        navigate("/");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isLogin) {
      // Login with password (existing users)
      console.log("Attempting login with:", email);
      const result = await login(email, password);
      console.log("Login result:", result);

      if (result.success) {
        console.log("Login successful, navigating to /");
        toast({
          title: "Success",
          description: "Welcome back!",
        });
        navigate("/");
      } else {
        console.error("Login failed:", result.error);
        toast({
          title: "Error",
          description: result.error || "Login failed",
          variant: "destructive",
        });
        setIsLoading(false); // Ensure local loading is off
      }
    } else {
      // Register
      if (verificationMethod === "password") {
        if (password !== confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const result = await register(name, email, password, phone);
        if (result.success) {
          toast({
            title: "Success",
            description: "Account created successfully! Please log in.",
          });
          setIsLogin(true);
        } else {
          toast({
            title: "Error",
            description: result.error || "Registration failed",
            variant: "destructive",
          });
        }
      } else {
        // Register with magic link
        const result = await registerWithMagicLink(name, email, phone);
        if (result.success) {
          toast({
            title: "Check Your Email",
            description: "We've sent you a magic link to verify your account.",
          });
          setStep("otp");
        } else {
          toast({
            title: "Error",
            description: result.error || "Registration failed",
            variant: "destructive",
          });
        }
      }
    }

    setIsLoading(false);
  };

  const handleResendMagicLink = async () => {
    setIsLoading(true);
    const result = await registerWithMagicLink(name, email, phone);
    if (result.success) {
      toast({
        title: "Link Resent",
        description: "A new magic link has been sent to your email.",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to resend magic link",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleMagicLinkLogin = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description:
          "Please enter your email address to login with magic link.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const result = await loginWithMagicLink(email);
    if (result.success) {
      toast({
        title: "Check Your Email",
        description: "We've sent you a magic link to login.",
      });
      setStep("otp");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to send magic link",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const features = [
    {
      icon: TrendingUp,
      title: "Live Trading",
      description: "Real-time market data",
    },
    { icon: Shield, title: "Secure", description: "Bank-level security" },
    { icon: BarChart3, title: "Analytics", description: "Advanced tools" },
    {
      icon: Wallet,
      title: "Wallet Support",
      description: "MetaMask integration",
    },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-background to-background p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <img src={logo} alt="Bexprot" className="w-12 h-12 rounded-xl" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Bexprot</h1>
              <p className="text-sm text-muted-foreground">
                Professional Trading Platform
              </p>
            </div>
          </div>

          <div className="space-y-8 mb-12">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Trade with <span className="text-primary">Confidence</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Access global markets 24/7 with advanced trading tools and
                real-time analytics
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-card/50 backdrop-blur border border-border rounded-xl p-6"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="text-primary" size={24} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>© 2024 Bexprot. All rights reserved.</p>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src={logo}
              alt="Bexprot"
              className="w-16 h-16 rounded-xl mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-foreground mb-2">Bexprot</h1>
            <p className="text-muted-foreground">
              Professional Trading Platform
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-muted-foreground">
                {isLogin
                  ? "Enter your credentials to access your account"
                  : "Sign up to start trading"}
              </p>
            </div>

            <div className="flex gap-2 mb-6">
              <Button
                variant={isLogin ? "default" : "outline"}
                onClick={() => {
                  setIsLogin(true);
                  setStep("form");
                }}
                className="flex-1 rounded-xl"
              >
                Login
              </Button>
              <Button
                variant={!isLogin ? "default" : "outline"}
                onClick={() => {
                  setIsLogin(false);
                  setStep("form");
                }}
                className="flex-1 rounded-xl"
              >
                Register
              </Button>
            </div>

            {step === "form" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="flex gap-2 mb-4">
                    <Button
                      type="button"
                      variant={
                        verificationMethod === "email" ? "default" : "outline"
                      }
                      onClick={() => setVerificationMethod("email")}
                      className="flex-1 text-xs"
                      size="sm"
                    >
                      Magic Link
                    </Button>
                    <Button
                      type="button"
                      variant={
                        verificationMethod === "password"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => setVerificationMethod("password")}
                      className="flex-1 text-xs"
                      size="sm"
                    >
                      Password
                    </Button>
                  </div>
                )}

                {!isLogin && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Full Name
                    </label>
                    <Input
                      placeholder="John Trader"
                      className="bg-background border-border rounded-xl h-11"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    className="bg-background border-border rounded-xl h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                {!isLogin && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Phone Number (Optional)
                    </label>
                    <Input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      className="bg-background border-border rounded-xl h-11"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                )}

                {!isLogin && verificationMethod === "password" && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          className="bg-background border-border rounded-xl h-11 pr-10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          className="bg-background border-border rounded-xl h-11 pr-10"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {isLogin && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="bg-background border-border rounded-xl h-11 pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {isLogin && (
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() => navigate("/forgot-password")}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {isLogin && (
                  <div className="flex flex-col gap-3">
                    <Button
                      type="submit"
                      className="w-full bg-primary text-foreground hover:bg-primary/90 rounded-xl h-11 font-semibold"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login with Password"
                      )}
                    </Button>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-xl h-11 font-semibold"
                      onClick={handleMagicLinkLogin}
                      disabled={isLoading}
                    >
                      Login with Magic Link
                    </Button>
                  </div>
                )}

                {!isLogin && (
                  <Button
                    type="submit"
                    className="w-full bg-primary text-foreground hover:bg-primary/90 rounded-xl h-11 font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Magic Link...
                      </>
                    ) : verificationMethod === "password" ? (
                      "Sign Up"
                    ) : (
                      "Sign Up with Magic Link"
                    )}
                  </Button>
                )}
              </form>
            ) : (
              <div className="space-y-6">
                <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="text-primary" size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    Check your email
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We've sent a <strong>magic link</strong> to{" "}
                    <span className="text-foreground font-medium">{email}</span>
                    . Click the link in the email to instantly verify your
                    account and sign in.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl h-11"
                    onClick={handleResendMagicLink}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resending...
                      </>
                    ) : (
                      "Resend Magic Link"
                    )}
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Checked your spam folder? Emails can sometimes take a minute
                    to arrive.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => setStep("form")}
                  disabled={isLoading}
                >
                  Back to Registration
                </Button>
              </div>
            )}

            {!isLogin && (
              <div className="mt-6 p-4 bg-muted/50 rounded-xl">
                <p className="text-xs text-muted-foreground text-center">
                  By creating an account, you agree to our Terms of Service and
                  Privacy Policy
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center pt-2">🔒 All data is stored securely on our backend</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
