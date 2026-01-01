import { useParams, useNavigate } from "react-router-dom";
import { useNotificationStore } from "@/store/notificationStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Bell, Shield, TrendingUp, CreditCard, Info } from "lucide-react";
import { useEffect } from "react";

const NotificationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notifications, markAsRead } = useNotificationStore();
  
  const notification = notifications.find(n => n.id === id);

  useEffect(() => {
    if (notification && !notification.read) {
      markAsRead(notification.id);
    }
  }, [notification, markAsRead]);

  if (!notification) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl font-bold mb-4">Notification not found</h2>
        <Button onClick={() => navigate("/notifications")}>
          Back to Notifications
        </Button>
      </div>
    );
  }

  const getIcon = () => {
    switch (notification.iconType) {
      case 'trade': return <TrendingUp className="w-8 h-8 text-blue-500" />;
      case 'security': return <Shield className="w-8 h-8 text-green-500" />;
      case 'payment': return <CreditCard className="w-8 h-8 text-purple-500" />;
      default: return <Bell className="w-8 h-8 text-primary" />;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/notifications")}
        className="mb-6 pl-0 hover:pl-2 transition-all"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Notifications
      </Button>

      <Card className="p-6 md:p-8 border-border shadow-lg">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-secondary/50 rounded-xl">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{notification.title}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(notification.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg leading-relaxed mb-6">
            {notification.message}
          </p>
          
          {notification.details && (
            <div className="bg-secondary/20 p-4 rounded-lg border border-border mt-4">
              <div dangerouslySetInnerHTML={{ __html: notification.details }} />
            </div>
          )}
        </div>

        {notification.link && (
          <div className="mt-8 pt-6 border-t border-border">
            <Button 
              onClick={() => navigate(notification.link!)}
              className="w-full md:w-auto"
            >
              View Related Action
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default NotificationDetail;
