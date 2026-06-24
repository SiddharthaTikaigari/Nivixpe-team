'use client';

import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Bell, Settings, LogOut } from 'lucide-react';

import { NotificationCenter } from '@/components/notification-center';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="border-b border-border bg-card">
      <div className="px-mobile py-3 sm:py-4 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-responsive-xl font-bold text-foreground truncate">{title}</h1>
          {subtitle && <p className="text-responsive-xs text-muted-foreground mt-1 line-clamp-2">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 sm:gap-4 ml-4">
          <div className="hidden sm:flex items-center">
            <NotificationCenter />
          </div>
          <Button variant="ghost" size="icon" className="tap-target hidden sm:flex">
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Logout"
            className="tap-target"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
