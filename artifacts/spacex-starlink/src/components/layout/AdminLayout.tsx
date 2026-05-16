import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  List, 
  Users, 
  LogOut,
  Satellite
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminToken, removeAdminToken } from "@/lib/auth";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!getAdminToken()) {
      setLocation("/admin");
    }
  }, [location, setLocation]);

  const handleLogout = () => {
    removeAdminToken();
    setLocation("/admin");
  };

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/plans", label: "Plans", icon: List },
    { href: "/admin/subscriptions", label: "Subscriptions", icon: Users },
  ];

  if (!getAdminToken()) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex dark">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2 group">
            <Satellite className="w-5 h-5 text-primary" />
            <span className="font-bold tracking-tighter uppercase text-sm">SpaceXStarlink</span>
          </Link>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <span 
                  data-testid={`admin-nav-${item.label.toLowerCase()}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-card-foreground/5 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
            data-testid="admin-nav-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
