import { useEffect } from 'react';
import { X, Bell, CheckCheck, FileText, Users, AlertTriangle, Info } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { notificationService } from '../services/notificationService';
import { formatRelativeTime } from '../utils';
import { cn } from '../lib/utils';
import type { NotificationType } from '../types';

// Visual config for each notification type
const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ElementType; textColor: string; bgColor: string }
> = {
  invoice: { icon: FileText,      textColor: 'text-accent',      bgColor: 'bg-accent/10'       },
  vendor:  { icon: Users,         textColor: 'text-emerald-400', bgColor: 'bg-emerald-500/10'  },
  alert:   { icon: AlertTriangle, textColor: 'text-red-400',     bgColor: 'bg-red-500/10'      },
  system:  { icon: Info,          textColor: 'text-blue-400',    bgColor: 'bg-blue-500/10'     },
};

export default function NotificationDrawer() {
  const { notificationDrawerOpen, setNotificationDrawerOpen } = useUIStore();
  const {
    notificationList,
    unreadCount,
    setNotifications,
    markOneAsRead,
    markAllAsRead,
  } = useNotificationStore();

  // Load existing notifications from the server on first render
  useEffect(() => {
    notificationService
      .getAll()
      .then((apiResponse) => {
        setNotifications(apiResponse.data.data, apiResponse.data.unreadCount);
      });
  }, [setNotifications]);

  const handleMarkOneAsRead = async (notificationId: string) => {
    try {
      await notificationService.markRead(notificationId);
      markOneAsRead(notificationId);
    } catch {
      // Silently ignore read-marking errors
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllRead();
      markAllAsRead();
    } catch {
      // Silently ignore read-marking errors
    }
  };

  return (
    <>
      {/* Backdrop overlay — clicking it closes the drawer */}
      {notificationDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setNotificationDrawerOpen(false)}
        />
      )}

      {/* Slide-in Drawer Panel */}
      <aside
        className={cn(
          'fixed top-0 right-0 h-full w-80 bg-surface border-l border-border z-50 flex flex-col transition-transform duration-350 ease-out',
          notificationDrawerOpen ? 'translate-x-0 animate-slide-in-right' : 'translate-x-full'
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-accent" />
            <h2 className="text-white font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-muted hover:text-white text-xs flex items-center gap-1 transition-colors"
                title="Mark all notifications as read"
              >
                <CheckCheck size={14} />
                All read
              </button>
            )}
            <button
              onClick={() => setNotificationDrawerOpen(false)}
              className="text-muted hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Notification List */}
        <div className="flex-1 overflow-y-auto">
          {notificationList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted">
              <Bell size={32} className="opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {notificationList.map((notification) => {
                const typeConfig = NOTIFICATION_TYPE_CONFIG[notification.type] ?? NOTIFICATION_TYPE_CONFIG.system;
                const IconComponent = typeConfig.icon;

                return (
                  <div
                    key={notification._id}
                    onClick={() => !notification.isRead && handleMarkOneAsRead(notification._id)}
                    className={cn(
                      'flex gap-3 p-4 transition-colors cursor-pointer',
                      !notification.isRead
                        ? 'bg-white/[0.03] hover:bg-white/[0.05]'
                        : 'hover:bg-white/[0.02]'
                    )}
                  >
                    {/* Type Icon */}
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                        typeConfig.bgColor
                      )}
                    >
                      <IconComponent size={15} className={typeConfig.textColor} />
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            'text-sm font-medium leading-snug',
                            notification.isRead ? 'text-muted' : 'text-white'
                          )}
                        >
                          {notification.title}
                        </p>
                        {/* Unread indicator dot */}
                        {!notification.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted/60 mt-1.5">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-center text-xs text-muted">
            {notificationList.length} total · {unreadCount} unread
          </p>
        </div>
      </aside>
    </>
  );
}
