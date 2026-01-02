import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Settings, ShieldAlert, Zap, Ban, Scale } from "lucide-react";
import {
  getSystemSettings,
  updateSystemSetting,
  type SystemSettings,
} from "@/lib/adminSettings";
import { supabase } from "@/lib/supabase";

const AdminSettingsPanel = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    const data = await getSystemSettings();
    setSettings(data);
    setLoading(false);
  };

  useEffect(() => {
    // Initial load
    loadSettings();

    // Realtime subscription
    const channel = supabase
      .channel("admin_settings_realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "system_settings" },
        (payload) => {
          console.log("Settings updated:", payload);
          // Update local state with the new value
          if (payload.new) {
            // The payload is the full row now
            const newSettings = payload.new as SystemSettings;
            setSettings((prev) => ({
              ...prev,
              ...newSettings,
            }));
            // Don't show toast - admin knows they just changed it
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleToggleChange = async (checked: boolean) => {
    if (!settings) return;

    console.log("[Admin Settings] Contract trading toggle:", {
      from: settings.contract_trading_enabled,
      to: checked,
    });
    // Optimistic update
    setSettings({ ...settings, contract_trading_enabled: checked });

    const success = await updateSystemSetting(
      "contract_trading_enabled",
      checked
    );
    console.log(
      "[Admin Settings] Toggle update result:",
      success ? "SUCCESS" : "FAILED"
    );

    if (success) {
      toast.success(`Contract trading ${checked ? "enabled" : "disabled"}`);
    } else {
      toast.error("Failed to update setting");
      // Revert
      setSettings({ ...settings, contract_trading_enabled: !checked });
    }
  };

  const handleModeChange = async (value: string) => {
    if (!settings) return;
    const mode = value as SystemSettings["contract_outcome_mode"];

    console.log("[Admin Settings] Mode change requested:", {
      from: settings.contract_outcome_mode,
      to: mode,
    });
    setSettings({ ...settings, contract_outcome_mode: mode });

    console.log("[Admin Settings] Calling updateSystemSetting...");
    const success = await updateSystemSetting("contract_outcome_mode", mode);
    console.log(
      "[Admin Settings] updateSystemSetting result:",
      success ? "SUCCESS" : "FAILED"
    );

    if (success) {
      toast.success(
        `Contract outcome mode set to: ${mode.replace("_", " ").toUpperCase()}`
      );
    } else {
      toast.error("Failed to update setting");
      // Revert (would need previous state, but for now just reload)
      console.log("[Admin Settings] Reverting changes...");
      loadSettings();
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading settings...
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load settings. Please ensure the database is set up.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card shadow-lg">
        <CardHeader className="border-b border-border/50 bg-muted/20">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            System Configuration
          </CardTitle>
          <CardDescription>
            Manage global application settings and trading controls
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {/* Contract Trading Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Zap
                  className={`w-4 h-4 ${
                    settings.contract_trading_enabled
                      ? "text-yellow-500"
                      : "text-muted-foreground"
                  }`}
                />
                Contract Trading Feature
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable the contract trading functionality for all
                users.
                {settings.contract_trading_enabled ? (
                  <span className="text-green-500 ml-1 font-medium">
                    Currently Active
                  </span>
                ) : (
                  <span className="text-red-500 ml-1 font-medium">
                    Currently Disabled
                  </span>
                )}
              </p>
            </div>
            <Switch
              checked={settings.contract_trading_enabled}
              onCheckedChange={handleToggleChange}
            />
          </div>

          {/* Win/Loss Mode */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">
                Contract Outcome Control
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Control the outcome of contract trades.{" "}
              <span className="text-red-500 font-bold">
                WARNING: This affects all users immediately.
              </span>
            </p>

            <RadioGroup
              value={settings.contract_outcome_mode}
              onValueChange={handleModeChange}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="fair"
                  id="mode-fair"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="mode-fair"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-muted/50 hover:text-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                >
                  <Scale className="mb-3 h-6 w-6 text-blue-500" />
                  <div className="font-semibold">Fair Mode</div>
                  <div className="text-xs text-muted-foreground text-center mt-1">
                    Standard market behavior. Wins/Losses based on real price
                    movement.
                  </div>
                </Label>
              </div>

              <div>
                <RadioGroupItem
                  value="always_win"
                  id="mode-win"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="mode-win"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-muted/50 hover:text-foreground peer-data-[state=checked]:border-green-500 [&:has([data-state=checked])]:border-green-500 cursor-pointer transition-all"
                >
                  <Zap className="mb-3 h-6 w-6 text-green-500" />
                  <div className="font-semibold text-green-500">Always Win</div>
                  <div className="text-xs text-muted-foreground text-center mt-1">
                    Users will ALWAYS win their contracts, regardless of price
                    action.
                  </div>
                </Label>
              </div>

              <div>
                <RadioGroupItem
                  value="always_loss"
                  id="mode-loss"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="mode-loss"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-muted/50 hover:text-foreground peer-data-[state=checked]:border-red-500 [&:has([data-state=checked])]:border-red-500 cursor-pointer transition-all"
                >
                  <Ban className="mb-3 h-6 w-6 text-red-500" />
                  <div className="font-semibold text-red-500">Always Loss</div>
                  <div className="text-xs text-muted-foreground text-center mt-1">
                    Users will ALWAYS lose their contracts, regardless of price
                    action.
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettingsPanel;
