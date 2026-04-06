import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header as DashboardHeader } from "./DashboardHeader";
import { TooltipProvider } from "@/components/ui/tooltip";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);


  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}

        />
        <div className="lg:ml-56 transition-all duration-300">
          <DashboardHeader userName="Olayinka" profileType="Individual Profile" onMenuClick={() => setSidebarOpen(true)} />
          <main className="p-3 md:p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
