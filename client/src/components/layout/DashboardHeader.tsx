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
      className="h-14 md:h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 shadow-sm"
    >
      {/* Left: hamburger (mobile) + logo + name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors -ml-1"
          data-testid="button-mobile-menu"
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Logo (mobile only, sidebar already shows it on desktop) + brand name */}
        <div className="flex items-center gap-2.5">
          <img
            src="/assets/logo.svg"
            alt="Samis Online"
            className="h-10 w-auto object-contain lg:hidden"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.src = "/assets/Low-quality_logo.png";
            }}
          />
          <span className="text-base font-bold text-primary">
            Samis Online Money
          </span>
        </div>
      </div>

      {/* Right: bell + user */}
      <div className="flex items-center gap-3 ml-auto">
        <button
          className="relative p-2 rounded-lg hover:bg-muted transition-colors"
          data-testid="button-notifications"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </button>

        <div className="hidden sm:block h-6 w-px bg-gray-200" />

        <div
          className="flex items-center gap-2.5 cursor-pointer group"
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
