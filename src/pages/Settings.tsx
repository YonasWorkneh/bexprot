import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const updatePassword = useAuthStore((state) => state.updatePassword);
  const updatePreferences = useAuthStore((state) => state.updatePreferences);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [priceAlerts, setPriceAlerts] = useState(false);
  const [tradeNotifications, setTradeNotifications] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);

  // Load preferences from user
  useEffect(() => {
    if (user?.preferences) {
      setPriceAlerts(user.preferences.priceAlerts || false);
      setTradeNotifications(user.preferences.tradeNotifications || false);
      setEmailNotifications(user.preferences.emailNotifications || false);
    }
  }, [user]);

  const handlePasswordUpdate = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsUpdating(true);
    const result = await updatePassword(newPassword);
    setIsUpdating(false);

    if (result.success) {
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error(result.error || "Failed to update password");
    }
  };

  const handlePreferenceChange = async (key: string, value: boolean) => {
    const newPreferences = {
      priceAlerts,
      tradeNotifications,
      emailNotifications,
      [key]: value,
    };

    const result = await updatePreferences(newPreferences);
    if (result.success) {
      toast.success("Preferences updated");
    } else {
      toast.error(result.error || "Failed to update preferences");
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      const result = await deleteAccount();
      if (result.success) {
        toast.success("Account deleted successfully");
        navigate("/auth");
      } else {
        toast.error(result.error || "Failed to delete account");
      }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Security</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background border-border"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background border-border"
              />
            </div>
            <Button
              onClick={handlePasswordUpdate}
              disabled={isUpdating}
              className="bg-primary text-foreground hover:bg-primary/90"
            >
              {isUpdating ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground">Price Alerts</div>
                <div className="text-sm text-muted-foreground">Get notified when prices change</div>
              </div>
              <Switch
                checked={priceAlerts}
                onCheckedChange={(val) => {
                  setPriceAlerts(val);
                  handlePreferenceChange('priceAlerts', val);
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground">Trade Notifications</div>
                <div className="text-sm text-muted-foreground">Notifications for trade execution</div>
              </div>
              <Switch
                checked={tradeNotifications}
                onCheckedChange={(val) => {
                  setTradeNotifications(val);
                  handlePreferenceChange('tradeNotifications', val);
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground">Email Notifications</div>
                <div className="text-sm text-muted-foreground">Receive updates via email</div>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={(val) => {
                  setEmailNotifications(val);
                  handlePreferenceChange('emailNotifications', val);
                }}
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">API Keys</h2>
          <p className="text-muted-foreground mb-4">Manage API keys for external integrations</p>
          
          <div className="space-y-4">
            {user?.preferences?.apiKeys && user.preferences.apiKeys.length > 0 ? (
                <div className="space-y-2">
                    {user.preferences.apiKeys.map((keyItem, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border">
                            <div className="flex flex-col">
                                <span className="font-mono text-sm">{keyItem.key}</span>
                                <span className="text-xs text-muted-foreground">Created: {new Date(keyItem.createdAt).toLocaleDateString()}</span>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                    navigator.clipboard.writeText(keyItem.key);
                                    toast.success("API Key copied to clipboard");
                                }}
                            >
                                Copy
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-sm text-muted-foreground italic">No API keys generated yet.</div>
            )}

            <Button 
                variant="outline" 
                className="border-border"
                onClick={async () => {
                    const generateApiKey = useAuthStore.getState().generateApiKey;
                    const result = await generateApiKey();
                    if (result.success) {
                        toast.success("New API Key generated");
                    } else {
                        toast.error(result.error);
                    }
                }}
            >
                Generate New API Key
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-danger mb-4">Danger Zone</h2>
          <p className="text-muted-foreground mb-4">Irreversible actions</p>
          <Button onClick={handleDeleteAccount} variant="destructive">
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
