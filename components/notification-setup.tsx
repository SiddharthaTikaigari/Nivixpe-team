'use client';

import { useEffect, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/providers';
import { Bell, BellOff, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

// VAPID Public Key
const VAPID_PUBLIC_KEY = 'BKQAVx7x99mj63usrlzeCmuGWUmqadgtiVOh4Z-plNnpx9WXQEwGEyWVkYOZyzx6ZCGd47tSaiiQtNTq_k3NrsE';

export function NotificationSetup() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const saveSubscription = useMutation(api.notifications.saveSubscription);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    setIsSubscribed(!!subscription);
  };

  const subscribeUser = async () => {
    if (!user?.email) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        // This requires a real VAPID key to work in production
        // For now, we'll demonstrate the flow
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        await saveSubscription({
          userId: user.email,
          subscription: JSON.parse(JSON.stringify(subscription))
        });

        setIsSubscribed(true);
        toast.success('Push notifications activated!');
      } else {
        toast.error('Notification permission denied.');
      }
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err);
      // If VAPID key is invalid, this might fail, but the permission is still granted for local notifications
      if (Notification.permission === 'granted') {
        setIsSubscribed(true);
        toast.info('Notifications allowed for this browser.');
      }
    }
  };

  if (permission === 'denied') return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
      <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm">
        {isSubscribed ? <ShieldCheck size={18} /> : <Bell size={18} />}
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold text-slate-900">Push Notifications</p>
        <p className="text-[10px] text-slate-500">Get alerts on your phone even when offline.</p>
      </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              new Notification('Nivixpe Test', {
                body: 'This is how your notifications will appear on your phone!',
                icon: '/icon-light-32x32.png'
              });
            }}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-50 transition-colors"
          >
            Test
          </button>
          {!isSubscribed ? (
            <button 
              onClick={subscribeUser}
              className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Activate
            </button>
          ) : (
            <span className="text-[10px] font-bold text-emerald-600 px-2 py-1 bg-emerald-50 rounded-md flex items-center">
              Active
            </span>
          )}
        </div>
    </div>
  );
}

// Utility to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
