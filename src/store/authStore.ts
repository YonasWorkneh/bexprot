import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { clearBalanceCache } from "@/lib/balanceSnapshot";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: number;
  kycStatus?: "not_started" | "pending" | "verified";
  avatarUrl?: string;
  phone?: string;
  role?: 'user' | 'admin';
  preferences?: {
    priceAlerts?: boolean;
    tradeNotifications?: boolean;
    emailNotifications?: boolean;
    phone?: string;
    demo_balance?: number;
    apiKeys?: Array<{ key: string; createdAt: number; label: string }>;
    hasSeenWelcome?: boolean;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; error?: string; confirmationRequired?: boolean }>;
  registerWithMagicLink: (name: string, email: string, phone?: string) => Promise<{ success: boolean; error?: string; confirmationRequired?: boolean }>;
  loginWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string; confirmationRequired?: boolean }>;
  verifyOtp: (identifier: string, token: string, type?: 'sms' | 'email') => Promise<{ success: boolean; error?: string }>;
  logout: (redirectTo?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updatePreferences: (preferences: any) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  generateApiKey: () => Promise<{ success: boolean; apiKey?: string; error?: string }>;

  // Session management
  checkSession: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  (set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    // Register new user
    register: async (name: string, email: string, password: string, phone?: string) => {
      try {
        // Sign up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          phone,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              name,
              phone,
              email,
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        // Check if email or phone confirmation is required
        if (data.user && !data.session) {
          return { success: true, confirmationRequired: true };
        }

        if (data.user) {
          const user: User = {
            id: data.user.id,
            email: data.user.email!,
            name,
            createdAt: new Date(data.user.created_at).getTime(),
            kycStatus: "not_started",
            role: 'user',
            preferences: {
              phone,
            },
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        }

        set({ isLoading: false });
        return { success: false, error: "Registration failed" };
      } catch (error: any) {
        set({ isLoading: false });
        return { success: false, error: error.message || "Registration failed" };
      }
    },

    // Register with magic link (passwordless)
    registerWithMagicLink: async (name: string, email: string, phone?: string) => {
      try {
        // Store name and phone temporarily for post-verification update
        sessionStorage.setItem('pending_user_name', name);
        sessionStorage.setItem('pending_user_email', email);
        if (phone) {
          sessionStorage.setItem('pending_user_phone', phone);
        }

        // Determine redirect URL based on environment
        const redirectUrl = window.location.hostname === 'localhost'
          ? 'http://localhost:5173'
          : 'https://bexprot.com';

        // Send magic link via OTP
        const { data, error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectUrl,
            shouldCreateUser: true,
            data: {
              name,
              phone,
            }
          },
        });

        if (error) {
          sessionStorage.removeItem('pending_user_name');
          sessionStorage.removeItem('pending_user_email');
          sessionStorage.removeItem('pending_user_phone');
          return { success: false, error: error.message };
        }

        // Magic link sent successfully
        return { success: true, confirmationRequired: true };
      } catch (error: any) {
        sessionStorage.removeItem('pending_user_name');
        sessionStorage.removeItem('pending_user_email');
        sessionStorage.removeItem('pending_user_phone');
        return { success: false, error: error.message || "Failed to send magic link" };
      }
    },

    // Login with magic link
    loginWithMagicLink: async (email: string) => {
      try {
        const redirectUrl = window.location.hostname === 'localhost'
          ? 'http://localhost:5173'
          : 'https://bexprot.com';

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectUrl,
            shouldCreateUser: false, // Don't create new users on login attempt
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true, confirmationRequired: true };
      } catch (error: any) {
        return { success: false, error: error.message || "Failed to send magic link" };
      }
    },

    // Verify OTP
    verifyOtp: async (identifier: string, token: string, type: 'sms' | 'email' = 'sms') => {
      try {
        const verifyParams: any = {
          token,
          type: type === 'sms' ? 'sms' : 'signup', // 'signup' is for email OTP
        };

        if (type === 'sms') {
          verifyParams.phone = identifier;
        } else {
          verifyParams.email = identifier;
        }

        const { data, error } = await supabase.auth.verifyOtp(verifyParams);

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const user: User = {
            id: data.user.id,
            email: data.user.email!,
            name: profile?.name || data.user.user_metadata?.name || data.user.email!.split('@')[0],
            createdAt: new Date(data.user.created_at).getTime(),
            kycStatus: profile?.kyc_status || "not_started",
            avatarUrl: profile?.avatar_url,
            phone: profile?.phone,
            role: profile?.role || 'user',
            preferences: profile?.preferences || {},
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        }

        set({ isLoading: false });
        return { success: false, error: "Verification failed" };
      } catch (error: any) {
        set({ isLoading: false });
        return { success: false, error: error.message || "Verification failed" };
      }
    },

    // Login existing user
    login: async (email: string, password: string) => {
      try {
        console.log("authStore: calling signInWithPassword");
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error("authStore: signInWithPassword error", error);
          set({ isLoading: false });
          return { success: false, error: error.message };
        }

        if (data.user) {
          console.log("authStore: signInWithPassword success, fetching profile");
          // Fetch user profile from database
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            console.error("Error fetching profile:", profileError);
          } else {
            console.log("authStore: profile fetched", profile);
          }

          const user: User = {
            id: data.user.id,
            email: data.user.email!,
            name: profile?.name || data.user.user_metadata?.name || email.split('@')[0],
            createdAt: new Date(data.user.created_at).getTime(),
            kycStatus: profile?.kyc_status || "not_started",
            avatarUrl: profile?.avatar_url,
            role: profile?.role || 'user',
            preferences: profile?.preferences || {},
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          console.log("authStore: state updated, isAuthenticated=true");

          return { success: true };
        }

        set({ isLoading: false });
        return { success: false, error: "Login failed" };
      } catch (error: any) {
        console.error("authStore: unexpected error", error);
        set({ isLoading: false });
        return { success: false, error: error.message || "Login failed" };
      }
    },

    // Logout user
    logout: async (redirectTo?: string) => {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error("Error signing out:", error);
      }

      // Clear all storage to ensure clean slate
      localStorage.removeItem('wallet-storage');
      localStorage.removeItem('trading-storage');
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      clearBalanceCache(); // Clear balance snapshot
      sessionStorage.clear();

      // Reset internal state
      set({ user: null, isAuthenticated: false, isLoading: false });

      // Force reload to clear any in-memory stores and reset app to initial state
      // Default to /auth, but allow custom redirect (e.g., /admin for admin logout)
      window.location.href = redirectTo || '/auth';
    },

    // Reset password
    resetPassword: async (email: string) => {
      try {
        const redirectUrl = window.location.hostname === 'localhost'
          ? 'http://localhost:5173/reset-password'
          : 'https://bexprot.com/reset-password';

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        });

        if (error) throw error;

        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || "Password reset failed" };
      }
    },

    // Update password
    updatePassword: async (newPassword: string) => {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || "Password update failed" };
      }
    },

    // Update preferences
    updatePreferences: async (preferences: any) => {
      try {
        const { user } = get();
        if (!user) return { success: false, error: "Not authenticated" };

        const { error } = await supabase
          .from('users')
          .update({ preferences })
          .eq('id', user.id);

        if (error) throw error;

        // Update local state
        const updatedUser = { ...user, preferences };
        set({ user: updatedUser });

        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || "Failed to update preferences" };
      }
    },

    // Delete account
    deleteAccount: async () => {
      try {
        const { user } = get();
        if (!user) return { success: false, error: "Not authenticated" };

        // Delete user data from public tables
        // Note: Auth user deletion usually requires admin rights or edge function.
        // We will delete the public profile and sign out.
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', user.id);

        if (error) throw error;

        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });

        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || "Failed to delete account" };
      }
    },

    // Generate API Key
    generateApiKey: async () => {
      try {
        const { user } = get();
        if (!user) return { success: false, error: "Not authenticated" };

        const newKey = `pk_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
        const currentKeys = user.preferences?.apiKeys || [];
        const updatedKeys = [...currentKeys, { key: newKey, createdAt: Date.now(), label: 'Default Key' }];

        const newPreferences = {
          ...user.preferences,
          apiKeys: updatedKeys
        };

        const { error } = await supabase
          .from('users')
          .update({ preferences: newPreferences })
          .eq('id', user.id);

        if (error) throw error;

        // Update local state
        const updatedUser = { ...user, preferences: newPreferences };
        set({ user: updatedUser });

        return { success: true, apiKey: newKey };
      } catch (error: any) {
        return { success: false, error: error.message || "Failed to generate API key" };
      }
    },

    // Check and restore session
    checkSession: async () => {
      console.log("authStore: checkSession started");

      // If already authenticated (e.g., from onAuthStateChange), skip to avoid race condition
      const currentState = get();
      if (currentState.isAuthenticated && currentState.user) {
        console.log("authStore: already authenticated, skipping checkSession");
        set({ isLoading: false });
        return;
      }

      try {
        // 1. Try to get session from storage (fast)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn("Session check error:", sessionError);
        }

        let currentUser = session?.user || null;

        // 2. If no session in storage, try to fetch user from server (slower but more reliable)
        if (!currentUser) {
          console.log("authStore: no session in storage, trying getUser()");
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (!userError && user) {
            currentUser = user;
          }
        }

        if (currentUser) {
          console.log("authStore: user found", currentUser.id);

          // Optimistic update: Set authenticated immediately with basic info
          const basicUser: User = {
            id: currentUser.id,
            email: currentUser.email!,
            name: currentUser.user_metadata?.name || currentUser.email!.split('@')[0],
            createdAt: new Date(currentUser.created_at).getTime(),
            kycStatus: "not_started",
            role: 'user'
          };

          set({
            user: basicUser,
            isAuthenticated: true,
            isLoading: false,
          });

          // Fetch user profile from database in background
          try {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', currentUser.id)
              .single();

            if (profile) {
              const fullUser: User = {
                ...basicUser,
                name: profile.name || basicUser.name,
                kycStatus: profile.kyc_status || "not_started",
                avatarUrl: profile.avatar_url,
                phone: profile.phone,
                role: profile.role || 'user',
                preferences: profile.preferences || {},
              };
              set({ user: fullUser });
            }
          } catch (profileError) {
            console.warn("Could not fetch user profile:", profileError);
          }

          console.log("authStore: checkSession complete (authenticated)");
        } else {
          // No user found
          console.log("authStore: no user found");
          set({ isLoading: false, isAuthenticated: false, user: null });
        }
      } catch (error) {
        console.error("Error checking session:", error);
        set({ isLoading: false, isAuthenticated: false, user: null });
      } finally {
        // Ensure we don't leave the app hanging, but only if we haven't already set a user
        const state = get();
        if (state.isLoading) {
          console.log("authStore: checkSession parsing done, still loading, forcing completion");
          set({ isLoading: false });
        }
      }
    },

    // Set user manually
    setUser: (user: User | null) => {
      set({ user, isAuthenticated: !!user, isLoading: false });
    },
  })
);

// Listen for auth state changes
// supabase.auth.onAuthStateChange(async (event, session) => {
//   console.log("authStore: onAuthStateChange event", event);

//   try {
//     const store = useAuthStore.getState();
//     if (!store) {
//       console.warn("authStore: store not ready in onAuthStateChange");
//       return;
//     }

//     if (event === 'SIGNED_OUT') {
//       store.setUser(null);
//     } else if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user) {
//       // CRITICAL: Immediately update auth state to prevent App.tsx timeout from kicking in
//       // Set basic user info right away so the app knows we're authenticated
//       const basicUser: User = {
//         id: session.user.id,
//         email: session.user.email!,
//         name: session.user.user_metadata?.name || session.user.email!.split('@')[0],
//         createdAt: new Date(session.user.created_at).getTime(),
//         kycStatus: "not_started",
//         role: 'user'
//       };

//       useAuthStore.setState({
//         user: basicUser,
//         isAuthenticated: true,
//         isLoading: false
//       });

//       // Check for pending user metadata from magic link registration
//       const pendingName = sessionStorage.getItem('pending_user_name');
//       const pendingEmail = sessionStorage.getItem('pending_user_email');
//       const pendingPhone = sessionStorage.getItem('pending_user_phone');

//       // Fetch user profile
//       const { data: profile, error: profileError } = await supabase
//         .from('users')
//         .select('*')
//         .eq('id', session.user.id)
//         .single();

//       if (profileError) {
//         console.warn("authStore: could not fetch profile in onAuthStateChange", profileError);
//       }

//       // If there's pending metadata and the profile doesn't have a name yet, update it
//       if (pendingName && pendingEmail === session.user.email && (!profile?.name || profile.name === session.user.email)) {
//         const updates: any = { name: pendingName };
//         if (pendingPhone) updates.phone = pendingPhone;

//         await supabase
//           .from('users')
//           .update(updates)
//           .eq('id', session.user.id);

//         // Clear pending metadata
//         sessionStorage.removeItem('pending_user_name');
//         sessionStorage.removeItem('pending_user_email');
//         sessionStorage.removeItem('pending_user_phone');

//         // Refetch profile with updated name
//         const { data: updatedProfile } = await supabase
//           .from('users')
//           .select('*')
//           .eq('id', session.user.id)
//           .single();

//         const user: User = {
//           id: session.user.id,
//           email: session.user.email!,
//           name: updatedProfile?.name || pendingName,
//           createdAt: new Date(session.user.created_at).getTime(),
//           kycStatus: updatedProfile?.kyc_status || "not_started",
//           avatarUrl: updatedProfile?.avatar_url,
//           phone: updatedProfile?.phone,
//           role: updatedProfile?.role || 'user',
//           preferences: updatedProfile?.preferences || {},
//         };
//         store.setUser(user);
//       } else {
//         // No pending metadata, use existing profile
//         const user: User = {
//           id: session.user.id,
//           email: session.user.email!,
//           name: profile?.name || session.user.user_metadata?.name || session.user.email!.split('@')[0],
//           createdAt: new Date(session.user.created_at).getTime(),
//           kycStatus: profile?.kyc_status || "not_started",
//           avatarUrl: profile?.avatar_url,
//           phone: profile?.phone,
//           role: profile?.role || 'user',
//           preferences: profile?.preferences || {},
//         };
//         store.setUser(user);
//       }

//       // Subscribe to profile changes
//       if (!(window as any).userProfileSubscription) {
//         const channel = supabase
//           .channel(`user_profile_${session.user.id}`)
//           .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${session.user.id}` }, (payload) => {
//             const profile = payload.new as any;
//             const currentStore = useAuthStore.getState();
//             const currentUser = currentStore.user;
//             if (currentUser && profile) {
//               currentStore.setUser({
//                 ...currentUser,
//                 name: profile.name,
//                 kycStatus: profile.kyc_status,
//                 avatarUrl: profile.avatar_url,
//                 phone: profile.phone,
//                 preferences: profile.preferences,
//                 role: profile.role,
//               });
//             }
//           })
//           .subscribe();

//         // Store subscription to cleanup later if needed
//         (window as any).userProfileSubscription = channel;
//       }
//     }
//   } catch (error) {
//     console.error("authStore: error in onAuthStateChange", error);
//   }
// });
