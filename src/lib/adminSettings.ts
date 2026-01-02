import { supabase } from "./supabase";

export interface SystemSettings {
  contract_trading_enabled: boolean;
  contract_outcome_mode: "fair" | "always_win" | "always_loss";
  withdrawal_enabled?: boolean;
  min_deposit_amount?: number;
  min_withdrawal_amount?: number;
  maintenance_mode?: boolean;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  contract_trading_enabled: true,
  contract_outcome_mode: "fair",
  withdrawal_enabled: true,
  min_deposit_amount: 10,
  min_withdrawal_amount: 20,
  maintenance_mode: false,
};

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    console.log("[Admin Settings] Fetching system settings from database...");
    const { data, error } = await supabase
      .from("system_settings")
      .select("*")
      .single();

    if (error) {
      console.error("[Admin Settings] Error fetching system settings:", error);
      console.error("[Admin Settings] Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      // If table doesn't exist or no row exists, return defaults
      if (error.code === "PGRST116" || error.message.includes("no rows")) {
        console.warn(
          "[Admin Settings] No settings found, using defaults. Run init_system_settings.sql to create table."
        );
      }
      return DEFAULT_SETTINGS;
    }

    console.log("[Admin Settings] Settings loaded successfully:", data);
    // Merge with defaults to ensure all fields exist
    return { ...DEFAULT_SETTINGS, ...data };
  } catch (error) {
    console.error("[Admin Settings] Exception in getSystemSettings:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSystemSetting(
  key: keyof SystemSettings,
  value: SystemSettings[keyof SystemSettings]
): Promise<boolean> {
  try {
    // We assume there is only one row in system_settings.
    // First, try to get the existing row
    const { data: existingData, error: fetchError } = await supabase
      .from("system_settings")
      .select("*")
      .limit(1)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid throwing on no rows

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 is "no rows returned", which is fine
      console.error(
        "[Admin Settings] Error fetching existing settings:",
        fetchError
      );
      throw fetchError;
    }

    if (existingData && existingData.id) {
      // Update the existing row
      const { error: updateError } = await supabase
        .from("system_settings")
        .update({
          [key]: value,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingData.id);

      if (updateError) {
        console.error(
          `[Admin Settings] Error updating setting ${key}:`,
          updateError
        );
        throw updateError;
      }

      console.log(`[Admin Settings] Successfully updated ${key} to ${value}`);
      return true;
    } else {
      // No row exists, insert a new one with defaults + the new value
      const { error: insertError } = await supabase
        .from("system_settings")
        .insert({
          ...DEFAULT_SETTINGS,
          [key]: value,
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error(
          `[Admin Settings] Error inserting setting ${key}:`,
          insertError
        );
        throw insertError;
      }

      console.log(
        `[Admin Settings] Successfully inserted new settings with ${key} = ${value}`
      );
      return true;
    }
  } catch (error) {
    console.error(`[Admin Settings] Error updating setting ${key}:`, error);
    return false;
  }
}

export async function initSystemSettings(): Promise<void> {
  // Ensure default settings exist
  const { data, error } = await supabase
    .from("system_settings")
    .select("id")
    .limit(1);

  if (!data || data.length === 0) {
    await supabase.from("system_settings").insert(DEFAULT_SETTINGS);
  }
}
