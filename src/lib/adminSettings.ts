import { supabase } from './supabase';

export interface SystemSettings {
  contract_trading_enabled: boolean;
  contract_outcome_mode: 'fair' | 'always_win' | 'always_loss';
  withdrawal_enabled?: boolean;
  min_deposit_amount?: number;
  min_withdrawal_amount?: number;
  maintenance_mode?: boolean;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  contract_trading_enabled: true,
  contract_outcome_mode: 'fair',
  withdrawal_enabled: true,
  min_deposit_amount: 10,
  min_withdrawal_amount: 20,
  maintenance_mode: false,
};

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    console.log('[Admin Settings] Fetching system settings from database...');
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();

    if (error) {
      console.error('[Admin Settings] Error fetching system settings:', error);
      console.error('[Admin Settings] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      // If table doesn't exist or no row exists, return defaults
      if (error.code === 'PGRST116' || error.message.includes('no rows')) {
        console.warn('[Admin Settings] No settings found, using defaults. Run init_system_settings.sql to create table.');
      }
      return DEFAULT_SETTINGS;
    }

    console.log('[Admin Settings] Settings loaded successfully:', data);
    // Merge with defaults to ensure all fields exist
    return { ...DEFAULT_SETTINGS, ...data };
  } catch (error) {
    console.error('[Admin Settings] Exception in getSystemSettings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSystemSetting(key: keyof SystemSettings, value: any): Promise<boolean> {
  try {
    console.log(`[Admin Settings] Updating ${key} to:`, value);
    // We assume there is only one row in system_settings. 
    // We update the first row found, or insert if empty.

    // First, check if a row exists
    const { data: existing } = await supabase
      .from('system_settings')
      .select('id')
      .limit(1)
      .single();

    let error;

    if (existing) {
      // Update the existing row
      const { error: updateError } = await supabase
        .from('system_settings')
        .update({ [key]: value, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      error = updateError;
      console.log(`[Admin Settings] Update result:`, updateError ? 'FAILED' : 'SUCCESS');
    } else {
      // Insert a new row with defaults + the new value
      const { error: insertError } = await supabase
        .from('system_settings')
        .insert({
          ...DEFAULT_SETTINGS,
          [key]: value
        });
      error = insertError;
      console.log(`[Admin Settings] Insert result:`, insertError ? 'FAILED' : 'SUCCESS');
    }

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error updating setting ${key}:`, error);
    return false;
  }
}

export async function initSystemSettings(): Promise<void> {
  // Ensure default settings exist
  const { data, error } = await supabase
    .from('system_settings')
    .select('id')
    .limit(1);

  if (!data || data.length === 0) {
    await supabase.from('system_settings').insert(DEFAULT_SETTINGS);
  }
}
