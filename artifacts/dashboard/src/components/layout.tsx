import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Briefcase,
  DollarSign,
  CheckSquare,
  Calendar,
  StickyNote,
  TerminalSquare,
  Menu,
  X,
  Search,
  CalendarDays,
  CreditCard,
  LogOut,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MissionStrip } from "@/components/mission-strip";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/hub", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: Briefcase },
  { href: "/revenue", label: "Revenue", icon: DollarSign },
  { href: "/expenses", label: "Expenses", icon: CreditCard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/planner", label: "Planner", icon: CalendarDays },
  { href: "/keywords", label: "Keywords", icon: Search },
  { href: "/content", label: "Content", icon: Calendar },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

function NavContent({ location, onNavigate }: { location: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3">
        Mission Control
      </div>
      {navItems.map((item) => {
        const isActive = location === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "opacity-70")} />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <aside className="w-64 border-r border-border bg-card flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary">
            <TerminalSquare className="w-6 h-6" />
            <span className="font-display font-bold text-lg tracking-tight text-foreground">
              Business<span className="text-primary">Hub</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <NavContent location={location} />
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              O
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">Owner</p>
            </div>
            <button
              onClick={logout}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center justify-between px-6 border-b border-border">
              <div className="flex items-center gap-2 text-primary">
                <TerminalSquare className="w-6 h-6" />
                <span className="font-display font-bold text-lg tracking-tight text-foreground">
                  Business<span className="text-primary">Hub</span>
                </span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
              <NavContent location={location} onNavigate={() => setMobileOpen(false)} />
            </nav>
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="md:hidden h-14 flex items-center px-4 border-b border-border bg-card gap-3">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display font-bold text-sm tracking-tight text-foreground">
            Business<span className="text-primary">Hub</span>
          </span>
        </div>

        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `radial-gradient(hsl(var(--primary)/0.05) 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }} />

        <div className="flex-1 overflow-y-auto relative z-10">
          <MissionStrip />
          <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
