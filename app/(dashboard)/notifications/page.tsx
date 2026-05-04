'use client';

import { Header } from '@/components/header';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/providers';
import { Bell, CheckCircle, AlertCircle, Clock, Users, FileText, Briefcase, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { NotificationSetup } from '@/components/notification-setup';

export default function NotificationsPage() {
  const { user } = useAuth();
  
  // Queries
  const notifications = useQuery(api.notifications.get, { userId: user?.email || '' }) || [];
  
  // Mutations
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'attendance': return Clock;
      case 'work': return FileText;
      case 'meeting': return Users;
      case 'leave': return Calendar;
      case 'pow': return Briefcase;
      default: return Bell;
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'attendance': return 'border-l-amber-500';
      case 'work': return 'border-l-indigo-500';
      case 'meeting': return 'border-l-blue-500';
      case 'leave': return 'border-l-rose-500';
      case 'pow': return 'border-l-emerald-500';
      default: return 'border-l-slate-500';
    }
  };

  const handleMarkAllRead = async () => {
    if (user?.email) {
      await markAllAsRead({ userId: user.email });
    }
  };

  const handleMarkRead = async (id: any) => {
    await markAsRead({ id });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <Header 
        title="Notifications" 
        subtitle={user ? `Hello ${user.name}, you have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'Loading...'}
      />

      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <NotificationSetup />
        
        {/* Unread Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Activity</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="grid gap-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const Icon = getIcon(notification.type);
                const colorClass = getStatusColor(notification.type);
                
                return (
                  <Card 
                    key={notification._id} 
                    className={`border border-slate-200 bg-white transition-all hover:shadow-md ${!notification.isRead ? `border-l-4 ${colorClass}` : 'opacity-75'}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className={`p-2 rounded-lg ${!notification.isRead ? 'bg-slate-50' : ''}`}>
                          <Icon className={`w-5 h-5 ${!notification.isRead ? 'text-indigo-600' : 'text-slate-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-bold ${!notification.isRead ? 'text-slate-900' : 'text-slate-500'}`}>
                              {notification.title}
                            </p>
                            <p className="text-[10px] font-medium text-slate-400">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          {notification.link && (
                            <Link 
                              href={notification.link}
                              className="inline-block mt-3 text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:text-indigo-700 transition-colors"
                            >
                              View Details →
                            </Link>
                          )}
                        </div>
                        {!notification.isRead && (
                          <button 
                            onClick={() => handleMarkRead(notification._id)}
                            className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-600 mt-1.5"
                            title="Mark as read"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Bell className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-sm font-medium text-slate-400 italic">No notifications yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
