import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  FileText, 
  Home, 
  LogOut, 
  User, 
  PlusCircle, 
  Menu,
  Activity,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'New Note', href: '/notes/new', icon: PlusCircle },
    { name: 'All Notes', href: '/notes', icon: FileText },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold font-display tracking-tight text-foreground">
            SOAP Notes
          </h1>
        </div>

        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div 
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 translate-x-1' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1'
                    }
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-auto px-6 py-6 border-t border-border/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={user?.profileImageUrl} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.firstName?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 hover:border-destructive/20"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 border-r border-border/60 bg-card fixed h-full z-10">
        <NavContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen transition-all duration-300">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 border-b border-border/60 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-bold font-display text-lg">SOAP Notes</span>
          </div>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <NavContent />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full animate-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
