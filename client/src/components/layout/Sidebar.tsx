import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  Shield,
  HelpCircle,
  Settings,
  LogOut,
  X,
  UserCheck,
  Wallet,
  Building2,
  Gift,
  Send,
  UsersRound,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface NavItemData {
  icon: React.ElementType;
  label: string;
  href: string;
  enabled: boolean;
}

const navItems: NavItemData[] = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard", enabled: true },
  { icon: ArrowLeftRight, label: "Transactions", href: "/test-checkout", enabled: true },
  { icon: Users, label: "Recipients", href: "/recipients", enabled: true },
  { icon: Shield, label: "Compliance", href: "/compliance", enabled: true },
  { icon: HelpCircle, label: "Support", href: "/support", enabled: true },
  { icon: Settings, label: "Settings", href: "/settings", enabled: true },
];

const secondaryNavItems: NavItemData[] = [
  { icon: UserCheck, label: "Senders", href: "/senders", enabled: true },
  { icon: Wallet, label: "Received Payments", href: "/payments", enabled: true },
  { icon: UsersRound, label: "Funding Campaigns", href: "/group-pay", enabled: true },
  { icon: Building2, label: "Collections Accounts", href: "/payout-accounts", enabled: true },
  { icon: Gift, label: "Bonus & Discounts", href: "/bonus-discounts", enabled: true },
  { icon: Send, label: "Send Money", href: "/send-money-flow", enabled: true },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch {
      // session may already be gone
    }
    toast({ title: "Logged out", description: "You have been signed out successfully." });
    setLocation("/auth");
  };

  const NavItem = ({ item }: { item: NavItemData }) => {
    const isActive =
      location === item.href ||
      location.startsWith(item.href + "/");

    if (!item.enabled) return null;

    const handleClick = (e: React.MouseEvent) => {
      if (isActive) {
        e.preventDefault();
        return;
      }
      onClose?.();
    };

    return (
      <Link href={item.href} onClick={handleClick}>
        <div
          className={cn(
            "relative flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 group",
            isActive
              ? "text-primary bg-primary/[0.07] cursor-default"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
          )}
          data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {/* Active left border indicator */}
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-primary" />
          )}

          <item.icon
            className={cn(
              "w-5 h-5 shrink-0",
              isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600"
            )}
          />
          <span className={cn("flex-1", isActive && "font-semibold")}>{item.label}</span>
          {isActive && <ChevronRight className="w-4 h-4 text-primary opacity-60" />}
        </div>
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <div className="flex items-center min-w-0">
          <img
            src="/assets/logo.svg"
            alt="Samis Online"
            className="h-9 w-auto shrink-0 object-contain"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.src = "/assets/Low-quality_logo.png";
            }}
          />
        </div>
        <button
          onClick={onClose}
          className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 shrink-0"
          data-testid="button-close-sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}

        {/* Divider */}
        <div className="mx-4 my-3 h-px bg-gray-100" />

        {/* Secondary nav */}
        {secondaryNavItems.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-gray-100 p-3 space-y-1">
        {/* Back to Samis Online store */}
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 w-full transition-all duration-200 group"
        >
          <ShoppingBag className="w-4 h-4 text-primary/70 group-hover:text-primary" />
          Back to Store
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          data-testid="button-logout"
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 w-full transition-all duration-200 group"
        >
          <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex bg-white border-r border-gray-100 h-screen flex-col fixed left-0 top-0 z-50 w-56 shadow-sm">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 w-64 bg-white h-screen flex flex-col z-50 lg:hidden shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
