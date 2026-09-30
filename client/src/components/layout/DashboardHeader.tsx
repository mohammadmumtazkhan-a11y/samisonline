import { Bell, ChevronDown, Menu } from "lucide-react";
import { motion } from "framer-motion";

interface HeaderProps {
  userName: string;
  profileType?: string;
  onMenuClick?: () => void;
}

export function Header({ userName, profileType = "Individual Profile", onMenuClick }: HeaderProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="h-16 bg-white border-b border-gray-100 flex items-center justify-between gap-2 px-3 sm:px-4 md:px-6 sticky top-0 z-40 shadow-sm pt-[env(safe-area-inset-top)] box-content md:box-border md:pt-0"
    >
      {/* Left: hamburger (mobile) + logo + name */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted active:bg-muted transition-colors"
          aria-label="Open menu"
          data-testid="button-mobile-menu"
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Logo (mobile only, sidebar already shows it on desktop) + brand name */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <img
            src="/assets/logo.svg"
            alt="Samis Online"
            className="h-9 sm:h-10 w-auto object-contain lg:hidden shrink-0"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.src = "/assets/Low-quality_logo.png";
            }}
          />
          <span className="hidden sm:inline text-base font-bold text-primary whitespace-nowrap">
            Samis Online Money
          </span>
          <span className="sm:hidden text-[11px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full leading-none">
            Money
          </span>
        </div>
      </div>

      {/* Right: bell + user */}
      <div className="flex items-center gap-1 sm:gap-3 ml-auto shrink-0">
        <button
          className="relative w-10 h-10 flex items-center justify-center rounded-xl sm:block sm:w-auto sm:h-auto sm:p-2 sm:rounded-lg hover:bg-muted active:bg-muted transition-colors"
          data-testid="button-notifications"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-2 right-2 sm:top-1.5 sm:right-1.5 w-2 h-2 bg-destructive rounded-full max-sm:ring-2 max-sm:ring-white" />
        </button>

        <div className="hidden sm:block h-6 w-px bg-gray-200" />

        <div
          className="flex items-center gap-2.5 cursor-pointer group p-0.5 sm:p-0"
          data-testid="button-profile-menu"
        >
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-sm ring-2 ring-primary/20 transition-all group-hover:ring-primary/40">
            <span className="text-white font-bold text-xs">{initials}</span>
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-sm font-semibold text-gray-800">{userName}</span>
            <span className="text-[11px] text-muted-foreground">{profileType}</span>
          </div>
          <ChevronDown className="hidden sm:block w-4 h-4 text-muted-foreground group-hover:text-gray-700 transition-colors" />
        </div>
      </div>
    </motion.header>
  );
}
