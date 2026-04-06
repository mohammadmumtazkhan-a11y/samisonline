import { Search, ShoppingCart, User, Send, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { navItems } from "@/data/products";

export default function Header() {
  const [, navigate] = useLocation();

  return (
    <header className="w-full">
      {/* Top Bar — white background */}
      <div className="bg-white">
        <div className="w-full px-5 py-4 flex items-center justify-between gap-6">
          {/* Logo */}
          <button onClick={() => navigate("/")} className="shrink-0">
            <img
              src="/assets/logo.svg"
              alt="Samis Online"
              className="h-14 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = "/assets/Low-quality_logo.png";
              }}
            />
          </button>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl hidden sm:flex">
            <div className="flex w-full">
              <input
                type="text"
                placeholder="Search for products, brands and categories..."
                className="flex-1 rounded-l-lg py-3 pl-5 pr-4 text-sm text-gray-700 bg-gray-50 border border-gray-300 border-r-0 focus:outline-none focus:border-primary"
              />
              <button className="bg-primary hover:bg-primary/90 text-white rounded-r-full px-7 text-sm font-medium transition-colors whitespace-nowrap">
                Search
              </button>
            </div>
          </div>

          {/* Send Money Button */}
          <button
            onClick={() => navigate("/send-money")}
            className={cn(
              "shrink-0 flex items-center gap-2 bg-teal hover:bg-teal/90 text-white",
              "font-semibold rounded-full px-5 py-2.5 transition-all",
              "shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
              "text-sm"
            )}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send Money</span>
          </button>

          {/* Cart & Account */}
          <div className="flex items-center gap-5 text-black shrink-0">
            <button className="flex items-center gap-1 hover:text-primary transition-colors relative">
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-accent text-[10px] font-bold text-black flex items-center justify-center">
                  0
                </span>
              </div>
              <span className="hidden md:inline text-base font-medium ml-1">My Cart</span>
            </button>
            <button onClick={() => navigate("/auth")} className="flex items-center gap-2 hover:text-primary transition-colors">
              <User className="w-6 h-6" />
              <span className="hidden md:inline text-base font-medium">Login / Signup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar — white pill items on blue-50 bg, matching live site */}
      <nav className="bg-blue-50 w-full py-3">
        <div className="w-full px-5">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => (
              <button
                key={item}
                className={cn(
                  "flex items-center gap-1 whitespace-nowrap px-3 py-1 text-sm font-normal",
                  "text-black bg-white border-2 border-white rounded-full",
                  "hover:text-primary hover:border-primary/20 transition-colors"
                )}
              >
                {item}
                <ChevronDown className="w-3.5 h-3.5 opacity-50" />
              </button>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
