import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useAuthStore as useAuthStoreHook } from './authStore';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
  iconType?: 'trade' | 'security' | 'system' | 'payment';
  link?: string;
  details?: string; // HTML or Markdown content for the detail page
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  fetchNotifications: () => Promise<void>;
  subscribeToNotifications: () => () => void;
}

export const useNotificationStore = create<NotificationState>()(
  (set, get) => ({
    notifications: [],
    unreadCount: 0,
    
    addNotification: (notification) =>
      set((state) => {
        const newNotification: Notification = {
          ...notification,
          id: Math.random().toString(36).substring(7),
          timestamp: Date.now(),
          read: false,
        };
        return {
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        };
      }),

    markAsRead: async (id) => {
      // Optimistic update
      set((state) => {
        const newNotifications = state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        return {
          notifications: newNotifications,
          unreadCount: newNotifications.filter((n) => !n.read).length,
        };
      });

      // Update in DB
      try {
          const { error } = await supabase
              .from('notifications')
              .update({ read: true })
              .eq('id', id);
          
          if (error) console.error('Error marking notification as read:', error);
      } catch (e) {
          console.error('Error marking notification as read:', e);
      }
    },

    markAllAsRead: async () => {
      const { notifications } = get();
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      // Optimistic update
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));

      // Update in DB
      try {
          const { error } = await supabase
              .from('notifications')
              .update({ read: true })
              .in('id', unreadIds);
          
          if (error) console.error('Error marking all as read:', error);
      } catch (e) {
          console.error('Error marking all as read:', e);
      }
    },

    clearAll: () => set({ notifications: [], unreadCount: 0 }),

    fetchNotifications: async () => {
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
              .from('notifications')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(50);

          if (error) throw error;

          if (data) {
              const formattedNotifications: Notification[] = data.map(n => ({
                  id: n.id,
                  title: n.title,
                  message: n.message,
                  timestamp: new Date(n.created_at).getTime(),
                  read: n.read,
                  type: n.type as any,
                  link: n.link,
              }));

              set({
                  notifications: formattedNotifications,
                  unreadCount: formattedNotifications.filter(n => !n.read).length
              });
          }
      } catch (error) {
          console.error('Error fetching notifications:', error);
      }
    },

    subscribeToNotifications: () => {
      const { user } = useAuthStoreHook.getState(); // Helper to get user ID if needed, or just rely on auth state
      // Better to get user from supabase directly to be safe or pass it in
      
      const subscription = supabase
          .channel('public:notifications')
          .on(
              'postgres_changes',
              {
                  event: 'INSERT',
                  schema: 'public',
                  table: 'notifications',
              },
              (payload) => {
                  const newNotification = payload.new;
                  
                  // Check if it belongs to current user
                  // Note: RLS should handle this but for realtime we might receive all if not careful with filters
                  // However, standard realtime setup often broadcasts. 
                  // We should verify the user_id matches.
                  supabase.auth.getUser().then(({ data: { user } }) => {
                      if (user && newNotification.user_id === user.id) {
                           const formatted: Notification = {
                              id: newNotification.id,
                              title: newNotification.title,
                              message: newNotification.message,
                              timestamp: new Date(newNotification.created_at).getTime(),
                              read: newNotification.read,
                              type: newNotification.type as any,
                              link: newNotification.link,
                          };

                          set((state) => ({
                              notifications: [formatted, ...state.notifications],
                              unreadCount: state.unreadCount + 1,
                          }));

                          // Show toast
                          toast({
                              title: formatted.title,
                              description: formatted.message,
                              variant: formatted.type === 'error' ? 'destructive' : 'default',
                          });
                      }
                  });
              }
          )
          .subscribe();

      return () => {
          supabase.removeChannel(subscription);
      };
    }
  })
);
