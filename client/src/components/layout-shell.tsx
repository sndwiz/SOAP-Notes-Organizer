import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, Home, LogOut, PlusCircle, Menu, Activity, Users,
  Calendar, CheckSquare, FolderOpen, Settings, Bell, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  const mainNav = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'New Note', href: '/notes/new', icon: PlusCircle },
    { name: 'All Notes', href: '/notes', icon: FileText },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Clients', href: '/clients', icon: Users },
  ];

  const manageNav = [
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Documents', href: '/documents', icon: FolderOpen },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  const systemNav = [
    { name: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const NavSection = ({ title, items }: { title?: string; items: typeof mainNav }) => (
    <div className="space-y-1">
      {title && <p className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">{title}</p>}
      {items.map((item) => {
        const isActive = item.href === '/' ? location === '/' : location.startsWith(item.href);
        return (
          <Link key={item.name} href={item.href}>
            <div
              className={`
                flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
                ${isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }
              `}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon className={`h-4 w-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              <span className="flex-1">{item.name}</span>
              {'badge' in item && (item as any).badge > 0 && (
                <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-[10px]">
                  {(item as any).badge}
                </Badge>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display tracking-tight text-foreground">SOAP Notes</h1>
            <p className="text-[10px] text-muted-foreground">Clinical Practice Manager</p>
          </div>
        </div>

        <div className="space-y-6">
          <NavSection items={mainNav} />
          <NavSection title="Manage" items={manageNav} />
          <NavSection title="System" items={systemNav} />
        </div>
      </div>

      <div className="mt-auto px-5 py-4 border-t border-border/50">
        <div className="flex items-center gap-3 mb-3 px-1">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={user?.profileImageUrl} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {user?.firstName?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={() => logout()}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block w-64 border-r border-border/60 bg-card fixed h-full z-10">
        <NavContent />
      </div>

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300">
        <header className="lg:hidden h-14 border-b border-border/60 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-bold font-display text-base">SOAP Notes</span>
          </div>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <NavContent />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
