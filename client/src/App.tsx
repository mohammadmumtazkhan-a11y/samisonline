import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "@/pages/home";
import SendMoneyPlaceholder from "@/pages/send-money";
import AuthPage from "@/pages/auth";
import DashboardPage from "@/pages/dashboard";
import SendMoneyFlowPage from "@/pages/send-money-flow";

/** Scrolls to the top of the page on every route change. */
function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ScrollToTop />
      <Switch>
        {/* Root → Samis Online home page (e-commerce store) */}
        <Route path="/" component={HomePage} />
        {/* /home kept as alias so existing links don't break */}
        <Route path="/home">
          <Redirect to="/" />
        </Route>
        <Route path="/send-money" component={SendMoneyPlaceholder} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/send-money-flow" component={SendMoneyFlowPage} />
        <Route>
          <div className="flex items-center justify-center min-h-screen">
            <h1 className="text-2xl font-display">404 — Page Not Found</h1>
          </div>
        </Route>
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
